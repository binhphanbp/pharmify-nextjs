'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch } from '@/stores';
import { addCartItem } from '@/stores/cart-store';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import type { Product, ProductUnit } from '@/types/product';

interface QuickViewModalProps {
  product: Product;
  onClose: () => void;
}

export default function QuickViewModal({
  product,
  onClose,
}: QuickViewModalProps) {
  const dispatch = useAppDispatch();
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<ProductUnit | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);

  const loadUnits = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('v_product_detail')
      .select('*')
      .eq('id', product.id)
      .single();

    if (data?.units) {
      setUnits(data.units);
      const baseUnit =
        data.units.find((u: ProductUnit) => u.is_base_unit) || data.units[0];
      setSelectedUnit(baseUnit);
    }
    setLoading(false);
  }, [product.id]);

  useEffect(() => {
    loadUnits();
  }, [loadUnits]);

  const handleAdd = () => {
    if (!selectedUnit) return;
    dispatch(
      addCartItem({
        productId: product.id,
        unitId: selectedUnit.unit_id,
        quantity,
      }),
    );
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      onClose();
    }, 1200);
  };

  const currentPrice = selectedUnit?.price ?? product.price;
  const currentOriginal =
    selectedUnit?.original_price ?? product.original_price;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal modal-wide">
        <div className="modal-header">
          <h3>Xem nhanh sản phẩm</h3>
          <button className="btn-close" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div className="text-center py-8 text-text-muted">Đang tải...</div>
          ) : (
            <div className="flex gap-6 flex-col sm:flex-row">
              {/* Image */}
              <div className="sm:w-1/3 shrink-0">
                <img
                  src={
                    product.image_url ||
                    'https://placehold.co/300x300/f5f5f5/999?text=Pharmify'
                  }
                  alt={product.name}
                  className="w-full aspect-square object-contain rounded-xl bg-gray-50 p-4"
                />
              </div>

              {/* Info */}
              <div className="flex-1">
                <h4 className="text-lg font-bold text-text-primary mb-2">
                  {product.name}
                </h4>

                {product.short_description && (
                  <p className="text-sm text-text-secondary mb-4 line-clamp-3">
                    {product.short_description}
                  </p>
                )}

                {/* Price */}
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-2xl font-bold text-accent">
                    {formatCurrency(currentPrice)}
                  </span>
                  {currentOriginal > currentPrice && (
                    <span className="text-sm text-text-muted line-through">
                      {formatCurrency(currentOriginal)}
                    </span>
                  )}
                </div>

                {/* Units */}
                {units.length > 1 && (
                  <div className="mb-4">
                    <label className="text-sm font-semibold text-text-secondary mb-2 block">
                      Đơn vị:
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {units.map((u) => (
                        <button
                          key={u.unit_id}
                          onClick={() => setSelectedUnit(u)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                            selectedUnit?.unit_id === u.unit_id
                              ? 'border-primary bg-primary-light text-primary'
                              : 'border-border text-text-secondary hover:border-primary'
                          }`}
                        >
                          {u.unit_name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div className="mb-6">
                  <label className="text-sm font-semibold text-text-secondary mb-2 block">
                    Số lượng:
                  </label>
                  <div className="flex items-center gap-0 border border-border rounded-lg w-fit overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center text-text-secondary hover:bg-bg-primary transition"
                    >
                      <span className="material-icons text-lg">remove</span>
                    </button>
                    <span className="w-12 h-10 flex items-center justify-center text-sm font-semibold border-x border-border">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center text-text-secondary hover:bg-bg-primary transition"
                    >
                      <span className="material-icons text-lg">add</span>
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleAdd}
                    className="btn-primary flex-1 justify-center"
                  >
                    <span className="material-icons text-lg">
                      add_shopping_cart
                    </span>
                    Thêm vào giỏ
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="toast">
          <span className="material-icons">check_circle</span>
          Đã thêm vào giỏ hàng!
        </div>
      )}
    </div>
  );
}
