import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
  safeCompare,
  createSessionToken,
  checkRateLimit,
  recordFailedAttempt,
  clearFailedAttempts,
} from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Determine client IP for rate limiting
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown-ip';

    // Check brute force rate limit
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many failed login attempts. Locked out for ${rateCheck.waitSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { username, password } = body;

    const isUserValid = safeCompare(username || '', ADMIN_USERNAME);
    const isPassValid = safeCompare(password || '', ADMIN_PASSWORD);

    if (isUserValid && isPassValid) {
      clearFailedAttempts(ip);

      const token = createSessionToken(ADMIN_USERNAME);
      const isProduction = process.env.NODE_ENV === 'production';

      const response = NextResponse.json({
        success: true,
        message: 'Admin authentication successful',
      });

      // Set hardened httpOnly cookie
      response.cookies.set('admin_token', token, {
        httpOnly: true,
        secure: isProduction,
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: 'lax',
      });

      return response;
    }

    // Record failure
    recordFailedAttempt(ip);

    return NextResponse.json(
      { success: false, error: 'Invalid username or password' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
