'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/stores';
import { initializeAuth } from '@/stores/auth-store';
import { initCart, syncCartWithServer } from '@/stores/cart-store';

export default function AppInitializer({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(initializeAuth());
    dispatch(initCart());
    // Sync cart with server after initializing
    const items = JSON.parse(localStorage.getItem('pharmify_cart') || '[]');
    if (items.length > 0) {
      dispatch(syncCartWithServer(items));
    }
  }, [dispatch]);

  return <>{children}</>;
}
