import type { DashboardMetrics } from "@/lib/types";
import { PLATFORM_LABELS } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/utils";

export function MetricsCards({ metrics }: { metrics: DashboardMetrics }) {
  const cards = [
    { label: "合作达人", value: formatNumber(metrics.totalKols), sub: "2025.7 – 2026.6" },
    { label: "合作发文", value: formatNumber(metrics.totalCollabs), sub: "2025.7 – 2026.6" },
    { label: "总合作价格（日元）", value: formatCurrency(metrics.totalSpend), sub: "合作价格(JPY)" },
    { label: "平均合作价格", value: formatCurrency(metrics.avgPrice), sub: "单次合作" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <p className="text-sm text-zinc-500">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{card.value}</p>
            <p className="mt-1 text-xs text-zinc-400">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-medium text-zinc-700">平台分布</h3>
          <div className="mt-3 space-y-2">
            {metrics.platformBreakdown.map((item) => (
              <div key={item.platform} className="flex items-center justify-between text-sm">
                <span className="text-zinc-600">{PLATFORM_LABELS[item.platform]}</span>
                <span className="font-medium text-zinc-900">{item.count} 篇</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-medium text-zinc-700">热门推广功能</h3>
          <div className="mt-3 space-y-2">
            {metrics.topFeatures.map((item) => (
              <div key={item.feature} className="flex items-center justify-between text-sm">
                <span className="text-zinc-600">{item.feature}</span>
                <span className="font-medium text-zinc-900">{item.count} 次</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
