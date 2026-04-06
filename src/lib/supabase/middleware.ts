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

  // Refresh session token nếu sắp hết hạn
  await supabase.auth.getUser();

  // ─────────────────────────────────────────────────────
  // BƯỚC 2: TỰ VERIFY JWT — giống Express.js authMiddleware
  // ─────────────────────────────────────────────────────

  const pathname = request.nextUrl.pathname;
  const isProtectedRoute =
    pathname.startsWith('/checkout') || pathname.startsWith('/admin');

  if (isProtectedRoute) {
    // Lấy JWT từ cookie (Express lấy từ Authorization header)
    const cookieHeader = request.headers.get('cookie');
    const token = extractTokenFromCookies(cookieHeader);

    if (!token) {
      // Không có token → redirect auth (tương đương res.status(401) trong Express)
      console.log(`[JWT Middleware] No token found for: ${pathname}`);
      return redirectToAuth(request, pathname);
    }

    // ⭐ VERIFY JWT — đây là phần thầy muốn thấy
    // Tương đương: jwt.verify(token, process.env.JWT_SECRET) trong Express
    const payload = await verifyJWT(token);

    if (!payload) {
      // Token invalid hoặc expired
      console.log(`[JWT Middleware] Invalid/expired token for: ${pathname}`);
      return redirectToAuth(request, pathname);
    }

    // Log payload để debug (giống console.log trong Express middleware)
    console.log('[JWT Middleware] ✅ Token verified:', {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      expiresAt: new Date(payload.exp! * 1000).toISOString(),
    });

    // Kiểm tra role admin
    if (pathname.startsWith('/admin')) {
      // role === 'authenticated' là user thường
      // Role admin được check thêm qua app_metadata từ Supabase
      // Decode để lấy app_metadata
      const rawDecoded = decodeJWT(token) as Record<string, unknown> | null;
      const isAdmin =
        rawDecoded?.app_metadata &&
        typeof rawDecoded.app_metadata === 'object' &&
        (rawDecoded.app_metadata as Record<string, unknown>).role === 'admin';

      if (!isAdmin) {
        console.log(`[JWT Middleware] ⛔ Not admin: ${payload.email}`);
        // Không phải admin → redirect về trang chủ
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
    }

    // ✅ Pass through — tương đương next() trong Express
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
