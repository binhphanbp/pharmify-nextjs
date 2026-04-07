'use client';

import { useState } from 'react';

export default function PasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (currentPassword === newPassword) {
      setError('Mật khẩu mới phải khác mật khẩu hiện tại');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Đổi mật khẩu thất bại');
      setSuccess('Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Đổi mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px', borderBottom: '1px solid #eee', paddingBottom: '16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#333', margin: 0 }}>Đổi mật khẩu</h1>
        <p style={{ color: '#666', fontSize: '14px', margin: '4px 0 0' }}>Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác</p>
      </div>

      {error && (
        <div style={{ background: '#fff0f0', color: '#c0392b', border: '1px solid #fcc', padding: '10px 16px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-icons" style={{ fontSize: '18px' }}>error</span>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: '#f0fff4', color: '#27ae60', border: '1px solid #b7ebc7', padding: '10px 16px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-icons" style={{ fontSize: '18px' }}>check_circle</span>
          {success}
        </div>
      )}

      <div style={{ maxWidth: '400px', margin: '40px auto' }}>
        <form onSubmit={handleSave}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: '#555', fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>Mật khẩu hiện tại</label>
            <input type="password" required style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: '#555', fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>Mật khẩu mới</label>
            <input type="password" required style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <div style={{ fontSize: '12px', color: '#999', marginTop: '6px' }}>Tối thiểu 6 ký tự</div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: '#555', fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>Xác nhận mật khẩu mới</label>
            <input type="password" required style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>

          <div style={{ marginTop: '32px' }}>
            <button type="submit" disabled={loading} style={{ width: '100%', background: '#004d95', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '15px', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Đang xử lý...' : 'Xác nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
