'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '@/stores';
import { placeOrder, syncCartWithServer } from '@/stores/cart-store';
import { formatCurrency } from '@/lib/utils';

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const { items, cartSummary, loading } = useAppSelector((s) => s.cart);

  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    shipping_address: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (items.length > 0) {
      dispatch(syncCartWithServer(items));
    }
  }, []);

  // Redirect to cart if empty (after initial hydration)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (items.length === 0 && !loading) {
        router.replace('/cart');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [items.length, loading, router]);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        customer_name:
          prev.customer_name || user.user_metadata?.full_name || '',
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.customer_name || !form.customer_phone || !form.shipping_address) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setSubmitting(true);
    try {
      const result = await dispatch(placeOrder({ ...form, items })).unwrap();
      if (result) {
        router.push('/order-success');
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Có lỗi xảy ra khi đặt hàng',
      );
    }
    setSubmitting(false);
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
          Hãy thêm sản phẩm vào giỏ hàng trước khi đặt hàng
        </p>
        <button
          onClick={() => router.push('/')}
          className="btn-primary inline-flex"
        >
          <span className="material-icons">arrow_back</span>
          Tiếp tục mua sắm
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-secondary mb-6">
        <Link href="/" className="hover:text-primary transition">
          Trang chủ
        </Link>
        <span className="material-icons text-sm">chevron_right</span>
        <Link href="/cart" className="hover:text-primary transition">
          Giỏ hàng
        </Link>
        <span className="material-icons text-sm">chevron_right</span>
        <span className="text-text-primary font-medium">Thanh toán</span>
      </div>

      <h1 className="text-2xl font-bold text-text-primary mb-6">Thanh toán</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Shipping Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-lg text-text-primary mb-4 flex items-center gap-2">
                <span className="material-icons text-primary">
                  local_shipping
                </span>
                Thông tin giao hàng
              </h3>

              {error && (
                <div className="bg-red-50 text-danger text-sm p-3 rounded-lg mb-4 flex items-center gap-2">
                  <span className="material-icons text-lg">error</span>
                  {error}
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Họ tên người nhận *</label>
                  <input
                    type="text"
                    value={form.customer_name}
                    onChange={(e) =>
                      setForm({ ...form, customer_name: e.target.value })
                    }
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Số điện thoại *</label>
                  <input
                    type="tel"
                    value={form.customer_phone}
                    onChange={(e) =>
                      setForm({ ...form, customer_phone: e.target.value })
                    }
                    placeholder="0912 345 678"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Địa chỉ giao hàng *</label>
                <textarea
                  value={form.shipping_address}
                  onChange={(e) =>
                    setForm({ ...form, shipping_address: e.target.value })
                  }
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                  rows={3}
                  required
                />
              </div>

              <div className="form-group">
                <label>Ghi chú đơn hàng</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Ghi chú thêm cho đơn hàng (không bắt buộc)"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-20">
              <h3 className="font-bold text-lg text-text-primary mb-4">
                Đơn hàng của bạn
              </h3>

              <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
                {cartSummary?.items.map((item) => (
                  <div
                    key={`${item.product_id}-${item.unit_id}`}
                    className="flex items-center gap-3"
                  >
                    <img
                      src={
                        item.product_image ||
                        'https://placehold.co/48x48/f5f5f5/999?text=?'
                      }
                      alt={item.product_name}
                      className="w-12 h-12 object-contain rounded-lg bg-gray-50 p-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate">
                        {item.product_name}
                      </p>
                      <p className="text-xs text-text-muted">
                        {item.unit_name} x {item.quantity}
                      </p>
                    </div>
                    <span className="text-sm font-semibold shrink-0">
                      {formatCurrency(item.line_total)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-text-secondary">
                  <span>Tạm tính</span>
                  <span>{formatCurrency(cartSummary?.total_amount || 0)}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Vận chuyển</span>
                  <span className="text-success">Miễn phí</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
                  <span>Tổng cộng</span>
                  <span className="text-accent">
                    {formatCurrency(cartSummary?.total_amount || 0)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || loading}
                className="btn-primary w-full justify-center py-3 text-base mt-6"
              >
                {submitting ? (
                  <>Đang xử lý...</>
                ) : (
                  <>
                    <span className="material-icons">check_circle</span>
                    Đặt hàng
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
