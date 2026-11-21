import fs from 'fs';
import path from 'path';
import { UpiConfig } from '@/types/donation';
import { SITE_CONFIG } from '@/config/site';
import { getRedisClient } from './redis';

const REDIS_CONFIG_KEY = 'gta6_upi_config';

const defaultConfig: UpiConfig = {
  upiId: SITE_CONFIG.defaultUpiId,
  payeeName: SITE_CONFIG.defaultPayeeName,
  note: SITE_CONFIG.defaultNote,
};

let memoryConfig: UpiConfig = { ...defaultConfig };

function getConfigFilePath(): string {
  const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;
  if (isVercel) {
    return path.join('/tmp', 'gta6_upi_config.json');
  }
  return path.join(process.cwd(), 'data', 'upi_config.json');
}

export async function getUpiConfig(): Promise<UpiConfig> {
  // 1. Try Redis
  const redis = getRedisClient();
  if (redis) {
    try {
      const data = await redis.get<UpiConfig>(REDIS_CONFIG_KEY);
      if (data && data.upiId) {
        return data;
      }
    } catch (err) {
      console.warn('Redis config read error:', err);
    }
  }

  // 2. Try file system
  const filePath = getConfigFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && parsed.upiId) {
        memoryConfig = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Config file read error:', err);
  }

  return memoryConfig;
}

export async function saveUpiConfig(newConfig: UpiConfig): Promise<UpiConfig> {
  memoryConfig = { ...newConfig };

  // 1. Persist to Redis
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.set(REDIS_CONFIG_KEY, newConfig);
    } catch (err) {
      console.warn('Redis config write error:', err);
    }
  }

  // 2. Persist to file
  const filePath = getConfigFilePath();
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(newConfig, null, 2), 'utf-8');
  } catch (err) {
    console.warn('File write error (likely read-only on Vercel):', err);
  }

  return memoryConfig;
}
