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
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Config fetch error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch config' }, { status: 500 });
  }
}
