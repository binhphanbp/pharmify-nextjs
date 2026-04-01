'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import { useAppDispatch } from '@/stores';
import { addCartItem } from '@/stores/cart-store';
import { formatCurrency } from '@/lib/utils';
import ProductCard from '@/components/shop/ProductCard';
import QuickViewModal from '@/components/shop/QuickViewModal';
import type { Product, ProductUnit } from '@/types/product';

interface ProductDetailData {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand_name: string;
  category_name: string;
  category_slug: string;
  short_description: string;
  description: string;
  image_url: string;
  manufacturer: string;
  origin: string;
  requires_prescription: boolean;
  active_ingredient: string;
  usage_instructions: string;
  units: ProductUnit[];
  price: number;
  original_price: number;
  base_unit_name: string;
}

/** SWR fetcher: load product detail from Supabase */
const fetchProductDetail = async (slug: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('v_product_detail')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) throw error;
  return data as ProductDetailData;
};

/** SWR fetcher: load related products */
const fetchRelatedProducts = async (
  categorySlug: string,
  excludeSlug: string,
) => {
  const supabase = createClient();
  const { data } = await supabase
    .from('v_product_catalog')
    .select('*')
    .eq('category_slug', categorySlug)
    .neq('slug', excludeSlug)
    .eq('is_active', true)
    .limit(5);
  return (data || []) as Product[];
};

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const dispatch = useAppDispatch();

  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(
    null,
  );

  // SWR for product detail
  const {
    data: product,
    error,
    isLoading,
  } = useSWR<ProductDetailData>(
    slug ? `product-detail-${slug}` : null,
    () => fetchProductDetail(slug),
    {
      revalidateOnFocus: false,
      onSuccess: (data) => {
        // Set default selected unit
        if (data?.units?.length > 0 && !selectedUnitId) {
          const base = data.units.find((u) => u.is_base_unit) || data.units[0];
          setSelectedUnitId(base.unit_id || base.id);
        }
      },
    },
  );

  // SWR for related products (only fetch when product is loaded)
  const { data: relatedProducts = [] } = useSWR<Product[]>(
    product?.category_slug ? `related-${product.category_slug}-${slug}` : null,
    () => fetchRelatedProducts(product!.category_slug, slug),
    { revalidateOnFocus: false },
  );

  const selectedUnit =
    product?.units?.find((u) => (u.unit_id || u.id) === selectedUnitId) || null;

  const currentPrice = selectedUnit?.price ?? product?.price ?? 0;
  const originalPrice =
    selectedUnit?.original_price ?? product?.original_price ?? 0;
  const currentUnitName =
    selectedUnit?.unit_name ?? product?.base_unit_name ?? '';
  const discountPercent =
    originalPrice > currentPrice
      ? Math.round((1 - currentPrice / originalPrice) * 100)
      : null;

  const handleAddToCart = () => {
    if (!product || !selectedUnitId) return;
    dispatch(
      addCartItem({
        productId: product.id,
        unitId: selectedUnitId,
        quantity,
      }),
    );
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="product-detail-page">
        <div className="container">
          <div className="loading-layout">
            <div
              className="skeleton"
              style={{ height: 400, borderRadius: 12, flex: '0 0 40%' }}
            />
            <div style={{ flex: 1 }}>
              <div
                className="skeleton"
                style={{
                  height: 32,
                  width: '70%',
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              />
              <div
                className="skeleton"
                style={{
                  height: 24,
                  width: '40%',
                  borderRadius: 8,
                  marginBottom: 24,
                }}
              />
              <div
                className="skeleton"
                style={{
                  height: 48,
                  width: '50%',
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              />
              <div
                className="skeleton"
                style={{ height: 48, borderRadius: 8 }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error / Not found
  if (error || !product) {
    return (
      <div className="product-detail-page">
        <div className="container">
          <div className="not-found">
            <span className="material-icons">search_off</span>
            <h2>Không tìm thấy sản phẩm</h2>
            <Link href="/" className="btn-back">
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb-bar">
          <Link href="/">Trang chủ</Link>
          <span className="sep">›</span>
          <Link href={`/category/${product.category_slug}`}>
            {product.category_name}
          </Link>
          <span className="sep">›</span>
          <span className="current">{product.name}</span>
        </div>

        {/* Buy Section */}
        <div className="buy-section">
          {/* Image */}
          <div className="product-gallery">
            <img
              src={
                product.image_url ||
                'https://placehold.co/400x400/f8f9fa/ccc?text=Pharmify'
              }
              alt={product.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://placehold.co/400x400/f8f9fa/ccc?text=Pharmify';
              }}
            />
          </div>

          {/* Info */}
          <div className="product-info">
            <span className="brand-name">
              {product.brand_name || product.manufacturer || 'Thương hiệu khác'}
            </span>
            <h1 className="product-title">{product.name}</h1>

            <div className="price-block">
              <span className="price-value">
                {formatCurrency(currentPrice)}
              </span>
              <span className="price-unit">/ {currentUnitName}</span>
              {originalPrice > currentPrice && (
                <span className="price-original">
                  {formatCurrency(originalPrice)}
                </span>
              )}
              {discountPercent && (
                <span className="discount-badge">-{discountPercent}%</span>
              )}
            </div>

            {/* Unit Selector */}
            {product.units && product.units.length > 0 && (
              <div className="unit-selector">
                <label className="unit-label">Chọn quy cách:</label>
                <div className="unit-options">
                  {product.units.map((unit) => {
                    const uid = unit.unit_id || unit.id;
                    return (
                      <button
                        key={uid}
                        className={`unit-btn${selectedUnitId === uid ? ' active' : ''}`}
                        onClick={() => setSelectedUnitId(uid)}
                      >
                        {unit.unit_name}
                        {unit.conversion_factor > 1 && (
                          <span className="unit-factor">
                            ({unit.conversion_factor})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <hr className="divider" />

            {/* Quantity & Buy */}
            <div className="buy-actions">
              <div className="qty-control">
                <button
                  className="qty-btn"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <span className="material-icons">remove</span>
                </button>
                <input
                  type="number"
                  value={quantity}
                  readOnly
                  className="qty-input"
                />
                <button
                  className="qty-btn"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <span className="material-icons">add</span>
                </button>
              </div>
              <button className="buy-btn" onClick={handleAddToCart}>
                <span className="material-icons">shopping_cart</span> Chọn mua
              </button>
            </div>

            {/* Trust Badges */}
            <div className="trust-badges">
              <div className="trust-badge-item">
                <span className="material-icons">verified_user</span> Chính hãng
                100%
              </div>
              <div className="trust-badge-item">
                <span className="material-icons">local_shipping</span> Giao
                nhanh 2h
              </div>
              <div className="trust-badge-item">
                <span className="material-icons">swap_horiz</span> Đổi trả dễ
                dàng
              </div>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="detail-section">
          <h2 className="detail-title">
            <span className="material-icons">description</span> Thông tin sản
            phẩm
          </h2>

          {product.short_description && (
            <div className="detail-block">
              <h3>Mô tả ngắn</h3>
              <p>{product.short_description}</p>
            </div>
          )}

          {product.description && (
            <div className="detail-block">
              <h3>Mô tả chi tiết</h3>
              <div dangerouslySetInnerHTML={{ __html: product.description }} />
            </div>
          )}

          {product.active_ingredient && (
            <div className="detail-block">
              <h3>Thành phần</h3>
              <p>{product.active_ingredient}</p>
            </div>
          )}

          {product.usage_instructions && (
            <div className="detail-block">
              <h3>Hướng dẫn sử dụng</h3>
              <p style={{ whiteSpace: 'pre-line' }}>
                {product.usage_instructions}
              </p>
            </div>
          )}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="related-section">
            <h2 className="section-title text-dark">Sản phẩm liên quan</h2>
            <div className="product-grid">
              {relatedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onQuickView={setQuickViewProduct}
                />
              ))}
            </div>
          </section>
        )}

        {quickViewProduct && (
          <QuickViewModal
            product={quickViewProduct}
            onClose={() => setQuickViewProduct(null)}
          />
        )}

        {/* Toast */}
        {showToast && (
          <div className="toast">
            <span className="material-icons">check_circle</span>
            Đã thêm vào giỏ hàng!
          </div>
        )}
      </div>
    </div>
  );
}
