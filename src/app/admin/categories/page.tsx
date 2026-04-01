'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  icon: string;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    icon: '',
    parent_id: '',
    sort_order: 0,
    is_active: true,
  });

  const supabase = createClient();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');
    setCategories(data || []);
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
      icon: '',
      parent_id: '',
      sort_order: 0,
      is_active: true,
    });
    setShowModal(true);
  };

  const openEdit = (c: CategoryRow) => {
    setEditing(c);
    setForm({
      name: c.name,
      slug: c.slug,
      icon: c.icon || '',
      parent_id: c.parent_id || '',
      sort_order: c.sort_order,
      is_active: c.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, parent_id: form.parent_id || null };
    if (editing) {
      await supabase.from('categories').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('categories').insert(payload);
    }
    setShowModal(false);
    setSaving(false);
    loadCategories();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa danh mục này?')) return;
    await supabase.from('categories').delete().eq('id', id);
    loadCategories();
  };

  const getParentName = (parentId: string | null) =>
    categories.find((c) => c.id === parentId)?.name || '—';

  return (
    <>
      <div className="page-header">
        <h2 className="text-xl font-bold">Quản lý danh mục</h2>
        <button onClick={openAdd} className="btn-primary">
          <span className="material-icons text-lg">add</span>Thêm danh mục
        </button>
      </div>

      <div className="table-card">
        {loading ? (
          <div className="p-8 text-center text-text-muted">Đang tải...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Icon</th>
                <th>Tên</th>
                <th>Slug</th>
                <th>Danh mục cha</th>
                <th>Thứ tự</th>
                <th>Trạng thái</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-text">
                    Chưa có danh mục
                  </td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="material-icons text-xl text-primary">
                        {c.icon || 'category'}
                      </span>
                    </td>
                    <td className="font-medium text-sm">{c.name}</td>
                    <td className="text-sm text-text-secondary">{c.slug}</td>
                    <td className="text-sm text-text-secondary">
                      {getParentName(c.parent_id)}
                    </td>
                    <td className="text-sm">{c.sort_order}</td>
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
                          onClick={() => openEdit(c)}
                          className="btn-icon edit"
                        >
                          <span className="material-icons text-lg">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
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

      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="modal">
            <div className="modal-header">
              <h3>{editing ? 'Sửa danh mục' : 'Thêm danh mục'}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Tên danh mục *</label>
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
                    <label>Icon (Material Icons)</label>
                    <input
                      type="text"
                      value={form.icon}
                      onChange={(e) =>
                        setForm({ ...form, icon: e.target.value })
                      }
                      placeholder="category"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Danh mục cha</label>
                    <select
                      value={form.parent_id}
                      onChange={(e) =>
                        setForm({ ...form, parent_id: e.target.value })
                      }
                    >
                      <option value="">Không có</option>
                      {categories
                        .filter((c) => c.id !== editing?.id)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
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
