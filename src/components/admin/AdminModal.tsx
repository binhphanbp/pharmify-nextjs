'use client';

import React from 'react';

interface AdminModalProps {
  /** Whether the modal is visible */
  show: boolean;
  /** Called when user clicks overlay or close button */
  onClose: () => void;
  /** Modal title */
  title: string;
  /** Use wider modal (720px instead of 520px) */
  wide?: boolean;
  /** Content inside the modal body */
  children: React.ReactNode;
  /** Footer buttons (optional, renders modal-footer) */
  footer?: React.ReactNode;
}

/**
 * Reusable modal for all admin pages.
 * Uses CSS classes: modal-overlay, modal, modal-header, modal-body, modal-footer
 */
export default function AdminModal({
  show,
  onClose,
  title,
  wide = false,
  children,
  footer,
}: AdminModalProps) {
  if (!show) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`modal ${wide ? 'modal-wide' : ''}`}>
        {/* Header */}
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn-close" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">{children}</div>

        {/* Footer (optional) */}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
