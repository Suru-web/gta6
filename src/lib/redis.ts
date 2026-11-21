import { Redis } from '@upstash/redis';

let redisClient: Redis | null = null;

/**
 * Dynamically resolves Upstash Redis URL and Token from process.env at runtime.
 * Explicitly rejects read-only tokens and prioritizes read-write credentials.
 */
export function resolveRedisCredentials(): { url?: string; token?: string; detectedKeys: string[] } {
  const detectedKeys: string[] = [];
  const env = process.env;

  // 1. Direct standard names (including Vercel STORAGE_ prefix)
  let url =
    env.UPSTASH_REDIS_REST_URL ||
    env.STORAGE_KV_REST_API_URL ||
    env.KV_REST_API_URL ||
    env.STORAGE_UPSTASH_REDIS_REST_URL ||
    env.REDIS_REST_API_URL ||
    env.UPSTASH_URL ||
    env.KV_URL;

  // Prioritize Read-Write token (NEVER pick read-only tokens)
  let token =
    env.UPSTASH_REDIS_REST_TOKEN ||
    env.STORAGE_KV_REST_API_TOKEN ||
    env.KV_REST_API_TOKEN ||
    env.STORAGE_UPSTASH_REDIS_REST_TOKEN ||
    env.REDIS_REST_API_TOKEN ||
    env.UPSTASH_TOKEN ||
    env.KV_TOKEN;

  // Track direct keys if present
  if (env.UPSTASH_REDIS_REST_URL) detectedKeys.push('UPSTASH_REDIS_REST_URL');
  else if (env.STORAGE_KV_REST_API_URL) detectedKeys.push('STORAGE_KV_REST_API_URL');
  else if (env.KV_REST_API_URL) detectedKeys.push('KV_REST_API_URL');

  if (env.UPSTASH_REDIS_REST_TOKEN) detectedKeys.push('UPSTASH_REDIS_REST_TOKEN');
  else if (env.STORAGE_KV_REST_API_TOKEN) detectedKeys.push('STORAGE_KV_REST_API_TOKEN');
  else if (env.KV_REST_API_TOKEN) detectedKeys.push('KV_REST_API_TOKEN');

  // 2. If not found via standard names, scan all process.env keys
  if (!url || !token) {
    for (const [key, val] of Object.entries(env)) {
      if (!val || typeof val !== 'string') continue;
      const upperKey = key.toUpperCase();

      // STRICTLY IGNORE any Read-Only tokens
      if (upperKey.includes('READ_ONLY') || upperKey.includes('READONLY')) {
        continue;
      }

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

      // Look for Read-Write Token
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

export async function testRedisConnection(): Promise<{
  connected: boolean;
  canWrite?: boolean;
  error?: string;
  latencyMs?: number;
}> {
  const client = getRedisClient();
  if (!client) {
    return { connected: false, error: 'No Redis credentials found in process.env' };
  }

  const start = Date.now();
  try {
    const pingRes = await client.ping();
    const latencyMs = Date.now() - start;

    if (pingRes !== 'PONG' && !pingRes) {
      return { connected: false, error: 'Ping failed' };
    }

    // Verify read-write capabilities
    try {
      await client.set('gta6_health_ping', Date.now());
      return { connected: true, canWrite: true, latencyMs };
    } catch (writeErr: unknown) {
      const msg = writeErr instanceof Error ? writeErr.message : String(writeErr);
      return { connected: false, canWrite: false, latencyMs, error: `Write failed (Read-Only Token?): ${msg}` };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('Redis test ping failed:', msg);
    return { connected: false, error: msg };
  }
}
