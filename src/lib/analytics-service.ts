import type { Collaboration, Platform, Prisma } from "@prisma/client";
import { featureAliasesFor, normalizeFeatureName } from "./feature-normalization";
import { collabsForErAverage } from "./kol-service";
import { isViewsHidden } from "./platform-display";
import { prisma } from "./prisma";
import type { KolFilters, PostFilters, PostSortField } from "./types";
import { avgEngagementRate, engagementRate, engagementTotal } from "./utils";

export type LibraryOverview = {
  totalKols: number;
  totalCollabs: number;
  totalSpend: number;
  avgPrice: number;
  platformBreakdown: { platform: Platform; count: number; pct: number }[];
  followerBuckets: { label: string; count: number }[];
  topFeatures: { feature: string; count: number }[];
};

export type PostPerformanceRow = {
  id: string;
  publishedAt: string;
  kolId: string;
  handle: string;
  name: string;
  platform: Platform;
  feature: string;
  contentTheme: string;
  postUrl: string;
  organicViews: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  totalEngagement: number;
  er: number;
  price: number;
  viewsHidden: boolean;
};

export type ThemeBubblePoint = {
  feature: string;
  postCount: number;
  totalSpend: number;
  totalViews: number;
  totalEngagement: number;
  avgEr: number;
};

export type KolBubblePoint = {
  kolId: string;
  handle: string;
  name: string;
  platform: Platform;
  postCount: number;
  totalSpend: number;
  totalViews: number;
  totalEngagement: number;
  avgEr: number;
};

export type KolHistoryRow = {
  id: string;
  name: string;
  handle: string;
  platform: Platform;
  followers: number | null;
  collabCount: number;
  totalSpend: number;
  avgEngagement: number;
  avgPrice: number;
  totalViews: number;
  totalEngagement: number;
  performanceTier: "excellent" | "normal" | "poor" | "unrated";
  features: string[];
  lastCollabDate: string | null;
};

export function buildPostWhere(filters: PostFilters): Prisma.CollaborationWhereInput {
  const where: Prisma.CollaborationWhereInput = {};

  if (filters.platform) where.platform = filters.platform;
  if (filters.feature) {
    const aliases = featureAliasesFor(filters.feature);
    where.feature = { in: aliases };
  }
  if (filters.kolId) where.kolId = filters.kolId;
  if (filters.dateFrom || filters.dateTo) {
    where.publishedAt = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
    };
  }
  if (filters.q) {
    where.OR = [
      { feature: { contains: filters.q } },
      { postUrl: { contains: filters.q } },
      { contentTheme: { contains: filters.q } },
      { kol: { name: { contains: filters.q } } },
      { kol: { handle: { contains: filters.q } } },
    ];
  }
  if (filters.maxPrice !== undefined) {
    where.price = { lte: filters.maxPrice };
  }
  if (filters.minFollowers !== undefined) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      { kol: { followers: { gte: filters.minFollowers } } },
    ];
  }

  return where;
}

function monthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return {
    dateFrom: start.toISOString().slice(0, 10),
    dateTo: end.toISOString().slice(0, 10),
  };
}

function followerBucket(followers: number | null): string {
  const n = followers ?? 0;
  if (n < 10_000) return "<1万";
  if (n < 100_000) return "1万-10万";
  return "10万-50万";
}

function performanceTier(avgEr: number): Exclude<KolHistoryRow["performanceTier"], "unrated"> {
  if (avgEr >= 3) return "excellent";
  if (avgEr < 1) return "poor";
  return "normal";
}

/** IG Post often has no public impression count — don't treat 0 ER as 效果差. */
function isIgPostViewsUncountable(collabs: Collaboration[]): boolean {
  if (collabs.length === 0) return false;
  return collabs.every((c) => {
    if (String(c.platform).toUpperCase() !== "INSTAGRAM") return false;
    const views = c.organicViews > 0 ? c.organicViews : c.views;
    const engagement = engagementTotal(c);
    if (c.viewsHidden || isViewsHidden(c.platform, views, engagement)) return true;
    const theme = (c.contentTheme || "").trim();
    const isIgPost =
      theme === "IG Post" ||
      theme === "" ||
      (!/reels?/i.test(theme) && !/stor(y|ies)/i.test(theme));
    return isIgPost && views === 0;
  });
}

function resolveHistoryPerformanceTier(
  avgEr: number,
  collabs: Collaboration[],
  platform: Platform,
): KolHistoryRow["performanceTier"] {
  const tier = performanceTier(avgEr);
  if (
    tier === "poor" &&
    String(platform).toUpperCase() === "INSTAGRAM" &&
    isIgPostViewsUncountable(collabs)
  ) {
    return "unrated";
  }
  return tier;
}

export async function getLibraryOverview(): Promise<LibraryOverview> {
  const [kols, collabs, platformGroups, featureGroups] = await Promise.all([
    prisma.kol.findMany({
      where: { collaborations: { some: {} } },
      select: { followers: true },
    }),
    prisma.collaboration.findMany({
      select: { price: true, platform: true, feature: true },
    }),
    prisma.collaboration.groupBy({
      by: ["platform"],
      _count: { platform: true },
    }),
    prisma.collaboration.groupBy({
      by: ["feature"],
      _count: { feature: true },
      orderBy: { _count: { feature: "desc" } },
      take: 8,
    }),
  ]);

  const totalSpend = collabs.reduce((sum, c) => sum + c.price, 0);
  const totalCollabs = collabs.length;
  const bucketMap = new Map<string, number>();

  for (const kol of kols) {
    const label = followerBucket(kol.followers);
    bucketMap.set(label, (bucketMap.get(label) ?? 0) + 1);
  }

  return {
    totalKols: kols.length,
    totalCollabs,
    totalSpend,
    avgPrice: totalCollabs > 0 ? Math.round(totalSpend / totalCollabs) : 0,
    platformBreakdown: platformGroups.map((g) => ({
      platform: g.platform as Platform,
      count: g._count.platform,
      pct: totalCollabs > 0 ? (g._count.platform / totalCollabs) * 100 : 0,
    })),
    followerBuckets: ["<1万", "1万-10万", "10万-50万"].map((label) => ({
      label,
      count: bucketMap.get(label) ?? 0,
    })),
    topFeatures: featureGroups.map((g) => ({
      feature: normalizeFeatureName(g.feature),
      count: g._count.feature,
    })),
  };
}

export async function getPostPerformance(
  filters: PostFilters = {},
): Promise<PostPerformanceRow[]> {
  const resolved =
    filters.applyDefaultDateRange !== false && !filters.dateFrom && !filters.dateTo
      ? { ...filters, ...monthRange() }
      : filters;

  const collabs = await prisma.collaboration.findMany({
    where: buildPostWhere(resolved),
    include: { kol: { select: { handle: true, name: true, followers: true } } },
    orderBy: { publishedAt: "desc" },
  });

  const rows = collabs.map((c) => ({
    id: c.id,
    publishedAt: c.publishedAt.toISOString(),
    kolId: c.kolId,
    handle: c.kol.handle,
    name: c.kol.name,
    platform: c.platform,
    feature: normalizeFeatureName(c.feature),
    contentTheme: c.contentTheme,
    postUrl: c.postUrl,
    organicViews: c.organicViews > 0 ? c.organicViews : c.views,
    likes: c.likes,
    comments: c.comments,
    shares: c.shares,
    saves: c.saves,
    totalEngagement: engagementTotal(c),
    er: engagementRate(c, c.kol.followers),
    price: c.price,
    viewsHidden: c.viewsHidden,
  }));

  const sortBy = filters.sortBy ?? "er";
  const order = filters.sortOrder === "asc" ? 1 : -1;

  return rows.sort((a, b) => {
    const av = a[sortBy as keyof typeof a];
    const bv = b[sortBy as keyof typeof b];
    if (av === bv) return 0;
    return (av as number | string) > (bv as number | string) ? order : -order;
  });
}

export async function getThemeBubbles(
  filters: PostFilters = {},
): Promise<ThemeBubblePoint[]> {
  const collabs = await prisma.collaboration.findMany({
    where: buildPostWhere(filters),
    include: { kol: { select: { followers: true } } },
  });

  const map = new Map<string, ThemeBubblePoint>();

  for (const c of collabs) {
    const feature = normalizeFeatureName(c.feature);
    const views = c.organicViews > 0 ? c.organicViews : c.views;
    const engagement = engagementTotal(c);
    const er = engagementRate(c, c.kol.followers);

    if (!map.has(feature)) {
      map.set(feature, {
        feature,
        postCount: 0,
        totalSpend: 0,
        totalViews: 0,
        totalEngagement: 0,
        avgEr: 0,
      });
    }

    const point = map.get(feature)!;
    point.postCount++;
    point.totalSpend += c.price;
    point.totalViews += views;
    point.totalEngagement += engagement;
    point.avgEr = ((point.avgEr * (point.postCount - 1)) + er) / point.postCount;
  }

  return [...map.values()].sort((a, b) => b.totalEngagement - a.totalEngagement);
}

export async function getKolBubblesForTheme(
  feature: string,
  filters: PostFilters = {},
): Promise<KolBubblePoint[]> {
  const aliases = featureAliasesFor(feature);
  const collabs = await prisma.collaboration.findMany({
    where: {
      ...buildPostWhere(filters),
      feature: { in: aliases },
    },
    include: { kol: { select: { handle: true, name: true, followers: true } } },
  });

  const map = new Map<string, KolBubblePoint>();

  for (const c of collabs) {
    const views = c.organicViews > 0 ? c.organicViews : c.views;
    const engagement = engagementTotal(c);
    const er = engagementRate(c, c.kol.followers);
    const key = c.kol.handle.toLowerCase();

    if (!map.has(key)) {
      map.set(key, {
        kolId: c.kolId,
        handle: c.kol.handle,
        name: c.kol.name,
        platform: c.platform,
        postCount: 0,
        totalSpend: 0,
        totalViews: 0,
        totalEngagement: 0,
        avgEr: 0,
      });
    }

    const point = map.get(key)!;
    point.postCount++;
    point.totalSpend += c.price;
    point.totalViews += views;
    point.totalEngagement += engagement;
    point.avgEr = ((point.avgEr * (point.postCount - 1)) + er) / point.postCount;
  }

  return [...map.values()].sort((a, b) => b.totalEngagement - a.totalEngagement);
}

export async function getKolThemeCollabs(
  feature: string,
  kolId: string,
  filters: PostFilters = {},
): Promise<PostPerformanceRow[]> {
  const kol = await prisma.kol.findUnique({
    where: { id: kolId },
    select: { handle: true },
  });
  if (!kol) return [];

  const siblingIds = (
    await prisma.kol.findMany({
      where: { handle: kol.handle },
      select: { id: true },
    })
  ).map((k) => k.id);

  const aliases = featureAliasesFor(feature);
  const collabs = await prisma.collaboration.findMany({
    where: {
      ...buildPostWhere(filters),
      feature: { in: aliases },
      kolId: { in: siblingIds },
    },
    include: { kol: { select: { handle: true, name: true, followers: true } } },
    orderBy: { publishedAt: "desc" },
  });

  return collabs.map((c) => ({
    id: c.id,
    publishedAt: c.publishedAt.toISOString(),
    kolId: c.kolId,
    handle: c.kol.handle,
    name: c.kol.name,
    platform: c.platform,
    feature: normalizeFeatureName(c.feature),
    contentTheme: c.contentTheme,
    postUrl: c.postUrl,
    organicViews: c.organicViews > 0 ? c.organicViews : c.views,
    likes: c.likes,
    comments: c.comments,
    shares: c.shares,
    saves: c.saves,
    totalEngagement: engagementTotal(c),
    er: engagementRate(c, c.kol.followers),
    price: c.price,
    viewsHidden: c.viewsHidden,
  }));
}

export async function getKolHistory(
  filters: KolFilters = {},
): Promise<KolHistoryRow[]> {
  const kols = await prisma.kol.findMany({
    where: {
      collaborations: { some: {} },
      ...(filters.platform ? { platform: filters.platform } : {}),
      ...(filters.q
        ? {
            OR: [
              { name: { contains: filters.q } },
              { handle: { contains: filters.q } },
            ],
          }
        : {}),
    },
    include: {
      collaborations: {
        orderBy: { publishedAt: "desc" },
        ...(filters.dateFrom || filters.dateTo
          ? {
              where: {
                publishedAt: {
                  ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
                  ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
                },
              },
            }
          : {}),
      },
    },
  });

  const rows: KolHistoryRow[] = kols
    .filter((k) => k.collaborations.length > 0)
    .map((kol) => {
      const collabs = kol.collaborations;
      const totalSpend = collabs.reduce((sum, c) => sum + c.price, 0);
      const totalViews = collabs.reduce(
        (sum, c) => sum + (c.organicViews > 0 ? c.organicViews : c.views),
        0,
      );
      const totalEngagement = collabs.reduce((sum, c) => sum + engagementTotal(c), 0);
      const avgEngagement = avgEngagementRate(collabsForErAverage(collabs), kol.followers);

      return {
        id: kol.id,
        name: kol.name,
        handle: kol.handle,
        platform: kol.platform,
        followers: kol.followers,
        collabCount: collabs.length,
        totalSpend,
        avgEngagement,
        avgPrice: collabs.length > 0 ? Math.round(totalSpend / collabs.length) : 0,
        totalViews,
        totalEngagement,
        performanceTier: resolveHistoryPerformanceTier(
          avgEngagement,
          collabs,
          kol.platform,
        ),
        features: [...new Set(collabs.map((c) => normalizeFeatureName(c.feature)))],
        lastCollabDate: collabs[0]?.publishedAt.toISOString() ?? null,
      };
    });

  const sortField = filters.sortBy ?? "avgEngagement";
  const order = filters.sortOrder === "asc" ? 1 : -1;

  return rows.sort((a, b) => {
    const field =
      sortField === "totalSpend"
        ? "totalSpend"
        : sortField === "collabCount"
          ? "collabCount"
          : sortField === "avgPrice"
            ? "avgPrice"
            : sortField === "followers"
              ? "followers"
              : sortField === "lastCollabDate"
                ? "lastCollabDate"
                : sortField === "totalViews"
                  ? "totalViews"
                  : sortField === "totalEngagement"
                    ? "totalEngagement"
                    : "avgEngagement";
    const av = a[field as keyof typeof a] ?? 0;
    const bv = b[field as keyof typeof b] ?? 0;
    if (field === "lastCollabDate") {
      return order === 1
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    }
    return av === bv ? 0 : (av as number) > (bv as number) ? order : -order;
  });
}

export { monthRange };
export type { PostFilters } from "./types";
