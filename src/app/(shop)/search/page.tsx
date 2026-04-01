'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSearch } from '@/contexts/SearchContext';
import ProductCard from '@/components/shop/ProductCard';
import QuickViewModal from '@/components/shop/QuickViewModal';
import type { Product } from '@/types/product';

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="category-page">
          <div className="container">
            <div className="product-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton product-skeleton" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const { setQuery, searchProducts } = useSearch();

  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(
    null,
  );
  const perPage = 20;

  const loadResults = async (query: string, pageNum: number) => {
    setLoading(true);
    setPage(pageNum);
    try {
      const { data, hasMore: more } = await searchProducts(
        query,
        pageNum,
        perPage,
      );
      setResults(data);
      setHasMore(more);
    } catch {
      setResults([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (q) {
      setQuery(q);
      loadResults(q, 1);
    }
  }, [q]);

  return (
    <div className="search-page">
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb-bar">
          <Link href="/">Trang chủ</Link>
          <span className="sep">›</span>
          <span>Tìm kiếm</span>
          {q && (
            <>
              <span className="sep">›</span>
              <span className="current">{q}</span>
            </>
          )}
        </div>

        {/* Search Header */}
        <div className="content-header">
          <h1 className="page-title">Kết quả tìm kiếm cho &ldquo;{q}&rdquo;</h1>
          {!loading && (
            <span className="sort-label">
              {results.length > 0
                ? `Tìm thấy ${results.length} sản phẩm`
                : 'Không tìm thấy sản phẩm nào'}
            </span>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="product-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton product-skeleton" />
            ))}
          </div>
        )}

        {/* Results Grid */}
        {!loading && results.length > 0 && (
          <>
            <div className="product-grid">
              {results.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={setQuickViewProduct}
                />
              ))}
            </div>

            {/* Pagination */}
            {(hasMore || page > 1) && (
              <div className="search-pagination">
                {page > 1 && (
                  <button
                    onClick={() => loadResults(q, page - 1)}
                    className="pagination-btn"
                  >
                    ← Trang trước
                  </button>
                )}
                <span className="pagination-current">Trang {page}</span>
                {hasMore && (
                  <button
                    onClick={() => loadResults(q, page + 1)}
                    className="pagination-btn"
                  >
                    Trang sau →
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && results.length === 0 && q && (
          <div className="empty-state">
            <span className="material-icons">search_off</span>
            <p>Không tìm thấy sản phẩm</p>
            <p>Vui lòng thử tìm kiếm với từ khóa khác</p>
            <Link href="/" className="btn-back">
              Về trang chủ
            </Link>
          </div>
        )}
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
