"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { WeekOverWeekFeature, WeekOverWeekSummary } from "@/lib/insights-service";
import { formatNumber } from "@/lib/utils";

const STATUS_LABELS: Record<WeekOverWeekFeature["status"], string> = {
  new: "本周新增",
  stopped: "本周停止",
  continued: "持续推广",
};

const STATUS_STYLES: Record<WeekOverWeekFeature["status"], string> = {
  new: "bg-emerald-50 text-emerald-700 border-emerald-100",
  stopped: "bg-zinc-100 text-zinc-600 border-zinc-200",
  continued: "bg-blue-50 text-blue-700 border-blue-100",
};

function Delta({ value, suffix = "" }: { value: number; suffix?: string }) {
  if (value === 0) return <span className="text-zinc-400">—</span>;
  const positive = value > 0;
  return (
    <span className={positive ? "text-emerald-600" : "text-rose-600"}>
      {positive ? "+" : ""}
      {suffix === "%" ? value.toFixed(2) : formatNumber(value)}
      {suffix}
    </span>
  );
}

function BarCompare({
  thisVal,
  lastVal,
  thisLabel = "基准",
  lastLabel = "对比",
}: {
  thisVal: number;
  lastVal: number;
  thisLabel?: string;
  lastLabel?: string;
}) {
  const max = Math.max(thisVal, lastVal, 1);
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[48px_1fr_64px] items-center gap-2 text-xs">
        <span className="text-zinc-500">{thisLabel}</span>
        <div className="h-2.5 overflow-hidden rounded-full bg-rose-50">
          <div
            className="h-full rounded-full bg-rose-500"
            style={{ width: `${(thisVal / max) * 100}%` }}
          />
        </div>
        <span className="text-right font-medium text-zinc-900">
          {formatNumber(thisVal)}
        </span>
      </div>
      <div className="grid grid-cols-[48px_1fr_64px] items-center gap-2 text-xs">
        <span className="text-zinc-500">{lastLabel}</span>
        <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-zinc-400"
            style={{ width: `${(lastVal / max) * 100}%` }}
          />
        </div>
        <span className="text-right font-medium text-zinc-700">
          {formatNumber(lastVal)}
        </span>
      </div>
    </div>
  );
}

function dateOffset(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function MetricCard({
  label,
  current,
  previous,
  suffix = "",
}: {
  label: string;
  current: number;
  previous: number;
  suffix?: string;
}) {
  const delta = current - previous;
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-zinc-500">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="text-2xl font-semibold text-zinc-900">
          {suffix === "%" ? current.toFixed(2) : formatNumber(current)}
          {suffix}
        </p>
        <p className="text-sm font-medium">
          <Delta value={delta} suffix={suffix} />
        </p>
      </div>
      <p className="mt-1 text-xs text-zinc-400">
        对比期：{suffix === "%" ? previous.toFixed(2) : formatNumber(previous)}
        {suffix}
      </p>
    </div>
  );
}

export function WeeklyWow() {
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [anchorDate, setAnchorDate] = useState(() => dateOffset(0));
  const [compareDate, setCompareDate] = useState(() => dateOffset(-7));
  const [data, setData] = useState<WeekOverWeekSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(
      `/api/insights/wow?anchorDate=${anchorDate}&compareDate=${compareDate}&period=${period}`,
    )
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [anchorDate, compareDate, period]);

  const grouped = useMemo(() => {
    const groups: Record<WeekOverWeekFeature["status"], WeekOverWeekFeature[]> = {
      new: [],
      stopped: [],
      continued: [],
    };
    for (const feature of data?.features ?? []) {
      groups[feature.status].push(feature);
    }
    return groups;
  }, [data]);

  if (loading) {
    return <p className="text-center text-sm text-zinc-500">加载周对比数据...</p>;
  }

  if (!data?.thisWeek) {
    return (
      <p className="text-center text-sm text-zinc-500">
        暂无周数据，请先导入合作记录
      </p>
    );
  }

  const topFeatures = data.features
    .filter((f) => f.status !== "stopped")
    .sort((a, b) => {
      const statusOrder = { new: 0, continued: 1, stopped: 2 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      return b.thisWeek.engagement - a.thisWeek.engagement;
    })
    .slice(0, 10);
  const periodLabel = period === "week" ? "基准周" : "基准月";
  const lastPeriodLabel = period === "week" ? "对比周" : "对比月";

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3 text-sm">
          <div className="flex rounded-lg bg-zinc-100 p-1">
            {(["week", "month"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setPeriod(value);
                  if (value === "week") setCompareDate(dateOffset(-7));
                }}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  period === value
                    ? "bg-white text-rose-600 shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {value === "week" ? "每周成效" : "每月成效"}
              </button>
            ))}
          </div>
          <label className="space-y-1">
            <span className="block text-xs text-zinc-500">基准日期</span>
            <input
              type="date"
              value={anchorDate}
              onChange={(e) => setAnchorDate(e.target.value)}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
            />
          </label>
          <label className="space-y-1">
            <span className="block text-xs text-zinc-500">对比日期</span>
            <input
              type="date"
              value={compareDate}
              onChange={(e) => setCompareDate(e.target.value)}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
            />
          </label>
          <div className="rounded-lg bg-rose-50 px-4 py-3">
            <p className="text-xs text-rose-500">{periodLabel}</p>
            <p className="font-semibold text-zinc-900">{data.thisWeek.weekLabel}</p>
          </div>
          <div className="rounded-lg bg-zinc-50 px-4 py-3">
            <p className="text-xs text-zinc-500">{lastPeriodLabel}</p>
            <p className="font-semibold text-zinc-700">{data.lastWeek?.weekLabel}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="发布条数"
          current={data.thisWeek.postCount}
          previous={data.lastWeek?.postCount ?? 0}
        />
        <MetricCard
          label="总浏览量"
          current={data.thisWeek.totalViews}
          previous={data.lastWeek?.totalViews ?? 0}
        />
        <MetricCard
          label="总互动量"
          current={data.thisWeek.totalEngagement}
          previous={data.lastWeek?.totalEngagement ?? 0}
        />
        <MetricCard
          label="平均 ER"
          current={data.thisWeek.avgEr}
          previous={data.lastWeek?.avgEr ?? 0}
          suffix="%"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          {(["new", "continued"] as const).map((status) => (
            <div
              key={status}
              className={`rounded-xl border p-4 ${STATUS_STYLES[status]}`}
            >
              <p className="text-xs font-medium">{STATUS_LABELS[status]}</p>
              <p className="mt-1 text-3xl font-semibold">{grouped[status].length}</p>
              <p className="mt-2 text-xs leading-5">
                {grouped[status].slice(0, 8).map((f) => f.feature).join("、") || "无"}
              </p>
            </div>
          ))}
          {grouped.stopped.length > 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs font-medium text-zinc-500">
                暂停推广（仅提示）
              </p>
              <p className="mt-2 line-clamp-4 text-xs leading-5 text-zinc-500">
                {grouped.stopped.map((f) => f.feature).join("、")}
              </p>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">
                重点推广功能对比
              </h3>
              <p className="mt-1 text-xs text-zinc-500">
                玫红为{periodLabel}，灰色为{lastPeriodLabel}；优先展示新增和持续推广。
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {topFeatures.map((f) => (
              <div key={f.feature} className="rounded-xl bg-zinc-50 p-3">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <Link
                    href={`/themes/${encodeURIComponent(f.feature)}`}
                    className="text-sm font-medium text-rose-600 hover:underline"
                  >
                    {f.feature}
                  </Link>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${STATUS_STYLES[f.status]}`}
                  >
                    {STATUS_LABELS[f.status]}
                  </span>
                </div>
                <BarCompare
                  thisVal={f.thisWeek.engagement}
                  lastVal={f.lastWeek.engagement}
                  thisLabel="基准"
                  lastLabel="对比"
                />
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg bg-white p-2">
                    <p className="text-zinc-500">发布条数</p>
                    <p className="mt-0.5 font-medium text-zinc-900">
                      {f.thisWeek.posts} <Delta value={f.postsDelta} />
                    </p>
                  </div>
                  <div className="rounded-lg bg-white p-2">
                    <p className="text-zinc-500">浏览量</p>
                    <p className="mt-0.5 font-medium text-zinc-900">
                      {formatNumber(f.thisWeek.views)}{" "}
                      <Delta value={f.thisWeek.views - f.lastWeek.views} />
                    </p>
                  </div>
                  <div className="rounded-lg bg-white p-2">
                    <p className="text-zinc-500">ER</p>
                    <p className="mt-0.5 font-medium text-zinc-900">
                      {f.thisWeek.er.toFixed(2)}%{" "}
                      <Delta value={f.erDelta} suffix="%" />
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {topFeatures.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">
                这个日期范围内没有新增或持续推广的功能。
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        ER = 总互动数 / 自然量曝光数；没有曝光数时才用浏览量，再没有时用粉丝数兜底。
      </p>
    </div>
  );
}
