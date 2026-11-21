import { NextResponse } from 'next/server';
import { getDetailedAnalytics } from '@/lib/analytics';

export async function GET() {
  try {
    const analytics = await getDetailedAnalytics();
    return NextResponse.json(
      {
        success: true,
        analytics,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (err) {
    console.error('GET /api/admin/analytics error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch admin analytics' },
      { status: 500 }
    );
  }
}
