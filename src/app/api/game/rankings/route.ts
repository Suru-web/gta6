import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/game-db';

export async function GET() {
  try {
    const leaderboard = await getLeaderboard();
    return NextResponse.json(leaderboard, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load rankings.' },
      { status: 500 }
    );
  }
}
