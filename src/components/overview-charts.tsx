"use client";

import type { LibraryOverview } from "@/lib/analytics-service";
import { PLATFORM_LABELS } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/utils";

const PLATFORM_COLORS = ["#6ecfb8", "#7eb8da", "#9ed4a8", "#f0c987"];

export function OverviewCharts({ overview }: { overview: LibraryOverview }) {
  const platformTotal = overview.platformBreakdown.reduce((s, p) => s + p.count, 0);
  const followerMax = Math.max(...overview.followerBuckets.map((b) => b.count), 1);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "合作达人", value: formatNumber(overview.totalKols) },
          { label: "合作发文", value: formatNumber(overview.totalCollabs) },
          { label: "总合作价格", value: formatCurrency(overview.totalSpend) },
          { label: "平均单次合作价格", value: formatCurrency(overview.avgPrice) },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-zinc-500">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-900">平台分布</h3>
          <p className="mt-1 text-xs text-zinc-500">按发文条数统计</p>
          <div className="mt-5 flex items-center gap-6">
            <div
              className="relative h-36 w-36 shrink-0 rounded-full"
              style={{
                background: `conic-gradient(${overview.platformBreakdown
                  .map((p, i, arr) => {
                    const start = arr.slice(0, i).reduce((s, x) => s + x.pct, 0);
                    return `${PLATFORM_COLORS[i % PLATFORM_COLORS.length]} ${start}% ${start + p.pct}%`;
                  })
                  .join(", ")})`,
              }}
            >
              <div className="absolute inset-5 flex items-center justify-center rounded-full bg-white text-center text-xs text-zinc-500">
                共
                <br />
                {platformTotal}
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {overview.platformBreakdown.map((item) => (
                <div key={item.platform} className="flex justify-between gap-6">
                  <span className="text-zinc-600">{PLATFORM_LABELS[item.platform]}</span>
                  <span className="font-medium text-zinc-900">
                    {item.count} ({item.pct.toFixed(0)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-900">粉丝量级分布</h3>
          <p className="mt-1 text-xs text-zinc-500">达人粉丝分层</p>
          <div className="mt-5 space-y-3">
            {overview.followerBuckets.map((bucket) => (
              <div key={bucket.label}>
                <div className="mb-1 flex justify-between text-xs text-zinc-600">
                  <span>{bucket.label}</span>
                  <span>{bucket.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-mint-100">
                  <div
                    className="h-full rounded-full bg-mint-400"
                    style={{ width: `${(bucket.count / followerMax) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-900">热门推广主题</h3>
          <p className="mt-1 text-xs text-zinc-500">历史合作 Top 8</p>
          <div className="mt-5 space-y-2">
            {overview.topFeatures.map((item, idx) => (
              <div key={item.feature} className="flex items-center gap-2 text-sm">
                <span className="w-5 text-xs text-zinc-400">{idx + 1}</span>
                <span className="flex-1 truncate text-zinc-700">{item.feature}</span>
                <span className="font-medium text-zinc-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
