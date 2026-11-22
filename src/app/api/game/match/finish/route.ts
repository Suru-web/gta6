import { NextRequest, NextResponse } from 'next/server';
import { validateAndConsumeToken, saveMatch } from '@/lib/game-db';
import { MatchRecord } from '@/types/game';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      matchToken,
      matchId,
      playerCharacterId,
      cpuCharacterId,
      arenaId,
      difficulty,
      playerWon,
      roundsWonPlayer,
      roundsWonCpu,
      durationSeconds,
      damageDealtPlayer,
      damageDealtCpu,
      maxCombo,
    } = body;

    if (!matchToken || !matchId || !playerCharacterId || !cpuCharacterId) {
      return NextResponse.json(
        { success: false, error: 'Missing required match parameters.' },
        { status: 400 }
      );
    }

    // Integrity check: A match must have a winner who reached 2 rounds (best-of-three)
    const isCompleted = roundsWonPlayer === 2 || roundsWonCpu === 2;
    if (!isCompleted) {
      return NextResponse.json(
        { success: false, error: 'Match was not completed (best of 3 rounds required).' },
        { status: 400 }
      );
    }

    // Minimum sensible duration (a real best-of-3 takes at least 5 seconds of active combat)
    if (typeof durationSeconds !== 'number' || durationSeconds < 5) {
      return NextResponse.json(
        { success: false, error: 'Invalid match duration.' },
        { status: 400 }
      );
    }

    // Token validation and anti-replay
    const isValidToken = await validateAndConsumeToken(
      matchToken,
      matchId,
      playerCharacterId,
      cpuCharacterId
    );

    if (!isValidToken) {
      return NextResponse.json(
        { success: false, error: 'Invalid or already consumed match token.' },
        { status: 403 }
      );
    }

    const matchRecord: MatchRecord = {
      id: matchId,
      timestamp: Date.now(),
      playerCharacterId,
      cpuCharacterId,
      arenaId: arenaId || 'vice-city',
      difficulty: difficulty || 'normal',
      playerWon: Boolean(playerWon && roundsWonPlayer === 2),
      roundsWonPlayer: Number(roundsWonPlayer) || 0,
      roundsWonCpu: Number(roundsWonCpu) || 0,
      durationSeconds: Math.round(durationSeconds),
      damageDealtPlayer: Math.round(damageDealtPlayer || 0),
      damageDealtCpu: Math.round(damageDealtCpu || 0),
      maxCombo: Math.round(maxCombo || 1),
    };

    const saved = await saveMatch(matchRecord);
    if (!saved) {
      return NextResponse.json(
        { success: false, error: 'Duplicate match record detected.' },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      matchId: matchRecord.id,
      playerWon: matchRecord.playerWon,
    });
  } catch (error) {
    console.error('Match finish error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error saving match result.' },
      { status: 500 }
    );
  }
}
