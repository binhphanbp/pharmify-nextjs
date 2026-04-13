'use client';

import React from 'react';

interface ConfirmDeleteProps {
  /** Whether the confirm dialog is visible */
  show: boolean;
  /** Called when user cancels */
  onCancel: () => void;
  /** Called when user confirms deletion */
  onConfirm: () => void;
  /** Title text (default: "Xác nhận xóa") */
  title?: string;
  /** Description text */
  message?: string;
  /** Confirm button text (default: "Xóa") */
  confirmText?: string;
  /** Whether the confirm action is loading */
  loading?: boolean;
}

/**
 * Replaces native confirm() dialogs with a styled confirmation modal.
 * Uses CSS classes: confirm-overlay, confirm-box, confirm-actions
 */
export default function ConfirmDelete({
  show,
  onCancel,
  onConfirm,
  title = 'Xác nhận xóa',
  message = 'Bạn có chắc muốn xóa? Hành động này không thể hoàn tác.',
  confirmText = 'Xóa',
  loading = false,
}: ConfirmDeleteProps) {
  if (!show) return null;

  return (
    <div
      className="confirm-overlay"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="confirm-box">
        <span
          className="material-icons"
          style={{ fontSize: 48, color: 'var(--color-danger)' }}
        >
          warning
        </span>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="btn-cancel" onClick={onCancel} disabled={loading}>
            Hủy
          </button>
          <button className="btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Đang xóa...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
