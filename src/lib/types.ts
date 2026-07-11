import type { Platform } from "@prisma/client";

export type KolFeaturePost = {
  feature: string;
  postUrl: string;
  collabId: string;
  postCount: number;
};

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
  avgPrice: number;
  avgEngagement: number;
  lastCollabDate: string | null;
  features: string[];
  featurePosts: KolFeaturePost[];
};

export type KolSortField =
  | "collabCount"
  | "totalSpend"
  | "avgPrice"
  | "avgEngagement"
  | "followers"
  | "lastCollabDate"
  | "totalViews"
  | "totalEngagement";

export type PostSortField =
  | "publishedAt"
  | "organicViews"
  | "likes"
  | "saves"
  | "totalEngagement"
  | "er"
  | "price";

export type ThemeSortField =
  | "postCount"
  | "totalSpend"
  | "totalViews"
  | "totalEngagement"
  | "avgEr";

export type KolFilters = {
  q?: string;
  platform?: Platform;
  feature?: string;
  minFollowers?: number;
  maxPrice?: number;
  minEngagement?: number;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: KolSortField;
  sortOrder?: "asc" | "desc";
  limit?: number;
};

export type PostFilters = {
  q?: string;
  platform?: Platform;
  feature?: string;
  dateFrom?: string;
  dateTo?: string;
  kolId?: string;
  minFollowers?: number;
  maxPrice?: number;
  sortBy?: PostSortField;
  sortOrder?: "asc" | "desc";
  applyDefaultDateRange?: boolean;
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
