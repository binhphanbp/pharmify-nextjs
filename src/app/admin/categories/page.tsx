'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { generateSlug } from '@/lib/utils';
import {
  PageHeader,
  AdminModal,
  StatusBadge,
  ConfirmDelete,
  Toast,
} from '@/components/admin';

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
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
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
    setToast(editing ? 'Cập nhật thành công!' : 'Thêm thành công!');
    loadCategories();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('categories').delete().eq('id', deleteId);
    setDeleteId(null);
    setToast('Đã xóa danh mục!');
    loadCategories();
  };

  const getParentName = (parentId: string | null) =>
    categories.find((c) => c.id === parentId)?.name || '—';

  return (
    <>
      <PageHeader
        title="Quản lý danh mục"
        actionText="Thêm danh mục"
        onAction={openAdd}
      />

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
                      <StatusBadge active={c.is_active} />
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
                          onClick={() => setDeleteId(c.id)}
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

      {/* Add/Edit Modal */}
      <AdminModal
        show={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Sửa danh mục' : 'Thêm danh mục'}
        footer={
          <>
            <button className="btn-cancel" onClick={() => setShowModal(false)}>
              Hủy
            </button>
            <button
              type="submit"
              form="category-form"
              className="btn-primary"
              disabled={saving}
            >
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSave}>
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
        </form>
      </AdminModal>

      {/* Confirm Delete */}
      <ConfirmDelete
        show={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        message="Bạn có chắc muốn xóa danh mục này?"
      />

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}
