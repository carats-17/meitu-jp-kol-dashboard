import type { Collaboration, Platform, Prisma } from "@prisma/client";
import {
  allCanonicalFeatures,
  featureAliasesFor,
  normalizeFeatureName,
} from "./feature-normalization";
import { prisma } from "./prisma";
import type { DashboardMetrics, KolFilters, KolSortField, KolWithStats } from "./types";
import { avgEngagementRate, engagementTotal } from "./utils";

/** Same-day multi-platform posts: keep highest-engagement row for ER averages. */
export function collabsForErAverage(collabs: Collaboration[]): Collaboration[] {
  const map = new Map<string, Collaboration>();
  for (const c of collabs) {
    const day = c.publishedAt.toISOString().slice(0, 10);
    const key = `${c.kolId}-${day}`;
    const existing = map.get(key);
    if (!existing || engagementTotal(c) > engagementTotal(existing)) {
      map.set(key, c);
    }
  }
  return [...map.values()];
}

function buildCollabWhere(filters: KolFilters): Prisma.CollaborationWhereInput {
  const where: Prisma.CollaborationWhereInput = {};

  if (filters.platform) where.platform = filters.platform;
  if (filters.feature) {
    const aliases = featureAliasesFor(filters.feature);
    where.feature = { in: aliases };
  }
  if (filters.dateFrom || filters.dateTo) {
    where.publishedAt = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
    };
  }
  if (filters.maxPrice !== undefined) {
    where.price = { lte: filters.maxPrice };
  }

  return where;
}

function sortValue(kol: KolWithStats, field: KolSortField): number | string {
  switch (field) {
    case "lastCollabDate":
      return kol.lastCollabDate ?? "";
    case "followers":
      return kol.followers ?? 0;
    case "avgPrice":
      return kol.avgPrice;
    case "collabCount":
      return kol.collabCount;
    case "totalSpend":
      return kol.totalSpend;
    case "avgEngagement":
      return kol.avgEngagement;
    default:
      return kol.avgEngagement;
  }
}

function sortKols(kols: KolWithStats[], filters: KolFilters): KolWithStats[] {
  const field = filters.sortBy ?? "avgEngagement";
  const order = filters.sortOrder === "asc" ? 1 : -1;

  return [...kols].sort((a, b) => {
    const av = sortValue(a, field);
    const bv = sortValue(b, field);
    if (av === bv) return a.handle.localeCompare(b.handle);
    return av > bv ? order : -order;
  });
}

export async function getKolsWithStats(filters: KolFilters = {}): Promise<KolWithStats[]> {
  const collabWhere = buildCollabWhere(filters);

  const kols = await prisma.kol.findMany({
    where: {
      ...(filters.platform ? { platform: filters.platform } : {}),
      ...(filters.minFollowers !== undefined
        ? { followers: { gte: filters.minFollowers } }
        : {}),
      ...(filters.q
        ? {
            OR: [
              { name: { contains: filters.q } },
              { handle: { contains: filters.q } },
              { category: { contains: filters.q } },
              {
                collaborations: {
                  some: {
                    OR: [
                      { feature: { contains: filters.q } },
                      { postUrl: { contains: filters.q } },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
      collaborations: { some: collabWhere },
    },
    include: {
      collaborations: {
        where: collabWhere,
        orderBy: { publishedAt: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const results: KolWithStats[] = kols.map((kol) => {
    const collabs = kol.collaborations;
    const totalSpend = collabs.reduce((sum, c) => sum + c.price, 0);
    const avgEngagement = avgEngagementRate(collabsForErAverage(collabs), kol.followers);
    const featureMap = new Map<
      string,
      { postUrl: string; collabId: string; postCount: number }
    >();
    for (const c of collabs) {
      const f = normalizeFeatureName(c.feature);
      const existing = featureMap.get(f);
      if (!existing) {
        featureMap.set(f, { postUrl: c.postUrl, collabId: c.id, postCount: 1 });
      } else {
        existing.postCount++;
      }
    }
    const featurePosts = [...featureMap.entries()].map(([feature, v]) => ({
      feature,
      postUrl: v.postUrl,
      collabId: v.collabId,
      postCount: v.postCount,
    }));
    const features = featurePosts.map((f) => f.feature);

    return {
      id: kol.id,
      name: kol.name,
      handle: kol.handle,
      platform: kol.platform,
      category: kol.category,
      followers: kol.followers,
      email: kol.email,
      notes: kol.notes,
      collabCount: collabs.length,
      totalSpend,
      avgPrice: collabs.length > 0 ? Math.round(totalSpend / collabs.length) : 0,
      avgEngagement,
      lastCollabDate: collabs[0]?.publishedAt.toISOString() ?? null,
      features,
      featurePosts,
    };
  });

  let filtered = results;
  if (filters.minEngagement !== undefined) {
    filtered = filtered.filter((k) => k.avgEngagement >= filters.minEngagement!);
  }

  return sortKols(filtered, filters);
}

export async function getKolById(id: string) {
  const kol = await prisma.kol.findUnique({
    where: { id },
    include: {
      collaborations: {
        orderBy: { publishedAt: "desc" },
      },
    },
  });

  if (!kol) return null;

  const totalSpend = kol.collaborations.reduce((sum, c) => sum + c.price, 0);

  return {
    ...kol,
    stats: {
      collabCount: kol.collaborations.length,
      totalSpend,
      totalEngagement: kol.collaborations.reduce(
        (sum, c) => sum + (c.totalEngagement || c.likes + c.comments + c.shares + c.saves),
        0,
      ),
      avgEngagement: avgEngagementRate(collabsForErAverage(kol.collaborations), kol.followers),
      avgPrice:
        kol.collaborations.length > 0
          ? Math.round(totalSpend / kol.collaborations.length)
          : 0,
    },
  };
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [totalKols, collabs, platformGroups, featureGroups] = await Promise.all([
    prisma.kol.count({
      where: { collaborations: { some: {} } },
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

  return {
    totalKols,
    totalCollabs: collabs.length,
    totalSpend,
    avgPrice: collabs.length > 0 ? Math.round(totalSpend / collabs.length) : 0,
    platformBreakdown: platformGroups.map((g) => ({
      platform: g.platform as Platform,
      count: g._count.platform,
    })),
    topFeatures: featureGroups.map((g) => ({
      feature: normalizeFeatureName(g.feature),
      count: g._count.feature,
    })),
  };
}

export async function getFilterOptions() {
  const collabs = await prisma.collaboration.findMany({
    select: { feature: true },
  });

  return {
    features: allCanonicalFeatures(collabs.map((c) => c.feature)),
  };
}
