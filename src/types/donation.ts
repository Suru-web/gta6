export interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string;
  badge: string;
  timestamp: number;
  isRecent?: boolean;
}

export interface SiteStats {
  targetAmount: number;
  totalRaised: number;
  totalDonors: number;
  percentComplete: number;
  wantedLevel: number; // 0 to 5 stars
  remainingAmount: number;
}

export interface UpiConfig {
  upiId: string;
  payeeName: string;
  note: string;
  customQrUrl?: string;
}
