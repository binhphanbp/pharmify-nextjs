'use client';

import { useState, useEffect, useEffectEvent } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { StatusBadge } from '@/components/admin';

interface StatsOverview {
  products: number;
  activeProducts: number;
  categories: number;
  orders: number;
  banners: number;
  users: number;
}

interface RecentProduct {
  id: string;
  name: string;
  image_url: string;
  price: number;
  is_active: boolean;
  created_at: string;
}

interface OrderRow {
  id: string;
  total_amount: number;
  status: string | null;
  created_at: string;
}

interface RawOrderItemRow {
  product_id: string;
  quantity: number | null;
  price: number | null;
  products: { name: string | null } | { name: string | null }[] | null;
}

interface RevenuePoint {
  label: string;
  amount: number;
}

interface StatusPoint {
  key: string;
  label: string;
  color: string;
  count: number;
}

interface TopProduct {
  id: string;
  name: string;
  qty: number;
  revenue: number;
}

interface RecentOrder {
  id: string;
  total_amount: number;
  status: string | null;
  created_at: string;
}

type TimeRange = 7 | 30 | 90;

interface DashboardData {
  stats: StatsOverview;
  recentProducts: RecentProduct[];
  recentOrders: RecentOrder[];
  revenueSeries: RevenuePoint[];
  statusSeries: StatusPoint[];
  topProducts: TopProduct[];
  revenueCurrent: number;
  ordersCurrent: number;
  avgOrderValueCurrent: number;
  revenueGrowthPct: number;
  ordersGrowthPct: number;
  avgGrowthPct: number;
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chờ xử lý', color: '#f59e0b' },
  confirmed: { label: 'Đã xác nhận', color: '#3b82f6' },
  shipping: { label: 'Đang giao', color: '#8b5cf6' },
  delivered: { label: 'Đã giao', color: '#10b981' },
  completed: { label: 'Hoàn thành', color: '#16a34a' },
  cancelled: { label: 'Đã hủy', color: '#ef4444' },
  unknown: { label: 'Khác', color: '#94a3b8' },
};

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function calcGrowthPct(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function growthLabel(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

function resolveProductName(
  products: RawOrderItemRow['products'],
  fallbackId: string,
): string {
  if (!products) return `Sản phẩm #${fallbackId.slice(0, 6)}`;
  if (Array.isArray(products)) {
    return products[0]?.name || `Sản phẩm #${fallbackId.slice(0, 6)}`;
  }
  return products.name || `Sản phẩm #${fallbackId.slice(0, 6)}`;
}

function pickTicks(points: RevenuePoint[], targetCount: number): RevenuePoint[] {
  if (points.length <= targetCount) return points;
  const ticks: RevenuePoint[] = [];
  for (let i = 0; i < targetCount; i += 1) {
    const index = Math.round((i * (points.length - 1)) / (targetCount - 1));
    ticks.push(points[index]);
  }
  return ticks;
}

function RevenueChart({
  points,
  rangeDays,
}: {
  points: RevenuePoint[];
  rangeDays: TimeRange;
}) {
  const width = 640;
  const height = 220;
  const xPad = 20;
  const yPad = 20;
  const chartHeight = height - yPad * 2;
  const chartWidth = width - xPad * 2;
  const values = points.map((p) => p.amount);
  const maxValue = Math.max(...values, 1);

  const coordinates = points.map((point, index) => {
    const x =
      xPad + (index * chartWidth) / Math.max(points.length - 1, 1);
    const y = height - yPad - (point.amount / maxValue) * chartHeight;
    return { x, y };
  });

  const linePath = coordinates
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const areaPath = `${linePath} L ${xPad + chartWidth} ${height - yPad} L ${xPad} ${height - yPad} Z`;
  const ticks = pickTicks(points, 7);

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-text-primary">
          Doanh thu {rangeDays} ngày gần nhất
        </h3>
        <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700">
          Realtime từ đơn hàng
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56">
        <defs>
          <linearGradient id="revenueArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3, 4].map((i) => {
          const y = yPad + (i * chartHeight) / 4;
          return (
            <line
              key={i}
              x1={xPad}
              x2={width - xPad}
              y1={y}
              y2={y}
              stroke="#eef2f7"
              strokeWidth="1"
            />
          );
        })}

        <path d={areaPath} fill="url(#revenueArea)" />
        <path
          d={linePath}
          fill="none"
          stroke="#2563eb"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {coordinates.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="3.5"
            fill="#2563eb"
            stroke="#fff"
            strokeWidth="1.5"
          />
        ))}
      </svg>

      <div className="mt-2 text-[11px] text-text-muted flex items-center justify-between gap-2">
        {ticks.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}

function StatusDonut({ points }: { points: StatusPoint[] }) {
  const total = points.reduce((sum, point) => sum + point.count, 0);

  let cumulative = 0;
  const gradientStops = points
    .map((point) => {
      const start = cumulative;
      const slice = total > 0 ? (point.count / total) * 100 : 0;
      cumulative += slice;
      return `${point.color} ${start.toFixed(2)}% ${cumulative.toFixed(2)}%`;
    })
    .join(', ');

  const donutBackground =
    total > 0
      ? `conic-gradient(${gradientStops})`
      : 'conic-gradient(#e2e8f0 0% 100%)';

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <h3 className="font-bold text-text-primary mb-4">Phân bổ trạng thái đơn</h3>
      <div className="flex flex-col sm:flex-row items-center gap-5">
        <div className="relative w-44 h-44 shrink-0">
          <div
            className="w-full h-full rounded-full"
            style={{ background: donutBackground }}
          />
          <div className="absolute inset-7 bg-white rounded-full flex flex-col items-center justify-center text-center">
            <span className="text-[11px] text-text-muted">Tổng đơn</span>
            <strong className="text-2xl text-text-primary">{total}</strong>
          </div>
        </div>
        <div className="w-full space-y-2">
          {points.map((point) => {
            const pct = total > 0 ? (point.count / total) * 100 : 0;
            return (
              <div
                key={point.key}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: point.color }}
                  />
                  <span className="text-text-secondary truncate">{point.label}</span>
                </div>
                <div className="text-right shrink-0">
                  <strong className="text-text-primary">{point.count}</strong>
                  <span className="text-text-muted text-xs ml-1">
                    ({pct.toFixed(1)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TopProductsChart({
  products,
  rangeDays,
}: {
  products: TopProduct[];
  rangeDays: TimeRange;
}) {
  const maxQty = Math.max(...products.map((p) => p.qty), 1);

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-text-primary">
          Top sản phẩm bán chạy ({rangeDays} ngày)
        </h3>
        <Link
          href="/admin/products"
          className="text-xs text-primary font-semibold hover:underline"
        >
          Xem sản phẩm
        </Link>
      </div>

      <div className="space-y-4">
        {products.length === 0 ? (
          <p className="text-sm text-text-muted">Chưa có dữ liệu bán hàng.</p>
        ) : (
          products.map((product) => (
            <div key={product.id}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="font-medium text-text-primary truncate pr-3">
                  {product.name}
                </span>
                <span className="text-text-secondary shrink-0">
                  {product.qty} sp
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                  style={{ width: `${(product.qty / maxQty) * 100}%` }}
                />
              </div>
              <p className="text-xs text-text-muted mt-1">
                Doanh thu: <strong>{formatCurrency(product.revenue)}</strong>
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [rangeDays, setRangeDays] = useState<TimeRange>(30);
  const [dashboard, setDashboard] = useState<DashboardData>({
    stats: {
      products: 0,
      activeProducts: 0,
      categories: 0,
      orders: 0,
      banners: 0,
      users: 0,
    },
    recentProducts: [],
    recentOrders: [],
    revenueSeries: [],
    statusSeries: [],
    topProducts: [],
    revenueCurrent: 0,
    ordersCurrent: 0,
    avgOrderValueCurrent: 0,
    revenueGrowthPct: 0,
    ordersGrowthPct: 0,
    avgGrowthPct: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadData = useEffectEvent(async (selectedRange: TimeRange) => {
    const supabase = createClient();
    const now = new Date();
    const startToday = startOfDay(now);
    const startPeriod = new Date(
      startToday.getTime() - (selectedRange - 1) * DAY_MS,
    );
    const startPrevPeriod = new Date(
      startPeriod.getTime() - selectedRange * DAY_MS,
    );

    const [p, pActive, c, o, b, u, rp, ordersResp] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
      supabase.from('categories').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('banners').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase
        .from('products')
        .select('id, name, image_url, price, is_active, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('orders')
        .select('id, total_amount, status, created_at')
        .gte('created_at', startPrevPeriod.toISOString())
        .order('created_at', { ascending: false })
        .limit(1000),
    ]);

    const orders = (ordersResp.data || []) as OrderRow[];
    const orderIds = orders.map((order) => order.id);

    let rawOrderItems: RawOrderItemRow[] = [];
    if (orderIds.length > 0) {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, quantity, price, products(name)')
        .in('order_id', orderIds);
      rawOrderItems = (orderItems || []) as RawOrderItemRow[];
    }

    const recentOrders = orders
      .filter((order) => new Date(order.created_at) >= startPeriod)
      .slice(0, 6);

    const revenueByDate = new Map<string, number>();
    for (let i = 0; i < selectedRange; i += 1) {
      const date = new Date(startPeriod.getTime() + i * DAY_MS);
      revenueByDate.set(dateKey(date), 0);
    }

    let revenueCurrent = 0;
    let revenuePrev = 0;
    let ordersCurrent = 0;
    let ordersPrev = 0;
    const statusCounter = new Map<string, number>();

    orders.forEach((order) => {
      const orderDate = new Date(order.created_at);
      const amount = Number(order.total_amount || 0);
      const key = dateKey(startOfDay(orderDate));

      if (revenueByDate.has(key)) {
        revenueByDate.set(key, (revenueByDate.get(key) || 0) + amount);
      }

      if (orderDate >= startPeriod) {
        revenueCurrent += amount;
        ordersCurrent += 1;
      } else if (orderDate >= startPrevPeriod) {
        revenuePrev += amount;
        ordersPrev += 1;
      }

      if (orderDate >= startPeriod) {
        const statusKey =
          order.status && STATUS_META[order.status] ? order.status : 'unknown';
        statusCounter.set(statusKey, (statusCounter.get(statusKey) || 0) + 1);
      }
    });

    const revenueSeries: RevenuePoint[] = Array.from(revenueByDate.entries()).map(
      ([key, amount]) => {
        const date = new Date(`${key}T00:00:00`);
        return {
          label: `${date.getDate()}/${date.getMonth() + 1}`,
          amount,
        };
      },
    );

    const statusSeries: StatusPoint[] = Array.from(statusCounter.entries())
      .map(([key, count]) => ({
        key,
        label: STATUS_META[key]?.label || STATUS_META.unknown.label,
        color: STATUS_META[key]?.color || STATUS_META.unknown.color,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    const productMap = new Map<string, TopProduct>();
    rawOrderItems.forEach((item) => {
      const id = item.product_id;
      const qty = Number(item.quantity || 0);
      const price = Number(item.price || 0);
      const revenue = qty * price;
      const existing = productMap.get(id);

      if (!existing) {
        productMap.set(id, {
          id,
          name: resolveProductName(item.products, id),
          qty,
          revenue,
        });
        return;
      }

      existing.qty += qty;
      existing.revenue += revenue;
    });

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6);

    const avgOrderValueCurrent = ordersCurrent > 0 ? revenueCurrent / ordersCurrent : 0;
    const avgOrderValuePrev = ordersPrev > 0 ? revenuePrev / ordersPrev : 0;

    setDashboard({
      stats: {
        products: p.count || 0,
        activeProducts: pActive.count || 0,
        categories: c.count || 0,
        orders: o.count || 0,
        banners: b.count || 0,
        users: u.count || 0,
      },
      recentProducts: (rp.data || []) as RecentProduct[],
      recentOrders,
      revenueSeries,
      statusSeries,
      topProducts,
      revenueCurrent,
      ordersCurrent,
      avgOrderValueCurrent,
      revenueGrowthPct: calcGrowthPct(revenueCurrent, revenuePrev),
      ordersGrowthPct: calcGrowthPct(ordersCurrent, ordersPrev),
      avgGrowthPct: calcGrowthPct(avgOrderValueCurrent, avgOrderValuePrev),
    });

    setLoading(false);
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData(rangeDays);
    }, 0);
    return () => clearTimeout(timer);
  }, [rangeDays]);

  const statCards = [
    {
      label: 'Sản phẩm',
      value: dashboard.stats.products,
      meta: `${dashboard.stats.activeProducts} đang hoạt động`,
      icon: 'inventory_2',
      color: 'bg-blue-500',
      link: '/admin/products',
    },
    {
      label: 'Danh mục',
      value: dashboard.stats.categories,
      meta: 'Danh mục kinh doanh',
      icon: 'category',
      color: 'bg-green-500',
      link: '/admin/categories',
    },
    {
      label: 'Đơn hàng',
      value: dashboard.stats.orders,
      meta: `${dashboard.ordersCurrent} đơn / ${rangeDays} ngày`,
      icon: 'receipt_long',
      color: 'bg-orange-500',
      link: '/admin/orders',
    },
    {
      label: 'Banner',
      value: dashboard.stats.banners,
      meta: `${dashboard.stats.users} tài khoản`,
      icon: 'view_carousel',
      color: 'bg-purple-500',
      link: '/admin/banners',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 bg-gray-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-text-primary">Tổng quan kinh doanh</h2>
          <p className="text-sm text-text-secondary">
            Bộ lọc thời gian áp dụng cho toàn bộ KPI và biểu đồ
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-border p-1 bg-bg-primary">
          {[7, 30, 90].map((day) => (
            <button
              key={day}
              onClick={() => setRangeDays(day as TimeRange)}
              className={`px-4 py-1.5 text-sm rounded-md font-semibold transition ${
                rangeDays === day
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {day} ngày
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.link}
            className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-text-primary">
                  {stat.value}
                </p>
                <p className="text-xs text-text-muted mt-1">{stat.meta}</p>
              </div>
              <div
                className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition`}
              >
                <span className="material-icons text-white text-2xl">
                  {stat.icon}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* KPI highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <p className="text-sm text-text-secondary mb-1">
            Doanh thu {rangeDays} ngày
          </p>
          <p className="text-2xl font-bold text-text-primary">
            {formatCurrency(dashboard.revenueCurrent)}
          </p>
          <p
            className={`text-xs mt-2 font-semibold ${dashboard.revenueGrowthPct >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {growthLabel(dashboard.revenueGrowthPct)} so với {rangeDays} ngày trước
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <p className="text-sm text-text-secondary mb-1">
            Số đơn {rangeDays} ngày
          </p>
          <p className="text-2xl font-bold text-text-primary">
            {dashboard.ordersCurrent}
          </p>
          <p
            className={`text-xs mt-2 font-semibold ${dashboard.ordersGrowthPct >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {growthLabel(dashboard.ordersGrowthPct)} so với {rangeDays} ngày trước
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <p className="text-sm text-text-secondary mb-1">
            Giá trị đơn hàng trung bình
          </p>
          <p className="text-2xl font-bold text-text-primary">
            {formatCurrency(dashboard.avgOrderValueCurrent)}
          </p>
          <p
            className={`text-xs mt-2 font-semibold ${dashboard.avgGrowthPct >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {growthLabel(dashboard.avgGrowthPct)} so với {rangeDays} ngày trước
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-3">
          <RevenueChart points={dashboard.revenueSeries} rangeDays={rangeDays} />
        </div>
        <div className="xl:col-span-2">
          <StatusDonut points={dashboard.statusSeries} />
        </div>
      </div>

      <TopProductsChart products={dashboard.topProducts} rangeDays={rangeDays} />

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h3 className="font-bold text-text-primary mb-4">Thao tác nhanh</h3>
        <div className="flex flex-wrap gap-3">
          {[
            {
              label: 'Thêm sản phẩm',
              icon: 'add_circle',
              href: '/admin/products',
            },
            {
              label: 'Quản lý đơn hàng',
              icon: 'list_alt',
              href: '/admin/orders',
            },
            {
              label: 'Flash Sale',
              icon: 'flash_on',
              href: '/admin/flash-sale',
            },
            { label: 'Quản lý banner', icon: 'image', href: '/admin/banners' },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-2 px-4 py-2.5 bg-bg-primary rounded-lg text-sm font-medium text-text-primary hover:bg-primary-light hover:text-primary transition"
            >
              <span className="material-icons text-lg">{action.icon}</span>
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Products */}
      <div className="table-card">
        <div className="p-5 border-b border-border">
          <h3 className="font-bold text-text-primary">Sản phẩm gần đây</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Giá</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.recentProducts.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-text">
                  Chưa có sản phẩm nào.{' '}
                  <Link href="/admin/products" className="text-primary hover:underline">
                    Thêm sản phẩm ngay
                  </Link>
                </td>
              </tr>
            ) : (
              dashboard.recentProducts.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          p.image_url ||
                          'https://placehold.co/40x40/f5f5f5/999?text=?'
                        }
                        alt=""
                        className="thumb"
                      />
                      <span className="font-medium text-sm">{p.name}</span>
                    </div>
                  </td>
                  <td className="text-sm">{formatCurrency(p.price)}</td>
                  <td>
                    <StatusBadge active={p.is_active} />
                  </td>
                  <td className="text-sm text-text-secondary">
                    {new Date(p.created_at).toLocaleDateString('vi-VN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="table-card">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-text-primary">Đơn hàng gần đây</h3>
          <Link href="/admin/orders" className="text-sm text-primary font-semibold hover:underline">
            Xem tất cả
          </Link>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Giá trị</th>
              <th>Trạng thái</th>
              <th>Thời gian</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.recentOrders.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-text">
                  Chưa có đơn hàng trong {rangeDays} ngày đã chọn.
                </td>
              </tr>
            ) : (
              dashboard.recentOrders.map((order) => {
                const statusKey =
                  order.status && STATUS_META[order.status]
                    ? order.status
                    : 'unknown';
                return (
                  <tr key={order.id}>
                    <td className="text-sm font-medium text-primary">
                      #{order.id.slice(0, 8)}
                    </td>
                    <td className="text-sm font-semibold">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td>
                      <span
                        className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: `${STATUS_META[statusKey].color}1a`,
                          color: STATUS_META[statusKey].color,
                        }}
                      >
                        {STATUS_META[statusKey].label}
                      </span>
                    </td>
                    <td className="text-sm text-text-secondary">
                      {new Date(order.created_at).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
