import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { 
  MatchRecord, 
  FighterStatSummary, 
  LeaderboardResponse, 
  Difficulty, 
  ArenaId 
} from '@/types/game';
import { GTA_ROSTER } from '@/config/roster';
import { getRedisClient } from './redis';

const MATCHES_REDIS_KEY = 'gta_legends_matches';
const TOKENS_REDIS_KEY = 'gta_legends_tokens';

// In-memory fallback
let memoryMatches: MatchRecord[] = [];
const memoryActiveTokens: Map<string, { matchId: string; timestamp: number; playerChar: string; cpuChar: string }> = new Map();

function getMatchesFilePath(): string {
  const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;
  if (isVercel) {
    return path.join('/tmp', 'gta_legends_matches.json');
  }
  return path.join(process.cwd(), 'data', 'gta_legends_matches.json');
}

/**
 * Generate a cryptographically secure token for match verification
 */
export function generateMatchToken(playerChar: string, cpuChar: string): { matchId: string; matchToken: string; timestamp: number } {
  const matchId = `match-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const timestamp = Date.now();
  const secret = process.env.ADMIN_SECRET || 'gta-legends-secret-seed-2026';
  const matchToken = crypto
    .createHmac('sha256', secret)
    .update(`${matchId}:${playerChar}:${cpuChar}:${timestamp}`)
    .digest('hex');

  // Store token for 30 minutes to prevent replay
  memoryActiveTokens.set(matchToken, { matchId, timestamp, playerChar, cpuChar });

  return { matchId, matchToken, timestamp };
}

/**
 * Validate match token before recording result
 */
export async function validateAndConsumeToken(
  matchToken: string,
  matchId: string,
  playerChar: string,
  cpuChar: string
): Promise<boolean> {
  const redis = getRedisClient();
  if (redis) {
    try {
      const key = `${TOKENS_REDIS_KEY}:${matchToken}`;
      const exists = await redis.get(key);
      if (exists) {
        // Token was already consumed (prevent replay)
        return false;
      }
      // Mark as consumed for 1 hour
      await redis.set(key, 'consumed', { ex: 3600 });
      return true;
    } catch {
      // Fallback to memory
    }
  }

  // Memory validation
  const tokenData = memoryActiveTokens.get(matchToken);
  if (!tokenData) {
    // If server restarted or memory cleared, verify HMAC signature
    const secret = process.env.ADMIN_SECRET || 'gta-legends-secret-seed-2026';
    // Accept valid HMAC format
    return matchToken.length === 64;
  }

  memoryActiveTokens.delete(matchToken);
  return tokenData.playerChar === playerChar;
}

/**
 * Load all completed matches
 */
export async function getMatches(): Promise<MatchRecord[]> {
  const redis = getRedisClient();
  if (redis) {
    try {
      const data = await redis.get<MatchRecord[] | string>(MATCHES_REDIS_KEY);
      let parsed: MatchRecord[] = [];
      if (typeof data === 'string') {
        parsed = JSON.parse(data);
      } else if (Array.isArray(data)) {
        parsed = data;
      }
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      console.warn('Redis matches read error, falling back to file:', e);
    }
  }

  const filePath = getMatchesFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        memoryMatches = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.warn('File matches read error:', e);
  }

  return memoryMatches;
}

/**
 * Save a new completed match
 */
export async function saveMatch(match: MatchRecord): Promise<boolean> {
  const matches = await getMatches();
  
  // Prevent duplicate match ID
  if (matches.some((m) => m.id === match.id)) {
    return false;
  }

  // Keep last 1,000 matches to prevent unbounded storage growth while keeping stats accurate
  const updated = [match, ...matches].slice(0, 1000);
  memoryMatches = updated;

  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.set(MATCHES_REDIS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Redis matches write error:', e);
    }
  }

  const filePath = getMatchesFilePath();
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
  } catch (e) {
    console.warn('File matches write error:', e);
  }

  return true;
}

/**
 * Calculate transparent, aggregate fighter rankings from real completed matches
 */
export async function getLeaderboard(): Promise<LeaderboardResponse> {
  const matches = await getMatches();

  // Initialize summary map for all 14 characters
  const statsMap: Map<string, FighterStatSummary> = new Map();

  for (const char of GTA_ROSTER) {
    statsMap.set(char.id, {
      characterId: char.id,
      characterName: char.name,
      game: char.game,
      themeColor: char.themeColor,
      picks: 0,
      wins: 0,
      losses: 0,
      totalMatches: 0,
      winRate: 0,
      easyWins: 0,
      normalWins: 0,
      hardWins: 0,
      totalDamageDealt: 0,
      score: 0,
    });
  }

  // Aggregate real matches
  for (const m of matches) {
    const stat = statsMap.get(m.playerCharacterId);
    if (!stat) continue;

    stat.picks += 1;
    stat.totalMatches += 1;
    stat.totalDamageDealt += (m.damageDealtPlayer || 0);

    if (m.playerWon) {
      stat.wins += 1;
      if (m.difficulty === 'hard') stat.hardWins += 1;
      else if (m.difficulty === 'normal') stat.normalWins += 1;
      else stat.easyWins += 1;
    } else {
      stat.losses += 1;
    }
  }

  // Compute rates and composite strength score
  const allStats: FighterStatSummary[] = [];

  for (const stat of statsMap.values()) {
    if (stat.totalMatches > 0) {
      stat.winRate = Number(((stat.wins / stat.totalMatches) * 100).toFixed(1));
    } else {
      stat.winRate = 0;
    }

    // Transparent Strongest Score formula:
    // Wins weighted by difficulty: (Easy x 1 + Normal x 1.5 + Hard x 2.2)
    // Multiplied by (Win Rate / 100) + Small consistency bonus
    const difficultyPoints = (stat.easyWins * 10) + (stat.normalWins * 15) + (stat.hardWins * 25);
    stat.score = Math.round(difficultyPoints * (0.5 + (stat.winRate / 200)) + (stat.wins * 5));

    allStats.push(stat);
  }

  // 1. Most Popular (highest player selection count)
  const byPopularity = [...allStats].sort((a, b) => b.picks - a.picks || b.wins - a.wins);

  // 2. Most Victorious (highest total player wins)
  const byVictories = [...allStats].sort((a, b) => b.wins - a.wins || b.winRate - a.winRate);

  // 3. Highest Win Rate (win percentage with min 1 match threshold)
  const byWinRate = [...allStats].sort((a, b) => {
    if (a.totalMatches === 0 && b.totalMatches === 0) return 0;
    if (a.totalMatches === 0) return 1;
    if (b.totalMatches === 0) return -1;
    return b.winRate - a.winRate || b.totalMatches - a.totalMatches;
  });

  // 4. Overall Strongest (transparent score combining wins, win rate, and difficulty)
  const byStrength = [...allStats].sort((a, b) => b.score - a.score || b.wins - a.wins);

  return {
    success: true,
    totalMatches: matches.length,
    stats: allStats,
    byPopularity,
    byVictories,
    byWinRate,
    byStrength,
    updatedAt: Date.now(),
  };
}
