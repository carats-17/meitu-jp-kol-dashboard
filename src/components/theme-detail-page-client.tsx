"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import type { KolBubblePoint } from "@/lib/analytics-service";
import type { FeatureCollabRow } from "@/lib/insights-service";
import { BubbleChart, type BubbleDatum } from "@/components/bubble-chart";
import { SortableHeader, useSortState } from "@/components/sortable-header";
import { displayPlatform, formatViews } from "@/lib/platform-display";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

type DetailSortField =
  | "publishedAt"
  | "organicViews"
  | "likes"
  | "totalEngagement"
  | "er"
  | "price";

export function ThemeDetailPageClient({ feature }: { feature: string }) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { sortBy, sortOrder, toggleSort } = useSortState<DetailSortField>("totalEngagement", "desc");
  const [kols, setKols] = useState<KolBubblePoint[]>([]);
  const [collabs, setCollabs] = useState<FeatureCollabRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const [bubbleRes, collabRes] = await Promise.all([
        fetch(`/api/themes/${encodeURIComponent(feature)}/bubbles?${params}`),
        fetch(`/api/features/${encodeURIComponent(feature)}?${params}`),
      ]);
      const bubbleData = await bubbleRes.json();
      const collabData = await collabRes.json();
      setKols(bubbleData.kols ?? []);
      setCollabs(collabData.collabs ?? []);
    } finally {
      setLoading(false);
    }
  }, [feature, dateFrom, dateTo]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 200);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const sortedCollabs = useMemo(() => {
    const order = sortOrder === "asc" ? 1 : -1;
    return [...collabs].sort((a, b) => {
      let av: number | string = 0;
      let bv: number | string = 0;
      switch (sortBy) {
        case "publishedAt":
          av = a.publishedAt;
          bv = b.publishedAt;
          break;
        case "organicViews":
          av = a.organicViews;
          bv = b.organicViews;
          break;
        case "likes":
          av = a.likes ?? 0;
          bv = b.likes ?? 0;
          break;
        case "er":
          av = a.er;
          bv = b.er;
          break;
        case "price":
          av = a.price;
          bv = b.price;
          break;
        default:
          av = a.totalEngagement;
          bv = b.totalEngagement;
      }
      return av === bv ? 0 : av > bv ? order : -order;
    });
  }, [collabs, sortBy, sortOrder]);

  const kolSummary = useMemo(() => {
    const map = new Map<string, KolBubblePoint>();
    for (const k of kols) map.set(k.kolId, k);
    return map;
  }, [kols]);

  const bubbles: BubbleDatum[] = kols.map((k) => ({
    id: k.kolId,
    label: k.handle,
    x: k.totalSpend,
    y: k.totalEngagement,
    size: k.postCount,
    href: `/kols/${k.kolId}`,
  }));

  const totalSpend = collabs.reduce((s, c) => s + c.price, 0);

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="space-y-6">
      <Link href="/themes" className="text-sm text-mint-600 hover:underline">
        ← 返回主题层级
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-[var(--border)] bg-white p-4">
        <div className="flex flex-wrap gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-mint-400"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-mint-400"
          />
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border border-mint-200 bg-mint-50 px-3 py-2 text-xs font-medium text-mint-600 hover:bg-mint-100"
          >
            清除筛选
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="发文总数" value={String(collabs.length)} />
        <Stat label="参与达人" value={String(kols.length)} />
        <Stat label="总合作价格" value={formatCurrency(totalSpend)} />
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">加载中...</p>
      ) : (
        <>
          <section>
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">达人分布 · {feature}</h2>
            <BubbleChart
              points={bubbles}
              xLabel="合作花费 JPY"
              yLabel="总互动量"
              sizeLabel="发文数"
              emptyText="该主题下暂无达人数据"
              title={`${feature} · 达人层级`}
            />
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-white shadow-sm">
            <div className="border-b border-mint-50 px-4 py-3">
              <h2 className="text-sm font-semibold text-zinc-900">达人发文明细看板</h2>
              <p className="mt-0.5 text-xs text-zinc-500">按达人汇总 + 单篇明细，点击表头排序</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-mint-50/60 text-left text-xs text-zinc-500">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">达人</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">平台</th>
                    <SortableHeader label="发文日期" field="publishedAt" activeField={sortBy} order={sortOrder} onSort={toggleSort} />
                    <SortableHeader label="曝光" field="organicViews" activeField={sortBy} order={sortOrder} onSort={toggleSort} align="right" />
                    <SortableHeader label="点赞" field="likes" activeField={sortBy} order={sortOrder} onSort={toggleSort} align="right" />
                    <th className="px-3 py-2 text-right text-xs font-medium text-zinc-500">评论</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-zinc-500">转发</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-zinc-500">收藏</th>
                    <SortableHeader label="总互动" field="totalEngagement" activeField={sortBy} order={sortOrder} onSort={toggleSort} align="right" />
                    <SortableHeader label="ER" field="er" activeField={sortBy} order={sortOrder} onSort={toggleSort} align="right" />
                    <SortableHeader label="价格" field="price" activeField={sortBy} order={sortOrder} onSort={toggleSort} align="right" />
                    <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">链接</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCollabs.map((c, idx) => {
                    const summary = kolSummary.get(c.kolId);
                    const prev = idx > 0 ? sortedCollabs[idx - 1] : null;
                    const isNewKol = !prev || prev.kolId !== c.kolId;
                    const views = formatViews(
                      c.organicViews,
                      c.platform,
                      c.totalEngagement,
                      c.viewsHidden,
                    );
                    return (
                      <Fragment key={c.id}>
                        {isNewKol && summary && (
                          <tr className="bg-mint-50/80">
                            <td colSpan={12} className="px-3 py-2">
                              <div className="flex flex-wrap items-center gap-4 text-xs">
                                <Link
                                  href={`/kols/${c.kolId}`}
                                  className="font-semibold text-mint-700 hover:underline"
                                >
                                  @{c.handle}
                                </Link>
                                <span className="text-zinc-500">
                                  {summary.postCount} 篇 · 总互动 {formatNumber(summary.totalEngagement)} · 平均 ER {summary.avgEr.toFixed(2)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}
                        <tr className="border-t border-mint-50 hover:bg-mint-50/30">
                          <td className="px-3 py-2 pl-6 text-zinc-400">└</td>
                          <td className="px-3 py-2">
                            {displayPlatform(c.platform, c.contentTheme, true)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">{formatDate(c.publishedAt)}</td>
                          <td className={`px-3 py-2 text-right ${views.hidden ? "font-medium text-amber-600" : ""}`}>
                            {views.text}
                          </td>
                          <td className="px-3 py-2 text-right">{formatNumber(c.likes ?? 0)}</td>
                          <td className="px-3 py-2 text-right">{formatNumber(c.comments ?? 0)}</td>
                          <td className="px-3 py-2 text-right">{formatNumber(c.shares ?? 0)}</td>
                          <td className="px-3 py-2 text-right">{formatNumber(c.saves ?? 0)}</td>
                          <td className="px-3 py-2 text-right">{formatNumber(c.totalEngagement)}</td>
                          <td className="px-3 py-2 text-right text-mint-600">{c.er.toFixed(2)}%</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(c.price)}</td>
                          <td className="px-3 py-2">
                            <a
                              href={c.postUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-mint-600 hover:underline"
                            >
                              打开
                            </a>
                          </td>
                        </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-zinc-900">{value}</p>
    </div>
  );
}
