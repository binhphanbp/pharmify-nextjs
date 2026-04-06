/**
 * JWT Utility — Tương đương jsonwebtoken trong Express.js
 *
 * Express.js:                          Next.js (file này):
 * ─────────────────────────────────    ──────────────────────────────────
 * const jwt = require('jsonwebtoken')  import { jwtVerify } from 'jose'
 * jwt.verify(token, secret)        →   verifyJWT(token)
 * jwt.decode(token)                →   decodeJWT(token)
 */

import { jwtVerify, type JWTPayload } from 'jose';

// Supabase JWT secret — lấy từ Supabase Dashboard > Settings > API > JWT Secret
// Tương tự: process.env.JWT_SECRET trong Express.js
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET!;

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
    // jose yêu cầu secret dạng Uint8Array (raw bytes)
    const secret = new TextEncoder().encode(SUPABASE_JWT_SECRET);

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
 */
export function decodeJWT(token: string): JWTUserPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decode phần payload (phần giữa)
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf-8')
    );
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
