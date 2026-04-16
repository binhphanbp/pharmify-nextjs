/**
 * POST /api/auth/register
 * - Tự hash mật khẩu bằng bcrypt (cost=12)
 */

import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/bcrypt';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function mapProfileRoleToAuthRole(role: unknown): 'admin' | 'user' {
  return role === 'admin' ? 'admin' : 'user';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, phone, role, isActive } = body;
    const profileRole = role === 'admin' ? 'admin' : 'customer';

    // ─── VALIDATE ───────────────────────────────────────────────────
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

    // ─── KHỞI TẠO ADMIN CLIENT ──────────────────────────────────────
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // ─── CHECK EMAIL TRÙNG ──────────────────────────────────────────
    const { data: existingUser } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email này đã được đăng ký' },
        { status: 409 },
      );
    }

    // ─── BCRYPT HASH MẬT KHẨU ───────────────────────────────────────
    const hashedPassword = await hashPassword(password);

    console.log('[Register] bcrypt hash:', {
      algorithm: 'bcrypt',
      cost_factor: 12,
      starts_with: hashedPassword.substring(0, 7), // "$2b$12$"
    });

    // ─── TẠO USER QUA ADMIN API ─────────────────────────────────────
    // email_confirm: true → KHÔNG gửi email xác nhận, tự động kích hoạt
    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
        app_metadata: {
          role: mapProfileRoleToAuthRole(profileRole),
          is_active: isActive !== undefined ? isActive : true,
        },
      });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || 'Đăng ký thất bại' },
        { status: 400 },
      );
    }

    // ─── LƯU BCRYPT HASH VÀO BẢNG PROFILES ─────────────────────────
    const { error: profileError } = await adminClient.from('profiles').upsert({
      id: authData.user.id,
      email,
      full_name: fullName,
      phone: phone || null,
      role: profileRole,
      is_active: isActive !== undefined ? isActive : true,
      password_hash: hashedPassword,
    });

    if (profileError) {
      console.error('[Register] Profile upsert error:', profileError);
    }

    // ─── RESPONSE ───────────────────────────────────────────────────
    return NextResponse.json(
      {
        success: true,
        message: 'Đăng ký thành công!',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          full_name: fullName,
        },
        bcrypt_demo: {
          algorithm: 'bcrypt',
          cost_factor: 12,
          hash_preview: `${hashedPassword.substring(0, 29)}...`,
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
