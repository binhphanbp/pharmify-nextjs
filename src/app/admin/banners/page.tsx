'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Banner } from '@/types/banner';

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'hero' | 'sub'>('hero');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    link_url: '',
    position: 'hero' as string,
    sort_order: 0,
    is_active: true,
    image_url: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('banners')
      .select('*')
      .order('sort_order');
    setBanners(data || []);
    setLoading(false);
  };

  const filtered = banners.filter((b) => b.position === activeTab);

  const openAdd = () => {
    setEditing(null);
    setForm({
      title: '',
      subtitle: '',
      link_url: '',
      position: activeTab,
      sort_order: 0,
      is_active: true,
      image_url: '',
    });
    setImageFile(null);
    setShowModal(true);
  };

  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({
      title: b.title,
      subtitle: b.subtitle || '',
      link_url: b.link_url || '',
      position: b.position,
      sort_order: b.sort_order,
      is_active: b.is_active,
      image_url: b.image_url || '',
    });
    setImageFile(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let imageUrl = form.image_url;
    if (imageFile) {
      const ext = imageFile.name.split('.').pop();
      const path = `banners/${Date.now()}.${ext}`;
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
      await supabase.from('banners').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('banners').insert(payload);
    }

    setShowModal(false);
    setSaving(false);
    loadBanners();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa banner này?')) return;
    await supabase.from('banners').delete().eq('id', id);
    loadBanners();
  };

  return (
    <>
      <div className="page-header">
        <h2 className="text-xl font-bold">Quản lý Banner</h2>
        <button onClick={openAdd} className="btn-primary">
          <span className="material-icons text-lg">add</span>Thêm banner
        </button>
      </div>

      <div className="tabs">
        <button
          onClick={() => setActiveTab('hero')}
          className={`tab ${activeTab === 'hero' ? 'active' : ''}`}
        >
          <span className="material-icons text-lg">panorama</span>Hero Banner
        </button>
        <button
          onClick={() => setActiveTab('sub')}
          className={`tab ${activeTab === 'sub' ? 'active' : ''}`}
        >
          <span className="material-icons text-lg">view_sidebar</span>Sub Banner
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-text-muted">Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-text">Chưa có banner nào</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-xl overflow-hidden shadow-sm group"
            >
              <div className="aspect-video bg-gray-100 relative overflow-hidden">
                <img
                  src={
                    b.image_url ||
                    'https://placehold.co/400x200/f5f5f5/999?text=Banner'
                  }
                  alt={b.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(b)}
                      className="bg-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-light transition"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="bg-white text-danger px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-50 transition"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-3">
                <p className="font-medium text-sm truncate">
                  {b.title || 'Không có tiêu đề'}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-text-muted">
                    Thứ tự: {b.sort_order}
                  </span>
                  <span
                    className={`badge ${b.is_active ? 'active' : 'inactive'}`}
                  >
                    {b.is_active ? 'Hoạt động' : 'Ẩn'}
                  </span>
                </div>
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
              <h3>{editing ? 'Sửa banner' : 'Thêm banner'}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Tiêu đề</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Phụ đề</label>
                  <input
                    type="text"
                    value={form.subtitle}
                    onChange={(e) =>
                      setForm({ ...form, subtitle: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Link URL</label>
                  <input
                    type="text"
                    value={form.link_url}
                    onChange={(e) =>
                      setForm({ ...form, link_url: e.target.value })
                    }
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Vị trí</label>
                    <select
                      value={form.position}
                      onChange={(e) =>
                        setForm({ ...form, position: e.target.value })
                      }
                    >
                      <option value="hero">Hero</option>
                      <option value="sub">Sub</option>
                    </select>
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
