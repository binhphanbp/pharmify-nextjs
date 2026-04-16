'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import {
  PageHeader,
  AdminModal,
  StatusBadge,
  ConfirmDelete,
  Toast,
} from '@/components/admin';

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'customer',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const supabase = createClient();

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setToast({ message: 'Lỗi tải danh sách', type: 'error' });
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      email: '',
      password: '',
      full_name: '',
      phone: '',
      role: 'customer',
      is_active: true,
    });
    setShowModal(true);
  };

  const openEdit = (user: UserRow) => {
    setEditing(user);
    setForm({
      email: user.email,
      password: '',
      full_name: user.full_name || '',
      phone: user.phone || '',
      role: user.role,
      is_active: user.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const updatePayload = {
      full_name: form.full_name,
      phone: form.phone,
      role: form.role,
      is_active: form.is_active,
    };

    if (editing) {
      try {
        const res = await fetch(`/api/admin/users/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Lỗi cập nhật người dùng');

        setToast({ message: 'Cập nhật thành công!', type: 'success' });
        setShowModal(false);
        loadUsers();
      } catch (err: unknown) {
        setToast({
          message: 'Lưu thất bại: ' + (err as Error).message,
          type: 'error',
        });
      }
    } else {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            fullName: form.full_name,
            phone: form.phone,
            role: form.role,
            isActive: form.is_active,
          }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Lỗi thêm người dùng');

        setToast({ message: 'Thêm mới thành công!', type: 'success' });
        setShowModal(false);
        loadUsers();
      } catch (err: unknown) {
        setToast({ message: (err as Error).message, type: 'error' });
      }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/users/${deleteId}`, {
        method: 'DELETE',
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Lỗi khi xóa người dùng');

      setToast({ message: 'Đã xóa người dùng', type: 'success' });
      loadUsers();
    } catch (err: unknown) {
      setToast({
        message: 'Xóa thất bại: ' + (err as Error).message,
        type: 'error',
      });
    }

    setDeleteId(null);
    setDeleting(false);
  };

  // Filter logic
  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name || '').toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Quản trị';
      case 'customer':
        return 'Khách hàng';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Quản lý người dùng"
        actionText="Thêm người dùng"
        onAction={openAdd}
      />

      {/* Filters */}
      <div className="filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Tìm theo tên hoặc email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="filter-select"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">Tất cả vai trò</option>
          <option value="admin">Quản trị</option>
          <option value="customer">Khách hàng</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Số điện thoại</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th className="text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-text">
                  Không tìm thấy người dùng
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div>
                      <p className="font-medium text-sm">
                        {u.full_name || '—'}
                      </p>
                      <p className="text-xs text-text-secondary">{u.email}</p>
                    </div>
                  </td>
                  <td className="text-sm">{u.phone || '—'}</td>
                  <td>
                    <span
                      className={`badge ${u.role === 'admin' ? 'active' : 'inactive'}`}
                    >
                      {roleLabel(u.role)}
                    </span>
                  </td>
                  <td>
                    <StatusBadge active={u.is_active} />
                  </td>
                  <td className="text-sm text-text-secondary">
                    {formatDate(u.created_at)}
                  </td>
                  <td>
                    <div className="actions justify-end">
                      <button
                        onClick={() => openEdit(u)}
                        className="btn-icon edit"
                      >
                        <span className="material-icons text-lg">edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteId(u.id)}
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
      </div>

      {/* Edit Modal */}
      <AdminModal
        show={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Chỉnh sửa người dùng' : 'Thêm người dùng'}
      >
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                disabled={!!editing}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            {!editing && (
              <div className="form-group">
                <label>Mật khẩu</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required={!editing}
                />
              </div>
            )}
            <div className="form-group">
              <label>Họ tên</label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Số điện thoại</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Vai trò</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="customer">Khách hàng</option>
                <option value="admin">Quản trị</option>
              </select>
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

      {/* Confirm Delete */}
      <ConfirmDelete
        show={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message="Bạn có chắc muốn xóa người dùng này? Thao tác không thể hoàn tác."
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
