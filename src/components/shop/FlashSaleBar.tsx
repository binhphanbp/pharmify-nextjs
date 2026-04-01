'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';

interface FlashSaleBarProps {
  endTime: string;
  products: Array<{
    id: string;
    name: string;
    image_url: string;
    slug: string;
    flash_price: number;
    original_price: number;
    discount_percent: number;
    sold_quantity: number;
    total_quantity: number;
  }>;
}

export default function FlashSaleBar({ endTime, products }: FlashSaleBarProps) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const diff = end - now;

      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  if (products.length === 0) return null;

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <section className="bg-gradient-to-r from-flash-red to-flash-orange rounded-2xl p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="material-icons text-3xl animate-pulse">
            flash_on
          </span>
          <h2 className="text-xl font-bold">Flash Sale</h2>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm mr-2">Kết thúc sau:</span>
          {[
            pad(timeLeft.hours),
            pad(timeLeft.minutes),
            pad(timeLeft.seconds),
          ].map((v, i) => (
            <span key={i} className="flex items-center">
              <span className="bg-white text-flash-red font-bold text-lg px-2 py-1 rounded-md min-w-[36px] text-center">
                {v}
              </span>
              {i < 2 && <span className="mx-1 font-bold">:</span>}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {products.map((p) => {
          const soldPercent =
            p.total_quantity > 0
              ? Math.round((p.sold_quantity / p.total_quantity) * 100)
              : 0;
          return (
            <a
              key={p.id}
              href={`/product/${p.slug}`}
              className="bg-white rounded-xl p-3 text-text-primary hover:shadow-lg transition group"
            >
              <img
                src={
                  p.image_url ||
                  'https://placehold.co/150x150/f5f5f5/999?text=?'
                }
                alt={p.name}
                className="w-full aspect-square object-contain mb-2 group-hover:scale-105 transition"
              />
              <p className="text-xs line-clamp-2 mb-1 font-medium">{p.name}</p>
              <div className="text-sm font-bold text-accent">
                {formatCurrency(p.flash_price)}
              </div>
              <div className="text-xs text-text-muted line-through">
                {formatCurrency(p.original_price)}
              </div>
              {/* Progress bar */}
              <div className="mt-2 relative h-5 bg-red-100 rounded-full overflow-hidden">
                <div
                  className="absolute inset-0 bg-gradient-to-r from-flash-red to-flash-orange rounded-full"
                  style={{ width: `${soldPercent}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                  Đã bán {p.sold_quantity}
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
