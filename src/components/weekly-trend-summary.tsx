"use client";

import { useEffect, useState } from "react";
import type { WeeklyInsight } from "@/lib/insights-service";
import { formatNumber } from "@/lib/utils";

function weeksAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n * 7);
  return d.toISOString().slice(0, 10);
}

export function WeeklyTrendSummary() {
  const [weeks, setWeeks] = useState<WeeklyInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/insights/weekly?dateFrom=${weeksAgo(28)}&dateTo=${new Date().toISOString().slice(0, 10)}`)
      .then((r) => r.json())
      .then((data: WeeklyInsight[]) => {
        setWeeks((data ?? []).slice(-4));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sm text-zinc-500">加载周趋势...</p>;
  }

  if (weeks.length === 0) {
    return <p className="text-sm text-zinc-500">近 4 周暂无发文数据</p>;
  }

  const maxPosts = Math.max(...weeks.map((w) => w.postCount), 1);
  const maxEng = Math.max(...weeks.map((w) => w.totalEngagement), 1);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <SummaryCard
          label="近 4 周发文总数"
          value={weeks.reduce((s, w) => s + w.postCount, 0)}
        />
        <SummaryCard
          label="近 4 周总互动"
          value={weeks.reduce((s, w) => s + w.totalEngagement, 0)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {weeks.map((w) => (
          <div
            key={w.weekKey}
            className="rounded-xl border border-[var(--border)] bg-white p-3 shadow-sm"
          >
            <p className="text-xs font-medium text-zinc-700">{w.weekLabel}</p>
            <div className="mt-3 space-y-2">
              <BarRow label="发文" value={w.postCount} max={maxPosts} color="bg-mint-400" />
              <BarRow
                label="互动"
                value={w.totalEngagement}
                max={maxEng}
                color="bg-teal-300"
              />
            </div>
            {w.features[0] && (
              <p className="mt-2 truncate text-[10px] text-zinc-400">
                热门：{w.features[0].feature}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-mint-50/50 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
        {formatNumber(value)}
      </p>
    </div>
  );
}

function BarRow({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-[10px] text-zinc-500">
        <span>{label}</span>
        <span>{formatNumber(value)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-mint-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  );
}
