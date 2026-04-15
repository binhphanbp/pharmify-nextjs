/**
 * Supabase Middleware — Session Refresh + Route Protection
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // ─────────────────────────────────────────────────────
  // Kiểm tra env variables
  // ─────────────────────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Middleware] Missing Supabase env variables');
    return supabaseResponse;
  }

  // ─────────────────────────────────────────────────────
  // REFRESH SESSION (giữ cho Supabase hoạt động)
  // ─────────────────────────────────────────────────────
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Refresh session token nếu sắp hết hạn — lấy luôn user từ đây
  // Wrap trong try-catch để không crash middleware nếu Supabase không respond
  let sessionUser = null;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    sessionUser = user;
  } catch (err) {
    console.error('[Middleware] Failed to get user session:', err);
    // Không crash — tiếp tục xử lý, protected routes sẽ redirect
  }

  // ─────────────────────────────────────────────────────
  // BẢO VỆ ROUTE — dùng sessionUser từ Supabase SSR
  // ─────────────────────────────────────────────────────

  const pathname = request.nextUrl.pathname;
  const isProtectedRoute =
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/account');

  if (isProtectedRoute) {
    if (!sessionUser) {
      return redirectToAuth(request, pathname);
    }

    // Kiểm tra role admin — dùng app_metadata từ Supabase session
    if (pathname.startsWith('/admin')) {
      const isAdmin = sessionUser.app_metadata?.role === 'admin';
      if (!isAdmin) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}

// Helper: redirect về trang auth
function redirectToAuth(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = '/auth';
  url.searchParams.set('redirect', pathname);
  return NextResponse.redirect(url);
}
