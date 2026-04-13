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
    supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      if (!currentUser) {
        dispatch(setUser({ user: null, role: null }));
        return;
      }

      if (event === 'SIGNED_IN') {
        let newRole: 'admin' | 'user' = 'user';
        try {
          const { data } = await supabase.rpc('is_admin');
          newRole = data === true ? 'admin' : 'user';
        } catch {
          /* ignore */
        }
        dispatch(setUser({ user: currentUser, role: newRole }));
      } else {
        // USER_UPDATED / TOKEN_REFRESHED — just sync the user object, keep existing role
        dispatch(setUser({ user: currentUser, role: role ?? 'user' }));
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
    // Gọi API route tự tạo — hash bcrypt + auto-confirm (không bắt xác nhận email)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Đăng ký thất bại');
    return data;
  },
);

export const signOut = createAsyncThunk('auth/signOut', async () => {
  const supabase = createClient();
  await supabase.auth.signOut();
});

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (
    {
      fullName,
      phone,
      dob,
      gender,
    }: {
      fullName: string;
      phone: string;
      dob: string;
      gender: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) return rejectWithValue('Chưa đăng nhập');

      // Cập nhật user_metadata trong Supabase Auth
      const { data: updatedAuth, error: authError } =
        await supabase.auth.updateUser({
          data: { full_name: fullName, phone, dob, gender },
        });
      if (authError) return rejectWithValue(authError.message);

      // Cập nhật bảng profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone,
          dob: dob || null,
          gender: gender || null,
        })
        .eq('id', user.id);
      if (profileError) return rejectWithValue(profileError.message);

      return updatedAuth.user;
    } catch (e: unknown) {
      return rejectWithValue(
        e instanceof Error ? e.message : 'Cập nhật thất bại',
      );
    }
  },
);

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
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        if (action.payload) state.user = action.payload;
      });
  },
});

export const { setUser } = authSlice.actions;
export default authSlice.reducer;
