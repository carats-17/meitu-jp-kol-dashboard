import type { Collaboration } from "@prisma/client";

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("ja-JP");
}

export function formatCurrency(amount: number, currency = "JPY"): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Compact table date: 6/20 (current year) or 2025/6/20 (other years) */
export function formatShortDate(date: Date | string): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const currentYear = new Date().getFullYear();
  if (year !== currentYear) {
    return `${year}/${d.getMonth() + 1}/${d.getDate()}`;
  }
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

type EngagementFields = Pick<
  Collaboration,
  "likes" | "comments" | "shares" | "saves" | "totalEngagement"
>;

type EngagementRateFields = EngagementFields &
  Pick<Collaboration, "organicViews" | "views" | "er">;

export function engagementTotal(c: EngagementFields): number {
  if (c.totalEngagement > 0) return c.totalEngagement;
  return c.likes + c.comments + c.shares + c.saves;
}

export function engagementRate(
  c: EngagementRateFields,
  followers?: number | null,
): number {
  if (c.er != null && Number.isFinite(c.er)) {
    return c.er;
  }

  const total = engagementTotal(c);
  const impressions = c.organicViews > 0 ? c.organicViews : c.views;
  if (impressions > 0) {
    return (total / impressions) * 100;
  }
  if (followers && followers > 0) {
    return (total / followers) * 100;
  }
  return 0;
}

export function formatMetric(value: number | null | undefined): string {
  if (value == null || value === 0) return "—";
  return value.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
}

export function avgEngagementRate(
  collabs: EngagementRateFields[],
  followers?: number | null,
): number {
  if (collabs.length === 0) return 0;

  const withSheetEr = collabs.filter((c) => c.er != null && Number.isFinite(c.er));
  if (withSheetEr.length > 0) {
    return withSheetEr.reduce((sum, c) => sum + c.er!, 0) / withSheetEr.length;
  }

  const sum = collabs.reduce((acc, c) => acc + engagementRate(c, followers), 0);
  return sum / collabs.length;
}

export function oneYearAgo(): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d;
}
