'use client';

import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/stores';
import { updateProfile } from '@/stores/auth-store';

export default function AccountPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('other');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // Sync form fields when user data loads from Redux
  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || '');
      setPhone(user.user_metadata?.phone || '');
      setDateOfBirth(user.user_metadata?.dob || '');
      setGender(user.user_metadata?.gender || 'other');
    }
  }, [user?.id]); // only re-sync when the user identity changes, not on every metadata update

  if (!user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess('');
    setIsSaving(true);
    try {
      await dispatch(
        updateProfile({ fullName, phone, dob: dateOfBirth, gender }),
      ).unwrap();
      setSaveSuccess('Cập nhật thông tin thành công!');
      setIsEditing(false);
    } catch (err: unknown) {
      // rejectWithValue returns a string; RTK serialized errors have a .message property
      const msg =
        typeof err === 'string'
          ? err
          : err instanceof Error
            ? err.message
            : (err as Record<string, unknown>)?.message
              ? String((err as Record<string, unknown>).message)
              : 'Cập nhật thất bại';
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsSaving(false); // safety reset in case save was in-flight
    setSaveError('');
    setFullName(user.user_metadata?.full_name || '');
    setPhone(user.user_metadata?.phone || '');
    setDateOfBirth(user.user_metadata?.dob || '');
    setGender(user.user_metadata?.gender || 'other');
  };

  const inputCss: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#222',
    background: '#fff',
  };

  const rowCss: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #f5f5f5',
  };

  const labelCss: React.CSSProperties = {
    width: '160px',
    flexShrink: 0,
    fontSize: '14px',
    color: '#888',
    fontWeight: 500,
  };

  const valueCss: React.CSSProperties = {
    flex: 1,
    fontSize: '14px',
    color: '#222',
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <h1
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#1a1a1a',
            margin: '0 0 4px',
          }}
        >
          Hồ sơ của tôi
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: '#999' }}>
          Quản lý thông tin hồ sơ để bảo mật tài khoản
        </p>
      </div>

      {/* Alerts */}
      {saveError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#fff1f0',
            border: '1px solid #ffa39e',
            borderRadius: '6px',
            padding: '10px 14px',
            marginBottom: '16px',
            fontSize: '14px',
            color: '#cf1322',
          }}
        >
          <span className="material-icons" style={{ fontSize: '18px' }}>
            error_outline
          </span>
          {saveError}
        </div>
      )}
      {saveSuccess && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#f6ffed',
            border: '1px solid #b7eb8f',
            borderRadius: '6px',
            padding: '10px 14px',
            marginBottom: '16px',
            fontSize: '14px',
            color: '#389e0d',
          }}
        >
          <span className="material-icons" style={{ fontSize: '18px' }}>
            check_circle
          </span>
          {saveSuccess}
        </div>
      )}

      {/* Two-column: form + avatar */}
      <div style={{ display: 'flex', gap: '48px' }}>
        {/* Form */}
        <form onSubmit={handleSave} style={{ flex: 1, minWidth: 0 }}>
          <div style={rowCss}>
            <div style={labelCss}>Tên đăng nhập</div>
            <div style={{ ...valueCss, color: '#555' }}>
              {user.email?.split('@')[0]}
            </div>
          </div>

          <div style={rowCss}>
            <div style={labelCss}>Họ &amp; Tên</div>
            {isEditing ? (
              <input
                style={inputCss}
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên"
                required
              />
            ) : (
              <div style={valueCss}>
                {fullName || (
                  <span style={{ color: '#bbb' }}>Chưa cập nhật</span>
                )}
              </div>
            )}
          </div>

          <div style={rowCss}>
            <div style={labelCss}>Email</div>
            <div style={{ ...valueCss, color: '#555' }}>{user.email}</div>
          </div>

          <div style={rowCss}>
            <div style={labelCss}>Số điện thoại</div>
            {isEditing ? (
              <input
                style={inputCss}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nhập số điện thoại"
              />
            ) : (
              <div style={valueCss}>
                {phone || <span style={{ color: '#bbb' }}>Chưa cập nhật</span>}
              </div>
            )}
          </div>

          <div style={rowCss}>
            <div style={labelCss}>Giới tính</div>
            {isEditing ? (
              <div style={{ display: 'flex', gap: '20px' }}>
                {(['male', 'female', 'other'] as const).map((g) => (
                  <label
                    key={g}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '14px',
                      color: '#333',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={g}
                      checked={gender === g}
                      onChange={() => setGender(g)}
                      style={{ accentColor: '#004d95' }}
                    />
                    {g === 'male' ? 'Nam' : g === 'female' ? 'Nữ' : 'Khác'}
                  </label>
                ))}
              </div>
            ) : (
              <div style={valueCss}>
                {gender === 'male'
                  ? 'Nam'
                  : gender === 'female'
                    ? 'Nữ'
                    : 'Khác'}
              </div>
            )}
          </div>

          <div style={{ ...rowCss, borderBottom: 'none' }}>
            <div style={labelCss}>Ngày sinh</div>
            {isEditing ? (
              <input
                style={{ ...inputCss, maxWidth: '180px' }}
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            ) : (
              <div style={valueCss}>
                {dateOfBirth ? (
                  new Date(dateOfBirth).toLocaleDateString('vi-VN')
                ) : (
                  <span style={{ color: '#bbb' }}>Chưa cập nhật</span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ marginTop: '28px', display: 'flex', gap: '10px' }}>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                  setSaveSuccess('');
                }}
                style={{
                  padding: '10px 24px',
                  background: '#004d95',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cập nhật hồ sơ
              </button>
            ) : (
              <>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    padding: '10px 24px',
                    background: isSaving ? '#90b8d8' : '#004d95',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    padding: '10px 20px',
                    background: '#f5f5f5',
                    color: '#555',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Hủy
                </button>
              </>
            )}
          </div>
        </form>

        {/* Avatar section */}
        <div
          style={{
            width: '200px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: '8px',
          }}
        >
          <div
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #004d95, #0072bc)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              color: '#fff',
              fontSize: '40px',
              fontWeight: 700,
            }}
          >
            {user.user_metadata?.full_name?.charAt(0).toUpperCase() ||
              user.email?.charAt(0).toUpperCase() ||
              'U'}
          </div>
          <button
            type="button"
            style={{
              padding: '7px 18px',
              background: '#fff',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#555',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Chọn Ảnh
          </button>
          <div
            style={{
              marginTop: '12px',
              fontSize: '12px',
              color: '#bbb',
              textAlign: 'center',
              lineHeight: 1.6,
            }}
          >
            Tối đa 1 MB
            <br />
            JPG, PNG
          </div>
        </div>
      </div>
    </div>
  );
}
