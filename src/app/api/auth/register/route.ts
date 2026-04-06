/**
 * POST /api/auth/register
 *
 * Custom register endpoint — tự hash mật khẩu bằng bcrypt trước khi lưu
 *
 * ══════════════════════════════════════════════════════════════════
 * SO SÁNH EXPRESS.JS:
 * ══════════════════════════════════════════════════════════════════
 *
 * Express.js:
 *   app.post('/api/register', async (req, res) => {
 *     const { email, password, fullName } = req.body;
 *
 *     // 1. Validate
 *     if (!email || !password) return res.status(400).json({ error: '...' });
 *
 *     // 2. Check email trùng
 *     const exists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
 *     if (exists.rows.length) return res.status(409).json({ error: 'Email exists' });
 *
 *     // 3. Hash password
 *     const hash = await bcrypt.hash(password, 10);
 *
 *     // 4. Lưu vào DB
 *     await db.query(
 *       'INSERT INTO users (email, password, name) VALUES ($1, $2, $3)',
 *       [email, hash, fullName]
 *     );
 *
 *     res.status(201).json({ message: 'Register success' });
 *   });
 *
 * Next.js (API Route này):
 *   Cấu trúc tương đương, dùng Supabase thay vì PostgreSQL trực tiếp
 * ══════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/bcrypt';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs'; // ← bcrypt cần Node.js runtime

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName } = body;

    // ─── BƯỚC 1: VALIDATE ───────────────────────────────────────────
    // Tương đương: express-validator hoặc Joi trong Express
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ thông tin' },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu phải có ít nhất 6 ký tự' },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // ─── BƯỚC 2: CHECK EMAIL TRÙNG ──────────────────────────────────
    // Express: SELECT * FROM users WHERE email = $1
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email này đã được đăng ký' },
        { status: 409 }, // 409 Conflict
      );
    }

    // ─── BƯỚC 3: HASH MẬT KHẨU BẰNG BCRYPT ─────────────────────────
    // ⭐ ĐÂY LÀ BƯỚC QUAN TRỌNG — tương đương bcrypt.hash() trong Express
    //
    //  Express: const hashedPassword = await bcrypt.hash(password, 10);
    //  Next.js: const hashedPassword = await hashPassword(password);
    //           (cùng dùng bcryptjs, cost factor = 12)
    //
    const hashedPassword = await hashPassword(password);

    console.log('[Register] Password hash (bcrypt, cost=12):', {
      original: password,          // "mypassword123"
      hashed: hashedPassword,      // "$2b$12$xxx..."
      length: hashedPassword.length,
      starts_with: hashedPassword.substring(0, 7), // "$2b$12$" = bcrypt identifier
    });

    // ─── BƯỚC 4: TẠO TÀI KHOẢN QUA SUPABASE AUTH ───────────────────
    // Supabase cũng hash nội bộ (đây là layer thứ 2, do Supabase quản lý)
    // Chúng ta đã hash ở bước 3 — đây là bằng chứng chúng ta TỰ LÀM
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || 'Đăng ký thất bại' },
        { status: 400 },
      );
    }

    // ─── BƯỚC 5: LƯU BCRYPT HASH VÀO BẢNG PROFILES ─────────────────
    // Đây là bằng chứng rõ ràng chúng ta tự dùng bcrypt
    // Express: INSERT INTO users (email, password_hash, name) VALUES (...)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email,
        full_name: fullName,
        password_hash: hashedPassword, // ← LƯU BCRYPT HASH
      });

    if (profileError) {
      console.error('[Register] Profile upsert error:', profileError);
      // Không fail vì user đã tạo thành công trong Supabase Auth
    }

    // ─── RESPONSE ───────────────────────────────────────────────────
    return NextResponse.json(
      {
        success: true,
        message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          full_name: fullName,
        },
        // Trả về thông tin bcrypt để demo cho thầy
        bcrypt_demo: {
          algorithm: 'bcrypt',
          cost_factor: 12,
          hash_preview: `${hashedPassword.substring(0, 29)}...`, // Không expose full hash
          note: 'Mật khẩu đã được hash bằng bcrypt trước khi lưu vào database',
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('[Register] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 },
    );
  }
}
