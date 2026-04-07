'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/stores';
import {
  updateCartQty,
  removeCartItem,
  clearAllCart,
  syncCartWithServer,
} from '@/stores/cart-store';
import { formatCurrency } from '@/lib/utils';

export default function CartPage() {
  const dispatch = useAppDispatch();
  const { items, cartSummary, loading } = useAppSelector((s) => s.cart);

  useEffect(() => {
    if (items.length > 0) {
      dispatch(syncCartWithServer(items));
    }
  // Re-run whenever the cart item count changes (e.g. after initCart loads from localStorage)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const handleUpdateQty = (productId: string, unitId: string, qty: number) => {
    dispatch(updateCartQty({ productId, unitId, quantity: qty }));
  };

  const handleRemove = (productId: string, unitId: string) => {
    dispatch(removeCartItem({ productId, unitId }));
  };

  const handleClear = () => {
    if (confirm('Bạn có chắc muốn xóa tất cả sản phẩm trong giỏ hàng?')) {
      dispatch(clearAllCart());
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <span className="material-icons text-7xl text-text-muted mb-4">
          shopping_cart
        </span>
        <h2 className="text-xl font-bold text-text-primary mb-2">
          Giỏ hàng trống
        </h2>
        <p className="text-text-secondary mb-6">
          Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm
        </p>
        <Link href="/" className="btn-primary inline-flex">
          <span className="material-icons">arrow_back</span>
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-secondary mb-6">
        <a href="/" className="hover:text-primary transition">
          Trang chủ
        </a>
        <span className="material-icons text-sm">chevron_right</span>
        <span className="text-text-primary font-medium">Giỏ hàng</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">
          Giỏ hàng{' '}
          <span className="text-text-muted font-normal text-lg">
            ({items.reduce((s, i) => s + i.quantity, 0)} sản phẩm)
          </span>
        </h1>
        <button
          onClick={handleClear}
          disabled={loading}
          className="text-sm text-danger hover:underline flex items-center gap-1 disabled:opacity-50"
        >
          <span className="material-icons text-lg">delete_sweep</span>
          Xóa tất cả
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          {loading || !cartSummary ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-200 rounded-xl animate-pulse h-24"
                />
              ))}
            </div>
          ) : (
            cartSummary?.items.map((item) => (
              <div
                key={`${item.product_id}-${item.unit_id}`}
                className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm"
              >
                {/* Image */}
                <Link
                  href={`/product/${item.product_slug}`}
                  className="shrink-0"
                >
                  <img
                    src={
                      item.product_image ||
                      'https://placehold.co/80x80/f5f5f5/999?text=?'
                    }
                    alt={item.product_name}
                    className="w-20 h-20 object-contain rounded-lg bg-gray-50 p-2"
                  />
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/product/${item.product_slug}`}
                    className="text-sm font-medium text-text-primary hover:text-primary transition line-clamp-2"
                  >
                    {item.product_name}
                  </Link>
                  <p className="text-xs text-text-muted mt-0.5">
                    {item.unit_name}
                  </p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-sm font-bold text-accent">
                      {formatCurrency(item.price)}
                    </span>
                    {item.original_price > item.price && (
                      <span className="text-xs text-text-muted line-through">
                        {formatCurrency(item.original_price)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity */}
                <div className="flex items-center gap-0 border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() =>
                      handleUpdateQty(
                        item.product_id,
                        item.unit_id,
                        item.quantity - 1,
                      )
                    }
                    disabled={loading}
                    className="w-9 h-9 flex items-center justify-center text-text-secondary hover:bg-bg-primary transition disabled:opacity-50"
                  >
                    <span className="material-icons text-lg">remove</span>
                  </button>
                  <span className="w-10 h-9 flex items-center justify-center text-sm font-semibold border-x border-border">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      handleUpdateQty(
                        item.product_id,
                        item.unit_id,
                        item.quantity + 1,
                      )
                    }
                    disabled={loading}
                    className="w-9 h-9 flex items-center justify-center text-text-secondary hover:bg-bg-primary transition disabled:opacity-50"
                  >
                    <span className="material-icons text-lg">add</span>
                  </button>
                </div>

                {/* Line total */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-text-primary">
                    {formatCurrency(item.line_total)}
                  </p>
                </div>

                {/* Remove */}
                <button
                  onClick={() => handleRemove(item.product_id, item.unit_id)}
                  disabled={loading}
                  className="shrink-0 p-2 text-text-muted hover:text-danger transition rounded-lg hover:bg-red-50 disabled:opacity-50"
                >
                  <span className="material-icons text-xl">close</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-6 shadow-sm sticky top-20">
            <h3 className="font-bold text-lg text-text-primary mb-4">
              Tóm tắt đơn hàng
            </h3>
            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>Tạm tính ({cartSummary?.total_items || 0} sản phẩm)</span>
                <span>{formatCurrency(cartSummary?.total_amount || 0)}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Phí vận chuyển</span>
                <span className="text-success font-medium">Miễn phí</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
                <span>Tổng cộng</span>
                <span className="text-accent">
                  {formatCurrency(cartSummary?.total_amount || 0)}
                </span>
              </div>
            </div>
            <Link
              href="/checkout"
              className="btn-primary w-full justify-center py-3 text-base"
            >
              Tiến hành đặt hàng
              <span className="material-icons">arrow_forward</span>
            </Link>
            <Link
              href="/"
              className="block text-center text-sm text-primary hover:underline mt-3"
            >
              ← Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
