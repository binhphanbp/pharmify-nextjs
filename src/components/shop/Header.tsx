'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/stores';
import { signOut } from '@/stores/auth-store';
import { useSearch } from '@/contexts/SearchContext';
import type { Product } from '@/types/product';
import AuthModal from './AuthModal';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user, role } = useAppSelector((s) => s.auth);
  const cartItems = useAppSelector((s) => s.cart.items);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const isHomePage = pathname === '/';

  // Search context
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    suggestions: searchResults,
    showDropdown: showSearch,
    setShowDropdown: setShowSearch,
    isSearching,
    submitSearch,
    clearSearch,
  } = useSearch();

  const [isSticky, setIsSticky] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 120);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setShowSearch(false);
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      )
        setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [setShowSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitSearch();
  };

  const handleResultClick = () => {
    setShowSearch(false);
    clearSearch();
  };

  const handleLogout = async () => {
    await dispatch(signOut());
    setShowUserMenu(false);
    router.push('/');
  };

  return (
    <>
      <header
        className="header-wrap"
        style={{ position: 'relative', zIndex: 1000 }}
      >
        {/* === Promo Bar === */}
        <div className="promo-bar">
          <div className="container promo-container">
            <div className="promo-content">
              <span className="promo-logo">NHÀ THUỐC</span>
              <span className="promo-brand">Pharmify</span>
              <span className="promo-divider">|</span>
              <span className="promo-text">MIỄN PHÍ VẬN CHUYỂN</span>
              <span className="promo-highlight">CHO MỌI ĐƠN HÀNG TỪ 0Đ</span>
              <Link href="/" className="promo-cta">
                MUA NGAY ➤
              </Link>
            </div>
          </div>
        </div>

        {/* === Utility Bar === */}
        <div className="utility-bar">
          <div
            className="container"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <a href="#" className="utility-link">
                <span className="material-icons">phone_iphone</span> Tải ứng
                dụng
              </a>
              <span className="utility-sep">|</span>
              <a href="tel:18006821" className="utility-link hotline-link">
                <span className="material-icons">headset_mic</span> Hotline 1800
                6821
              </a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <a href="#" className="utility-link deal-link">
                <span className="material-icons">local_fire_department</span>{' '}
                Deal hot tháng 03 🔥
              </a>
              <span className="utility-sep">|</span>
              <a href="#" className="utility-link">
                <span className="material-icons">receipt_long</span> Tra cứu đơn
                hàng
              </a>
              <span className="utility-sep">|</span>
              <a href="#" className="utility-link">
                <span className="material-icons">article</span> Góc sức khỏe
              </a>
              <span className="utility-sep">|</span>
              <a href="#" className="utility-link">
                <span className="material-icons">local_hospital</span> Hệ thống
                nhà thuốc
              </a>
            </div>
          </div>
        </div>

        {/* === Main Header === */}
        <div
          className={`main-header ${isSticky || !isHomePage ? 'is-sticky' : ''}`}
        >
          <div
            className="container"
            style={{
              display: 'flex',
              alignItems: 'center',
              height: '60px',
              gap: '16px',
            }}
          >
            {/* Logo */}
            <Link href="/" className="logo">
              <span className="logo-sub">NHÀ THUỐC</span>
              <span className="logo-main">Pharmify</span>
            </Link>

            {/* Category Button */}
            <Link href="/category" className="category-btn">
              <span className="material-icons">dashboard</span>
              <span className="cat-label">Danh mục</span>
              <span className="material-icons arrow-icon">expand_more</span>
            </Link>

            {/* Nav Links (home only, non-sticky) */}
            {isHomePage && !isSticky && (
              <nav className="header-nav">
                <Link href="/category/thuoc" className="nav-link-item">
                  Thuốc
                </Link>
                <Link
                  href="/category/thuc-pham-chuc-nang"
                  className="nav-link-item"
                >
                  Thực phẩm bảo vệ sức khỏe
                </Link>
                <Link
                  href="/category/cham-soc-ca-nhan"
                  className="nav-link-item"
                >
                  Mẹ và bé
                </Link>
                <Link href="/category/thiet-bi-y-te" className="nav-link-item">
                  Nhãn hàng Pharmify
                </Link>
              </nav>
            )}

            {/* Sticky Search Bar */}
            {(!isHomePage || isSticky) && (
              <div className="header-search-wrap" ref={searchRef}>
                <form className="header-search" onSubmit={handleSearchSubmit}>
                  <input
                    type="text"
                    placeholder="Bạn đang tìm gì hôm nay..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button type="submit" className="search-icon-btn">
                    <span className="material-icons">search</span>
                  </button>
                </form>
                {showSearch && searchResults.length > 0 && (
                  <div className="search-dropdown">
                    {searchResults.map((p: Product) => (
                      <Link
                        key={p.id}
                        href={`/product/${p.slug}`}
                        onClick={handleResultClick}
                        className="search-result-item"
                      >
                        <img
                          src={
                            p.image_url ||
                            'https://placehold.co/40x40/f0f0f0/999?text=?'
                          }
                          alt={p.name}
                        />
                        <div>
                          <p className="result-name">{p.name}</p>
                          <p className="result-price">
                            {new Intl.NumberFormat('vi-VN').format(p.price)}đ
                          </p>
                        </div>
                      </Link>
                    ))}
                    {/* "Xem tất cả" button */}
                    <button
                      className="search-all-btn"
                      onClick={() => submitSearch()}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: 'none',
                        borderTop: '1px solid #eee',
                        background: '#f8f9fa',
                        color: '#004d95',
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      Xem tất cả kết quả →
                    </button>
                  </div>
                )}
                {showSearch && isSearching && (
                  <div className="search-dropdown">
                    <div
                      style={{
                        padding: '16px',
                        textAlign: 'center',
                        color: '#999',
                      }}
                    >
                      Đang tìm kiếm...
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Right Actions */}
            <div className="header-actions">
              <Link
                href="/cart"
                className="action-icon-btn cart-action"
                title="Giỏ hàng"
              >
                <span className="material-icons">shopping_cart</span>
                {cartCount > 0 && (
                  <span className="cart-badge">{cartCount}</span>
                )}
              </Link>

              <a href="#" className="action-icon-btn" title="Thông báo">
                <span className="material-icons">notifications_none</span>
              </a>

              <div ref={userMenuRef} className="user-dropdown-wrap">
                {user ? (
                  <>
                    <button
                      className="user-action"
                      onClick={() => setShowUserMenu(!showUserMenu)}
                    >
                      <span className="material-icons">person</span>
                      <div className="user-info">
                        <span className="user-greeting">Xin Chào</span>
                        <span className="user-name">
                          {user.user_metadata?.full_name || 'Tài khoản'}
                        </span>
                      </div>
                    </button>
                    {showUserMenu && (
                      <div className="user-dropdown-menu">
                        <Link
                          href="/account"
                          className="dropdown-item"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <span className="material-icons">person_outline</span>{' '}
                          Tài khoản
                        </Link>
                        <Link
                          href="/account/orders"
                          className="dropdown-item"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <span className="material-icons">receipt_long</span>{' '}
                          Đơn hàng
                        </Link>
                        {role === 'admin' && (
                          <Link
                            href="/admin"
                            className="dropdown-item"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <span className="material-icons">
                              admin_panel_settings
                            </span>{' '}
                            Quản trị
                          </Link>
                        )}
                        <div className="dropdown-divider" />
                        <button
                          className="dropdown-item logout-btn"
                          onClick={handleLogout}
                        >
                          <span className="material-icons">logout</span> Đăng
                          xuất
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <button
                    className="user-action"
                    onClick={() => setShowAuthModal(true)}
                  >
                    <span className="material-icons">person_outline</span>
                    <div className="user-info">
                      <span className="user-greeting">Xin Chào</span>
                      <span className="user-name">Đăng nhập</span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      {(isSticky || !isHomePage) && <div style={{ height: '60px' }} />}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </>
  );
}
