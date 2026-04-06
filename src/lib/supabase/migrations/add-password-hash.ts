import { createClient } from '@supabase/supabase-js';

/**
 * Script chạy một lần để thêm cột password_hash vào bảng profiles
 * Chạy: npx ts-node src/lib/supabase/migrations/add-password-hash.ts
 *
 * SQL tương đương:
 *   ALTER TABLE public.profiles
 *   ADD COLUMN IF NOT EXISTS password_hash TEXT;
 */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // cần service role để ALTER TABLE
);

async function migrate() {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE public.profiles
      ADD COLUMN IF NOT EXISTS password_hash TEXT;

      COMMENT ON COLUMN public.profiles.password_hash IS
        'Bcrypt hash (cost=12) của mật khẩu — demo tự hash, không phụ thuộc Supabase Auth';
    `,
  });

  if (error) {
    console.error('Migration failed:', error);
  } else {
    console.log('✅ Migration success: added password_hash column');
  }
}

migrate();
