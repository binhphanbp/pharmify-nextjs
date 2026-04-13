/**
 * JWT Utility — Tương đương jsonwebtoken trong Express.js
 *
 * Express.js:                          Next.js (file này):
 * ─────────────────────────────────    ──────────────────────────────────
 * const jwt = require('jsonwebtoken')  import { jwtVerify } from 'jose'
 * jwt.verify(token, secret)        →   verifyJWT(token)
 * jwt.decode(token)                →   decodeJWT(token)
 *
 * ⚠️ File này chạy trong Edge Runtime (Vercel middleware)
 *    → KHÔNG dùng Buffer, fs, hoặc Node.js API
 *    → Dùng TextEncoder/atob thay thế
 */

import { jwtVerify, type JWTPayload } from 'jose';

export interface JWTUserPayload extends JWTPayload {
  sub: string;          // User ID
  email: string;        // Email
  role: string;         // 'authenticated' | 'anon' | 'service_role'
  aud: string;          // Audience
  exp: number;          // Expiration timestamp
  iat: number;          // Issued at timestamp
  iss: string;          // Issuer (https://xxx.supabase.co/auth/v1)
  session_id: string;   // Session ID
  is_anonymous: boolean;
}

/**
 * Verify JWT token — giống jwt.verify() trong Express.js
 *
 * Express.js:
 *   const decoded = jwt.verify(token, process.env.JWT_SECRET);
 *
 * Next.js (hàm này):
 *   const decoded = await verifyJWT(token);
 */
export async function verifyJWT(token: string): Promise<JWTUserPayload | null> {
  try {
    // Đọc secret tại thời điểm gọi hàm (KHÔNG phải top-level)
    // → Đảm bảo env variable đã sẵn sàng trên Vercel
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (!jwtSecret) {
      console.error('[JWT] SUPABASE_JWT_SECRET is not set');
      return null;
    }

    // jose yêu cầu secret dạng Uint8Array (raw bytes)
    const secret = new TextEncoder().encode(jwtSecret);

    const { payload } = await jwtVerify(token, secret, {
      // Tương tự options trong jwt.verify()
      algorithms: ['HS256'],
    });

    return payload as JWTUserPayload;
  } catch (err) {
    // Token invalid, expired, hoặc sai secret
    console.error('[JWT] Verification failed:', err);
    return null;
  }
}

/**
 * Decode JWT mà KHÔNG verify (chỉ để đọc payload)
 * Tương tự jwt.decode() trong Express.js
 *
 * ⚠️ KHÔNG dùng để xác thực, chỉ để debug/đọc thông tin
 * ⚠️ Dùng atob() thay vì Buffer.from() để tương thích Edge Runtime
 */
export function decodeJWT(token: string): JWTUserPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decode base64url → base64 → string (Edge-compatible)
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonStr);
    return payload as JWTUserPayload;
  } catch {
    return null;
  }
}

/**
 * Lấy JWT token từ cookie của Supabase
 * Supabase lưu token trong cookie có dạng: sb-<project-ref>-auth-token
 */
export function extractTokenFromCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  // Parse cookie string
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach((cookie) => {
    const [key, ...val] = cookie.trim().split('=');
    if (key) cookies[key.trim()] = val.join('=');
  });

  // Tìm cookie auth của Supabase (dạng JSON base64)
  const authCookieKey = Object.keys(cookies).find(
    (key) => key.startsWith('sb-') && key.endsWith('-auth-token')
  );

  if (!authCookieKey) return null;

  try {
    const cookieValue = decodeURIComponent(cookies[authCookieKey]);
    const parsed = JSON.parse(cookieValue);
    return parsed.access_token ?? null;
  } catch {
    return null;
  }
}
