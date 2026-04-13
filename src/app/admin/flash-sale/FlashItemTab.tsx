'use client';

import React from 'react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { AdminModal, StatusBadge, ConfirmDelete } from '@/components/admin';

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
}

interface FlashItem {
  id: string;
  time_slot_id: string;
  product_id: string;
  product_name?: string;
  product_image?: string;
  unit_id: string;
  unit_name?: string;
  flash_price: number;
  original_price: number;
  discount_percent: number;
  total_quantity: number;
  sold_quantity: number;
  is_active: boolean;
}

interface ProductOption {
  id: string;
  name: string;
  image_url: string;
}

interface FlashItemTabProps {
  timeSlots: TimeSlot[];
  supabase: any;
}

export default function FlashItemTab({
  timeSlots,
  supabase,
}: FlashItemTabProps) {
  const [items, setItems] = React.useState<FlashItem[]>([]);
  const [products, setProducts] = React.useState<ProductOption[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [showModal, setShowModal] = React.useState(false);
  const [form, setForm] = React.useState({
    time_slot_id: '',
    product_id: '',
    unit_id: '',
    flash_price: 0,
    original_price: 0,
    discount_percent: 0,
    total_quantity: 100,
    is_active: true,
  });
  const [saving, setSaving] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('flash_sale_items')
      .select('*, products(name, image_url), units(name)')
      .order('created_at', { ascending: false });

    setItems(
      (data || []).map((i: any) => ({
        ...i,
        product_name: i.products?.name,
        product_image: i.products?.image_url,
        unit_name: i.units?.name,
      })),
    );
    setLoading(false);
  };

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, image_url')
      .eq('is_active', true)
      .order('name');
    setProducts(data || []);
  };

  const openAdd = () => {
    loadProducts();
    setForm({
      time_slot_id: timeSlots[0]?.id || '',
      product_id: '',
      unit_id: '',
      flash_price: 0,
      original_price: 0,
      discount_percent: 0,
      total_quantity: 100,
      is_active: true,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from('flash_sale_items').insert(form);
    setShowModal(false);
    setSaving(false);
    loadItems();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await supabase.from('flash_sale_items').delete().eq('id', deleteId);
    setDeleteId(null);
    setDeleting(false);
    loadItems();
  };

  return (
    <>
      <button onClick={openAdd} className="btn-primary mb-4">
        <span className="material-icons text-lg">add</span>
        Thêm sản phẩm
      </button>

      <div className="table-card">
        {loading ? (
          <div className="p-8 text-center text-text-muted">Đang tải...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Giá Flash</th>
                <th>Giảm</th>
                <th>SL</th>
                <th>Đã bán</th>
                <th>Trạng thái</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-text">
                    Chưa có sản phẩm
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <img
                          src={
                            item.product_image ||
                            'https://placehold.co/32x32/f5f5f5/999?text=?'
                          }
                          className="thumb w-8 h-8"
                          alt=""
                        />
                        <span className="text-sm">{item.product_name}</span>
                      </div>
                    </td>
                    <td className="text-sm font-semibold text-accent">
                      {formatCurrency(item.flash_price)}
                    </td>
                    <td className="text-sm">{item.discount_percent}%</td>
                    <td className="text-sm">{item.total_quantity}</td>
                    <td className="text-sm">{item.sold_quantity}</td>
                    <td>
                      <StatusBadge active={item.is_active} />
                    </td>
                    <td>
                      <div className="actions justify-end">
                        <button
                          onClick={() => setDeleteId(item.id)}
                          className="btn-icon danger"
                        >
                          <span className="material-icons text-lg">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Item Modal */}
      <AdminModal
        show={showModal}
        onClose={() => setShowModal(false)}
        title="Thêm sản phẩm Flash Sale"
      >
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-group">
              <label>Khung giờ *</label>
              <select
                value={form.time_slot_id}
                onChange={(e) =>
                  setForm({ ...form, time_slot_id: e.target.value })
                }
                required
              >
                <option value="">Chọn</option>
                {timeSlots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {formatDate(s.start_time, 'long')} -{' '}
                    {formatDate(s.end_time, 'long')}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Sản phẩm *</label>
              <select
                value={form.product_id}
                onChange={(e) =>
                  setForm({ ...form, product_id: e.target.value })
                }
                required
              >
                <option value="">Chọn</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Giá Flash *</label>
                <input
                  type="number"
                  value={form.flash_price}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      flash_price: parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Giá gốc</label>
                <input
                  type="number"
                  value={form.original_price}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      original_price: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Giảm %</label>
                <input
                  type="number"
                  value={form.discount_percent}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      discount_percent: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>Số lượng</label>
                <input
                  type="number"
                  value={form.total_quantity}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      total_quantity: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm({ ...form, is_active: e.target.checked })
                }
              />{' '}
              Hoạt động
            </label>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => setShowModal(false)}
            >
              Hủy
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </AdminModal>

      <ConfirmDelete
        show={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message="Bạn có chắc muốn xóa sản phẩm flash sale này?"
      />
    </>
  );
}
