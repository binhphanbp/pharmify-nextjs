-- Migration: Thêm cột dob, gender vào bảng profiles
-- Chạy trên Supabase SQL Editor: https://supabase.com/dashboard/project/jfygysihtplarmfeatdc/sql

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dob DATE,
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other'));
