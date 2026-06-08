import type { Platform, Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import type { DashboardMetrics, KolFilters, KolWithStats } from "./types";
import { avgEngagementRate, engagementTotal, oneYearAgo } from "./utils";

function buildCollabWhere(filters: KolFilters): Prisma.CollaborationWhereInput {
  const where: Prisma.CollaborationWhereInput = {
    publishedAt: { gte: oneYearAgo() },
  };

  if (filters.platform) where.platform = filters.platform;
  if (filters.feature) where.feature = { contains: filters.feature };
  if (filters.theme) where.contentTheme = { contains: filters.theme };
  if (filters.dateFrom || filters.dateTo) {
    where.publishedAt = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : { gte: oneYearAgo() }),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
    };
  }
  if (filters.maxPrice !== undefined) {
    where.price = { lte: filters.maxPrice };
  }

  return where;
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
    const avgEngagement = avgEngagementRate(collabs, kol.followers);
    const features = [...new Set(collabs.map((c) => c.feature))];
    const themes = [...new Set(collabs.map((c) => c.contentTheme))];

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
      avgEngagement,
      lastCollabDate: collabs[0]?.publishedAt.toISOString() ?? null,
      features,
      themes,
    };
  });

  if (filters.minEngagement !== undefined) {
    return results.filter((k) => k.avgEngagement >= filters.minEngagement!);
  }

  return results.sort((a, b) => b.avgEngagement - a.avgEngagement);
}

export async function getKolById(id: string) {
  const kol = await prisma.kol.findUnique({
    where: { id },
    include: {
      collaborations: {
        where: { publishedAt: { gte: oneYearAgo() } },
        orderBy: { publishedAt: "desc" },
      },
    },
  });

  if (!kol) return null;

  const totalSpend = kol.collaborations.reduce((sum, c) => sum + c.price, 0);
  const totalEngagement = kol.collaborations.reduce(
    (sum, c) => sum + engagementTotal(c),
    0,
  );

  return {
    ...kol,
    stats: {
      collabCount: kol.collaborations.length,
      totalSpend,
      totalEngagement,
      avgEngagement: avgEngagementRate(kol.collaborations, kol.followers),
      avgPrice:
        kol.collaborations.length > 0
          ? Math.round(totalSpend / kol.collaborations.length)
          : 0,
    },
  };
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const since = oneYearAgo();

  const [totalKols, collabs, platformGroups, featureGroups] = await Promise.all([
    prisma.kol.count({
      where: { collaborations: { some: { publishedAt: { gte: since } } } },
    }),
    prisma.collaboration.findMany({
      where: { publishedAt: { gte: since } },
      select: { price: true, platform: true, feature: true },
    }),
    prisma.collaboration.groupBy({
      by: ["platform"],
      where: { publishedAt: { gte: since } },
      _count: { platform: true },
    }),
    prisma.collaboration.groupBy({
      by: ["feature"],
      where: { publishedAt: { gte: since } },
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
      feature: g.feature,
      count: g._count.feature,
    })),
  };
}

export async function getFilterOptions() {
  const since = oneYearAgo();
  const collabs = await prisma.collaboration.findMany({
    where: { publishedAt: { gte: since } },
    select: { feature: true, contentTheme: true },
  });

  return {
    features: [...new Set(collabs.map((c) => c.feature))].sort(),
    themes: [...new Set(collabs.map((c) => c.contentTheme))].sort(),
  };
}
