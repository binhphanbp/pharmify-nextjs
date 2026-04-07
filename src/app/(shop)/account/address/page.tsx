'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppSelector } from '@/stores';
import { createClient } from '@/lib/supabase/client';

interface UserAddress {
  id: string;
  full_name: string;
  phone: string;
  address_line: string;
  ward: string;
  district: string;
  province: string;
  is_default: boolean;
}

const EMPTY_FORM = { full_name: '', phone: '', address_line: '', ward: '', district: '', province: '' };

export default function AddressPage() {
  const { user } = useAppSelector((s) => s.auth);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchAddresses = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });
    setAddresses((data as UserAddress[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (addr: UserAddress) => {
    setEditingId(addr.id);
    setForm({ full_name: addr.full_name, phone: addr.phone, address_line: addr.address_line, ward: addr.ward, district: addr.district, province: addr.province });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.full_name || !form.phone || !form.address_line || !form.ward || !form.district || !form.province) {
      setFormError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    setSaving(true);
    const supabase = createClient();
    try {
      if (editingId) {
        const { error } = await supabase.from('user_addresses').update({ ...form }).eq('id', editingId);
        if (error) throw error;
      } else {
        const isFirst = addresses.length === 0;
        const { error } = await supabase.from('user_addresses').insert({ ...form, user_id: user!.id, is_default: isFirst });
        if (error) throw error;
      }
      await fetchAddresses();
      setShowModal(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;
    const supabase = createClient();
    await supabase.from('user_addresses').delete().eq('id', id);
    await fetchAddresses();
  };

  const handleSetDefault = async (id: string) => {
    const supabase = createClient();
    // Bỏ default tất cả → set default cái mới (unique index đảm bảo 1 default)
    await supabase.from('user_addresses').update({ is_default: false }).eq('user_id', user!.id);
    await supabase.from('user_addresses').update({ is_default: true }).eq('id', id);
    await fetchAddresses();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #eee', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#333', margin: 0 }}>Địa chỉ của tôi</h1>
          <p style={{ color: '#666', fontSize: '14px', margin: '4px 0 0' }}>Quản lý thông tin địa chỉ giao hàng</p>
        </div>
        <button onClick={openAdd} style={{ background: '#004d95', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
          <span className="material-icons" style={{ fontSize: '18px' }}>add</span>
          Thêm địa chỉ mới
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          <span className="material-icons" style={{ fontSize: '32px' }}>sync</span>
        </div>
      ) : addresses.length === 0 ? (
        <div style={{ border: '1px dashed #ccc', padding: '40px', textAlign: 'center', borderRadius: '8px', color: '#999' }}>
          Bạn chưa có địa chỉ nào lưu sẵn.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {addresses.map((addr) => (
            <div key={addr.id} style={{ border: addr.is_default ? '1px solid #004d95' : '1px solid #eee', borderRadius: '8px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: addr.is_default ? '#f0f8ff' : 'white' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, fontSize: '15px', color: '#333' }}>{addr.full_name}</span>
                  <span style={{ color: '#666', fontSize: '14px' }}>{addr.phone}</span>
                  {addr.is_default && (
                    <span style={{ fontSize: '12px', color: '#004d95', border: '1px solid #004d95', padding: '1px 8px', borderRadius: '20px', fontWeight: 500 }}>
                      Mặc định
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '14px', color: '#555', lineHeight: 1.6 }}>
                  {addr.address_line}, {addr.ward}, {addr.district}, {addr.province}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginLeft: '16px' }}>
                <button style={{ background: 'none', border: '1px solid #ddd', padding: '5px 12px', borderRadius: '4px', fontSize: '13px', cursor: 'pointer' }} onClick={() => openEdit(addr)}>Sửa</button>
                {!addr.is_default && (
                  <button style={{ background: 'none', border: '1px solid #ddd', padding: '5px 12px', borderRadius: '4px', fontSize: '13px', cursor: 'pointer' }} onClick={() => handleSetDefault(addr.id)}>Đặt mặc định</button>
                )}
                <button style={{ background: 'none', border: '1px solid #fcc', padding: '5px 12px', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', color: '#c0392b' }} onClick={() => handleDelete(addr.id)}>Xóa</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Thêm / Sửa */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#333' }}>
                {editingId ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>
                <span className="material-icons">close</span>
              </button>
            </div>

            {formError && (
              <div style={{ background: '#fff0f0', color: '#c0392b', border: '1px solid #fcc', padding: '9px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#555', marginBottom: '6px' }}>Họ &amp; Tên *</label>
                  <input style={{ width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Nguyễn Văn A" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#555', marginBottom: '6px' }}>Số điện thoại *</label>
                  <input style={{ width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0912345678" />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#555', marginBottom: '6px' }}>Địa chỉ cụ thể (số nhà, tên đường) *</label>
                <input style={{ width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} value={form.address_line} onChange={(e) => setForm({ ...form, address_line: e.target.value })} placeholder="123 Nguyễn Huệ" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#555', marginBottom: '6px' }}>Phường / Xã *</label>
                  <input style={{ width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value })} placeholder="Phường Bến Nghé" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#555', marginBottom: '6px' }}>Quận / Huyện *</label>
                  <input style={{ width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} placeholder="Quận 1" />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#555', marginBottom: '6px' }}>Tỉnh / Thành phố *</label>
                <input style={{ width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} placeholder="TP. Hồ Chí Minh" />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: '#fff', border: '1px solid #ddd', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', color: '#555' }}>
                  Hủy
                </button>
                <button type="submit" disabled={saving} style={{ background: '#004d95', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '6px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 500, fontSize: '14px', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Đang lưu...' : 'Lưu địa chỉ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
