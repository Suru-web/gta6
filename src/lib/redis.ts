import { Redis } from '@upstash/redis';

// Support all standard Upstash and Vercel KV environment variables
const redisUrl =
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.KV_REST_API_URL ||
  process.env.REDIS_REST_API_URL ||
  process.env.UPSTASH_URL ||
  process.env.KV_URL;

const redisToken =
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.KV_REST_API_TOKEN ||
  process.env.REDIS_REST_API_TOKEN ||
  process.env.UPSTASH_TOKEN ||
  process.env.KV_TOKEN;

let redisClient: Redis | null = null;
let initAttempted = false;

export function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;
  if (initAttempted) return null;

  initAttempted = true;

  if (redisUrl && redisToken) {
    try {
      redisClient = new Redis({
        url: redisUrl.trim(),
        token: redisToken.trim(),
      });
      console.log('✅ Upstash Redis initialized successfully with URL:', redisUrl.split('@')[0].slice(0, 20) + '...');
    } catch (err) {
      console.warn('⚠️ Upstash Redis failed to initialize:', err);
      redisClient = null;
    }
  }

  return redisClient;
}

export function isRedisConfigured(): boolean {
  return Boolean(redisUrl && redisToken);
}

export async function testRedisConnection(): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;
  try {
    const pingRes = await client.ping();
    return pingRes === 'PONG' || !!pingRes;
  } catch (err) {
    console.warn('Redis ping check failed:', err);
    return false;
  }
}
