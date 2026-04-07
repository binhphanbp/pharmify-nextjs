-- Migration: Tạo bảng user_addresses + RLS policies
-- Chạy trên: Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS public.user_addresses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  phone         TEXT NOT NULL,
  address_line  TEXT NOT NULL,
  ward          TEXT NOT NULL,
  district      TEXT NOT NULL,
  province      TEXT NOT NULL,
  is_default    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index để query nhanh theo user
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON public.user_addresses(user_id);

-- Trigger tự cập nhật updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_addresses_updated_at ON public.user_addresses;
CREATE TRIGGER trg_user_addresses_updated_at
  BEFORE UPDATE ON public.user_addresses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS: bật Row Level Security
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

-- Policy: user chỉ đọc được địa chỉ của chính mình
CREATE POLICY "user_addresses_select_own"
  ON public.user_addresses FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: user chỉ insert địa chỉ cho chính mình
CREATE POLICY "user_addresses_insert_own"
  ON public.user_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: user chỉ update địa chỉ của chính mình
CREATE POLICY "user_addresses_update_own"
  ON public.user_addresses FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: user chỉ xóa địa chỉ của chính mình
CREATE POLICY "user_addresses_delete_own"
  ON public.user_addresses FOR DELETE
  USING (auth.uid() = user_id);
