/**
 * Bcrypt Utility — Mã hoá và kiểm tra mật khẩu
 *
 * Tương đương Express.js:
 * ──────────────────────────────────────────────────────────
 *   const bcrypt = require('bcryptjs');
 *
 *   // Hash khi đăng ký
 *   const hash = await bcrypt.hash(password, 10);
 *
 *   // So sánh khi đăng nhập
 *   const isMatch = await bcrypt.compare(password, hash);
 * ──────────────────────────────────────────────────────────
 *
 * ⚠️  File này chỉ dùng trong API Routes (Node.js runtime)
 *     KHÔNG dùng trong middleware.ts (Edge runtime)
 */

import bcrypt from 'bcryptjs';

/** Số vòng salt — càng cao càng an toàn nhưng càng chậm */
const SALT_ROUNDS = 12;

/**
 * Hash mật khẩu trước khi lưu vào database
 *
 * Express.js tương đương:
 *   const hash = await bcrypt.hash(password, 10);
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hash = await bcrypt.hash(plainPassword, salt);
  return hash;
}

/**
 * So sánh mật khẩu người dùng nhập với hash trong database
 * Trả về true nếu khớp, false nếu không khớp
 *
 * Express.js tương đương:
 *   const isMatch = await bcrypt.compare(password, user.password);
 */
export async function comparePassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Tạo salt riêng lẻ (dùng khi cần kiểm soát thủ công)
 */
export async function generateSalt(): Promise<string> {
  return bcrypt.genSalt(SALT_ROUNDS);
}
