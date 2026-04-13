'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { generateSlug } from '@/lib/utils';
import type { Brand } from '@/types/banner';
import {
  PageHeader,
  AdminModal,
  StatusBadge,
  ConfirmDelete,
  Toast,
} from '@/components/admin';

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
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
    setToast(editing ? 'Cập nhật thành công!' : 'Thêm thành công!');
    loadBrands();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('brands').delete().eq('id', deleteId);
    setDeleteId(null);
    setToast('Đã xóa thương hiệu!');
    loadBrands();
  };

  return (
    <>
      <PageHeader
        title="Quản lý thương hiệu"
        actionText="Thêm thương hiệu"
        onAction={openAdd}
      />

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
              <StatusBadge active={b.is_active} />
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => openEdit(b)} className="btn-icon edit">
                  <span className="material-icons text-sm">edit</span>
                </button>
                <button
                  onClick={() => setDeleteId(b.id)}
                  className="btn-icon danger"
                >
                  <span className="material-icons text-sm">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AdminModal
        show={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Sửa thương hiệu' : 'Thêm thương hiệu'}
        footer={
          <>
            <button className="btn-cancel" onClick={() => setShowModal(false)}>
              Hủy
            </button>
            <button
              type="submit"
              form="brand-form"
              className="btn-primary"
              disabled={saving}
            >
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </>
        }
      >
        <form id="brand-form" onSubmit={handleSave}>
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
        </form>
      </AdminModal>

      {/* Confirm Delete */}
      <ConfirmDelete
        show={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        message="Bạn có chắc muốn xóa thương hiệu này?"
      />

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}
