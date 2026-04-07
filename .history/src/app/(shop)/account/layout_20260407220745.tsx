'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/stores';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAppSelector(s => s.auth);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && (!loading && !user)) {
      router.push('/auth?redirect=/account');
    }
  }, [user, loading, isMounted, router]);

  if (!isMounted || loading || !user) {
    return (
      <div className="container" style={{ padding: '40px 0', minHeight: '60vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: '#666' }}>Đang tải dữ liệu người dùng...</p>
      </div>
    );
  }

  const menuItems = [
    { name: 'Thông tin tài khoản', href: '/account', icon: 'person' },
    { name: 'Quản lý đơn hàng', href: '/account/orders', icon: 'receipt_long' },
    { name: 'Địa chỉ nhận hàng', href: '/account/address', icon: 'location_on' },
    { name: 'Đổi mật khẩu', href: '/account/password', icon: 'lock' },
  ];

  return (
    <div className="account-layout">
      <div className="account-container container">
        <aside className="account-sidebar">
          <div className="user-summary">
            <div className="user-avatar">
              {user.user_metadata?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="user-summary-info">
              <span>Tài khoản của</span>
              <strong>{user.user_metadata?.full_name || 'Khách hàng'}</strong>
            </div>
          </div>
          
          <div className="account-menu">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`account-menu-item ${(pathname === item.href || (item.href !== '/account' && pathname.startsWith(item.href))) ? 'active' : ''}`}
              >
                <span className="material-icons">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </div>
        </aside>
        
        <main className="account-content">
          {children}
        </main>
      </div>
    </div>
  );
}
