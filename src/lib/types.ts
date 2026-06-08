import type { Platform } from "@prisma/client";

export type KolWithStats = {
  id: string;
  name: string;
  handle: string;
  platform: Platform;
  category: string | null;
  followers: number | null;
  email: string | null;
  notes: string | null;
  collabCount: number;
  totalSpend: number;
  avgEngagement: number;
  lastCollabDate: string | null;
  features: string[];
  themes: string[];
};

export type KolFilters = {
  q?: string;
  platform?: Platform;
  feature?: string;
  theme?: string;
  minFollowers?: number;
  maxPrice?: number;
  minEngagement?: number;
  dateFrom?: string;
  dateTo?: string;
};

export type DashboardMetrics = {
  totalKols: number;
  totalCollabs: number;
  totalSpend: number;
  avgPrice: number;
  platformBreakdown: { platform: Platform; count: number }[];
  topFeatures: { feature: string; count: number }[];
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  X: "X",
  TIKTOK: "TikTok",
  INSTAGRAM: "Instagram",
  THREADS: "Threads",
};

export const PLATFORM_OPTIONS: Platform[] = [
  "X",
  "TIKTOK",
  "INSTAGRAM",
  "THREADS",
];
