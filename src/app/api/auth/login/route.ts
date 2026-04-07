/**
 * POST /api/auth/login
 * ══════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { comparePassword } from '@/lib/bcrypt';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs'; // bcrypt cần NodeJS runtime

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // ─── VALIDATE ───────────────────────────────────────────
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email và mật khẩu không được để trống' },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // ─── LẤY BCRYPT HASH TỪ DATABASE ───────────────────────
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, password_hash')
      .eq('email', email)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không đúng' },
        { status: 401 },
      );
    }

    if (!profile.password_hash) {
      // User đăng ký qua Supabase Auth cũ (chưa có bcrypt hash)
      return NextResponse.json(
        {
          error:
            'Tài khoản này chưa có bcrypt hash. Vui lòng dùng /api/auth/register để đăng ký lại.',
        },
        { status: 400 },
      );
    }

    // ─── SO SÁNH MẬT KHẨU BẰNG BCRYPT.COMPARE ─────────────

    const isMatch = await comparePassword(password, profile.password_hash);

    console.log('[Login] bcrypt.compare result:', {
      email,
      password_entered: password,
      stored_hash: profile.password_hash,
      is_match: isMatch,
    });

    if (!isMatch) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không đúng' },
        { status: 401 },
      );
    }

    // ─── TẠO SESSION QUA SUPABASE ───────────────────────────
    // Sau khi bcrypt verify thành công, tạo session để lấy JWT
    const { data: sessionData, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (signInError || !sessionData.session) {
      return NextResponse.json(
        { error: signInError?.message || 'Đăng nhập thất bại' },
        { status: 401 },
      );
    }

    const { session } = sessionData;

    // ─── RESPONSE ───────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      message: 'Đăng nhập thành công',
      user: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
      },
      // Trả về JWT
      token: {
        access_token: session.access_token,
        token_type: 'Bearer',
        expires_in: session.expires_in,
        expires_at: new Date(session.expires_at! * 1000).toISOString(),
      },
      // Summary
      bcrypt_demo: {
        step: 'bcrypt.compare(password, stored_hash)',
        result: isMatch ? '✅ Mật khẩu khớp' : '❌ Mật khẩu sai',
        stored_hash_preview: `${profile.password_hash.substring(0, 29)}...`,
        algorithm: 'bcrypt (cost=12)',
      },
    });
  } catch (error) {
    console.error('[Login] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 },
    );
  }
}
