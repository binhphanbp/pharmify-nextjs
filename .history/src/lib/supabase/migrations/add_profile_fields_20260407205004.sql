-- Migration: Thêm cột dob và gender vào bảng profiles
-- Chạy trên: Supabase Dashboard → SQL Editor

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dob DATE,
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other'));
