import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function mapProfileRoleToAuthRole(role: unknown): 'admin' | 'user' {
  return role === 'admin' ? 'admin' : 'user';
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const fullName = typeof body.full_name === 'string' ? body.full_name : '';
    const phone =
      typeof body.phone === 'string' && body.phone.trim() ? body.phone : null;
    const profileRole = body.role === 'admin' ? 'admin' : 'customer';
    const isActive = body.is_active !== false;

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // 1) Update profile table for app queries/RLS helpers
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({
        full_name: fullName,
        phone,
        role: profileRole,
        is_active: isActive,
      })
      .eq('id', id);

    if (profileError) throw profileError;

    // 2) Update auth metadata because middleware/API checks app_metadata.role
    const { data: authUserResult, error: authReadError } =
      await adminClient.auth.admin.getUserById(id);
    if (authReadError || !authUserResult.user) {
      throw authReadError || new Error('Không tìm thấy Auth user');
    }

    const currentUser = authUserResult.user;
    const mergedUserMetadata = {
      ...(currentUser.user_metadata || {}),
      full_name: fullName,
      phone,
    };
    const mergedAppMetadata = {
      ...(currentUser.app_metadata || {}),
      role: mapProfileRoleToAuthRole(profileRole),
      is_active: isActive,
    };

    const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(
      id,
      {
        user_metadata: mergedUserMetadata,
        app_metadata: mergedAppMetadata,
      },
    );
    if (authUpdateError) throw authUpdateError;

    return NextResponse.json({
      success: true,
      message: 'Cập nhật thành công!',
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật';
    console.error('[Admin Update User] Error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Khởi tạo admin client (bypass RLS)
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // 1. Xóa trong bảng profiles
    const { error: profileError } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', id);
    if (profileError) throw profileError;

    // 2. Xóa hẵn user khỏi auth.users
    const { error: authError } = await adminClient.auth.admin.deleteUser(id);
    if (authError) throw authError;

    return NextResponse.json({
      success: true,
      message: 'Xoá người dùng thành công!',
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Có lỗi xảy ra khi xoá';
    console.error('[Admin Delete User] Error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
