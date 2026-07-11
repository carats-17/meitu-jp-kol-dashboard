import { prisma } from "./prisma";
import { featureAliasesFor, normalizeFeatureName } from "./feature-normalization";
import { formatWeekRangeLabel, getFridayAnchoredComparisonWeeks } from "./week-calendar";
import { engagementRate, engagementTotal } from "./utils";

const HIGH_ER_THRESHOLD = 3;

export type WeeklyFeatureStat = {
  feature: string;
  postCount: number;
  totalViews: number;
  totalEngagement: number;
  avgEr: number;
  share: number;
  highErPostCount: number;
  highErRate: number;
};

export type WeeklyInsight = {
  weekKey: string;
  weekLabel: string;
  weekStart: string;
  weekEnd: string;
  postCount: number;
  totalViews: number;
  totalEngagement: number;
  avgEr: number;
  highErPostCount: number;
  highErRate: number;
  features: WeeklyFeatureStat[];
};

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekLabel(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

function getMonthStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getPeriodEnd(start: Date, period: "week" | "month"): Date {
  const end = new Date(start);
  if (period === "week") {
    end.setDate(end.getDate() + 6);
  } else {
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
  }
  end.setHours(23, 59, 59, 999);
  return end;
}

function formatMonthLabel(start: Date): string {
  return start.toLocaleDateString("ja-JP", { year: "numeric", month: "short" });
}

export type WeekOverWeekFeature = {
  feature: string;
  status: "new" | "stopped" | "continued";
  thisWeek: { posts: number; views: number; engagement: number; er: number };
  lastWeek: { posts: number; views: number; engagement: number; er: number };
  postsDelta: number;
  engagementDelta: number;
  erDelta: number;
};

export type WeekOverWeekSummary = {
  thisWeek: WeeklyInsight | null;
  lastWeek: WeeklyInsight | null;
  features: WeekOverWeekFeature[];
};

function emptyWeek(start: Date): WeeklyInsight {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return {
    weekKey: start.toISOString().slice(0, 10),
    weekLabel: formatWeekLabel(start, end),
    weekStart: start.toISOString(),
    weekEnd: end.toISOString(),
    postCount: 0,
    totalViews: 0,
    totalEngagement: 0,
    avgEr: 0,
    highErPostCount: 0,
    highErRate: 0,
    features: [],
  };
}

async function getInsightForRange(
  start: Date,
  end: Date,
  period: "week" | "month",
): Promise<WeeklyInsight> {
  const collabs = await prisma.collaboration.findMany({
    where: {
      publishedAt: {
        gte: start,
        lte: end,
      },
    },
    include: { kol: { select: { followers: true } } },
  });

  const insight: WeeklyInsight = {
    weekKey: start.toISOString().slice(0, 10),
    weekLabel: period === "week" ? formatWeekLabel(start, end) : formatMonthLabel(start),
    weekStart: start.toISOString(),
    weekEnd: end.toISOString(),
    postCount: 0,
    totalViews: 0,
    totalEngagement: 0,
    avgEr: 0,
    highErPostCount: 0,
    highErRate: 0,
    features: [],
  };

  let erSum = 0;
  let highErCount = 0;
  for (const c of collabs) {
    const views = c.organicViews > 0 ? c.organicViews : c.views;
    const engagement = engagementTotal(c);
    const er = engagementRate(c, c.kol.followers);
    const featureName = normalizeFeatureName(c.feature);
    const isHighEr = er >= HIGH_ER_THRESHOLD;

    insight.postCount++;
    insight.totalViews += views;
    insight.totalEngagement += engagement;
    erSum += er;
    if (isHighEr) highErCount++;

    let feat = insight.features.find((f) => f.feature === featureName);
    if (!feat) {
      feat = {
        feature: featureName,
        postCount: 0,
        totalViews: 0,
        totalEngagement: 0,
        avgEr: 0,
        share: 0,
        highErPostCount: 0,
        highErRate: 0,
      };
      insight.features.push(feat);
    }
    feat.postCount++;
    feat.totalViews += views;
    feat.totalEngagement += engagement;
    feat.avgEr = ((feat.avgEr * (feat.postCount - 1)) + er) / feat.postCount;
    if (isHighEr) feat.highErPostCount++;
  }

  insight.avgEr = insight.postCount > 0 ? erSum / insight.postCount : 0;
  insight.highErPostCount = highErCount;
  insight.highErRate =
    insight.postCount > 0 ? (highErCount / insight.postCount) * 100 : 0;
  for (const feature of insight.features) {
    feature.share =
      insight.totalEngagement > 0
        ? (feature.totalEngagement / insight.totalEngagement) * 100
        : 0;
    feature.highErRate =
      feature.postCount > 0 ? (feature.highErPostCount / feature.postCount) * 100 : 0;
  }
  insight.features.sort((a, b) => b.totalEngagement - a.totalEngagement);
  return insight;
}

export async function getWeekOverWeek(
  anchorDate?: string,
  period: "week" | "month" = "week",
  compareDate?: string,
): Promise<WeekOverWeekSummary> {
  const anchor = anchorDate ? new Date(anchorDate) : new Date();
  const thisStart = period === "week" ? getWeekStart(anchor) : getMonthStart(anchor);
  const compareAnchor = compareDate ? new Date(compareDate) : null;
  const lastStart = compareAnchor
    ? period === "week"
      ? getWeekStart(compareAnchor)
      : getMonthStart(compareAnchor)
    : new Date(thisStart);
  if (!compareAnchor) {
    if (period === "week") lastStart.setDate(lastStart.getDate() - 7);
    else lastStart.setMonth(lastStart.getMonth() - 1);
  }

  const thisWeek = await getInsightForRange(
    thisStart,
    getPeriodEnd(thisStart, period),
    period,
  );
  const lastWeek = await getInsightForRange(
    lastStart,
    getPeriodEnd(lastStart, period),
    period,
  );

  const featureSet = new Set<string>();
  thisWeek?.features.forEach((f) => featureSet.add(f.feature));
  lastWeek?.features.forEach((f) => featureSet.add(f.feature));

  const features: WeekOverWeekFeature[] = [...featureSet].map((feature) => {
    const tw = thisWeek.features.find((f) => f.feature === feature);
    const lw = lastWeek.features.find((f) => f.feature === feature);
    const thisPosts = tw?.postCount ?? 0;
    const lastPosts = lw?.postCount ?? 0;
    const thisEng = tw?.totalEngagement ?? 0;
    const lastEng = lw?.totalEngagement ?? 0;
    const thisEr = tw?.avgEr ?? 0;
    const lastEr = lw?.avgEr ?? 0;

    return {
      feature,
      status:
        thisPosts > 0 && lastPosts === 0
          ? "new"
          : thisPosts === 0 && lastPosts > 0
            ? "stopped"
            : "continued",
      thisWeek: {
        posts: thisPosts,
        views: tw?.totalViews ?? 0,
        engagement: thisEng,
        er: thisEr,
      },
      lastWeek: {
        posts: lastPosts,
        views: lw?.totalViews ?? 0,
        engagement: lastEng,
        er: lastEr,
      },
      postsDelta: thisPosts - lastPosts,
      engagementDelta: thisEng - lastEng,
      erDelta: thisEr - lastEr,
    };
  });

  features.sort((a, b) => {
    const statusOrder = { new: 0, continued: 1, stopped: 2 };
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    return b.thisWeek.engagement - a.thisWeek.engagement;
  });

  return { thisWeek, lastWeek, features };
}

export async function getWeeklyInsights(
  dateFrom?: string,
  dateTo?: string,
): Promise<WeeklyInsight[]> {
  const collabs = await prisma.collaboration.findMany({
    where: {
      ...(dateFrom || dateTo
        ? {
            publishedAt: {
              ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
              ...(dateTo ? { lte: new Date(dateTo) } : {}),
            },
          }
        : {}),
    },
    include: { kol: { select: { followers: true } } },
    orderBy: { publishedAt: "desc" },
  });

  const weekMap = new Map<string, WeeklyInsight>();

  for (const c of collabs) {
    const start = getWeekStart(c.publishedAt);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const weekKey = start.toISOString().slice(0, 10);

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, {
        weekKey,
        weekLabel: formatWeekLabel(start, end),
        weekStart: start.toISOString(),
        weekEnd: end.toISOString(),
        postCount: 0,
        totalViews: 0,
        totalEngagement: 0,
        avgEr: 0,
        highErPostCount: 0,
        highErRate: 0,
        features: [],
      });
    }

    const week = weekMap.get(weekKey)!;
    const views = c.organicViews > 0 ? c.organicViews : c.views;
    const engagement = engagementTotal(c);
    const er = engagementRate(c, c.kol.followers);
    const isHighEr = er >= HIGH_ER_THRESHOLD;

    week.postCount++;
    week.totalViews += views;
    week.totalEngagement += engagement;
    if (isHighEr) week.highErPostCount++;

    const featureName = normalizeFeatureName(c.feature);
    let feat = week.features.find((f) => f.feature === featureName);
    if (!feat) {
      feat = {
        feature: featureName,
        postCount: 0,
        totalViews: 0,
        totalEngagement: 0,
        avgEr: 0,
        share: 0,
        highErPostCount: 0,
        highErRate: 0,
      };
      week.features.push(feat);
    }
    feat.postCount++;
    feat.totalViews += views;
    feat.totalEngagement += engagement;
    feat.avgEr = ((feat.avgEr * (feat.postCount - 1)) + er) / feat.postCount;
    if (isHighEr) feat.highErPostCount++;
  }

  for (const week of weekMap.values()) {
    let erSum = 0;
    for (const c of collabs) {
      const start = getWeekStart(c.publishedAt);
      if (start.toISOString().slice(0, 10) === week.weekKey) {
        erSum += engagementRate(c, c.kol.followers);
      }
    }
    week.avgEr = week.postCount > 0 ? erSum / week.postCount : 0;
    week.highErRate =
      week.postCount > 0 ? (week.highErPostCount / week.postCount) * 100 : 0;
    for (const feature of week.features) {
      feature.share =
        week.totalEngagement > 0
          ? (feature.totalEngagement / week.totalEngagement) * 100
          : 0;
      feature.highErRate =
        feature.postCount > 0 ? (feature.highErPostCount / feature.postCount) * 100 : 0;
    }
    week.features.sort((a, b) => b.totalEngagement - a.totalEngagement);
  }

  return [...weekMap.values()].sort((a, b) => b.weekStart.localeCompare(a.weekStart));
}

/** Fri-anchored this week + last week (Mon–Sun). */
export async function getLatestTwoWeeksInsights(
  anchorDate = new Date(),
): Promise<WeeklyInsight[]> {
  const { thisWeek, lastWeek } = getFridayAnchoredComparisonWeeks(anchorDate);

  const current = await getInsightForRange(thisWeek.start, thisWeek.end, "week");
  current.weekLabel = thisWeek.label;

  const previous = await getInsightForRange(lastWeek.start, lastWeek.end, "week");
  previous.weekLabel = lastWeek.label;

  return [previous, current];
}

export type TwoWeekCompareParams = {
  anchor?: string;
  thisWeekStart?: string;
  thisWeekEnd?: string;
  lastWeekStart?: string;
  lastWeekEnd?: string;
};

/** Anchor-based or fully custom Mon–Sun week ranges. */
export async function getTwoWeeksCompare(
  params: TwoWeekCompareParams = {},
): Promise<WeeklyInsight[]> {
  const hasCustom =
    params.thisWeekStart &&
    params.thisWeekEnd &&
    params.lastWeekStart &&
    params.lastWeekEnd;

  if (hasCustom) {
    const thisStart = new Date(params.thisWeekStart!);
    const thisEnd = new Date(params.thisWeekEnd!);
    const lastStart = new Date(params.lastWeekStart!);
    const lastEnd = new Date(params.lastWeekEnd!);
    thisEnd.setHours(23, 59, 59, 999);
    lastEnd.setHours(23, 59, 59, 999);

    const refYear = thisStart.getFullYear();
    const current = await getInsightForRange(thisStart, thisEnd, "week");
    current.weekLabel = formatWeekRangeLabel(thisStart, thisEnd, refYear);

    const previous = await getInsightForRange(lastStart, lastEnd, "week");
    previous.weekLabel = formatWeekRangeLabel(lastStart, lastEnd, refYear);

    return [previous, current];
  }

  const anchor = params.anchor ? new Date(params.anchor) : new Date();
  return getLatestTwoWeeksInsights(anchor);
}

export type FeatureCollabRow = {
  id: string;
  publishedAt: string;
  handle: string;
  kolId: string;
  platform: string;
  contentTheme: string;
  postUrl: string;
  thumbnailUrl: string | null;
  price: number;
  currency: string;
  organicViews: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  totalEngagement: number;
  er: number;
  viewsHidden: boolean;
  sourceSheet: string | null;
};

export async function getFeatureInsights(
  feature: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<FeatureCollabRow[]> {
  const aliases = featureAliasesFor(feature);
  const collabs = await prisma.collaboration.findMany({
    where: {
      feature: { in: aliases },
      ...(dateFrom || dateTo
        ? {
            publishedAt: {
              ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
              ...(dateTo ? { lte: new Date(dateTo) } : {}),
            },
          }
        : {}),
    },
    include: { kol: { select: { handle: true, followers: true } } },
    orderBy: { publishedAt: "desc" },
  });

  return collabs.map((c) => ({
    id: c.id,
    publishedAt: c.publishedAt.toISOString(),
    handle: c.kol.handle,
    kolId: c.kolId,
    platform: c.platform,
    contentTheme: c.contentTheme,
    postUrl: c.postUrl,
    thumbnailUrl: c.thumbnailUrl,
    price: c.price,
    currency: c.currency,
    organicViews: c.organicViews > 0 ? c.organicViews : c.views,
    likes: c.likes,
    comments: c.comments,
    shares: c.shares,
    saves: c.saves,
    totalEngagement: engagementTotal(c),
    er: engagementRate(c, c.kol.followers),
    viewsHidden: c.viewsHidden,
    sourceSheet: c.sourceSheet,
  }));
}

export async function getAllFeatures(): Promise<string[]> {
  const groups = await prisma.collaboration.groupBy({
    by: ["feature"],
    orderBy: { feature: "asc" },
  });
  return [...new Set(groups.map((g) => normalizeFeatureName(g.feature)))].sort((a, b) =>
    a.localeCompare(b, "ja"),
  );
}

export type FeatureSharePoint = {
  key: string;
  label: string;
  totalPosts: number;
  totalEngagement: number;
  features: {
    feature: string;
    postCount: number;
    totalEngagement: number;
    share: number;
    postShare: number;
  }[];
};

export async function getFeatureShares(
  granularity: "week" | "month",
): Promise<FeatureSharePoint[]> {
  const collabs = await prisma.collaboration.findMany({
    orderBy: { publishedAt: "desc" },
  });
  const buckets = new Map<string, FeatureSharePoint>();

  for (const c of collabs) {
    const key =
      granularity === "week"
        ? getWeekStart(c.publishedAt).toISOString().slice(0, 10)
        : `${c.publishedAt.getFullYear()}-${String(c.publishedAt.getMonth() + 1).padStart(2, "0")}`;
    const label =
      granularity === "week"
        ? formatWeekLabel(getWeekStart(c.publishedAt), new Date(getWeekStart(c.publishedAt).getTime() + 6 * 86400000))
        : c.publishedAt.toLocaleDateString("ja-JP", { year: "numeric", month: "short" });

    if (!buckets.has(key)) {
      buckets.set(key, { key, label, totalPosts: 0, totalEngagement: 0, features: [] });
    }
    const bucket = buckets.get(key)!;
    const engagement = engagementTotal(c);
    const featureName = normalizeFeatureName(c.feature);
    bucket.totalPosts++;
    bucket.totalEngagement += engagement;

    let feature = bucket.features.find((f) => f.feature === featureName);
    if (!feature) {
      feature = {
        feature: featureName,
        postCount: 0,
        totalEngagement: 0,
        share: 0,
        postShare: 0,
      };
      bucket.features.push(feature);
    }
    feature.postCount++;
    feature.totalEngagement += engagement;
  }

  for (const bucket of buckets.values()) {
    for (const feature of bucket.features) {
      feature.share =
        bucket.totalEngagement > 0
          ? (feature.totalEngagement / bucket.totalEngagement) * 100
          : 0;
      feature.postShare =
        bucket.totalPosts > 0 ? (feature.postCount / bucket.totalPosts) * 100 : 0;
    }
    bucket.features.sort((a, b) => b.share - a.share);
  }

  return [...buckets.values()].sort((a, b) => b.key.localeCompare(a.key));
}
