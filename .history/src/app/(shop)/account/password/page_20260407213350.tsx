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
          <style jsx>{`
            .pw-group { margin-bottom: 20px; }
            .pw-label { display: block; color: #555; font-size: 14px; margin-bottom: 8px; font-weight: 500; }
            .pw-input { width: 100%; padding: 10px 14px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
            .pw-input:focus { border-color: #004d95; }
            .pw-hint { font-size: 12px; color: #999; margin-top: 6px; }
            .pw-save-btn { width: 100%; background: #004d95; color: white; border: none; padding: 12px; border-radius: 6px; font-weight: 500; cursor: pointer; font-size: 15px; transition: background 0.2s; }
            .pw-save-btn:hover:not(:disabled) { background: #003a70; }
            .pw-save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
          `}</style>

          <div className="pw-group">
            <label className="pw-label">Mật khẩu hiện tại</label>
            <input type="password" required className="pw-input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>

          <div className="pw-group">
            <label className="pw-label">Mật khẩu mới</label>
            <input type="password" required className="pw-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <div className="pw-hint">Tối thiểu 6 ký tự</div>
          </div>

          <div className="pw-group">
            <label className="pw-label">Xác nhận mật khẩu mới</label>
            <input type="password" required className="pw-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>

          <div className="pw-group" style={{ marginTop: '32px' }}>
            <button type="submit" className="pw-save-btn" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Xác nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


  return (
    <div>
      <div style={{ marginBottom: '24px', borderBottom: '1px solid #eee', paddingBottom: '16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#333', margin: 0 }}>Đổi mật khẩu</h1>
        <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác</p>
      </div>

      <div style={{ maxWidth: '400px', margin: '40px auto' }}>
        <form onSubmit={handleSave}>
          <style jsx>{`
            .pw-group {
              margin-bottom: 20px;
            }
            .pw-label {
              display: block;
              color: #555;
              font-size: 14px;
              margin-bottom: 8px;
              font-weight: 500;
            }
            .pw-input {
              width: 100%;
              padding: 10px 14px;
              border: 1px solid #ddd;
              border-radius: 6px;
              font-size: 14px;
              outline: none;
              transition: border-color 0.2s;
            }
            .pw-input:focus {
              border-color: #004d95;
            }
            .pw-hint {
              font-size: 12px;
              color: #999;
              margin-top: 6px;
            }
            .pw-save-btn {
              width: 100%;
              background: #004d95;
              color: white;
              border: none;
              padding: 12px;
              border-radius: 6px;
              font-weight: 500;
              cursor: pointer;
              font-size: 15px;
              transition: background 0.2s;
            }
            .pw-save-btn:hover {
              background: #003a70;
            }
          `}</style>
          
          <div className="pw-group">
            <label className="pw-label">Mật khẩu hiện tại</label>
            <input type="password" required className="pw-input" />
          </div>

          <div className="pw-group">
            <label className="pw-label">Mật khẩu mới</label>
            <input type="password" required className="pw-input" />
            <div className="pw-hint">Tối thiểu 6 ký tự</div>
          </div>

          <div className="pw-group">
            <label className="pw-label">Xác nhận mật khẩu mới</label>
            <input type="password" required className="pw-input" />
          </div>

          <div className="pw-group" style={{ marginTop: '32px' }}>
            <button type="submit" className="pw-save-btn">Xác nhận</button>
          </div>
        </form>
      </div>
    </div>
  );
}
