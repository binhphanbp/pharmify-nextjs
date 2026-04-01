'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Product } from '@/types/product';
import QuickViewModal from './QuickViewModal';

interface Props {
  product: Product;
  onQuickView?: (p: Product) => void;
}

export default function ProductCard({ product, onQuickView }: Props) {
  const [showQuickView, setShowQuickView] = useState(false);
  const discountPercent =
    product.original_price && product.original_price > product.price
      ? Math.round(
          ((product.original_price - product.price) / product.original_price) *
            100,
        )
      : 0;

  const openQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) {
      onQuickView(product);
    } else {
      setShowQuickView(true);
    }
  };

  return (
    <>
      <Link href={`/product/${product.slug}`} className="product-card">
        {/* Image Area */}
        <div className="product-image-wrapper">
          {discountPercent > 0 && (
            <span className="discount-badge">Giảm {discountPercent}%</span>
          )}
          <img
            src={product.image_url || ''}
            alt={product.name}
            className="product-image"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://placehold.co/200x200/f8f9fa/ccc?text=Pharmify';
            }}
          />
        </div>

        {/* Product Info */}
        <div className="product-info">
          <h3 className="product-name">{product.name}</h3>

          <div className="product-pricing">
            <span className="price-current">
              {new Intl.NumberFormat('vi-VN').format(product.price)} đ
            </span>
            <span className="price-unit">
              /{product.base_unit_name || 'Đơn vị'}
            </span>
          </div>

          {product.original_price && product.original_price > product.price && (
            <div className="price-old-row">
              <span className="price-old">
                {new Intl.NumberFormat('vi-VN').format(product.original_price)}{' '}
                đ
              </span>
            </div>
          )}

          <button className="btn-buy" onClick={openQuickView}>
            <span className="material-icons">add</span> Chọn mua
          </button>
        </div>
      </Link>

      {showQuickView && (
        <QuickViewModal
          product={product}
          onClose={() => setShowQuickView(false)}
        />
      )}
    </>
  );
}
