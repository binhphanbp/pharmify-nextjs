'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDate, toLocalDatetime } from '@/lib/utils';

interface Campaign {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}
interface TimeSlot {
  id: string;
  campaign_id: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
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

export default function AdminFlashSalePage() {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'slots' | 'items'>(
    'campaigns',
  );
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [flashItems, setFlashItems] = useState<FlashItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Campaign form
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    is_active: true,
  });

  // Slot form
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [slotForm, setSlotForm] = useState({
    campaign_id: '',
    start_time: '',
    end_time: '',
    is_active: true,
  });

  // Item form
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FlashItem | null>(null);
  const [itemForm, setItemForm] = useState({
    time_slot_id: '',
    product_id: '',
    unit_id: '',
    flash_price: 0,
    original_price: 0,
    discount_percent: 0,
    total_quantity: 0,
    is_active: true,
  });
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [c, ts] = await Promise.all([
      supabase
        .from('flash_sale_campaigns')
        .select('*')
        .order('start_date', { ascending: false }),
      supabase
        .from('flash_sale_time_slots')
        .select('*')
        .order('start_time', { ascending: false }),
    ]);
    setCampaigns(c.data || []);
    setTimeSlots(ts.data || []);
    setLoading(false);
  };

  const loadItems = async (slotId?: string) => {
    const query = supabase
      .from('flash_sale_items')
      .select('*, products(name, image_url), units(name)');
    if (slotId) query.eq('time_slot_id', slotId);
    const { data } = await query.order('created_at', { ascending: false });
    setFlashItems(
      (data || []).map((i: any) => ({
        ...i,
        product_name: i.products?.name,
        product_image: i.products?.image_url,
        unit_name: i.units?.name,
      })),
    );
  };

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, image_url')
      .eq('is_active', true)
      .order('name');
    setProducts(data || []);
  };

  // Campaign CRUD
  const openAddCampaign = () => {
    setEditingCampaign(null);
    setCampaignForm({
      name: '',
      start_date: '',
      end_date: '',
      is_active: true,
    });
    setShowCampaignModal(true);
  };
  const openEditCampaign = (c: Campaign) => {
    setEditingCampaign(c);
    setCampaignForm({
      name: c.name,
      start_date: toLocalDatetime(new Date(c.start_date)),
      end_date: toLocalDatetime(new Date(c.end_date)),
      is_active: c.is_active,
    });
    setShowCampaignModal(true);
  };
  const saveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const p = { ...campaignForm };
    if (editingCampaign)
      await supabase
        .from('flash_sale_campaigns')
        .update(p)
        .eq('id', editingCampaign.id);
    else await supabase.from('flash_sale_campaigns').insert(p);
    setShowCampaignModal(false);
    setSaving(false);
    loadAll();
  };
  const deleteCampaign = async (id: string) => {
    if (!confirm('Xóa chiến dịch?')) return;
    await supabase.from('flash_sale_campaigns').delete().eq('id', id);
    loadAll();
  };

  // Slot CRUD
  const openAddSlot = () => {
    setEditingSlot(null);
    setSlotForm({
      campaign_id: campaigns[0]?.id || '',
      start_time: '',
      end_time: '',
      is_active: true,
    });
    setShowSlotModal(true);
  };
  const openEditSlot = (s: TimeSlot) => {
    setEditingSlot(s);
    setSlotForm({
      campaign_id: s.campaign_id,
      start_time: toLocalDatetime(new Date(s.start_time)),
      end_time: toLocalDatetime(new Date(s.end_time)),
      is_active: s.is_active,
    });
    setShowSlotModal(true);
  };
  const saveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const p = { ...slotForm };
    if (editingSlot)
      await supabase
        .from('flash_sale_time_slots')
        .update(p)
        .eq('id', editingSlot.id);
    else await supabase.from('flash_sale_time_slots').insert(p);
    setShowSlotModal(false);
    setSaving(false);
    loadAll();
  };
  const deleteSlot = async (id: string) => {
    if (!confirm('Xóa khung giờ?')) return;
    await supabase.from('flash_sale_time_slots').delete().eq('id', id);
    loadAll();
  };

  // Item CRUD
  const openAddItem = () => {
    loadProducts();
    setEditingItem(null);
    setItemForm({
      time_slot_id: timeSlots[0]?.id || '',
      product_id: '',
      unit_id: '',
      flash_price: 0,
      original_price: 0,
      discount_percent: 0,
      total_quantity: 100,
      is_active: true,
    });
    setShowItemModal(true);
  };
  const saveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const p = { ...itemForm };
    if (editingItem)
      await supabase
        .from('flash_sale_items')
        .update(p)
        .eq('id', editingItem.id);
    else await supabase.from('flash_sale_items').insert(p);
    setShowItemModal(false);
    setSaving(false);
    loadItems();
  };
  const deleteItem = async (id: string) => {
    if (!confirm('Xóa sản phẩm flash sale?')) return;
    await supabase.from('flash_sale_items').delete().eq('id', id);
    loadItems();
  };

  useEffect(() => {
    if (activeTab === 'items') loadItems();
  }, [activeTab]);

  return (
    <>
      <div className="page-header">
        <h2 className="text-xl font-bold">Quản lý Flash Sale</h2>
        <button
          onClick={() => {
            if (activeTab === 'campaigns') openAddCampaign();
            else if (activeTab === 'slots') openAddSlot();
            else openAddItem();
          }}
          className="btn-primary"
        >
          <span className="material-icons text-lg">add</span>
          {activeTab === 'campaigns'
            ? 'Thêm chiến dịch'
            : activeTab === 'slots'
              ? 'Thêm khung giờ'
              : 'Thêm sản phẩm'}
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {(['campaigns', 'slots', 'items'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`tab ${activeTab === t ? 'active' : ''}`}
          >
            <span className="material-icons text-lg">
              {t === 'campaigns'
                ? 'campaign'
                : t === 'slots'
                  ? 'schedule'
                  : 'flash_on'}
            </span>
            {t === 'campaigns'
              ? 'Chiến dịch'
              : t === 'slots'
                ? 'Khung giờ'
                : 'Sản phẩm'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center text-text-muted">Đang tải...</div>
      ) : (
        <div className="table-card">
          {/* Campaigns */}
          {activeTab === 'campaigns' && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>Bắt đầu</th>
                  <th>Kết thúc</th>
                  <th>Trạng thái</th>
                  <th className="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-text">
                      Chưa có chiến dịch
                    </td>
                  </tr>
                ) : (
                  campaigns.map((c) => (
                    <tr key={c.id}>
                      <td className="font-medium text-sm">{c.name}</td>
                      <td className="text-sm text-text-secondary">
                        {formatDate(c.start_date, 'long')}
                      </td>
                      <td className="text-sm text-text-secondary">
                        {formatDate(c.end_date, 'long')}
                      </td>
                      <td>
                        <span
                          className={`badge ${c.is_active ? 'active' : 'inactive'}`}
                        >
                          {c.is_active ? 'Hoạt động' : 'Ẩn'}
                        </span>
                      </td>
                      <td>
                        <div className="actions justify-end">
                          <button
                            onClick={() => openEditCampaign(c)}
                            className="btn-icon edit"
                          >
                            <span className="material-icons text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => deleteCampaign(c.id)}
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

          {/* Time Slots */}
          {activeTab === 'slots' && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Chiến dịch</th>
                  <th>Bắt đầu</th>
                  <th>Kết thúc</th>
                  <th>Trạng thái</th>
                  <th className="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {timeSlots.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-text">
                      Chưa có khung giờ
                    </td>
                  </tr>
                ) : (
                  timeSlots.map((s) => (
                    <tr key={s.id}>
                      <td className="text-sm">
                        {campaigns.find((c) => c.id === s.campaign_id)?.name ||
                          '—'}
                      </td>
                      <td className="text-sm text-text-secondary">
                        {formatDate(s.start_time, 'long')}
                      </td>
                      <td className="text-sm text-text-secondary">
                        {formatDate(s.end_time, 'long')}
                      </td>
                      <td>
                        <span
                          className={`badge ${s.is_active ? 'active' : 'inactive'}`}
                        >
                          {s.is_active ? 'Hoạt động' : 'Ẩn'}
                        </span>
                      </td>
                      <td>
                        <div className="actions justify-end">
                          <button
                            onClick={() => openEditSlot(s)}
                            className="btn-icon edit"
                          >
                            <span className="material-icons text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => deleteSlot(s.id)}
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

          {/* Flash Items */}
          {activeTab === 'items' && (
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
                {flashItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-text">
                      Chưa có sản phẩm
                    </td>
                  </tr>
                ) : (
                  flashItems.map((item) => (
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
                        {new Intl.NumberFormat('vi-VN').format(
                          item.flash_price,
                        )}
                        đ
                      </td>
                      <td className="text-sm">{item.discount_percent}%</td>
                      <td className="text-sm">{item.total_quantity}</td>
                      <td className="text-sm">{item.sold_quantity}</td>
                      <td>
                        <span
                          className={`badge ${item.is_active ? 'active' : 'inactive'}`}
                        >
                          {item.is_active ? 'Hoạt động' : 'Ẩn'}
                        </span>
                      </td>
                      <td>
                        <div className="actions justify-end">
                          <button
                            onClick={() => deleteItem(item.id)}
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
      )}

      {/* Campaign Modal */}
      {showCampaignModal && (
        <div
          className="modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setShowCampaignModal(false)
          }
        >
          <div className="modal">
            <div className="modal-header">
              <h3>{editingCampaign ? 'Sửa chiến dịch' : 'Thêm chiến dịch'}</h3>
              <button
                className="btn-close"
                onClick={() => setShowCampaignModal(false)}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            <form onSubmit={saveCampaign}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Tên *</label>
                  <input
                    type="text"
                    value={campaignForm.name}
                    onChange={(e) =>
                      setCampaignForm({ ...campaignForm, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Bắt đầu *</label>
                    <input
                      type="datetime-local"
                      value={campaignForm.start_date}
                      onChange={(e) =>
                        setCampaignForm({
                          ...campaignForm,
                          start_date: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Kết thúc *</label>
                    <input
                      type="datetime-local"
                      value={campaignForm.end_date}
                      onChange={(e) =>
                        setCampaignForm({
                          ...campaignForm,
                          end_date: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={campaignForm.is_active}
                    onChange={(e) =>
                      setCampaignForm({
                        ...campaignForm,
                        is_active: e.target.checked,
                      })
                    }
                  />{' '}
                  Hoạt động
                </label>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowCampaignModal(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slot Modal */}
      {showSlotModal && (
        <div
          className="modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setShowSlotModal(false)
          }
        >
          <div className="modal">
            <div className="modal-header">
              <h3>{editingSlot ? 'Sửa khung giờ' : 'Thêm khung giờ'}</h3>
              <button
                className="btn-close"
                onClick={() => setShowSlotModal(false)}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            <form onSubmit={saveSlot}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Chiến dịch *</label>
                  <select
                    value={slotForm.campaign_id}
                    onChange={(e) =>
                      setSlotForm({ ...slotForm, campaign_id: e.target.value })
                    }
                    required
                  >
                    <option value="">Chọn</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Bắt đầu *</label>
                    <input
                      type="datetime-local"
                      value={slotForm.start_time}
                      onChange={(e) =>
                        setSlotForm({ ...slotForm, start_time: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Kết thúc *</label>
                    <input
                      type="datetime-local"
                      value={slotForm.end_time}
                      onChange={(e) =>
                        setSlotForm({ ...slotForm, end_time: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={slotForm.is_active}
                    onChange={(e) =>
                      setSlotForm({ ...slotForm, is_active: e.target.checked })
                    }
                  />{' '}
                  Hoạt động
                </label>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowSlotModal(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {showItemModal && (
        <div
          className="modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setShowItemModal(false)
          }
        >
          <div className="modal">
            <div className="modal-header">
              <h3>Thêm sản phẩm Flash Sale</h3>
              <button
                className="btn-close"
                onClick={() => setShowItemModal(false)}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            <form onSubmit={saveItem}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Khung giờ *</label>
                  <select
                    value={itemForm.time_slot_id}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, time_slot_id: e.target.value })
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
                    value={itemForm.product_id}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, product_id: e.target.value })
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
                      value={itemForm.flash_price}
                      onChange={(e) =>
                        setItemForm({
                          ...itemForm,
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
                      value={itemForm.original_price}
                      onChange={(e) =>
                        setItemForm({
                          ...itemForm,
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
                      value={itemForm.discount_percent}
                      onChange={(e) =>
                        setItemForm({
                          ...itemForm,
                          discount_percent: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Số lượng</label>
                    <input
                      type="number"
                      value={itemForm.total_quantity}
                      onChange={(e) =>
                        setItemForm({
                          ...itemForm,
                          total_quantity: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemForm.is_active}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, is_active: e.target.checked })
                    }
                  />{' '}
                  Hoạt động
                </label>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowItemModal(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
