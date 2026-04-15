'use client';

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { createClient } from '@/lib/supabase/client';
import type { CartItem, CartSummary, CartSummaryItem } from '@/types/cart';

const CART_KEY = 'pharmify_cart';

interface CartState {
  items: CartItem[];
  cartSummary: CartSummary | null;
  loading: boolean;
}

function loadFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(CART_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveToStorage(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

const initialState: CartState = {
  items: [],
  cartSummary: null,
  loading: false,
};

export const syncCartWithServer = createAsyncThunk(
  'cart/syncWithServer',
  async (items: CartItem[], { rejectWithValue }) => {
    if (items.length === 0) {
      return { items: [], total_amount: 0, total_items: 0 } as CartSummary;
    }

    try {
      const supabase = createClient();
      // Pass items as JSONB — Supabase client serialises the array automatically
      const { data, error } = await supabase.rpc('fn_get_cart_summary', {
        p_cart_items: items,
      });

      if (error) return rejectWithValue(error.message);

      // RPC returns { items: [...], total_amount, total_items, final_total }
      const raw = data as {
        items: CartSummaryItem[];
        total_amount: number;
        total_items: number;
      };

      return {
        items: raw.items ?? [],
        total_amount: raw.total_amount ?? 0,
        total_items: raw.total_items ?? 0,
      } as CartSummary;
    } catch (e: unknown) {
      return rejectWithValue(
        e instanceof Error ? e.message : 'Không thể tải giỏ hàng',
      );
    }
  },
);

export const placeOrder = createAsyncThunk(
  'cart/placeOrder',
  async (orderData: {
    customer_name: string;
    customer_phone: string;
    shipping_address: string;
    notes?: string;
    items: CartItem[];
  }) => {
    if (orderData.items.length === 0) throw new Error('Giỏ hàng trống');

    const supabase = createClient();

    // Transform items to match the exact JSON keys expected by the database RPC
    const formattedItems = orderData.items.map((item) => ({
      product_id: item.product_id,
      product_unit_id: item.unit_id,
      quantity: item.quantity,
    }));

    // The database RPC 'fn_place_order' expects: p_items, p_shipping_address, p_notes, p_coupon_code
    // Since orders table doesn't have customer_name and phone columns, we prepend them to the shipping address.
    const fullAddress = `${orderData.customer_name} - ${orderData.customer_phone} - ${orderData.shipping_address}`;

    const { data, error } = await supabase.rpc('fn_place_order', {
      p_items: formattedItems,
      p_shipping_address: fullAddress,
      p_notes: orderData.notes || null,
      p_coupon_code: null,
    });

    if (error) throw error;

    // Depending on what 'fn_place_order' returns, it might return a JSON directly or have a success flag
    // Currently, fn_place_order returns jsonb_build_object('order_id', ..., 'order_number', ...)
    // So if data has order_id, it is successful.
    if (!data || !(data.order_id || data.success)) {
      throw new Error(data?.error || 'Có lỗi khi tạo đơn hàng trên hệ thống');
    }

    return data;
  },
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    initCart(state) {
      state.items = loadFromStorage();
    },
    addToCart(
      state,
      action: PayloadAction<{
        productId: string;
        unitId: string;
        quantity?: number;
      }>,
    ) {
      const { productId, unitId, quantity = 1 } = action.payload;
      const existing = state.items.find(
        (i) => i.product_id === productId && i.unit_id === unitId,
      );

      if (existing) {
        existing.quantity += quantity;
      } else {
        state.items.push({ product_id: productId, unit_id: unitId, quantity });
      }

      saveToStorage(state.items);
    },
    removeFromCart(
      state,
      action: PayloadAction<{ productId: string; unitId: string }>,
    ) {
      const { productId, unitId } = action.payload;
      state.items = state.items.filter(
        (i) => !(i.product_id === productId && i.unit_id === unitId),
      );
      saveToStorage(state.items);
    },
    updateQuantity(
      state,
      action: PayloadAction<{
        productId: string;
        unitId: string;
        quantity: number;
      }>,
    ) {
      const { productId, unitId, quantity } = action.payload;
      if (quantity <= 0) {
        state.items = state.items.filter(
          (i) => !(i.product_id === productId && i.unit_id === unitId),
        );
      } else {
        const item = state.items.find(
          (i) => i.product_id === productId && i.unit_id === unitId,
        );
        if (item) item.quantity = quantity;
      }
      saveToStorage(state.items);
    },
    clearCart(state) {
      state.items = [];
      state.cartSummary = null;
      saveToStorage([]);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncCartWithServer.pending, (state) => {
        state.loading = true;
      })
      .addCase(syncCartWithServer.fulfilled, (state, action) => {
        state.cartSummary = action.payload;
        state.loading = false;
      })
      .addCase(syncCartWithServer.rejected, (state) => {
        state.loading = false;
      })
      .addCase(placeOrder.fulfilled, (state) => {
        state.items = [];
        state.cartSummary = null;
        saveToStorage([]);
      });
  },
});

export const {
  initCart,
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
} = cartSlice.actions;

// Async wrappers to ensure server sync always uses the latest state
export const addCartItem = createAsyncThunk(
  'cart/addAndSync',
  async (
    payload: { productId: string; unitId: string; quantity?: number },
    { dispatch, getState },
  ) => {
    dispatch(addToCart(payload));
    const items = (getState() as { cart: CartState }).cart.items;
    await dispatch(syncCartWithServer(items));
  },
);

export const updateCartQty = createAsyncThunk(
  'cart/updateQtyAndSync',
  async (
    payload: { productId: string; unitId: string; quantity: number },
    { dispatch, getState },
  ) => {
    dispatch(updateQuantity(payload));
    const items = (getState() as { cart: CartState }).cart.items;
    await dispatch(syncCartWithServer(items));
  },
);

export const removeCartItem = createAsyncThunk(
  'cart/removeAndSync',
  async (
    payload: { productId: string; unitId: string },
    { dispatch, getState },
  ) => {
    dispatch(removeFromCart(payload));
    const items = (getState() as { cart: CartState }).cart.items;
    await dispatch(syncCartWithServer(items));
  },
);

export const clearAllCart = createAsyncThunk(
  'cart/clearAllAndSync',
  async (_, { dispatch }) => {
    dispatch(clearCart());
    await dispatch(syncCartWithServer([]));
  },
);

export default cartSlice.reducer;
