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

export function engagementTotal(c: Pick<Collaboration, "likes" | "comments" | "shares">): number {
  return c.likes + c.comments + c.shares;
}

export function engagementRate(
  c: Pick<Collaboration, "likes" | "comments" | "shares" | "views">,
  followers?: number | null,
): number {
  const total = engagementTotal(c);
  if (followers && followers > 0) {
    return (total / followers) * 100;
  }
  if (c.views > 0) {
    return (total / c.views) * 100;
  }
  return 0;
}

export function avgEngagementRate(
  collabs: Collaboration[],
  followers?: number | null,
): number {
  if (collabs.length === 0) return 0;
  const sum = collabs.reduce((acc, c) => acc + engagementRate(c, followers), 0);
  return sum / collabs.length;
}

export function oneYearAgo(): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d;
}
