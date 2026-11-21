import { NextResponse } from 'next/server';
import { getUpiConfig } from '@/lib/config-db';

export async function GET() {
  try {
    const config = await getUpiConfig();
    return NextResponse.json({
      success: true,
      config,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Config fetch error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch config' }, { status: 500 });
  }
}
