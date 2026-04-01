'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  sku: string;
  image_url: string;
  price: number;
  original_price: number;
  category_id: string;
  is_active: boolean;
  created_at: string;
  manufacturer: string;
  origin: string;
  short_description: string;
  description: string;
  requires_prescription: boolean;
}
interface CategoryOption {
  id: string;
  name: string;
}
interface UnitRow {
  id: string;
  product_id: string;
  unit_id: string;
  unit_name: string;
  conversion_factor: number;
  is_base_unit: boolean;
  is_active: boolean;
  price: number;
  original_price: number;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [saving, setSaving] = useState(false);

  // Form
  const [form, setForm] = useState({
    name: '',
    slug: '',
    sku: '',
    category_id: '',
    short_description: '',
    description: '',
    manufacturer: '',
    origin: '',
    requires_prescription: false,
    is_active: true,
    image_url: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Units
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [unitsProductId, setUnitsProductId] = useState('');
  const [units, setUnits] = useState<UnitRow[]>([]);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const supabase = createClient();

  const loadProducts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('id, name')
      .order('name');
    setCategories(data || []);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({
      name: '',
      slug: '',
      sku: '',
      category_id: '',
      short_description: '',
      description: '',
      manufacturer: '',
      origin: '',
      requires_prescription: false,
      is_active: true,
      image_url: '',
    });
    setImageFile(null);
    setShowModal(true);
  };

  const openEdit = (p: ProductRow) => {
    setEditing(p);
    setForm({
      name: p.name,
      slug: p.slug,
      sku: p.sku || '',
      category_id: p.category_id || '',
      short_description: p.short_description || '',
      description: p.description || '',
      manufacturer: p.manufacturer || '',
      origin: p.origin || '',
      requires_prescription: p.requires_prescription,
      is_active: p.is_active,
      image_url: p.image_url || '',
    });
    setImageFile(null);
    setShowModal(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let imageUrl = form.image_url;
    if (imageFile) {
      const ext = imageFile.name.split('.').pop();
      const path = `products/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('images')
        .upload(path, imageFile);
      if (!upErr) {
        const { data: urlData } = supabase.storage
          .from('images')
          .getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }
    }

    const payload = { ...form, image_url: imageUrl };

    if (editing) {
      await supabase.from('products').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('products').insert(payload);
    }

    setShowModal(false);
    setSaving(false);
    loadProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    await supabase.from('products').delete().eq('id', id);
    loadProducts();
  };

  const openUnits = async (productId: string) => {
    setUnitsProductId(productId);
    const { data } = await supabase
      .from('product_units')
      .select('*, units(name)')
      .eq('product_id', productId)
      .order('conversion_factor');
    setUnits(
      (data || []).map((u: any) => ({ ...u, unit_name: u.units?.name || '' })),
    );
    setShowUnitsModal(true);
  };

  const filtered = products.filter((p) => {
    const matchSearch =
      !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || p.category_id === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <>
      <div className="page-header">
        <h2 className="text-xl font-bold">Quản lý sản phẩm</h2>
        <button onClick={openAdd} className="btn-primary">
          <span className="material-icons text-lg">add</span>Thêm sản phẩm
        </button>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Tìm kiếm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="filter-select"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="table-card">
        {loading ? (
          <div className="p-8 text-center text-text-muted">Đang tải...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>SKU</th>
                <th>Giá</th>
                <th>Trạng thái</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-text">
                    Không tìm thấy sản phẩm
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            p.image_url ||
                            'https://placehold.co/40x40/f5f5f5/999?text=?'
                          }
                          alt=""
                          className="thumb"
                        />
                        <div>
                          <p className="font-medium text-sm">{p.name}</p>
                          <p className="text-xs text-text-muted">
                            {categories.find((c) => c.id === p.category_id)
                              ?.name || ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm text-text-secondary">
                      {p.sku || '—'}
                    </td>
                    <td className="text-sm font-semibold">
                      {formatCurrency(p.price || 0)}
                    </td>
                    <td>
                      <span
                        className={`badge ${p.is_active ? 'active' : 'inactive'}`}
                      >
                        {p.is_active ? 'Hoạt động' : 'Ẩn'}
                      </span>
                    </td>
                    <td>
                      <div className="actions justify-end">
                        <button
                          onClick={() => openUnits(p.id)}
                          className="btn-icon"
                          title="Đơn vị"
                        >
                          <span className="material-icons text-lg">list</span>
                        </button>
                        <button
                          onClick={() => openEdit(p)}
                          className="btn-icon edit"
                        >
                          <span className="material-icons text-lg">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="btn-icon danger"
                        >
                          <span className="material-icons text-lg">delete</span>
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

      {/* Product Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="modal modal-wide">
            <div className="modal-header">
              <h3>{editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Tên sản phẩm *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          name: e.target.value,
                          slug: generateSlug(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>SKU</label>
                    <input
                      type="text"
                      value={form.sku}
                      onChange={(e) =>
                        setForm({ ...form, sku: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Slug</label>
                    <input
                      type="text"
                      value={form.slug}
                      onChange={(e) =>
                        setForm({ ...form, slug: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Danh mục</label>
                    <select
                      value={form.category_id}
                      onChange={(e) =>
                        setForm({ ...form, category_id: e.target.value })
                      }
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Mô tả ngắn</label>
                  <textarea
                    value={form.short_description}
                    onChange={(e) =>
                      setForm({ ...form, short_description: e.target.value })
                    }
                    rows={2}
                  />
                </div>
                <div className="form-group">
                  <label>Mô tả chi tiết</label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    rows={4}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nhà sản xuất</label>
                    <input
                      type="text"
                      value={form.manufacturer}
                      onChange={(e) =>
                        setForm({ ...form, manufacturer: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Xuất xứ</label>
                    <input
                      type="text"
                      value={form.origin}
                      onChange={(e) =>
                        setForm({ ...form, origin: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Hình ảnh</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                  {form.image_url && (
                    <img
                      src={form.image_url}
                      className="preview-img"
                      alt="preview"
                    />
                  )}
                </div>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) =>
                        setForm({ ...form, is_active: e.target.checked })
                      }
                    />
                    Hoạt động
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.requires_prescription}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          requires_prescription: e.target.checked,
                        })
                      }
                    />
                    Cần kê đơn
                  </label>
                </div>
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
          </div>
        </div>
      )}

      {/* Units Modal */}
      {showUnitsModal && (
        <div
          className="modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setShowUnitsModal(false)
          }
        >
          <div className="modal">
            <div className="modal-header">
              <h3>Đơn vị sản phẩm</h3>
              <button
                className="btn-close"
                onClick={() => setShowUnitsModal(false)}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              {units.length === 0 ? (
                <p className="text-text-muted text-sm text-center py-4">
                  Chưa có đơn vị nào
                </p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Đơn vị</th>
                      <th>Hệ số</th>
                      <th>Giá</th>
                      <th>Giá gốc</th>
                      <th>Cơ bản</th>
                    </tr>
                  </thead>
                  <tbody>
                    {units.map((u) => (
                      <tr key={u.id}>
                        <td className="text-sm">{u.unit_name}</td>
                        <td className="text-sm">{u.conversion_factor}</td>
                        <td className="text-sm font-semibold">
                          {formatCurrency(u.price)}
                        </td>
                        <td className="text-sm text-text-muted">
                          {formatCurrency(u.original_price)}
                        </td>
                        <td>
                          {u.is_base_unit && (
                            <span className="badge active">✓</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
