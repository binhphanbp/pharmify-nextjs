'use client';

import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/stores';
import { updateProfile } from '@/stores/auth-store';

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
            <style jsx>{`
              .form-group { display: flex; align-items: center; margin-bottom: 20px; }
              .form-label { width: 120px; color: #555; font-size: 14px; text-align: right; margin-right: 20px; flex-shrink: 0; }
              .form-value { flex: 1; color: #333; font-size: 15px; }
              .form-input { flex: 1; padding: 10px 14px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; outline: none; transition: border-color 0.2s; width: 100%; }
              .form-input:focus { border-color: #004d95; }
              .radio-group { display: flex; gap: 16px; align-items: center; }
              .radio-label { display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 14px; color: #333; }
              .save-btn { background: #004d95; color: white; border: none; padding: 10px 24px; border-radius: 6px; font-weight: 500; cursor: pointer; font-size: 14px; transition: background 0.2s; }
              .save-btn:hover:not(:disabled) { background: #003a70; }
              .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
            `}</style>

            <div className="form-group">
              <div className="form-label">Tên đăng nhập</div>
              <div className="form-value">{user.email?.split('@')[0]}</div>
            </div>

            <div className="form-group">
              <div className="form-label">Họ &amp; Tên</div>
              {isEditing ? (
                <input type="text" className="form-input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              ) : (
                <div className="form-value">{fullName || 'Chưa cập nhật'}</div>
              )}
            </div>

            <div className="form-group">
              <div className="form-label">Email</div>
              <div className="form-value">{user.email?.replace(/(.{2})(.*)(@.*)/, '$1***$3')}</div>
            </div>

            <div className="form-group">
              <div className="form-label">Số điện thoại</div>
              {isEditing ? (
                <input type="tel" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Thêm số điện thoại" />
              ) : (
                <div className="form-value">
                  {phone ? phone.replace(/(\d{4})\d{3}(\d{3})/, '$1***$2') : 'Chưa cập nhật'}
                </div>
              )}
            </div>

            <div className="form-group">
              <div className="form-label">Giới tính</div>
              {isEditing ? (
                <div className="radio-group form-value">
                  {(['male', 'female', 'other'] as const).map((g) => (
                    <label key={g} className="radio-label">
                      <input type="radio" name="gender" value={g} checked={gender === g} onChange={() => setGender(g)} />
                      {g === 'male' ? 'Nam' : g === 'female' ? 'Nữ' : 'Khác'}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="form-value">{gender === 'male' ? 'Nam' : gender === 'female' ? 'Nữ' : 'Khác'}</div>
              )}
            </div>

            <div className="form-group">
              <div className="form-label">Ngày sinh</div>
              {isEditing ? (
                <input type="date" className="form-input" style={{ maxWidth: '200px' }} value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
              ) : (
                <div className="form-value">
                  {dateOfBirth ? new Date(dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginTop: '32px' }}>
              {!isEditing ? (
                <div style={{ marginLeft: '140px' }}>
                  <button type="button" className="save-btn" onClick={() => { setIsEditing(true); setSaveSuccess(''); }}>
                    Cập nhật hồ sơ
                  </button>
                </div>
              ) : (
                <div style={{ marginLeft: '140px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button type="submit" className="save-btn" disabled={isSaving}>
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


export default function AccountPage() {
  const { user } = useAppSelector(s => s.auth);
  
  // States for profile editing
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [phone, setPhone] = useState(user?.user_metadata?.phone || '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.user_metadata?.dob || '');
  const [gender, setGender] = useState(user?.user_metadata?.gender || 'other');

  // To fix layout not rendering properly when `user` object might not be immediately available
  if (!user) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, you would update the Supabase profile here
    // e.g. updateProfile({ full_name: fullName, phone, dob: dateOfBirth, gender })
    alert('Cập nhật thông tin thành công!');
    setIsEditing(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #eee', paddingBottom: '16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#333', margin: 0 }}>Hồ sơ của tôi</h1>
        <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>Quản lý thông tin hồ sơ để bảo mật tài khoản</p>
      </div>

      <div style={{ display: 'flex', gap: '40px' }}>
        <div style={{ flex: 1 }}>
          <form onSubmit={handleSave} className="profile-form">
            <style jsx>{`
              .form-group {
                display: flex;
                align-items: center;
                margin-bottom: 20px;
              }
              .form-label {
                width: 120px;
                color: #555;
                font-size: 14px;
                text-align: right;
                margin-right: 20px;
              }
              .form-value {
                flex: 1;
                color: #333;
                font-size: 15px;
              }
              .form-input {
                flex: 1;
                padding: 10px 14px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 14px;
                outline: none;
                transition: border-color 0.2s;
              }
              .form-input:focus {
                border-color: #004d95;
              }
              .radio-group {
                display: flex;
                gap: 16px;
                align-items: center;
              }
              .radio-label {
                display: flex;
                align-items: center;
                gap: 6px;
                cursor: pointer;
                font-size: 14px;
                color: #333;
              }
              .save-btn {
                background: #004d95;
                color: white;
                border: none;
                padding: 10px 24px;
                border-radius: 6px;
                font-weight: 500;
                cursor: pointer;
                font-size: 14px;
                margin-left: 140px;
                transition: background 0.2s;
              }
              .save-btn:hover {
                background: #003a70;
              }
              .edit-link {
                color: #004d95;
                cursor: pointer;
                font-size: 14px;
                text-decoration: underline;
                background: none;
                border: none;
                padding: 0;
              }
            `}</style>
            
            <div className="form-group">
              <div className="form-label">Tên đăng nhập</div>
              <div className="form-value">{user.email?.split('@')[0]}</div>
            </div>

            <div className="form-group">
              <div className="form-label">Họ & Tên</div>
              {isEditing ? (
                <input 
                  type="text" 
                  className="form-input" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  required
                />
              ) : (
                <div className="form-value">{fullName}</div>
              )}
            </div>

            <div className="form-group">
              <div className="form-label">Email</div>
              <div className="form-value">
                {user.email?.replace(/(.{2})(.*)(@.*)/, '$1***$3')}
              </div>
            </div>

            <div className="form-group">
              <div className="form-label">Số điện thoại</div>
              {isEditing ? (
                <input 
                  type="tel" 
                  className="form-input" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="Thêm số điện thoại"
                />
              ) : (
                <div className="form-value">
                  {phone ? phone.replace(/(\d{4})\d{3}(\d{3})/, '$1***$2') : 'Chưa cập nhật'}
                </div>
              )}
            </div>

            <div className="form-group">
              <div className="form-label">Giới tính</div>
              {isEditing ? (
                <div className="radio-group form-value">
                  <label className="radio-label">
                    <input type="radio" name="gender" value="male" checked={gender === 'male'} onChange={() => setGender('male')} /> Nam
                  </label>
                  <label className="radio-label">
                    <input type="radio" name="gender" value="female" checked={gender === 'female'} onChange={() => setGender('female')} /> Nữ
                  </label>
                  <label className="radio-label">
                    <input type="radio" name="gender" value="other" checked={gender === 'other'} onChange={() => setGender('other')} /> Khác
                  </label>
                </div>
              ) : (
                <div className="form-value">
                  {gender === 'male' ? 'Nam' : gender === 'female' ? 'Nữ' : 'Khác'}
                </div>
              )}
            </div>

            <div className="form-group">
              <div className="form-label">Ngày sinh</div>
              {isEditing ? (
                <input 
                  type="date" 
                  className="form-input" 
                  style={{ maxWidth: '200px' }}
                  value={dateOfBirth} 
                  onChange={(e) => setDateOfBirth(e.target.value)} 
                />
              ) : (
                <div className="form-value">
                  {dateOfBirth ? new Date(dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginTop: '32px' }}>
              {!isEditing ? (
                <div style={{ marginLeft: '140px' }}>
                  <button type="button" className="save-btn" onClick={() => setIsEditing(true)}>Cập nhật hồ sơ</button>
                </div>
              ) : (
                <div style={{ marginLeft: '140px', display: 'flex', gap: '12px' }}>
                  <button type="submit" className="save-btn" style={{ marginLeft: 0 }}>Lưu thay đổi</button>
                  <button type="button" className="edit-link" onClick={() => setIsEditing(false)} style={{ textDecoration: 'none', color: '#666' }}>Hủy</button>
                </div>
              )}
            </div>
          </form>
        </div>

        <div style={{ width: '280px', borderLeft: '1px solid #eee', paddingLeft: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', color: '#666', marginBottom: '20px', overflow: 'hidden' }}>
            <span className="material-icons" style={{ fontSize: '64px', color: '#bbb' }}>person</span>
          </div>
          <button style={{ background: '#fff', border: '1px solid #ddd', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', color: '#555', transition: 'background 0.2s' }}>
            Chọn Ảnh
          </button>
          <div style={{ marginTop: '16px', fontSize: '13px', color: '#999', textAlign: 'center', lineHeight: 1.5 }}>
            Dụng lượng file tối đa 1 MB<br/>Định dạng: .JPEG, .PNG
          </div>
        </div>
      </div>
    </div>
  );
}
