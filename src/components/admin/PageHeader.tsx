'use client';

import React from 'react';

interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Action button text (e.g. "Thêm sản phẩm") */
  actionText?: string;
  /** Called when action button is clicked */
  onAction?: () => void;
  /** Material icon name for the action button (default: "add") */
  actionIcon?: string;
}

/**
 * Standard page header for admin pages with title + optional action button.
 */
export default function PageHeader({
  title,
  actionText,
  onAction,
  actionIcon = 'add',
}: PageHeaderProps) {
  return (
    <div className="page-header">
      <h1 className="text-2xl font-bold">{title}</h1>
      {actionText && onAction && (
        <button className="btn-primary" onClick={onAction}>
          <span className="material-icons text-lg">{actionIcon}</span>
          {actionText}
        </button>
      )}
    </div>
  );
}
