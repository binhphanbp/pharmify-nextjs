'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { StatusBadge } from '@/components/admin';

interface Stats {
  products: number;
  categories: number;
  orders: number;
  banners: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    products: 0,
    categories: 0,
    orders: 0,
    banners: 0,
  });
  const [recentProducts, setRecentProducts] = useState<
    Array<{
      id: string;
      name: string;
      image_url: string;
      price: number;
      is_active: boolean;
      created_at: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const supabase = createClient();

    const [p, c, o, b, rp] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('categories').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('banners').select('*', { count: 'exact', head: true }),
      supabase
        .from('products')
        .select('id, name, image_url, price, is_active, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    setStats({
      products: p.count || 0,
      categories: c.count || 0,
      orders: o.count || 0,
      banners: b.count || 0,
    });
    setRecentProducts(rp.data || []);
    setLoading(false);
  };

  const statCards = [
    {
      label: 'Sản phẩm',
      value: stats.products,
      icon: 'inventory_2',
      color: 'bg-blue-500',
      link: '/admin/products',
    },
    {
      label: 'Danh mục',
      value: stats.categories,
      icon: 'category',
      color: 'bg-green-500',
      link: '/admin/categories',
    },
    {
      label: 'Đơn hàng',
      value: stats.orders,
      icon: 'receipt_long',
      color: 'bg-orange-500',
      link: '/admin/orders',
    },
    {
      label: 'Banner',
      value: stats.banners,
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
            {recentProducts.map((p) => (
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
                <td className="text-sm">
                  {formatCurrency(p.price)}
                </td>
                <td>
                  <StatusBadge active={p.is_active} />
                </td>
                <td className="text-sm text-text-secondary">
                  {new Date(p.created_at).toLocaleDateString('vi-VN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
