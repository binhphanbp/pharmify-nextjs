'use client';

import React from 'react';
import { formatDate, toLocalDatetime } from '@/lib/utils';
import { AdminModal, StatusBadge, ConfirmDelete } from '@/components/admin';

interface Campaign {
  id: string;
  name: string;
}

interface TimeSlot {
  id: string;
  campaign_id: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface TimeSlotTabProps {
  timeSlots: TimeSlot[];
  campaigns: Campaign[];
  onReload: () => void;
  supabase: any;
}

export default function TimeSlotTab({
  timeSlots,
  campaigns,
  onReload,
  supabase,
}: TimeSlotTabProps) {
  const [showModal, setShowModal] = React.useState(false);
  const [editing, setEditing] = React.useState<TimeSlot | null>(null);
  const [form, setForm] = React.useState({
    campaign_id: '',
    start_time: '',
    end_time: '',
    is_active: true,
  });
  const [saving, setSaving] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const openAdd = () => {
    setEditing(null);
    setForm({
      campaign_id: campaigns[0]?.id || '',
      start_time: '',
      end_time: '',
      is_active: true,
    });
    setShowModal(true);
  };

  const openEdit = (s: TimeSlot) => {
    setEditing(s);
    setForm({
      campaign_id: s.campaign_id,
      start_time: toLocalDatetime(new Date(s.start_time)),
      end_time: toLocalDatetime(new Date(s.end_time)),
      is_active: s.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (editing) {
      await supabase
        .from('flash_sale_time_slots')
        .update(form)
        .eq('id', editing.id);
    } else {
      await supabase.from('flash_sale_time_slots').insert(form);
    }
    setShowModal(false);
    setSaving(false);
    onReload();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await supabase.from('flash_sale_time_slots').delete().eq('id', deleteId);
    setDeleteId(null);
    setDeleting(false);
    onReload();
  };

  return (
    <>
      <button onClick={openAdd} className="btn-primary mb-4">
        <span className="material-icons text-lg">add</span>
        Thêm khung giờ
      </button>

      <div className="table-card">
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
                    {campaigns.find((c) => c.id === s.campaign_id)?.name || '—'}
                  </td>
                  <td className="text-sm text-text-secondary">
                    {formatDate(s.start_time, 'long')}
                  </td>
                  <td className="text-sm text-text-secondary">
                    {formatDate(s.end_time, 'long')}
                  </td>
                  <td>
                    <StatusBadge active={s.is_active} />
                  </td>
                  <td>
                    <div className="actions justify-end">
                      <button
                        onClick={() => openEdit(s)}
                        className="btn-icon edit"
                      >
                        <span className="material-icons text-lg">edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteId(s.id)}
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
        title={editing ? 'Sửa khung giờ' : 'Thêm khung giờ'}
      >
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-group">
              <label>Chiến dịch *</label>
              <select
                value={form.campaign_id}
                onChange={(e) =>
                  setForm({ ...form, campaign_id: e.target.value })
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
                  value={form.start_time}
                  onChange={(e) =>
                    setForm({ ...form, start_time: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Kết thúc *</label>
                <input
                  type="datetime-local"
                  value={form.end_time}
                  onChange={(e) =>
                    setForm({ ...form, end_time: e.target.value })
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

      <ConfirmDelete
        show={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message="Bạn có chắc muốn xóa khung giờ này?"
      />
    </>
  );
}
