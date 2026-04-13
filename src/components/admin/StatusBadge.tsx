'use client';

import React from 'react';

interface StatusBadgeProps {
  /** Whether the item is active */
  active: boolean;
  /** Text when active (default: "Hoạt động") */
  activeText?: string;
  /** Text when inactive (default: "Ẩn") */
  inactiveText?: string;
}

/**
 * Displays a styled status badge (active/inactive).
 */
export default function StatusBadge({
  active,
  activeText = 'Hoạt động',
  inactiveText = 'Ẩn',
}: StatusBadgeProps) {
  return (
    <span className={`badge ${active ? 'active' : 'inactive'}`}>
      {active ? activeText : inactiveText}
    </span>
  );
}
