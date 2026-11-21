import { Redis } from '@upstash/redis';

let redisClient: Redis | null = null;

/**
 * Dynamically resolves Upstash Redis URL and Token from process.env at runtime.
 * Handles any environment variable naming convention created by Vercel / Upstash.
 */
export function resolveRedisCredentials(): { url?: string; token?: string; detectedKeys: string[] } {
  const detectedKeys: string[] = [];
  const env = process.env;

  // 1. Direct standard names
  let url =
    env.UPSTASH_REDIS_REST_URL ||
    env.KV_REST_API_URL ||
    env.REDIS_REST_API_URL ||
    env.UPSTASH_URL ||
    env.KV_URL;

  let token =
    env.UPSTASH_REDIS_REST_TOKEN ||
    env.KV_REST_API_TOKEN ||
    env.REDIS_REST_API_TOKEN ||
    env.UPSTASH_TOKEN ||
    env.KV_TOKEN;

  if (env.UPSTASH_REDIS_REST_URL) detectedKeys.push('UPSTASH_REDIS_REST_URL');
  if (env.KV_REST_API_URL) detectedKeys.push('KV_REST_API_URL');
  if (env.UPSTASH_REDIS_REST_TOKEN) detectedKeys.push('UPSTASH_REDIS_REST_TOKEN');
  if (env.KV_REST_API_TOKEN) detectedKeys.push('KV_REST_API_TOKEN');

  // 2. If not found, scan all process.env keys for any Upstash / KV variables
  if (!url || !token) {
    for (const [key, val] of Object.entries(env)) {
      if (!val || typeof val !== 'string') continue;
      const upperKey = key.toUpperCase();

      // Look for Upstash REST URL
      if (!url) {
        if (
          (upperKey.includes('UPSTASH') || upperKey.includes('REDIS') || upperKey.includes('KV')) &&
          (upperKey.includes('URL') || upperKey.includes('REST')) &&
          val.startsWith('https://')
        ) {
          url = val;
          detectedKeys.push(key);
        } else if (val.includes('.upstash.io') && val.startsWith('https://')) {
          url = val;
          detectedKeys.push(key);
        }
      }

      // Look for Token
      if (!token) {
        if (
          (upperKey.includes('UPSTASH') || upperKey.includes('REDIS') || upperKey.includes('KV')) &&
          upperKey.includes('TOKEN') &&
          val.length > 20 &&
          !val.startsWith('http')
        ) {
          token = val;
          detectedKeys.push(key);
        }
      }
    }
  }

  return { url: url?.trim(), token: token?.trim(), detectedKeys };
}

export function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  const { url, token, detectedKeys } = resolveRedisCredentials();

  if (url && token) {
    try {
      redisClient = new Redis({
        url,
        token,
      });
      console.log('✅ Connected to Upstash Redis using keys:', detectedKeys.join(', '));
      return redisClient;
    } catch (err) {
      console.warn('⚠️ Failed to initialize Upstash Redis client:', err);
      redisClient = null;
    }
  }

  return null;
}

export function isRedisConfigured(): boolean {
  const { url, token } = resolveRedisCredentials();
  return Boolean(url && token);
}

export async function testRedisConnection(): Promise<{ connected: boolean; error?: string; latencyMs?: number }> {
  const client = getRedisClient();
  if (!client) {
    return { connected: false, error: 'No Redis credentials found in process.env' };
  }

  const start = Date.now();
  try {
    const pingRes = await client.ping();
    const latencyMs = Date.now() - start;
    const ok = pingRes === 'PONG' || !!pingRes;
    return { connected: ok, latencyMs };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('Redis test ping failed:', msg);
    return { connected: false, error: msg };
  }
}
