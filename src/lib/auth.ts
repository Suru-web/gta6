import crypto from 'crypto';
import { NextRequest } from 'next/server';

export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'suraj';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Suraj@123';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'gta6_vice_city_secret_key_ultra_secure_2026';

// Rate limiting against brute force
interface FailedAttempt {
  count: number;
  lockedUntil: number;
}
const failedAttempts = new Map<string, FailedAttempt>();

export function checkRateLimit(ip: string): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  const attempt = failedAttempts.get(ip);
  if (!attempt) return { allowed: true };

  if (attempt.lockedUntil > now) {
    const waitSeconds = Math.ceil((attempt.lockedUntil - now) / 1000);
    return { allowed: false, waitSeconds };
  }

  if (attempt.lockedUntil > 0 && attempt.lockedUntil <= now) {
    failedAttempts.delete(ip);
  }

  return { allowed: true };
}

export function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const attempt = failedAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  attempt.count += 1;

  if (attempt.count >= 5) {
    // Lock out for 15 minutes after 5 failed attempts
    attempt.lockedUntil = now + 15 * 60 * 1000;
  }
  failedAttempts.set(ip, attempt);
}

export function clearFailedAttempts(ip: string) {
  failedAttempts.delete(ip);
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Sign a cryptographic session token: base64(payload).signature
 */
export function createSessionToken(username: string): string {
  const payload = JSON.stringify({
    user: username,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    nonce: crypto.randomBytes(16).toString('hex'),
  });

  const payloadB64 = Buffer.from(payload).toString('base64url');
  const signature = crypto
    .createHmac('sha256', ADMIN_SECRET)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Verify cryptographic session token
 */
export function verifySessionToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payloadB64, signature] = parts;

  const expectedSignature = crypto
    .createHmac('sha256', ADMIN_SECRET)
    .update(payloadB64)
    .digest('base64url');

  try {
    const sigA = Buffer.from(signature);
    const sigB = Buffer.from(expectedSignature);
    if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
      return false;
    }

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    if (!payload.exp || Date.now() > payload.exp) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Verify admin authorization from NextRequest (via httpOnly cookie or Bearer header)
 */
export function verifyAdmin(request: NextRequest): boolean {
  const cookieToken = request.cookies.get('admin_token')?.value;
  if (cookieToken && verifySessionToken(cookieToken)) {
    return true;
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (verifySessionToken(token)) {
      return true;
    }
  }

  return false;
}
