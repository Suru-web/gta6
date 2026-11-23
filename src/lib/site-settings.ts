import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { getRedisClient } from './redis';

export interface SiteSettings {
  sideQuestVisible: boolean;
}

const KEY = 'gta6_site_settings';
// Keep the existing site unchanged until the admin chooses otherwise.
const DEFAULT_SETTINGS: SiteSettings = { sideQuestVisible: true };
const isServerless = () => process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;
const filePath = () => path.join(process.cwd(), 'data', 'site_settings.json');

function validateSettings(value: unknown): SiteSettings {
  if (typeof value !== 'object' || value === null || typeof (value as SiteSettings).sideQuestVisible !== 'boolean') {
    throw new Error('Invalid site settings');
  }
  return { sideQuestVisible: (value as SiteSettings).sideQuestVisible };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const redis = getRedisClient();
  if (redis) {
    const value = await redis.get<unknown>(KEY);
    return value == null ? { ...DEFAULT_SETTINGS } : validateSettings(typeof value === 'string' ? JSON.parse(value) : value);
  }
  if (isServerless()) return { ...DEFAULT_SETTINGS };
  try {
    return validateSettings(JSON.parse(await fs.readFile(filePath(), 'utf8')));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { ...DEFAULT_SETTINGS };
    throw error;
  }
}

export async function saveSiteSettings(settings: SiteSettings): Promise<SiteSettings> {
  const validated = validateSettings(settings);
  const redis = getRedisClient();
  if (redis) {
    await redis.set(KEY, validated);
  } else {
    // Serverless files are not shared across instances or durable.
    if (isServerless()) throw new Error('Shared storage is required to change site visibility.');
    const destination = filePath();
    await fs.mkdir(path.dirname(destination), { recursive: true });
    const temporary = `${destination}.${process.pid}.${randomUUID()}.tmp`;
    try {
      await fs.writeFile(temporary, JSON.stringify(validated, null, 2), 'utf8');
      await fs.rename(temporary, destination);
    } catch (error) {
      await fs.rm(temporary, { force: true }).catch(() => {});
      throw error;
    }
  }
  return validated;
}
