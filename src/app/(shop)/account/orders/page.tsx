'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAppSelector } from '@/stores';
import { createClient } from '@/lib/supabase/client';
import Swal from 'sweetalert2';

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

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: string; step: number }
> = {
  pending: {
    label: 'Chờ xác nhận',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    icon: 'pending_actions',
    step: 1,
  },
  confirmed: {
    label: 'Đã xác nhận',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    icon: 'check_circle',
    step: 2,
  },
  shipping: {
    label: 'Đang giao',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    icon: 'local_shipping',
    step: 3,
  },
  completed: {
    label: 'Hoàn thành',
    color: 'text-green-600',
    bg: 'bg-green-50',
    icon: 'task_alt',
    step: 4,
  },
  cancelled: {
    label: 'Đã huỷ',
    color: 'text-red-600',
    bg: 'bg-red-50',
    icon: 'cancel',
    step: -1,
  },
};

const STEP_ORDER = ['pending', 'confirmed', 'shipping', 'completed'];

export default function OrdersPage() {
  const { user } = useAppSelector((s) => s.auth);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from('orders')
      .select(
        `*, order_items(id, product_name, unit_name, quantity, unit_price, subtotal)`,
      )
      .eq('user_id', user.id)
      .order('ordered_at', { ascending: false });

    if (!error && data) {
      setOrders(data as Order[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCancelOrder = async (orderId: string) => {
    const result = await Swal.fire({
      title: 'Hủy đơn hàng?',
      text: 'Bạn có chắc chắn muốn hủy đơn hàng này không?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Đồng ý hủy',
      cancelButtonText: 'Không',
    });

    if (!result.isConfirmed) return;

    const supabase = createClient();
    // Using RPC to bypass RLS policies that restrict user's UPDATE access
    const { error } = await supabase.rpc('fn_cancel_order', {
      p_order_id: orderId,
    });

    if (error) {
      Swal.fire(
        'Lỗi!',
        'Không thể hủy đơn hàng lúc này. ' + error.message,
        'error',
      );
    } else {
      Swal.fire('Thành công!', 'Đơn hàng đã được hủy thành công.', 'success');
      // Refresh the orders list
      fetchOrders();
    }
  };

  if (loading) {
    return (
      <div>
        <div className="mb-6 border-b border-gray-100 pb-4">
          <h1 className="text-xl font-semibold text-gray-800">
            Quản lý đơn hàng
          </h1>
        </div>
        <div className="flex justify-center items-center py-16 text-gray-400">
          <span className="material-icons text-4xl animate-spin">sync</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 border-b border-gray-100 pb-4">
        <h1 className="text-xl font-semibold text-gray-800">
          Quản lý đơn hàng
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Theo dõi lịch sử và trạng thái đơn hàng của bạn
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <span className="material-icons text-6xl text-gray-200 block mb-4">
            receipt_long
          </span>
          <p className="text-gray-500">Bạn chưa có đơn hàng nào.</p>
          <Link
            href="/"
            className="mt-4 inline-block bg-primary-600 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => {
            const st = STATUS_CONFIG[order.status] ?? {
              label: order.status,
              color: 'text-gray-600',
              bg: 'bg-gray-100',
              icon: 'help_outline',
              step: 0,
            };
            const isExpanded = expandedId === order.id;

            return (
              <div
                key={order.id}
                className={`border rounded-xl bg-white shadow-sm transition-all duration-200 overflow-hidden ${isExpanded ? 'border-primary-200 ring-1 ring-primary-50' : 'border-gray-100'}`}
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="flex items-center justify-between p-4 bg-gray-50/50 cursor-pointer select-none hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                    <span className="font-semibold text-gray-900 flex items-center gap-2">
                      <span className="material-icons text-primary-600 text-[18px]">
                        receipt
                      </span>
                      {order.order_number}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(order.ordered_at).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="font-semibold text-primary-600 hidden sm:inline">
                      {new Intl.NumberFormat('vi-VN').format(
                        order.total_amount,
                      )}
                      đ
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${st.color} ${st.bg}`}
                    >
                      <span className="material-icons text-[14px]">
                        {st.icon}
                      </span>
                      {st.label}
                    </span>
                    <span
                      className={`material-icons text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-primary-600' : ''}`}
                    >
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-5 border-t border-gray-100 bg-white animate-in slide-in-from-top-2 duration-200">
                    {/* Stepper for Non-cancelled orders */}
                    {order.status !== 'cancelled' ? (
                      <div className="relative flex items-center justify-between max-w-2xl mx-auto mb-8 mt-4 px-4 sm:px-0">
                        {/* Connecting Line */}
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-10 -translate-y-1/2 rounded-full"></div>

                        {STEP_ORDER.map((stepKey, idx) => {
                          const isCompleted =
                            STEP_ORDER.indexOf(order.status) >= idx;
                          const isCurrent = order.status === stepKey;
                          const stepConfig = STATUS_CONFIG[stepKey];

                          return (
                            <div
                              key={stepKey}
                              className="flex flex-col items-center gap-2 bg-white px-2"
                            >
                              {/* Circle indicator */}
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm z-10 transition-colors ${isCompleted ? (isCurrent ? 'bg-primary-600 ring-4 ring-primary-100' : 'bg-primary-500') : 'bg-gray-200'}`}
                              >
                                <span className="material-icons text-[16px]">
                                  {stepConfig.icon}
                                </span>
                              </div>
                              <span
                                className={`text-xs font-medium sm:hidden lg:inline ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}
                              >
                                {stepConfig.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-lg mb-6 max-w-2xl mx-auto">
                        <span className="material-icons text-2xl">cancel</span>
                        <div>
                          <p className="font-semibold">Đơn hàng đã huỷ</p>
                          <p className="text-sm opacity-90">
                            Theo yêu cầu của khách hàng hoặc do sự cố giao hàng.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
                      {/* Products List */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <span className="material-icons text-[18px] text-gray-400">
                            inventory_2
                          </span>
                          Sản phẩm
                        </h3>
                        <div className="border border-gray-100 rounded-lg overflow-hidden">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                              <tr>
                                <th className="px-4 py-3 font-medium">
                                  Sản phẩm
                                </th>
                                <th className="px-4 py-3 font-medium text-center">
                                  SL
                                </th>
                                <th className="px-4 py-3 font-medium text-right">
                                  Đơn giá
                                </th>
                                <th className="px-4 py-3 font-medium text-right">
                                  Thành tiền
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {order.order_items.map((item) => (
                                <tr
                                  key={item.id}
                                  className="hover:bg-gray-50/50"
                                >
                                  <td className="px-4 py-3 font-medium text-gray-800">
                                    {item.product_name}
                                    <span className="text-gray-400 text-xs font-normal ml-1">
                                      ({item.unit_name})
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center text-gray-600">
                                    {item.quantity}
                                  </td>
                                  <td className="px-4 py-3 text-right text-gray-600">
                                    {new Intl.NumberFormat('vi-VN').format(
                                      item.unit_price,
                                    )}
                                    đ
                                  </td>
                                  <td className="px-4 py-3 text-right font-medium text-gray-800">
                                    {new Intl.NumberFormat('vi-VN').format(
                                      item.subtotal,
                                    )}
                                    đ
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Order Summary & Actions */}
                      <div className="flex flex-col gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="material-icons text-[18px] text-gray-400">
                              local_shipping
                            </span>
                            Giao hàng
                          </h3>
                          <p className="text-sm text-gray-600 leading-relaxed mb-4">
                            {order.shipping_address}
                          </p>

                          <div className="space-y-2 text-sm pt-4 border-t border-gray-200">
                            {order.shipping_fee > 0 && (
                              <div className="flex justify-between text-gray-600">
                                <span>Phí vận chuyển</span>
                                <span>
                                  {new Intl.NumberFormat('vi-VN').format(
                                    order.shipping_fee,
                                  )}
                                  đ
                                </span>
                              </div>
                            )}
                            {order.discount_amount > 0 && (
                              <div className="flex justify-between text-green-600">
                                <span>Giảm giá</span>
                                <span>
                                  -
                                  {new Intl.NumberFormat('vi-VN').format(
                                    order.discount_amount,
                                  )}
                                  đ
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between items-center text-base font-bold text-primary-700 pt-2 border-t border-gray-200 mt-2">
                              <span>Tổng cộng</span>
                              <span>
                                {new Intl.NumberFormat('vi-VN').format(
                                  order.total_amount,
                                )}
                                đ
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        {order.status === 'pending' && (
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="w-full bg-white border border-red-200 text-red-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-50 hover:border-red-300 transition-colors flex items-center justify-center gap-2"
                            >
                              <span className="material-icons text-[18px]">
                                cancel
                              </span>
                              Huỷ đơn hàng này
                            </button>
                            <p className="text-[11px] text-gray-400 text-center">
                              Bạn chỉ có thể huỷ đơn khi đang chờ xác nhận.
                            </p>
                          </div>
                        )}

                        {order.status === 'completed' && (
                          <button className="w-full bg-primary-50 text-primary-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors flex items-center justify-center gap-2">
                            <span className="material-icons text-[18px]">
                              shopping_cart
                            </span>
                            Mua lại đơn này
                          </button>
                        )}
                      </div>
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
