'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import ProductCard from '@/components/shop/ProductCard';
import QuickViewModal from '@/components/shop/QuickViewModal';
import type { Product } from '@/types/product';

const CATEGORY_LINKS = [
  { slug: '', label: 'Tất cả sản phẩm' },
  { slug: 'thuoc', label: 'Thuốc' },
  { slug: 'thuc-pham-chuc-nang', label: 'Thực phẩm chức năng' },
  { slug: 'cham-soc-ca-nhan', label: 'Chăm sóc cá nhân' },
  { slug: 'thiet-bi-y-te', label: 'Thiết bị y tế' },
  { slug: 'me-va-be', label: 'Mẹ và bé' },
];

export default function CategoryPage() {
  const params = useParams();
  const slug = (params?.slug as string) || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(
    null,
  );

  const categoryName =
    CATEGORY_LINKS.find((c) => c.slug === slug)?.label ||
    slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ||
    'Tất cả sản phẩm';

  const loadProducts = async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from('v_product_catalog')
      .select('*')
      .eq('is_active', true);

    if (slug) {
      query = query.eq('category_slug', slug);
    }

    switch (sortBy) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'best_seller':
        query = query.order('created_at', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const { data } = await query;
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, [slug, sortBy]);

  return (
    <div className="category-page">
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb-bar">
          <Link href="/">Trang chủ</Link>
          <span className="sep">›</span>
          <span className="current">{categoryName}</span>
        </div>

        <div className="page-layout">
          {/* Sidebar */}
          <aside className="sidebar">
            <div className="sidebar-card">
              <h3 className="sidebar-title">
                <span className="material-icons">filter_list</span> Danh mục
              </h3>
              <ul className="filter-list">
                {CATEGORY_LINKS.map((cat) => (
                  <li key={cat.slug}>
                    <Link
                      href={cat.slug ? `/category/${cat.slug}` : '/category'}
                      className={`filter-link${slug === cat.slug ? ' active' : ''}`}
                    >
                      {cat.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sidebar-card">
              <h3 className="sidebar-title">
                <span className="material-icons">tune</span> Khoảng giá
              </h3>
              <ul className="filter-list">
                <li>
                  <a className="filter-link">Dưới 100.000đ</a>
                </li>
                <li>
                  <a className="filter-link">100.000đ - 300.000đ</a>
                </li>
                <li>
                  <a className="filter-link">300.000đ - 500.000đ</a>
                </li>
                <li>
                  <a className="filter-link">Trên 500.000đ</a>
                </li>
              </ul>
            </div>
          </aside>

          {/* Main Content */}
          <main className="content">
            <div className="content-header">
              <h1 className="page-title">{categoryName}</h1>
              <div className="sort-wrapper">
                <span className="sort-label">Sắp xếp:</span>
                <select
                  className="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="best_seller">Bán chạy nhất</option>
                  <option value="price_asc">Giá thấp đến cao</option>
                  <option value="price_desc">Giá cao đến thấp</option>
                  <option value="newest">Mới nhất</option>
                </select>
              </div>
            </div>

            <div className="product-grid">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="skeleton product-skeleton" />
                ))
              ) : products.length === 0 ? (
                <div className="empty-state">
                  <span className="material-icons">inventory_2</span>
                  <p>Không tìm thấy sản phẩm nào trong danh mục này.</p>
                  <Link href="/" className="btn-back">
                    Về trang chủ
                  </Link>
                </div>
              ) : (
                products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onQuickView={setQuickViewProduct}
                  />
                ))
              )}
            </div>
          </main>
        </div>
      </div>

      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </div>
  );
}
