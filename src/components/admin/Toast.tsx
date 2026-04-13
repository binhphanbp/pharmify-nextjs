'use client';

import React, { useEffect } from 'react';

interface ToastProps {
  /** Message to display */
  message: string;
  /** Toast type (success or error) */
  type?: 'success' | 'error';
  /** Called when toast should be dismissed */
  onClose: () => void;
  /** Auto-dismiss duration in ms (default: 3000) */
  duration?: number;
}

/**
 * Auto-dismissing toast notification.
 */
export default function Toast({
  message,
  type = 'success',
  onClose,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className={`toast ${type === 'error' ? 'error' : ''}`}>
      <span className="material-icons">
        {type === 'success' ? 'check_circle' : 'error'}
      </span>
      {message}
    </div>
  );
}
