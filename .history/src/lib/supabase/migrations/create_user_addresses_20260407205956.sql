-- Migration: Tạo bảng user_addresses cho quản lý địa chỉ giao hàng
-- Chạy trong Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.user_addresses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  phone       TEXT NOT NULL,
  address_line TEXT NOT NULL,
  ward        TEXT NOT NULL,
  district    TEXT NOT NULL,
  province    TEXT NOT NULL,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index để query nhanh theo user
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON public.user_addresses(user_id);

-- Trigger tự update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_addresses_updated_at ON public.user_addresses;
CREATE TRIGGER trg_user_addresses_updated_at
  BEFORE UPDATE ON public.user_addresses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS: bật bảo vệ theo từng user
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

-- Policy: user chỉ xem địa chỉ của chính mình
CREATE POLICY "Users can view own addresses"
  ON public.user_addresses FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: user chỉ thêm địa chỉ cho chính mình
CREATE POLICY "Users can insert own addresses"
  ON public.user_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: user chỉ sửa địa chỉ của chính mình
CREATE POLICY "Users can update own addresses"
  ON public.user_addresses FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: user chỉ xóa địa chỉ của chính mình
CREATE POLICY "Users can delete own addresses"
  ON public.user_addresses FOR DELETE
  USING (auth.uid() = user_id);
