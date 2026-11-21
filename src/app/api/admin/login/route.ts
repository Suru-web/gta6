import { NextRequest, NextResponse } from 'next/server';

const ADMIN_USERNAME = 'suraj';
const ADMIN_PASSWORD = 'Suraj@123';
const AUTH_SECRET = 'gta6_admin_secret_token_99999';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const response = NextResponse.json({
        success: true,
        message: 'Admin authentication successful',
        token: AUTH_SECRET,
      });

      // Set cookie for session persistence
      response.cookies.set('admin_token', AUTH_SECRET, {
        httpOnly: false, // Accessible to client for instant UI check
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: 'lax',
      });

      return response;
    }

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
