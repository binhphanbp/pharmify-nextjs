import { NextRequest, NextResponse } from 'next/server';
import { comparePassword, hashPassword } from '@/lib/bcrypt';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ thông tin' },
        { status: 400 },
      );
    }
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu mới phải có ít nhất 6 ký tự' },
        { status: 400 },
      );
    }

    // Xác định user từ session hiện tại
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    // Lấy password_hash từ profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('password_hash')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.password_hash) {
      return NextResponse.json(
        { error: 'Không tìm thấy thông tin tài khoản' },
        { status: 404 },
      );
    }

    // Verify mật khẩu hiện tại bằng bcrypt
    const isMatch = await comparePassword(
      currentPassword,
      profile.password_hash,
    );
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Mật khẩu hiện tại không đúng' },
        { status: 401 },
      );
    }

    // Admin client để update password trong Supabase Auth
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { error: updateAuthError } =
      await adminClient.auth.admin.updateUserById(user.id, {
        password: newPassword,
      });
    if (updateAuthError) {
      return NextResponse.json(
        { error: updateAuthError.message },
        { status: 400 },
      );
    }

    // Cập nhật bcrypt hash mới trong profiles
    const newHash = await hashPassword(newPassword);
    const { error: updateProfileError } = await adminClient
      .from('profiles')
      .update({ password_hash: newHash })
      .eq('id', user.id);

    if (updateProfileError) {
      console.error(
        '[change-password] Failed to update hash:',
        updateProfileError,
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Đổi mật khẩu thành công',
    });
  } catch (error) {
    console.error('[change-password] Error:', error);
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 },
    );
  }
}
