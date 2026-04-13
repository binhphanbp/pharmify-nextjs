'use client';

import React from 'react';
import { formatDate, toLocalDatetime } from '@/lib/utils';
import { AdminModal, StatusBadge, ConfirmDelete } from '@/components/admin';

interface Campaign {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface CampaignTabProps {
  campaigns: Campaign[];
  onReload: () => void;
  supabase: any;
}

export default function CampaignTab({
  campaigns,
  onReload,
  supabase,
}: CampaignTabProps) {
  const [showModal, setShowModal] = React.useState(false);
  const [editing, setEditing] = React.useState<Campaign | null>(null);
  const [form, setForm] = React.useState({
    name: '',
    start_date: '',
    end_date: '',
    is_active: true,
  });
  const [saving, setSaving] = React.useState(false);

  // Confirm delete
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', start_date: '', end_date: '', is_active: true });
    setShowModal(true);
  };

  const openEdit = (c: Campaign) => {
    setEditing(c);
    setForm({
      name: c.name,
      start_date: toLocalDatetime(new Date(c.start_date)),
      end_date: toLocalDatetime(new Date(c.end_date)),
      is_active: c.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (editing) {
      await supabase
        .from('flash_sale_campaigns')
        .update(form)
        .eq('id', editing.id);
    } else {
      await supabase.from('flash_sale_campaigns').insert(form);
    }
    setShowModal(false);
    setSaving(false);
    onReload();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await supabase.from('flash_sale_campaigns').delete().eq('id', deleteId);
    setDeleteId(null);
    setDeleting(false);
    onReload();
  };

  return (
    <>
      {/* Add button */}
      <button onClick={openAdd} className="btn-primary mb-4">
        <span className="material-icons text-lg">add</span>
        Thêm chiến dịch
      </button>

      <div className="table-card">
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
      </div>

      {/* Modal */}
      <AdminModal
        show={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Sửa chiến dịch' : 'Thêm chiến dịch'}
      >
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-group">
              <label>Tên *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Bắt đầu *</label>
                <input
                  type="datetime-local"
                  value={form.start_date}
                  onChange={(e) =>
                    setForm({ ...form, start_date: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Kết thúc *</label>
                <input
                  type="datetime-local"
                  value={form.end_date}
                  onChange={(e) =>
                    setForm({ ...form, end_date: e.target.value })
                  }
                  required
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

      {/* Confirm Delete */}
      <ConfirmDelete
        show={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message="Bạn có chắc muốn xóa chiến dịch này?"
      />
    </>
  );
}
