import fs from 'fs';
import path from 'path';
import { Donation, SiteStats } from '@/types/donation';
import { SITE_CONFIG } from '@/config/site';
import seedDonations from '@/data/seed-donations.json';
import { getRedisClient, isRedisConfigured } from './redis';

const REDIS_KEY = 'gta6_donations';

export { isRedisConfigured };

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
  const redis = getRedisClient();
  if (redis) {
    try {
      let data = await redis.get<Donation[] | string>(REDIS_KEY);
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          // ignore
        }
      }
      if (data && Array.isArray(data)) {
        return data;
      }
      if (data === null || data === undefined) {
        return [];
      }
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
  const current = await getDonations();

  // Validate duplicate UTR if provided
  if (donation.utrNumber) {
    const cleanUtr = donation.utrNumber.trim();
    if (cleanUtr.length === 12 && current.some((d) => d.utrNumber && d.utrNumber.trim() === cleanUtr)) {
      throw new Error(`This 12-digit UPI UTR (${cleanUtr}) has already been recorded.`);
    }
  }

  const newDonation: Donation = {
    id: `don-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: donation.name?.trim() || 'Anonymous Legend',
    amount: Math.max(1, Number(donation.amount) || 1),
    message: donation.message?.trim() || 'Respect +1 for the GTA 6 fund! 🎮',
    badge: donation.badge || '👑 Gigachad',
    timestamp: Date.now(),
    utrNumber: donation.utrNumber?.trim(),
    screenshotUrl: donation.screenshotUrl,
    isVerified: donation.isVerified ?? false,
  };

  const updated = [newDonation, ...current];
  memoryDonations = updated;

  // 1. Persist to Redis if available
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.set(REDIS_KEY, updated);
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

  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.set(REDIS_KEY, updated);
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
