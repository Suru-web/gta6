import fs from 'fs';
import path from 'path';
import { getDonations } from './db';
import { Redis } from '@upstash/redis';

const REDIS_ANALYTICS_KEY = 'gta6_analytics';

// Upstash Redis client
let redisClient: Redis | null = null;
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

if (redisUrl && redisToken) {
  try {
    redisClient = new Redis({
      url: redisUrl,
      token: redisToken,
    });
  } catch (err) {
    console.warn('Analytics: Redis not available, using file/memory:', err);
  }
}

export interface AnalyticsRecord {
  totalVisits: number;
  uniqueVisitorIds: string[];
  lastVisited: number;
  dailyVisits: Record<string, number>;
}

const defaultAnalytics: AnalyticsRecord = {
  totalVisits: 0,
  uniqueVisitorIds: [],
  lastVisited: 0,
  dailyVisits: {},
};

let memoryAnalytics: AnalyticsRecord = { ...defaultAnalytics };

function getAnalyticsFilePath(): string {
  const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;
  if (isVercel) {
    return path.join('/tmp', 'gta6_analytics.json');
  }
  return path.join(process.cwd(), 'data', 'analytics.json');
}

export async function getAnalyticsData(): Promise<AnalyticsRecord> {
  // 1. Try Redis
  if (redisClient) {
    try {
      const data = await redisClient.get<AnalyticsRecord>(REDIS_ANALYTICS_KEY);
      if (data && typeof data.totalVisits === 'number') {
        memoryAnalytics = data;
        return data;
      }
    } catch (e) {
      console.warn('Redis analytics read error:', e);
    }
  }

  // 2. Try file system
  const filePath = getAnalyticsFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed.totalVisits === 'number') {
        memoryAnalytics = parsed;
        return parsed;
      }
    } else {
      try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, JSON.stringify(defaultAnalytics, null, 2), 'utf-8');
      } catch {
        // ignore
      }
    }
  } catch (err) {
    console.warn('File read error for analytics:', err);
  }

  return memoryAnalytics;
}

export async function recordVisit(visitorId?: string): Promise<{ totalVisits: number }> {
  const current = await getAnalyticsData();
  const today = new Date().toISOString().split('T')[0];

  const vid = visitorId || `anon-${Math.random().toString(36).substring(2, 9)}`;
  const uniqueSet = new Set(current.uniqueVisitorIds || []);
  uniqueSet.add(vid);

  const updated: AnalyticsRecord = {
    totalVisits: (current.totalVisits || 0) + 1,
    uniqueVisitorIds: Array.from(uniqueSet).slice(-2000), // keep last 2000 unique IDs to prevent runaway size
    lastVisited: Date.now(),
    dailyVisits: {
      ...(current.dailyVisits || {}),
      [today]: ((current.dailyVisits || {})[today] || 0) + 1,
    },
  };

  memoryAnalytics = updated;

  // Persist to Redis
  if (redisClient) {
    try {
      await redisClient.set(REDIS_ANALYTICS_KEY, updated);
    } catch (err) {
      console.warn('Redis analytics write error:', err);
    }
  }

  // Persist to file
  const filePath = getAnalyticsFilePath();
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.warn('File write error for analytics:', err);
  }

  return { totalVisits: updated.totalVisits };
}

export async function getDetailedAnalytics() {
  const analytics = await getAnalyticsData();
  const donations = await getDonations();

  const totalRaised = donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const totalDonors = donations.length;
  const uniqueVisitorsCount = analytics.uniqueVisitorIds ? analytics.uniqueVisitorIds.length : 0;

  const conversionRate = uniqueVisitorsCount > 0
    ? Number(((totalDonors / uniqueVisitorsCount) * 100).toFixed(2))
    : 0;

  const avgDonation = totalDonors > 0 ? Math.round(totalRaised / totalDonors) : 0;
  const highestDonation = donations.length > 0
    ? Math.max(...donations.map((d) => Number(d.amount) || 0))
    : 0;

  // Tier breakdown:
  const tiers: Record<string, { count: number; total: number; label: string }> = {
    '1': { count: 0, total: 0, label: '₹1 Honest Work' },
    '10': { count: 0, total: 0, label: '₹10 Chai Sacrifice' },
    '25': { count: 0, total: 0, label: '₹25 Samosa Patron' },
    '50': { count: 0, total: 0, label: '₹50 Homie For Life' },
    '69': { count: 0, total: 0, label: '₹69 The Nice Tier' },
    '100': { count: 0, total: 0, label: '₹100 Gigachad' },
    'custom': { count: 0, total: 0, label: '₹100+ Custom Whales' },
  };

  donations.forEach((d) => {
    const amt = Number(d.amount) || 0;
    const key = amt.toString();
    if (tiers[key]) {
      tiers[key].count += 1;
      tiers[key].total += amt;
    } else {
      tiers['custom'].count += 1;
      tiers['custom'].total += amt;
    }
  });

  return {
    totalVisits: analytics.totalVisits,
    uniqueVisitors: uniqueVisitorsCount,
    totalPaidDonors: totalDonors,
    totalRaised,
    conversionRate,
    avgDonation,
    highestDonation,
    dailyVisits: analytics.dailyVisits || {},
    tierBreakdown: tiers,
    lastVisited: analytics.lastVisited,
  };
}
