import { NextRequest, NextResponse } from 'next/server';
import { generateMatchToken } from '@/lib/game-db';
import { getCharacterById } from '@/config/roster';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerCharacterId, cpuCharacterId, arenaId, difficulty } = body;

    if (!playerCharacterId || !cpuCharacterId) {
      return NextResponse.json(
        { success: false, error: 'Player and CPU character IDs are required.' },
        { status: 400 }
      );
    }

    const playerChar = getCharacterById(playerCharacterId);
    const cpuChar = getCharacterById(cpuCharacterId);

    if (!playerChar || !cpuChar) {
      return NextResponse.json(
        { success: false, error: 'Invalid character selected.' },
        { status: 400 }
      );
    }

    const tokenData = generateMatchToken(playerCharacterId, cpuCharacterId);

    return NextResponse.json({
      success: true,
      matchId: tokenData.matchId,
      matchToken: tokenData.matchToken,
      timestamp: tokenData.timestamp,
    });
  } catch (error) {
    console.error('Match start error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error starting match.' },
      { status: 500 }
    );
  }
}
