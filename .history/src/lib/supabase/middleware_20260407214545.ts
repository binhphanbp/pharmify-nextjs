/**
 * Supabase Middleware — Kết hợp Self JWT Verification + Session Refresh
 *
 * ═══════════════════════════════════════════════════════════════════════
 * SO SÁNH VỚI EXPRESS.JS
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Express.js (thầy dạy):
 * ─────────────────────
 *   const authMiddleware = (req, res, next) => {
 *     const token = req.headers.authorization?.split(' ')[1];
 *     if (!token) return res.status(401).json({ message: 'No token' });
 *     try {
 *       const decoded = jwt.verify(token, process.env.JWT_SECRET);
 *       req.user = decoded;
 *       next();
 *     } catch (err) {
 *       return res.status(401).json({ message: 'Invalid token' });
 *     }
 *   };
 *   app.use('/admin', authMiddleware);
 *
 * Next.js (file này):
 * ─────────────────────
 *   export async function middleware(request: NextRequest) {
 *     const token = extractTokenFromCookies(...)  // ← thay vì Authorization header
 *     const payload = await verifyJWT(token)       // ← tương đương jwt.verify()
 *     if (!payload) return redirect('/auth')       // ← tương đương res.status(401)
 *     // pass through = next()
 *   }
 * ═══════════════════════════════════════════════════════════════════════
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { verifyJWT, extractTokenFromCookies, decodeJWT } from '@/lib/jwt';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // ─────────────────────────────────────────────────────
  // BƯỚC 1: REFRESH SESSION (giữ cho Supabase hoạt động)
  // Tương tự: dùng passport.js session() trong Express
  // ─────────────────────────────────────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    },
  );

  // Refresh session token nếu sắp hết hạn — lấy luôn user từ đây
  const { data: { user: sessionUser } } = await supabase.auth.getUser();

  // ─────────────────────────────────────────────────────
  // BƯỚC 2: BẢO VỆ ROUTE — dùng sessionUser từ Supabase SSR
  // (SSR client tự xử lý chunked cookies sb-*-auth-token.0/.1/...)
  // ─────────────────────────────────────────────────────

  const pathname = request.nextUrl.pathname;
  const isProtectedRoute =
    pathname.startsWith('/checkout') || pathname.startsWith('/admin') || pathname.startsWith('/account');

  if (isProtectedRoute) {
    if (!sessionUser) {
      console.log(`[Middleware] No session for: ${pathname}`);
      return redirectToAuth(request, pathname);
    }

    console.log('[Middleware] ✅ Session valid:', {
      userId: sessionUser.id,
      email: sessionUser.email,
    });

    // Kiểm tra role admin — dùng app_metadata từ Supabase session
    if (pathname.startsWith('/admin')) {
      const isAdmin = sessionUser.app_metadata?.role === 'admin';
      if (!isAdmin) {
        console.log(`[Middleware] ⛔ Not admin: ${sessionUser.email}`);
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
    }

    // Demo: manual JWT verify để log payload (không chặn access)
    const cookieHeader = request.headers.get('cookie');
    const token = extractTokenFromCookies(cookieHeader);
    if (token) {
      const payload = await verifyJWT(token);
      if (payload) {
        console.log('[Middleware] JWT payload:', {
          sub: payload.sub,
          exp: new Date(payload.exp! * 1000).toISOString(),
        });
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
