/**
 * Bcrypt Utility — Mã hoá và kiểm tra mật khẩu
 *
 */

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hash mật khẩu trước khi lưu vào database
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hash = await bcrypt.hash(plainPassword, salt);
  return hash;
}

/**
 * So sánh mật khẩu người dùng nhập với hash trong database
 */
export async function comparePassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Tạo salt riêng lẻ
 */
export async function generateSalt(): Promise<string> {
  return bcrypt.genSalt(SALT_ROUNDS);
}
