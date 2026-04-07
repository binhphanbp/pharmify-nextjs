'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppSelector } from '@/stores';
import { createClient } from '@/lib/supabase/client';

interface OrderItem {
  id: string;
  product_name: string;
  unit_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  shipping_fee: number;
  discount_amount: number;
  shipping_address: string;
  notes: string | null;
  ordered_at: string;
  order_items: OrderItem[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Chờ xác nhận', color: '#b8860b', bg: '#fffbeb' },
  confirmed: { label: 'Đã xác nhận',  color: '#1d6fa8', bg: '#ebf5ff' },
  shipping:  { label: 'Đang giao',    color: '#d35400', bg: '#fff3eb' },
  completed: { label: 'Hoàn thành',   color: '#27ae60', bg: '#f0fff4' },
  cancelled: { label: 'Đã huỷ',       color: '#c0392b', bg: '#fff0f0' },
};

export default function OrdersPage() {
  const { user } = useAppSelector((s) => s.auth);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from('orders')
      .select(`*, order_items(id, product_name, unit_name, quantity, unit_price, subtotal)`)
      .eq('user_id', user.id)
      .order('ordered_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setOrders(data as Order[]);
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div>
        <div style={{ marginBottom: '24px', borderBottom: '1px solid #eee', paddingBottom: '16px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#333', margin: 0 }}>Quản lý đơn hàng</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          <span className="material-icons" style={{ fontSize: '32px', animation: 'spin 1s linear infinite' }}>sync</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '24px', borderBottom: '1px solid #eee', paddingBottom: '16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#333', margin: 0 }}>Quản lý đơn hàng</h1>
        <p style={{ color: '#666', fontSize: '14px', margin: '4px 0 0' }}>Theo dõi lịch sử và trạng thái đơn hàng của bạn</p>
      </div>

      {orders.length === 0 ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#999' }}>
          <span className="material-icons" style={{ fontSize: '64px', color: '#ddd', display: 'block', marginBottom: '16px' }}>receipt_long</span>
          <p>Bạn chưa có đơn hàng nào.</p>
          <Link href="/" style={{ marginTop: '16px', background: '#004d95', color: 'white', textDecoration: 'none', padding: '10px 24px', borderRadius: '6px', fontWeight: 500, display: 'inline-block' }}>
            Tiếp tục mua sắm
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {orders.map((order) => {
            const st = STATUS_CONFIG[order.status] ?? { label: order.status, color: '#666', bg: '#f5f5f5' };
            const isExpanded = expandedId === order.id;
            return (
              <div key={order.id} style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
                {/* Header row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', cursor: 'pointer', background: '#fafafa', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontWeight: 600, color: '#333', fontSize: '15px' }}>{order.order_number}</span>
                    <span style={{ fontSize: '13px', color: '#999' }}>
                      {new Date(order.ordered_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: '#004d95' }}>
                      {new Intl.NumberFormat('vi-VN').format(order.total_amount)}đ
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', color: st.color, background: st.bg }}>
                      {st.label}
                    </span>
                    <span className="material-icons" style={{ fontSize: '18px', color: '#999', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{ padding: '16px 20px', borderTop: '1px solid #eee' }}>
                    <div style={{ marginBottom: '12px', fontSize: '13px', color: '#666' }}>
                      <span className="material-icons" style={{ fontSize: '15px', verticalAlign: 'middle', marginRight: '4px' }}>location_on</span>
                      {order.shipping_address}
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #eee', color: '#888' }}>
                          <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 500 }}>Sản phẩm</th>
                          <th style={{ textAlign: 'center', padding: '6px 8px', fontWeight: 500 }}>SL</th>
                          <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 500 }}>Đơn giá</th>
                          <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 500 }}>Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.order_items.map((item) => (
                          <tr key={item.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                            <td style={{ padding: '8px 0' }}>{item.product_name} <span style={{ color: '#999', fontSize: '12px' }}>({item.unit_name})</span></td>
                            <td style={{ textAlign: 'center', padding: '8px' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right', padding: '8px 0' }}>{new Intl.NumberFormat('vi-VN').format(item.unit_price)}đ</td>
                            <td style={{ textAlign: 'right', padding: '8px 0' }}>{new Intl.NumberFormat('vi-VN').format(item.subtotal)}đ</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ marginTop: '12px', textAlign: 'right', fontSize: '13px', color: '#666', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                      {order.shipping_fee > 0 && <span>Phí vận chuyển: {new Intl.NumberFormat('vi-VN').format(order.shipping_fee)}đ</span>}
                      {order.discount_amount > 0 && <span style={{ color: '#27ae60' }}>Giảm giá: -{new Intl.NumberFormat('vi-VN').format(order.discount_amount)}đ</span>}
                      <span style={{ fontWeight: 700, fontSize: '15px', color: '#004d95' }}>
                        Tổng: {new Intl.NumberFormat('vi-VN').format(order.total_amount)}đ
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

