import fs from 'fs';
import path from 'path';
import { Donation, SiteStats } from '@/types/donation';
import { SITE_CONFIG } from '@/config/site';
import seedDonations from '@/data/seed-donations.json';
import { Redis } from '@upstash/redis';

const REDIS_KEY = 'gta6_donations';

// Initialize Upstash Redis client if credentials exist
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
    console.warn('Failed to initialize Redis client, falling back to local/tmp store:', err);
  }
}

// In-memory fallback store
let memoryDonations: Donation[] = [...(seedDonations as Donation[])];

// Determine writable file path (local development vs Vercel /tmp)
function getFilePath(): string {
  const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;
  if (isVercel) {
    return path.join('/tmp', 'gta6_donations.json');
  }
  return path.join(process.cwd(), 'data', 'donations.json');
}

/**
 * Get all donations from storage (Redis -> Local/Tmp file -> In-memory)
 */
export async function getDonations(): Promise<Donation[]> {
  // 1. Try Redis if configured
  if (redisClient) {
    try {
      const data = await redisClient.get<Donation[]>(REDIS_KEY);
      if (data && Array.isArray(data)) {
        return data;
      }
      return [];
    } catch (error) {
      console.warn('Redis read error, falling back to file/memory:', error);
    }
  }

  // 2. Try file system
  const filePath = getFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        memoryDonations = parsed;
        return parsed;
      }
    } else {
      try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf-8');
      } catch {
        // Ignore write error on read-only environments
      }
    }
  } catch (error) {
    console.warn('File read error, falling back to memory:', error);
  }

  // 3. Fallback to memory
  return memoryDonations;
}

/**
 * Add a new donation to storage
 */
export async function addDonation(donation: Omit<Donation, 'id' | 'timestamp'>): Promise<Donation> {
  const newDonation: Donation = {
    id: `don-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: donation.name?.trim() || 'Anonymous Legend',
    amount: Math.max(1, Number(donation.amount) || 1),
    message: donation.message?.trim() || 'Respect +1 for the GTA 6 fund! 🎮',
    badge: donation.badge || '👑 Gigachad',
    timestamp: Date.now(),
  };

  const current = await getDonations();
  const updated = [newDonation, ...current];
  memoryDonations = updated;

  // 1. Persist to Redis if available
  if (redisClient) {
    try {
      await redisClient.set(REDIS_KEY, updated);
      return newDonation;
    } catch (err) {
      console.warn('Redis write error:', err);
    }
  }

  // 2. Persist to file
  const filePath = getFilePath();
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.warn('File write error (likely read-only on Vercel):', err);
  }

  return newDonation;
}

/**
 * Delete a donation by ID (Admin only)
 */
export async function deleteDonation(id: string): Promise<boolean> {
  const current = await getDonations();
  const updated = current.filter((d) => d.id !== id);
  memoryDonations = updated;

  if (redisClient) {
    try {
      await redisClient.set(REDIS_KEY, updated);
      return true;
    } catch (err) {
      console.warn('Redis delete error:', err);
    }
  }

  const filePath = getFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.warn('File delete error:', err);
  }

  return true;
}

/**
 * Compute aggregate statistics
 */
export function computeStats(donations: Donation[]): SiteStats {
  const targetAmount = SITE_CONFIG.targetAmount;
  const totalRaised = donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const totalDonors = donations.length;
  const percentComplete = Math.min(100, Number(((totalRaised / targetAmount) * 100).toFixed(1)));
  
  // Calculate Wanted Level (0 to 5 stars)
  let wantedLevel = 1;
  if (totalRaised >= targetAmount) wantedLevel = 5;
  else if (totalRaised >= targetAmount * 0.75) wantedLevel = 4;
  else if (totalRaised >= targetAmount * 0.5) wantedLevel = 3;
  else if (totalRaised >= targetAmount * 0.25) wantedLevel = 2;

  const remainingAmount = Math.max(0, targetAmount - totalRaised);

  return {
    targetAmount,
    totalRaised,
    totalDonors,
    percentComplete,
    wantedLevel,
    remainingAmount,
  };
}
