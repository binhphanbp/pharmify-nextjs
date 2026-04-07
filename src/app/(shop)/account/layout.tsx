'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/stores';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const menuItems = [
  { name: 'Thông tin tài khoản', href: '/account', icon: 'person' },
  { name: 'Quản lý đơn hàng', href: '/account/orders', icon: 'receipt_long' },
  { name: 'Địa chỉ nhận hàng', href: '/account/address', icon: 'location_on' },
  { name: 'Đổi mật khẩu', href: '/account/password', icon: 'lock' },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAppSelector(s => s.auth);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (isMounted && !loading && !user) {
      router.push('/auth?redirect=/account');
    }
  }, [user, loading, isMounted, router]);

  if (!isMounted || loading || !user) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', color: '#999' }}>
          <span className="material-icons" style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>sync</span>
          Đang tải...
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f0f2f5', padding: '28px 0 48px', minHeight: 'calc(100vh - 140px)' }}>
      <div className="container" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

        {/* ── SIDEBAR ── */}
        <aside style={{ width: '236px', flexShrink: 0 }}>
          {/* User card */}
          <div style={{ background: '#fff', borderRadius: '10px', padding: '20px 16px', marginBottom: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #004d95, #0072bc)',
              color: '#fff', fontWeight: 700, fontSize: '20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, letterSpacing: '-0.5px',
            }}>
              {user.user_metadata?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '2px' }}>Tài khoản của</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.user_metadata?.full_name || 'Khách hàng'}
              </div>
            </div>
          </div>

          {/* Nav menu */}
          <nav style={{ background: '#fff', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            {menuItems.map((item, idx) => {
              const isActive = pathname === item.href || (item.href !== '/account' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '11px',
                    padding: '13px 16px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#004d95' : '#444',
                    background: isActive ? '#eef5ff' : '#fff',
                    borderLeft: `3px solid ${isActive ? '#004d95' : 'transparent'}`,
                    borderBottom: idx < menuItems.length - 1 ? '1px solid #f5f5f5' : 'none',
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '19px', color: isActive ? '#004d95' : '#bbb', flexShrink: 0 }}>
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main style={{ flex: 1, minWidth: 0, background: '#fff', borderRadius: '10px', padding: '28px 32px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
