'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Brand } from '@/types/banner';

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    website_url: '',
    sort_order: 0,
    is_active: true,
    logo_url: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('brands')
      .select('*')
      .order('sort_order');
    setBrands(data || []);
    setLoading(false);
  };

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const openAdd = () => {
    setEditing(null);
    setForm({
      name: '',
      slug: '',
      website_url: '',
      sort_order: 0,
      is_active: true,
      logo_url: '',
    });
    setLogoFile(null);
    setShowModal(true);
  };

  const openEdit = (b: Brand) => {
    setEditing(b);
    setForm({
      name: b.name,
      slug: b.slug,
      website_url: b.website_url || '',
      sort_order: b.sort_order,
      is_active: b.is_active,
      logo_url: b.logo_url || '',
    });
    setLogoFile(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    let logoUrl = form.logo_url;
    if (logoFile) {
      const ext = logoFile.name.split('.').pop();
      const path = `brands/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('images')
        .upload(path, logoFile);
      if (!upErr) {
        const { data: urlData } = supabase.storage
          .from('images')
          .getPublicUrl(path);
        logoUrl = urlData.publicUrl;
      }
    }
    const payload = { ...form, logo_url: logoUrl };
    if (editing) {
      await supabase.from('brands').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('brands').insert(payload);
    }
    setShowModal(false);
    setSaving(false);
    loadBrands();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa thương hiệu này?')) return;
    await supabase.from('brands').delete().eq('id', id);
    loadBrands();
  };

  return (
    <>
      <div className="page-header">
        <h2 className="text-xl font-bold">Quản lý thương hiệu</h2>
        <button onClick={openAdd} className="btn-primary">
          <span className="material-icons text-lg">add</span>Thêm thương hiệu
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-text-muted">Đang tải...</div>
      ) : brands.length === 0 ? (
        <div className="empty-text">Chưa có thương hiệu nào</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {brands.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-xl p-4 shadow-sm text-center group relative"
            >
              <div className="w-20 h-20 mx-auto mb-3 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden">
                <img
                  src={
                    b.logo_url ||
                    'https://placehold.co/80x80/f5f5f5/999?text=Logo'
                  }
                  alt={b.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <p className="font-medium text-sm truncate">{b.name}</p>
              <span
                className={`badge mt-2 ${b.is_active ? 'active' : 'inactive'}`}
              >
                {b.is_active ? 'Hoạt động' : 'Ẩn'}
              </span>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => openEdit(b)} className="btn-icon edit">
                  <span className="material-icons text-sm">edit</span>
                </button>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="btn-icon danger"
                >
                  <span className="material-icons text-sm">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="modal">
            <div className="modal-header">
              <h3>{editing ? 'Sửa thương hiệu' : 'Thêm thương hiệu'}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Tên *</label>
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
                    <label>Thứ tự</label>
                    <input
                      type="number"
                      value={form.sort_order}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          sort_order: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Website</label>
                  <input
                    type="url"
                    value={form.website_url}
                    onChange={(e) =>
                      setForm({ ...form, website_url: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Logo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  />
                  {form.logo_url && (
                    <img
                      src={form.logo_url}
                      className="preview-img"
                      alt="preview"
                    />
                  )}
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
          </div>
        </div>
      )}
    </>
  );
}
