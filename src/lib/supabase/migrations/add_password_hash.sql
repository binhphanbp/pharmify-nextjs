-- Chạy SQL này trong Supabase Dashboard > SQL Editor
-- Mục đích: thêm cột lưu bcrypt hash do chúng ta tự tạo

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS password_hash TEXT;

COMMENT ON COLUMN public.profiles.password_hash IS
  'Bcrypt hash (cost=12) tự tạo bằng bcryptjs — demo manual bcrypt, không phụ thuộc Supabase Auth';

-- Kiểm tra kết quả
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'profiles'
  AND column_name  = 'password_hash';
