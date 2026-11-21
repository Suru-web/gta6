import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import { isRedisConfigured, testRedisConnection, resolveRedisCredentials } from '@/lib/redis';
import { getDonations } from '@/lib/db';
import { getAnalyticsData } from '@/lib/analytics';

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { detectedKeys } = resolveRedisCredentials();
  const testRes = await testRedisConnection();
  const donations = await getDonations();
  const analytics = await getAnalyticsData();

  return NextResponse.json(
    {
      success: true,
      status: {
        isRedisConfigured: isRedisConfigured(),
        isRedisConnected: testRes.connected,
        redisError: testRes.error,
        latencyMs: testRes.latencyMs,
        detectedKeys,
        storageMode: testRes.connected ? 'cloud_redis' : 'ephemeral_serverless',
        donationsCount: donations.length,
        totalVisits: analytics.totalVisits || 0,
        uniqueVisitors: analytics.uniqueVisitorIds?.length || 0,
        environment: process.env.NODE_ENV,
        isVercel: process.env.VERCEL === '1',
        region: process.env.VERCEL_REGION || 'local',
      },
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
