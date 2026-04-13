'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PageHeader, AdminModal, Toast } from '@/components/admin';

interface OrderRow {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  notes: string;
  status: string;
  total_amount: number;
  created_at: string;
  user_id: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string;
  unit_name: string;
  quantity: number;
  price: number;
  line_total: number;
}

const STATUS_OPTIONS = [
  {
    value: 'pending',
    label: 'Chờ xử lý',
    color: 'bg-yellow-100 text-yellow-800',
  },
  {
    value: 'confirmed',
    label: 'Đã xác nhận',
    color: 'bg-blue-100 text-blue-800',
  },
  {
    value: 'shipping',
    label: 'Đang giao',
    color: 'bg-purple-100 text-purple-800',
  },
  {
    value: 'delivered',
    label: 'Đã giao',
    color: 'bg-green-100 text-green-800',
  },
  { value: 'cancelled', label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [detailOrder, setDetailOrder] = useState<OrderRow | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.rpc('fn_update_order_status', {
      p_order_id: orderId,
      p_new_status: newStatus,
    });
    if (error) {
      setToast({ message: 'Lỗi: ' + error.message, type: 'error' });
      return;
    }
    setToast({ message: 'Cập nhật trạng thái thành công!', type: 'success' });
    loadOrders();
    if (detailOrder?.id === orderId) {
      setDetailOrder({ ...detailOrder, status: newStatus });
    }
  };

  const viewDetail = async (order: OrderRow) => {
    setDetailOrder(order);
    setLoadingItems(true);
    const { data } = await supabase
      .from('order_items')
      .select('*, products(name, image_url), units(name)')
      .eq('order_id', order.id);
    setOrderItems(
      (data || []).map((i: any) => ({
        id: i.id,
        product_name: i.products?.name || '',
        product_image: i.products?.image_url || '',
        unit_name: i.units?.name || '',
        quantity: i.quantity,
        price: i.price,
        line_total: i.price * i.quantity,
      })),
    );
    setLoadingItems(false);
  };

  const getStatusBadge = (status: string) => {
    const s = STATUS_OPTIONS.find((o) => o.value === status);
    return s
      ? `inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${s.color}`
      : 'badge';
  };

  const filtered = orders.filter((o) => {
    const matchSearch =
      !search ||
      o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone.includes(search);
    const matchStatus = !filterStatus || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <>
      <PageHeader title="Quản lý đơn hàng" />

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Tìm mã đơn, tên, SĐT..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="">Tất cả trạng thái</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="table-card">
        {loading ? (
          <div className="p-8 text-center text-text-muted">Đang tải...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>SĐT</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Ngày đặt</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-text">
                    Không có đơn hàng
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o.id}>
                    <td className="font-medium text-sm text-primary">
                      #{o.order_number || o.id.slice(0, 8)}
                    </td>
                    <td className="text-sm">{o.customer_name}</td>
                    <td className="text-sm text-text-secondary">
                      {o.customer_phone}
                    </td>
                    <td className="text-sm font-semibold">
                      {formatCurrency(o.total_amount)}
                    </td>
                    <td>
                      <select
                        value={o.status}
                        onChange={(e) => updateStatus(o.id, e.target.value)}
                        className={`${getStatusBadge(o.status)} border-0 cursor-pointer`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="text-sm text-text-secondary">
                      {formatDate(o.created_at, 'long')}
                    </td>
                    <td>
                      <div className="actions justify-end">
                        <button
                          onClick={() => viewDetail(o)}
                          className="btn-icon"
                        >
                          <span className="material-icons text-lg">
                            visibility
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      <AdminModal
        show={!!detailOrder}
        onClose={() => setDetailOrder(null)}
        title={`Chi tiết đơn hàng #${detailOrder?.order_number || detailOrder?.id.slice(0, 8) || ''}`}
        wide
      >
        {detailOrder && (
          <>
            {/* Order info */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <p className="text-text-secondary mb-1">Khách hàng</p>
                <p className="font-medium">{detailOrder.customer_name}</p>
              </div>
              <div>
                <p className="text-text-secondary mb-1">Số điện thoại</p>
                <p className="font-medium">{detailOrder.customer_phone}</p>
              </div>
              <div className="col-span-2">
                <p className="text-text-secondary mb-1">Địa chỉ</p>
                <p className="font-medium">{detailOrder.shipping_address}</p>
              </div>
              {detailOrder.notes && (
                <div className="col-span-2">
                  <p className="text-text-secondary mb-1">Ghi chú</p>
                  <p className="text-sm">{detailOrder.notes}</p>
                </div>
              )}
              <div>
                <p className="text-text-secondary mb-1">Trạng thái</p>
                <span className={getStatusBadge(detailOrder.status)}>
                  {
                    STATUS_OPTIONS.find((s) => s.value === detailOrder.status)
                      ?.label
                  }
                </span>
              </div>
              <div>
                <p className="text-text-secondary mb-1">Ngày đặt</p>
                <p className="font-medium">
                  {formatDate(detailOrder.created_at, 'long')}
                </p>
              </div>
            </div>

            {/* Order items */}
            <h4 className="font-bold text-sm mb-3">Sản phẩm</h4>
            {loadingItems ? (
              <p className="text-text-muted text-sm">Đang tải...</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Đơn vị</th>
                    <th>SL</th>
                    <th>Đơn giá</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              item.product_image ||
                              'https://placehold.co/32x32/f5f5f5/999?text=?'
                            }
                            className="thumb w-8 h-8"
                            alt=""
                          />
                          <span className="text-sm">{item.product_name}</span>
                        </div>
                      </td>
                      <td className="text-sm">{item.unit_name}</td>
                      <td className="text-sm">{item.quantity}</td>
                      <td className="text-sm">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="text-sm font-semibold">
                        {formatCurrency(item.line_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="text-right font-bold text-sm">
                      Tổng cộng:
                    </td>
                    <td className="font-bold text-accent text-sm">
                      {formatCurrency(detailOrder.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}

            {/* Status change */}
            <div className="mt-6 pt-4 border-t border-border">
              <h4 className="font-bold text-sm mb-3">Cập nhật trạng thái</h4>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => updateStatus(detailOrder.id, s.value)}
                    disabled={detailOrder.status === s.value}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${detailOrder.status === s.value ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'} ${s.color}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </AdminModal>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
