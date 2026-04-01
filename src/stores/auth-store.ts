'use client';

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  role: 'admin' | 'user' | null;
  loading: boolean;
  initialized: boolean;
}

const initialState: AuthState = {
  user: null,
  role: null,
  loading: true,
  initialized: false,
};

export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { dispatch }) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let role: 'admin' | 'user' | null = null;
    if (user) {
      try {
        const { data } = await supabase.rpc('is_admin');
        role = data === true ? 'admin' : 'user';
      } catch {
        role = 'user';
      }
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      if (currentUser) {
        let newRole: 'admin' | 'user' = 'user';
        try {
          const { data } = await supabase.rpc('is_admin');
          newRole = data === true ? 'admin' : 'user';
        } catch {
          /* ignore */
        }
        dispatch(setUser({ user: currentUser, role: newRole }));
      } else {
        dispatch(setUser({ user: null, role: null }));
      }
    });

    return { user, role };
  },
);

export const signIn = createAsyncThunk(
  'auth/signIn',
  async ({ email, password }: { email: string; password: string }) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);
  },
);

export const signUp = createAsyncThunk(
  'auth/signUp',
  async ({
    email,
    password,
    fullName,
  }: {
    email: string;
    password: string;
    fullName: string;
  }) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw new Error(error.message);
  },
);

export const signOut = createAsyncThunk('auth/signOut', async () => {
  const supabase = createClient();
  await supabase.auth.signOut();
});

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (email: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw new Error(error.message);
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(
      state,
      action: PayloadAction<{
        user: User | null;
        role: 'admin' | 'user' | null;
      }>,
    ) {
      state.user = action.payload.user;
      state.role = action.payload.role;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.role = action.payload.role;
        state.loading = false;
        state.initialized = true;
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.loading = false;
        state.initialized = true;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.user = null;
        state.role = null;
      });
  },
});

export const { setUser } = authSlice.actions;
export default authSlice.reducer;
