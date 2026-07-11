"use client";

import type { KolBubblePoint, PostPerformanceRow } from "@/lib/analytics-service";
import { displayPlatform, isViewsHidden } from "@/lib/platform-display";
import { PLATFORM_LABELS } from "@/lib/types";
import type { Platform } from "@prisma/client";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { ThemeFilterState } from "@/components/theme-analysis-filters";

type KolDetail = {
  id: string;
  handle: string;
  name: string;
  platform: Platform;
  followers: number | null;
};

function formatFullJpy(amount: number): string {
  return `JPY ${amount.toLocaleString("ja-JP")}`;
}

function formatPostDate(date: Date | string): string {
  const d = new Date(date);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

function postViewsHidden(c: PostPerformanceRow): boolean {
  return c.viewsHidden ?? isViewsHidden(c.platform, c.organicViews, c.totalEngagement);
}

function postFeatureLabel(feature: string): string {
  return feature.replace(/_未填写/g, "").trim() || feature;
}

function postCardTitle(feature: string, contentTheme: string): string {
  const base = postFeatureLabel(feature);
  const theme = contentTheme?.trim().replace(/_?未填写/g, "").trim();
  if (!theme || theme === "-" || theme === base) return base;
  return `${base}_${theme}`;
}

function buildFilterParams(filters: ThemeFilterState) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.platform) params.set("platform", filters.platform);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.minFollowers) params.set("minFollowers", filters.minFollowers);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  return params;
}

function formatViewsMetric(
  organicViews: number,
  platform: string,
  totalEngagement: number,
  viewsHidden?: boolean,
): string {
  const hidden = viewsHidden ?? isViewsHidden(platform, organicViews, totalEngagement);
  if (hidden) return "—";
  return organicViews.toLocaleString("ja-JP");
}

function aggregateViewsMetrics(collabs: PostPerformanceRow[]) {
  const withVisibleViews = collabs.filter((c) => !postViewsHidden(c));
  const hasHidden = collabs.some((c) => postViewsHidden(c));

  if (withVisibleViews.length === 0 && hasHidden) {
    return { totalViews: null as number | null, avgViews: null as number | null };
  }

  const totalViews = withVisibleViews.reduce((s, c) => s + c.organicViews, 0);
  const avgViews =
    withVisibleViews.length > 0
      ? Math.round(totalViews / withVisibleViews.length)
      : null;

  return { totalViews, avgViews };
}

export function KolThemeHistoryDashboard({
  feature,
  kolId,
  kolPreview,
  filters,
  onBack,
}: {
  feature: string;
  kolId: string;
  kolPreview?: KolBubblePoint | null;
  filters: ThemeFilterState;
  onBack: () => void;
}) {
  const [kol, setKol] = useState<KolDetail | null>(null);
  const [collabs, setCollabs] = useState<PostPerformanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = buildFilterParams(filters);
    Promise.all([
      fetch(`/api/kols/${kolId}`).then((r) => r.json()),
      fetch(
        `/api/themes/${encodeURIComponent(feature)}/kols/${kolId}?${params}`,
      ).then((r) => r.json()),
    ])
      .then(([kolData, themeData]) => {
        if (kolData?.id) {
          setKol({
            id: kolData.id,
            handle: kolData.handle,
            name: kolData.name,
            platform: kolData.platform,
            followers: kolData.followers,
          });
        }
        setCollabs(themeData.collabs ?? []);
      })
      .finally(() => setLoading(false));
  }, [feature, kolId, filters]);

  const metrics = useMemo(() => {
    const { totalViews, avgViews } = aggregateViewsMetrics(collabs);
    const engagement = collabs.reduce((s, c) => s + c.totalEngagement, 0);
    const spend = collabs.reduce((s, c) => s + c.price, 0);
    const prices = collabs.map((c) => c.price).filter((p) => p > 0);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;
    const er =
      collabs.length > 0
        ? collabs.reduce((s, c) => s + c.er, 0) / collabs.length
        : kolPreview?.avgEr ?? 0;
    const cpv =
      totalViews != null && totalViews > 0 ? spend / totalViews : null;
    return {
      totalViews,
      engagement,
      spend,
      avgViews,
      er,
      minPrice,
      maxPrice,
      cpv,
    };
  }, [collabs, kolPreview]);

  const handle = kol?.handle ?? kolPreview?.handle ?? "—";
  const platform = kol?.platform ?? kolPreview?.platform ?? "INSTAGRAM";
  const followers = kol?.followers ?? null;

  if (loading) {
    return <p className="py-16 text-center text-sm text-zinc-500">加载达人发文看板...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-mint-200 bg-mint-50 px-3 py-1.5 text-sm font-medium text-mint-700 hover:bg-mint-100"
        >
          ← 返回 KOL 推广层
        </button>
        <p className="text-sm text-zinc-500">
          <span className="font-medium text-zinc-800">{handle}</span>
          <span className="mx-2">/</span>
          主题：{feature}
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-mint-100 text-lg font-semibold text-mint-700">
            {handle.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-semibold text-zinc-900">{handle}</h3>
              <span className="rounded-full bg-mint-100 px-2 py-0.5 text-xs text-mint-700">
                {PLATFORM_LABELS[platform]}
              </span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                已合作
              </span>
            </div>
            <p className="mt-0.5 text-sm text-zinc-500">@{handle}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Tag text={feature} />
              <Tag text={PLATFORM_LABELS[platform]} />
              <Tag text={`记录 ${collabs.length}`} />
              <Tag text={`合作 ${collabs.length}`} />
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="粉丝数" value={followers ? formatNumber(followers) : "—"} />
          <MetricCard
            label="主题观看"
            value={
              metrics.totalViews != null
                ? metrics.totalViews.toLocaleString("ja-JP")
                : "—"
            }
          />
          <MetricCard label="互动数" value={formatNumber(metrics.engagement)} />
          <MetricCard
            label="平均观看"
            value={
              metrics.avgViews != null
                ? metrics.avgViews.toLocaleString("ja-JP")
                : "—"
            }
          />
          <MetricCard label="互动率" value={`${metrics.er.toFixed(1)}%`} />
          <MetricCard
            label="报价"
            value={
              metrics.minPrice > 0
                ? metrics.minPrice === metrics.maxPrice
                  ? formatFullJpy(metrics.minPrice)
                  : `${formatFullJpy(metrics.minPrice)} - ${formatFullJpy(metrics.maxPrice)}`
                : "—"
            }
          />
          <MetricCard label="主题花费" value={formatCurrency(metrics.spend)} />
          <MetricCard
            label="CPV"
            value={
              metrics.cpv != null
                ? `JPY ${metrics.cpv.toLocaleString("ja-JP", { maximumFractionDigits: 2 })}`
                : "—"
            }
          />
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <h4 className="text-sm font-semibold text-zinc-900">主题贴文</h4>
        <div className="mt-3 max-h-[520px] space-y-3 overflow-y-auto pr-1">
          {collabs.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">该主题下暂无发文</p>
          ) : (
            collabs.map((c) => {
              const viewsText = formatViewsMetric(
                c.organicViews,
                c.platform,
                c.totalEngagement,
                c.viewsHidden,
              );
              return (
                <div
                  key={c.id}
                  className="rounded-xl border border-mint-50 bg-mint-50/20 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-zinc-900">
                        {postCardTitle(feature, c.contentTheme)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <MiniTag>{formatPostDate(c.publishedAt)}</MiniTag>
                        <MiniTag>
                          {displayPlatform(c.platform, c.contentTheme, true)}
                        </MiniTag>
                        {c.price > 0 && <MiniTag>{formatFullJpy(c.price)}</MiniTag>}
                        <MiniTag>浏览 {viewsText}</MiniTag>
                        <MiniTag>点赞 {c.likes.toLocaleString("ja-JP")}</MiniTag>
                        <MiniTag>收藏 {c.saves.toLocaleString("ja-JP")}</MiniTag>
                      </div>
                    </div>
                    <a
                      href={c.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-sm font-medium text-mint-600 hover:underline"
                    >
                      贴文
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function Tag({ text }: { text: string }) {
  return (
    <span className="rounded-full border border-mint-100 bg-mint-50 px-2.5 py-0.5 text-xs text-mint-800">
      {text}
    </span>
  );
}

function MiniTag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded border border-zinc-200 bg-white px-2 py-0.5 text-[11px] text-zinc-600">
      {children}
    </span>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-mint-50 bg-mint-50/30 px-3 py-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-zinc-900">{value}</p>
    </div>
  );
}
