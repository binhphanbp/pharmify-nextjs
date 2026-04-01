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
  async (items: CartItem[]) => {
    if (items.length === 0) {
      return { items: [], total_amount: 0, total_items: 0 } as CartSummary;
    }

    const supabase = createClient();
    const { data, error } = await supabase.rpc('fn_get_cart_summary', {
      p_cart_items: items,
    });

    if (error) throw error;

    const summaryItems: CartSummaryItem[] = (data || []).map(
      (item: CartSummaryItem) => ({
        ...item,
        line_total: item.price * item.quantity,
      }),
    );

    const total_amount = summaryItems.reduce((s, i) => s + i.line_total, 0);

    return {
      items: summaryItems,
      total_amount,
      total_items: items.reduce((s, i) => s + i.quantity, 0),
    } as CartSummary;
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
    const { data, error } = await supabase.rpc('fn_place_order', {
      p_cart_items: orderData.items,
      p_customer_name: orderData.customer_name,
      p_customer_phone: orderData.customer_phone,
      p_shipping_address: orderData.shipping_address,
      p_notes: orderData.notes || '',
    });

    if (error) throw error;
    if (data && !data.success) throw new Error(data.error);
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
