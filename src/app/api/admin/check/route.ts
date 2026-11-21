import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const isAuth = verifyAdmin(request);
  return NextResponse.json({
    success: true,
    authenticated: isAuth,
  });
}
