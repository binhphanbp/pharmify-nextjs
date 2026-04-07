'use client';

import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/stores';
import { updateProfile } from '@/stores/auth-store';

const fgStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', marginBottom: '20px' };
const labelStyle: React.CSSProperties = { width: '120px', color: '#555', fontSize: '14px', textAlign: 'right', marginRight: '20px', flexShrink: 0 };
const valueStyle: React.CSSProperties = { flex: 1, color: '#333', fontSize: '15px' };
const inputStyle: React.CSSProperties = { flex: 1, padding: '10px 14px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' };
const radioGroupStyle: React.CSSProperties = { flex: 1, display: 'flex', gap: '16px', alignItems: 'center' };
const radioLabelStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', color: '#333' };
const saveBtnStyle: React.CSSProperties = { background: '#004d95', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '6px', fontWeight: 500, cursor: 'pointer', fontSize: '14px' };

export default function AccountPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [phone, setPhone] = useState(user?.user_metadata?.phone || '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.user_metadata?.dob || '');
  const [gender, setGender] = useState(user?.user_metadata?.gender || 'other');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  if (!user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess('');
    setIsSaving(true);
    try {
      await dispatch(updateProfile({ fullName, phone, dob: dateOfBirth, gender })).unwrap();
      setSaveSuccess('Cập nhật thông tin thành công!');
      setIsEditing(false);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Cập nhật thất bại');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #eee', paddingBottom: '16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#333', margin: 0 }}>Hồ sơ của tôi</h1>
        <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>Quản lý thông tin hồ sơ để bảo mật tài khoản</p>
      </div>

      {saveError && (
        <div style={{ background: '#fff0f0', color: '#c0392b', border: '1px solid #fcc', padding: '10px 16px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-icons" style={{ fontSize: '18px' }}>error</span>
          {saveError}
        </div>
      )}
      {saveSuccess && (
        <div style={{ background: '#f0fff4', color: '#27ae60', border: '1px solid #b7ebc7', padding: '10px 16px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-icons" style={{ fontSize: '18px' }}>check_circle</span>
          {saveSuccess}
        </div>
      )}

      <div style={{ display: 'flex', gap: '40px' }}>
        <div style={{ flex: 1 }}>
          <form onSubmit={handleSave}>
            <div style={fgStyle}>
              <div style={labelStyle}>Tên đăng nhập</div>
              <div style={valueStyle}>{user.email?.split('@')[0]}</div>
            </div>

            <div style={fgStyle}>
              <div style={labelStyle}>Họ &amp; Tên</div>
              {isEditing ? (
                <input type="text" style={inputStyle} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              ) : (
                <div style={valueStyle}>{fullName || 'Chưa cập nhật'}</div>
              )}
            </div>

            <div style={fgStyle}>
              <div style={labelStyle}>Email</div>
              <div style={valueStyle}>{user.email?.replace(/(.{2})(.*)(@.*)/, '$1***$3')}</div>
            </div>

            <div style={fgStyle}>
              <div style={labelStyle}>Số điện thoại</div>
              {isEditing ? (
                <input type="tel" style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Thêm số điện thoại" />
              ) : (
                <div style={valueStyle}>
                  {phone ? phone.replace(/(\d{4})\d{3}(\d{3})/, '$1***$2') : 'Chưa cập nhật'}
                </div>
              )}
            </div>

            <div style={fgStyle}>
              <div style={labelStyle}>Giới tính</div>
              {isEditing ? (
                <div style={radioGroupStyle}>
                  {(['male', 'female', 'other'] as const).map((g) => (
                    <label key={g} style={radioLabelStyle}>
                      <input type="radio" name="gender" value={g} checked={gender === g} onChange={() => setGender(g)} />
                      {g === 'male' ? 'Nam' : g === 'female' ? 'Nữ' : 'Khác'}
                    </label>
                  ))}
                </div>
              ) : (
                <div style={valueStyle}>{gender === 'male' ? 'Nam' : gender === 'female' ? 'Nữ' : 'Khác'}</div>
              )}
            </div>

            <div style={fgStyle}>
              <div style={labelStyle}>Ngày sinh</div>
              {isEditing ? (
                <input type="date" style={{ ...inputStyle, maxWidth: '200px' }} value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
              ) : (
                <div style={valueStyle}>
                  {dateOfBirth ? new Date(dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                </div>
              )}
            </div>

            <div style={{ ...fgStyle, marginTop: '32px' }}>
              {!isEditing ? (
                <div style={{ marginLeft: '140px' }}>
                  <button type="button" style={saveBtnStyle} onClick={() => { setIsEditing(true); setSaveSuccess(''); }}>
                    Cập nhật hồ sơ
                  </button>
                </div>
              ) : (
                <div style={{ marginLeft: '140px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button type="submit" style={{ ...saveBtnStyle, opacity: isSaving ? 0.6 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }} disabled={isSaving}>
                    {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                  <button type="button" onClick={() => { setIsEditing(false); setSaveError(''); }} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '14px' }}>
                    Hủy
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>

        <div style={{ width: '280px', borderLeft: '1px solid #eee', paddingLeft: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', overflow: 'hidden' }}>
            <span className="material-icons" style={{ fontSize: '64px', color: '#bbb' }}>person</span>
          </div>
          <button style={{ background: '#fff', border: '1px solid #ddd', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', color: '#555' }}>
            Chọn Ảnh
          </button>
          <div style={{ marginTop: '16px', fontSize: '13px', color: '#999', textAlign: 'center', lineHeight: 1.5 }}>
            Dụng lượng file tối đa 1 MB<br />Định dạng: .JPEG, .PNG
          </div>
        </div>
      </div>
    </div>
  );
}
