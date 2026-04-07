-- Migration: Tạo bảng user_addresses + RLS policies
-- Chạy trên Supabase SQL Editor: https://supabase.com/dashboard/project/jfygysihtplarmfeatdc/sql

CREATE TABLE IF NOT EXISTS public.user_addresses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  phone       TEXT NOT NULL,
  province    TEXT NOT NULL,
  district    TEXT NOT NULL,
  ward        TEXT NOT NULL,
  address_line TEXT NOT NULL,
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index để query nhanh theo user
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON public.user_addresses(user_id);

-- Chỉ 1 địa chỉ được phép is_default = true mỗi user
CREATE UNIQUE INDEX IF NOT EXISTS uidx_user_addresses_default
  ON public.user_addresses(user_id)
  WHERE is_default = true;

-- Enable RLS
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

-- Policies: user chỉ CRUD được địa chỉ của chính mình
CREATE POLICY "Users can view own addresses"
  ON public.user_addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses"
  ON public.user_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses"
  ON public.user_addresses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses"
  ON public.user_addresses FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger: tự cập nhật updated_at khi UPDATE
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_addresses_updated_at ON public.user_addresses;
CREATE TRIGGER trg_user_addresses_updated_at
  BEFORE UPDATE ON public.user_addresses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
