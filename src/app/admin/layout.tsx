'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/stores';
import { signOut } from '@/stores/auth-store';
import AdminChatBot from '@/components/admin/AdminChatBot';

const navItems = [
  { href: '/admin', icon: 'dashboard', label: 'Dashboard' },
  { href: '/admin/products', icon: 'inventory_2', label: 'Sản phẩm' },
  { href: '/admin/categories', icon: 'category', label: 'Danh mục' },
  { href: '/admin/banners', icon: 'view_carousel', label: 'Banner' },
  { href: '/admin/brands', icon: 'branding_watermark', label: 'Thương hiệu' },
  { href: '/admin/flash-sale', icon: 'flash_on', label: 'Flash Sale' },
  { href: '/admin/orders', icon: 'receipt_long', label: 'Đơn hàng' },
  { href: '/admin/users', icon: 'people', label: 'Người dùng' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, role, loading } = useAppSelector((s) => s.auth);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && (!user || role !== 'admin')) {
      router.push('/');
    }
  }, [user, role, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-center">
          <span className="material-icons text-4xl text-primary animate-spin">
            settings
          </span>
          <p className="mt-2 text-text-secondary">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user || role !== 'admin') return null;

  const currentNav = navItems.find((n) => {
    if (n.href === '/admin') return pathname === '/admin';
    return pathname.startsWith(n.href);
  });

  const handleLogout = async () => {
    await dispatch(signOut());
    router.push('/');
  };

  return (
    <div className="min-h-screen flex bg-bg-primary">
      {/* Sidebar */}
      <aside
        className={`bg-bg-dark text-white flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'} shrink-0`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-white/10">
          <Link
            href="/admin"
            className="flex items-center gap-2 overflow-hidden"
          >
            <span className="material-icons text-2xl text-secondary shrink-0">
              local_pharmacy
            </span>
            {!collapsed && (
              <span className="font-bold text-lg whitespace-nowrap">
                Pharmify
              </span>
            )}
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4">
          {navItems.map((item) => {
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="material-icons text-xl shrink-0">
                  {item.icon}
                </span>
                {!collapsed && (
                  <span className="whitespace-nowrap">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-3 mx-2 mb-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition flex items-center gap-3"
        >
          <span className="material-icons text-xl shrink-0">
            {collapsed ? 'chevron_right' : 'chevron_left'}
          </span>
          {!collapsed && <span className="text-sm">Thu gọn</span>}
        </button>

        {/* Back to store */}
        <div className="border-t border-white/10 p-2">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition text-sm"
          >
            <span className="material-icons text-xl shrink-0">storefront</span>
            {!collapsed && <span>Về cửa hàng</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 shrink-0">
          <div>
            <h1 className="text-lg font-bold text-text-primary">
              {currentNav?.label || 'Admin'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-secondary hidden sm:block">
              {user.user_metadata?.full_name || user.email}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm text-text-secondary hover:text-danger transition"
            >
              <span className="material-icons text-lg">logout</span>
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="admin-page">{children}</div>
        </main>
      </div>

      {/* AI Analytics ChatBot */}
      <AdminChatBot />
    </div>
  );
}
