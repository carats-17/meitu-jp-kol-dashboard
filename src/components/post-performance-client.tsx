"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { PostPerformanceRow } from "@/lib/analytics-service";
import { monthRange } from "@/lib/analytics-service";
import { KolFilters, defaultPostFilters, type FilterState } from "@/components/kol-filters";
import { SortableHeader, useSortState } from "@/components/sortable-header";
import { displayPlatform, formatViews } from "@/lib/platform-display";
import type { PostSortField } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/utils";

type Period = "month" | "week";

type BucketSummary = {
  key: string;
  label: string;
  collabKols: number;
  records: number;
  views: number;
  engagement: number;
  spend: number;
  cpe: number;
  byTheme: Map<string, { kols: Set<string>; records: number; views: number; engagement: number; cpe: number }>;
  byPlatform: Map<string, { kols: Set<string>; records: number; views: number; engagement: number; cpe: number }>;
};

type PerformanceSummary = Pick<
  BucketSummary,
  "collabKols" | "records" | "views" | "engagement" | "spend" | "cpe"
>;

function weekKey(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x.toISOString().slice(0, 10);
}

function weekLabelFromKey(key: string) {
  const start = new Date(`${key}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (dt: Date) => `${dt.getMonth() + 1}/${dt.getDate()}`;
  return `${fmt(start)}-${fmt(end)}`;
}

function monthLabelFromKey(key: string) {
  const [y, m] = key.split("-");
  return `${y}-${m}`;
}

function monthKeyFromDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatPostDate(date: Date | string) {
  const value = new Date(date);
  return `${value.getFullYear()}/${value.getMonth() + 1}/${value.getDate()}`;
}

function filterBucketsWithinNow(
  buckets: BucketSummary[],
  period: Period,
): BucketSummary[] {
  const now = new Date();
  if (period === "month") {
    const nowKey = monthKeyFromDate(now);
    return buckets.filter((b) => b.key <= nowKey);
  }
  const nowWeek = weekKey(now);
  return buckets.filter((b) => b.key <= nowWeek);
}

function bestWeeksByMonth(weeks: BucketSummary[]): BucketSummary[] {
  const byMonth = new Map<string, BucketSummary>();
  for (const w of weeks) {
    const mKey = monthKeyFromDate(new Date(`${w.key}T00:00:00`));
    const existing = byMonth.get(mKey);
    if (!existing || w.records > existing.records) {
      byMonth.set(mKey, w);
    }
  }
  return [...byMonth.values()].sort((a, b) => b.key.localeCompare(a.key));
}

function summarize(posts: PostPerformanceRow[], period: Period): BucketSummary[] {
  const map = new Map<string, BucketSummary>();

  for (const p of posts) {
    const date = new Date(p.publishedAt);
    const key =
      period === "month"
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        : weekKey(date);

    if (!map.has(key)) {
      map.set(key, {
        key,
        label: period === "month" ? monthLabelFromKey(key) : weekLabelFromKey(key),
        collabKols: 0,
        records: 0,
        views: 0,
        engagement: 0,
        spend: 0,
        cpe: 0,
        byTheme: new Map(),
        byPlatform: new Map(),
      });
    }

    const bucket = map.get(key)!;
    bucket.records += 1;
    bucket.views += p.organicViews;
    bucket.engagement += p.totalEngagement;
    bucket.spend += p.price;

    const themeKey = p.feature;
    if (!bucket.byTheme.has(themeKey)) {
      bucket.byTheme.set(themeKey, { kols: new Set(), records: 0, views: 0, engagement: 0, cpe: 0 });
    }
    const theme = bucket.byTheme.get(themeKey)!;
    theme.kols.add(p.kolId);
    theme.records += 1;
    theme.views += p.organicViews;
    theme.engagement += p.totalEngagement;

    const platformKey = displayPlatform(p.platform, p.contentTheme, false);
    if (!bucket.byPlatform.has(platformKey)) {
      bucket.byPlatform.set(platformKey, { kols: new Set(), records: 0, views: 0, engagement: 0, cpe: 0 });
    }
    const plat = bucket.byPlatform.get(platformKey)!;
    plat.kols.add(p.kolId);
    plat.records += 1;
    plat.views += p.organicViews;
    plat.engagement += p.totalEngagement;
  }

  const result = [...map.values()].sort((a, b) => b.key.localeCompare(a.key));
  for (const b of result) {
    b.cpe = b.engagement > 0 ? b.spend / b.engagement : 0;

    const kolSet = new Set<string>();
    for (const row of b.byPlatform.values()) {
      row.cpe = row.engagement > 0 ? b.spend / row.engagement : 0;
      row.kols.forEach((id) => kolSet.add(id));
    }
    for (const row of b.byTheme.values()) {
      row.cpe = row.engagement > 0 ? b.spend / row.engagement : 0;
    }
    b.collabKols = kolSet.size;
  }

  return result;
}

function summarizeTotal(posts: PostPerformanceRow[]): PerformanceSummary {
  const kolIds = new Set<string>();
  let views = 0;
  let engagement = 0;
  let spend = 0;

  for (const post of posts) {
    kolIds.add(post.kolId);
    views += post.organicViews;
    engagement += post.totalEngagement;
    spend += post.price;
  }

  return {
    collabKols: kolIds.size,
    records: posts.length,
    views,
    engagement,
    spend,
    cpe: engagement > 0 ? spend / engagement : 0,
  };
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

function TrendChart({
  buckets,
  selectedKey,
  onSelect,
}: {
  buckets: BucketSummary[];
  selectedKey?: string | null;
  onSelect?: (key: string | null) => void;
}) {
  if (buckets.length === 0) return null;
  const series = [...buckets].reverse().slice(-12);
  const max = Math.max(...series.map((b) => b.records), 1);
  const w = 980;
  const h = 300;
  const padL = 46;
  const padR = 24;
  const padT = 22;
  const padB = 38;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const slot = plotW / Math.max(series.length, 1);
  const barW = Math.max(8, Math.min(28, slot * 0.58));

  const points = series.map((b, i) => {
    const x = padL + i * slot + slot / 2;
    const y = padT + (1 - b.records / max) * plotH;
    return `${x},${y}`;
  });

  return (
    <div className="mt-4 rounded-xl border border-mint-50 bg-mint-50/30 p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs text-zinc-500">合作网红数</p>
        <p className="text-[10px] text-zinc-400">
          {onSelect ? "点击月份查看该月汇总" : "蓝绿色柱状 + 深青折线"}
        </p>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-[260px] w-full">
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = padT + t * plotH;
          const v = Math.round((1 - t) * max);
          return (
            <g key={t}>
              <line x1={padL} x2={w - padR} y1={y} y2={y} stroke="#e8e8ef" />
              <text x={8} y={y + 4} fill="#8b8b98" fontSize={10}>
                {v}
              </text>
            </g>
          );
        })}
        {series.map((b, i) => {
          const x = padL + i * slot + (slot - barW) / 2;
          const barH = (b.records / max) * plotH;
          const selected = selectedKey === b.key;
          return (
            <g
              key={b.key}
              className={onSelect ? "cursor-pointer" : undefined}
              onClick={() => onSelect?.(selected ? null : b.key)}
              role={onSelect ? "button" : undefined}
              tabIndex={onSelect ? 0 : undefined}
              aria-label={onSelect ? `查看 ${b.label} 汇总` : undefined}
              onKeyDown={(event) => {
                if (onSelect && (event.key === "Enter" || event.key === " ")) {
                  event.preventDefault();
                  onSelect(selected ? null : b.key);
                }
              }}
            >
              {onSelect && (
                <rect
                  x={padL + i * slot}
                  y={padT}
                  width={slot}
                  height={plotH + padB}
                  fill="transparent"
                />
              )}
              <rect
                x={x}
                y={padT + plotH - barH}
                width={barW}
                height={barH}
                fill={selected ? "#e8879b" : "#5fc8b5"}
                opacity={selected ? "1" : "0.85"}
                rx={3}
              />
              <text
                x={x + barW / 2}
                y={h - 10}
                textAnchor="middle"
                fill="#8b8b98"
                fontSize={10}
              >
                {b.label}
              </text>
            </g>
          );
        })}
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke="#2e7d74"
          strokeWidth={2.4}
        />
        {series.map((b, i) => {
          const x = padL + i * slot + slot / 2;
          const y = padT + (1 - b.records / max) * plotH;
          return <circle key={`pt-${b.key}`} cx={x} cy={y} r={2.8} fill="#2e7d74" />;
        })}
      </svg>
    </div>
  );
}

export function PostPerformanceClient() {
  const defaultRange = useMemo(() => monthRange(), []);
  const [period, setPeriod] = useState<Period>("month");
  const [selectedBucketKey, setSelectedBucketKey] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    ...defaultPostFilters,
    dateFrom: defaultRange.dateFrom,
    dateTo: defaultRange.dateTo,
  });
  const { sortBy, sortOrder, toggleSort } = useSortState<PostSortField>("er", "desc");

  const [features, setFeatures] = useState<string[]>([]);
  const [allPosts, setAllPosts] = useState<PostPerformanceRow[]>([]);
  const [posts, setPosts] = useState<PostPerformanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/kols?withOptions=1&limit=1")
      .then((r) => r.json())
      .then((d) => setFeatures(d.options?.features ?? []));

    fetch("/api/posts?all=1&sortBy=publishedAt&sortOrder=desc")
      .then((r) => r.json())
      .then((d) => setAllPosts(d.posts ?? []));
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.q) params.set("q", filters.q);
      if (filters.platform) params.set("platform", filters.platform);
      if (filters.feature) params.set("feature", filters.feature);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      const res = await fetch(`/api/posts?${params}`);
      const data = await res.json();
      setPosts(data.posts ?? []);
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, sortOrder]);

  useEffect(() => {
    const timer = setTimeout(fetchPosts, 250);
    return () => clearTimeout(timer);
  }, [fetchPosts]);

  const buckets = useMemo(
    () => filterBucketsWithinNow(summarize(allPosts, period), period),
    [allPosts, period],
  );
  const displayBuckets = useMemo(
    () => (period === "week" ? bestWeeksByMonth(buckets) : buckets),
    [buckets, period],
  );
  const historicalSummary = useMemo(() => summarizeTotal(allPosts), [allPosts]);
  const selectedBucket = useMemo(
    () =>
      selectedBucketKey
        ? displayBuckets.find((bucket) => bucket.key === selectedBucketKey) ?? null
        : null,
    [displayBuckets, selectedBucketKey],
  );
  const activeSummary: PerformanceSummary = selectedBucket ?? historicalSummary;

  const themeRanking = useMemo(() => {
    const map = new Map<
      string,
      { kols: Set<string>; records: number; views: number; engagement: number; spend: number }
    >();
    for (const p of allPosts) {
      if (!map.has(p.feature)) {
        map.set(p.feature, { kols: new Set(), records: 0, views: 0, engagement: 0, spend: 0 });
      }
      const row = map.get(p.feature)!;
      row.kols.add(p.kolId);
      row.records += 1;
      row.views += p.organicViews;
      row.engagement += p.totalEngagement;
      row.spend += p.price;
    }
    return [...map.entries()]
      .map(([name, v]) => ({
        name,
        kols: v.kols.size,
        records: v.records,
        views: v.views,
        engagement: v.engagement,
        cpe: v.engagement > 0 ? v.spend / v.engagement : 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  }, [allPosts]);

  const platformRanking = useMemo(() => {
    const map = new Map<
      string,
      { kols: Set<string>; records: number; views: number; engagement: number; spend: number }
    >();
    for (const p of allPosts) {
      const key = displayPlatform(p.platform, p.contentTheme, false);
      if (!map.has(key)) {
        map.set(key, { kols: new Set(), records: 0, views: 0, engagement: 0, spend: 0 });
      }
      const row = map.get(key)!;
      row.kols.add(p.kolId);
      row.records += 1;
      row.views += p.organicViews;
      row.engagement += p.totalEngagement;
      row.spend += p.price;
    }
    return [...map.entries()]
      .map(([name, v]) => ({
        name,
        kols: v.kols.size,
        records: v.records,
        views: v.views,
        engagement: v.engagement,
        cpe: v.engagement > 0 ? v.spend / v.engagement : 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  }, [allPosts]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">成效分析</h2>
            <p className="text-xs text-zinc-500">
              {selectedBucket
                ? `${selectedBucket.label} 汇总数据`
                : "全部历史数据汇总"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedBucket && (
              <button
                type="button"
                onClick={() => setSelectedBucketKey(null)}
                className="text-xs font-medium text-mint-700 hover:underline"
              >
                查看全部历史
              </button>
            )}
            <div className="inline-flex rounded-lg border border-[var(--border)] bg-mint-50 p-1">
              <button
                type="button"
                onClick={() => {
                  setPeriod("month");
                  setSelectedBucketKey(null);
                }}
                className={`rounded-md px-3 py-1.5 text-xs ${period === "month" ? "bg-white font-medium text-mint-700" : "text-zinc-600"}`}
              >
                月
              </button>
              <button
                type="button"
                onClick={() => {
                  setPeriod("week");
                  setSelectedBucketKey(null);
                }}
                className={`rounded-md px-3 py-1.5 text-xs ${period === "week" ? "bg-white font-medium text-mint-700" : "text-zinc-600"}`}
              >
                周
              </button>
            </div>
          </div>
        </div>

        {allPosts.length > 0 ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <StatCard label="合作网红" value={formatNumber(activeSummary.collabKols)} />
              <StatCard label="合作/推送记录" value={formatNumber(activeSummary.records)} />
              <StatCard label="总曝光" value={formatNumber(activeSummary.views)} />
              <StatCard label="总互动" value={formatNumber(activeSummary.engagement)} />
              <StatCard label="花费" value={formatCurrency(activeSummary.spend)} />
              <StatCard label="CPE" value={`JPY ${activeSummary.cpe.toFixed(1)}`} />
            </div>

            <TrendChart
              buckets={displayBuckets}
              selectedKey={selectedBucketKey}
              onSelect={period === "month" ? setSelectedBucketKey : undefined}
            />
          </>
        ) : (
          <p className="py-8 text-center text-sm text-zinc-500">暂无汇总数据</p>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-900">
          {period === "month" ? "每月汇总成效记录" : "每月表现最佳周对比"}
        </h3>
        {period === "week" && (
          <p className="mt-1 text-xs text-zinc-500">
            周维度仅保留每月合作网红数最高的一周
          </p>
        )}
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-mint-50/60 text-left text-xs text-zinc-500">
              <tr>
                <th className="px-3 py-2">周期</th>
                <th className="px-3 py-2 text-right">合作网红</th>
                <th className="px-3 py-2 text-right">记录</th>
                <th className="px-3 py-2 text-right">曝光</th>
                <th className="px-3 py-2 text-right">互动</th>
                <th className="px-3 py-2 text-right">花费</th>
                <th className="px-3 py-2 text-right">CPE</th>
              </tr>
            </thead>
            <tbody>
              {displayBuckets.map((b) => (
                <tr key={b.key} className="border-t border-mint-50 hover:bg-mint-50/40">
                  <td className="px-3 py-2">{b.label}</td>
                  <td className="px-3 py-2 text-right">{formatNumber(b.collabKols)}</td>
                  <td className="px-3 py-2 text-right">{formatNumber(b.records)}</td>
                  <td className="px-3 py-2 text-right">{formatNumber(b.views)}</td>
                  <td className="px-3 py-2 text-right">{formatNumber(b.engagement)}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(b.spend)}</td>
                  <td className="px-3 py-2 text-right">JPY {b.cpe.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <RankingCard title="主题成效排行" rows={themeRanking} />
        <RankingCard title="平台成效排行" rows={platformRanking} />
      </section>

      <section className="space-y-4">
        <KolFilters
          filters={filters}
          features={features}
          onChange={setFilters}
          onReset={() => setFilters({ ...defaultPostFilters, ...monthRange() })}
          variant="post"
        />

        <div className="rounded-2xl border border-[var(--border)] bg-white shadow-sm">
          <div className="border-b border-mint-50 px-4 py-3 text-sm text-zinc-500">
            当前筛选贴文 · 共 {posts.length} 篇
          </div>
          {loading ? (
            <p className="py-10 text-center text-sm text-zinc-500">加载中...</p>
          ) : posts.length === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-500">暂无贴文数据</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-xs xl:text-sm">
                <colgroup>
                  <col className="w-[8%]" />
                  <col className="w-[11%]" />
                  <col className="w-[8%]" />
                  <col className="w-[11%]" />
                  <col className="w-[8%]" />
                  <col className="w-[6%]" />
                  <col className="w-[6%]" />
                  <col className="w-[6%]" />
                  <col className="w-[6%]" />
                  <col className="w-[8%]" />
                  <col className="w-[6%]" />
                  <col className="w-[9%]" />
                  <col className="w-[7%]" />
                </colgroup>
                <thead className="bg-mint-50/60 text-left text-xs text-zinc-500">
                  <tr>
                    <SortableHeader label="日期" field="publishedAt" activeField={sortBy} order={sortOrder} onSort={toggleSort} compact />
                    <th className="px-2 py-3 text-left text-xs font-medium text-zinc-500">达人</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-zinc-500">平台</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-zinc-500">推广主题</th>
                    <SortableHeader label="曝光" field="organicViews" activeField={sortBy} order={sortOrder} onSort={toggleSort} align="right" compact />
                    <SortableHeader label="点赞" field="likes" activeField={sortBy} order={sortOrder} onSort={toggleSort} align="right" compact />
                    <th className="px-2 py-3 text-right text-xs font-medium text-zinc-500">评论</th>
                    <th className="px-2 py-3 text-right text-xs font-medium text-zinc-500">转发</th>
                    <SortableHeader label="收藏" field="saves" activeField={sortBy} order={sortOrder} onSort={toggleSort} align="right" compact />
                    <SortableHeader label="总互动" field="totalEngagement" activeField={sortBy} order={sortOrder} onSort={toggleSort} align="right" compact />
                    <SortableHeader label="ER" field="er" activeField={sortBy} order={sortOrder} onSort={toggleSort} align="right" compact />
                    <SortableHeader label="价格" field="price" activeField={sortBy} order={sortOrder} onSort={toggleSort} align="right" compact />
                    <th className="px-2 py-3 text-left text-xs font-medium text-zinc-500">链接</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => {
                    const views = formatViews(
                      post.organicViews,
                      post.platform,
                      post.totalEngagement,
                      post.viewsHidden,
                    );
                    return (
                      <tr key={post.id} className="border-t border-mint-50 hover:bg-mint-50/40">
                        <td className="overflow-hidden whitespace-nowrap px-2 py-3">
                          {formatPostDate(post.publishedAt)}
                        </td>
                        <td className="overflow-hidden px-2 py-3">
                          <Link
                            href={`/kols/${post.kolId}`}
                            title={post.name}
                            className="block truncate font-medium text-mint-600 hover:underline"
                          >
                            {post.name}
                          </Link>
                          <p className="truncate text-xs text-zinc-400" title={`@${post.handle}`}>
                            @{post.handle}
                          </p>
                        </td>
                        <td className="truncate px-2 py-3">{displayPlatform(post.platform, post.contentTheme, true)}</td>
                        <td className="truncate px-2 py-3" title={post.feature}>{post.feature}</td>
                        <td className={`px-2 py-3 text-right ${views.hidden ? "font-medium text-amber-600" : ""}`}>
                          {views.text}
                        </td>
                        <td className="px-2 py-3 text-right">{formatNumber(post.likes)}</td>
                        <td className="px-2 py-3 text-right">{formatNumber(post.comments)}</td>
                        <td className="px-2 py-3 text-right">{formatNumber(post.shares)}</td>
                        <td className="px-2 py-3 text-right">{formatNumber(post.saves)}</td>
                        <td className="px-2 py-3 text-right">{formatNumber(post.totalEngagement)}</td>
                        <td className="px-2 py-3 text-right font-medium text-mint-600">{post.er.toFixed(2)}%</td>
                        <td className="px-2 py-3 text-right">{formatCurrency(post.price)}</td>
                        <td className="px-2 py-3">
                          <a href={post.postUrl} target="_blank" rel="noopener noreferrer" className="text-mint-600 hover:underline">
                            打开
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function RankingCard({
  title,
  rows,
}: {
  title: string;
  rows: { name: string; kols: number; records: number; views: number; engagement: number; cpe: number }[];
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-mint-50/60 text-left text-xs text-zinc-500">
            <tr>
              <th className="px-3 py-2">分类</th>
              <th className="px-3 py-2 text-right">合作网红</th>
              <th className="px-3 py-2 text-right">记录</th>
              <th className="px-3 py-2 text-right">曝光</th>
              <th className="px-3 py-2 text-right">CPE</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-mint-50">
                <td className="px-3 py-2 font-medium text-zinc-800">{r.name}</td>
                <td className="px-3 py-2 text-right">{formatNumber(r.kols)}</td>
                <td className="px-3 py-2 text-right">{formatNumber(r.records)}</td>
                <td className="px-3 py-2 text-right">{formatNumber(r.views)}</td>
                <td className="px-3 py-2 text-right">JPY {r.cpe.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
