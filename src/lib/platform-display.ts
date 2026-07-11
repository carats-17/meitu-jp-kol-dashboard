import type { Platform } from "@prisma/client";

/** Level 1: unified platform label. Level 2+: show IG format when available. */
export function displayPlatform(
  platform: Platform | string,
  contentTheme?: string | null,
  detail = false,
): string {
  const p = String(platform).toUpperCase();
  if (detail && p === "INSTAGRAM" && contentTheme) {
    if (["IG Post", "IG Reels", "IG Story"].includes(contentTheme)) {
      return contentTheme;
    }
  }
  const labels: Record<string, string> = {
    X: "X",
    TIKTOK: "TikTok",
    INSTAGRAM: "Instagram",
    THREADS: "Threads",
  };
  return labels[p] ?? platform;
}

export function inferInstagramFormat(postUrl: string): string {
  const lower = postUrl.toLowerCase();
  if (lower.includes("/reel/") || lower.includes("/reels/")) return "IG Reels";
  if (lower.includes("/stories/") || lower.includes("/story/")) return "IG Story";
  if (lower.includes("/p/") || lower.includes("/tv/")) return "IG Post";
  return "IG Post";
}

export function isViewsHidden(platform: Platform | string, organicViews: number, totalEngagement: number): boolean {
  const p = String(platform).toUpperCase();
  return p === "INSTAGRAM" && organicViews === 0 && totalEngagement > 0;
}

export function formatViews(
  organicViews: number,
  platform: Platform | string,
  totalEngagement: number,
  viewsHidden?: boolean,
): { text: string; hidden: boolean } {
  const hidden = viewsHidden ?? isViewsHidden(platform, organicViews, totalEngagement);
  if (hidden) return { text: "未公开", hidden: true };
  if (organicViews === 0) return { text: "—", hidden: false };
  return { text: organicViews.toLocaleString("ja-JP"), hidden: false };
}
