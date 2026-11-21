import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsData, recordVisit } from '@/lib/analytics';

export async function GET() {
  try {
    const data = await getAnalyticsData();
    return NextResponse.json(
      { success: true, totalVisits: data.totalVisits },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store',
        },
      }
    );
  } catch (err) {
    console.error('GET /api/analytics error:', err);
    return NextResponse.json({ success: true, totalVisits: 0 });
  }
}

export async function POST(request: NextRequest) {
  try {
    let visitorId = '';
    try {
      const body = await request.json();
      if (typeof body?.visitorId === 'string') {
        visitorId = body.visitorId.slice(0, 50);
      }
    } catch {
      // Empty body is acceptable
    }

    const result = await recordVisit(visitorId);
    return NextResponse.json({ success: true, totalVisits: result.totalVisits });
  } catch (err) {
    console.error('POST /api/analytics error:', err);
    return NextResponse.json({ success: true, totalVisits: 0 });
  }
}
