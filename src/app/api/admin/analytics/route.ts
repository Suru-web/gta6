import { NextRequest, NextResponse } from 'next/server';
import { getDetailedAnalytics } from '@/lib/analytics';
import { verifyAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

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
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest?.startsWith('NEXT_')) {
      throw err;
    }
    console.error('GET /api/admin/analytics error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch admin analytics' },
      { status: 500 }
    );
  }
}
