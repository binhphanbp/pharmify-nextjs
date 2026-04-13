/**
 * API Route: GET /api/auth/token-info
 *──────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, decodeJWT, extractTokenFromCookies } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  // Lấy JWT từ cookie
  const cookieHeader = request.headers.get('cookie');
  const token = extractTokenFromCookies(cookieHeader);

  if (!token) {
    return NextResponse.json(
      {
        authenticated: false,
        message: 'No JWT token found. Please login first.',

        hint: 'Token is stored in HTTP-only cookie by Supabase',
      },
      { status: 401 },
    );
  }

  const payload = await verifyJWT(token);

  if (!payload) {
    return NextResponse.json(
      {
        authenticated: false,
        message: 'JWT verification failed. Token is invalid or expired.',
      },
      { status: 401 },
    );
  }

  // Decode để lấy full payload (không verify lại)
  const rawPayload = decodeJWT(token) as Record<string, unknown> | null;

  return NextResponse.json({
    authenticated: true,
    message: '✅ JWT verified successfully (manual verification using jose)',

    // Thông tin token
    token_info: {
      raw_token: token,
      algorithm: 'HS256',
      token_type: 'Bearer',
    },

    // Payload đã decode — đây là nội dung bên trong JWT
    jwt_payload: {
      user_id: payload.sub,
      email: payload.email,
      role: payload.role,
      issued_at: new Date(payload.iat! * 1000).toISOString(),
      expires_at: new Date(payload.exp! * 1000).toISOString(),
      issuer: payload.iss,
      audience: payload.aud,
    },

    raw_decoded_payload: rawPayload,

    comparison_with_express: {
      express: 'jwt.verify(token, process.env.JWT_SECRET)',
      nextjs: 'await verifyJWT(token) // using jose library',
      token_location_express: 'Authorization: Bearer <token> (HTTP Header)',
      token_location_nextjs: 'sb-<project>-auth-token (HTTP Cookie)',
    },
  });
}
