"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { WeeklyInsight } from "@/lib/insights-service";
import {
  getFridayAnchoredComparisonWeeks,
  getDefaultWeeklyCompareAnchor,
  toDateInputValue,
} from "@/lib/week-calendar";
import { formatNumber } from "@/lib/utils";

const METRIC_PANELS = [
  {
    label: "发文数",
    bg: "bg-teal-50/40",
    border: "border-teal-100",
    title: "text-teal-800",
    bar: "#4da99a",
    prevBar: "bg-teal-100",
  },
  {
    label: "总互动量",
    bg: "bg-violet-50/50",
    border: "border-violet-100",
    title: "text-violet-800",
    bar: "#8b7dd6",
    prevBar: "bg-violet-100",
  },
  {
    label: "ER≥3% 篇数",
    bg: "bg-rose-50/45",
    border: "border-rose-100",
    title: "text-rose-800",
    bar: "#c9a0a8",
    prevBar: "bg-rose-100",
  },
] as const;

const inputCls =
  "rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-mint-400";

type FeatureStatus = "new" | "stopped" | "continued" | "idle";

type ThemeCompareRow = {
  feature: string;
  status: FeatureStatus;
  curPosts: number;
  prevPosts: number;
  postsDelta: number;
  curEng: number;
  prevEng: number;
  engDelta: number;
  curShare: number;
  prevShare: number;
  shareDelta: number;
  curHighEr: number;
  prevHighEr: number;
  highErDelta: number;
  curHighErRate: number;
  prevHighErRate: number;
};

function defaultAnchorDate() {
  return getDefaultWeeklyCompareAnchor();
}

function featureStatus(curPosts: number, prevPosts: number): FeatureStatus {
  if (curPosts > 0 && prevPosts === 0) return "new";
  if (curPosts === 0 && prevPosts > 0) return "stopped";
  if (curPosts > 0 && prevPosts > 0) return "continued";
  return "idle";
}

function formatDeltaValue(delta: number, suffix = ""): string {
  if (delta === 0) return `0${suffix}`;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toLocaleString("ja-JP")}${suffix}`;
}

function formatPctChange(cur: number, prev: number): string | null {
  if (prev === 0) {
    if (cur === 0) return null;
    return "新增";
  }
  const pct = ((cur - prev) / prev) * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

function DeltaBadge({
  delta,
  pct,
  size = "sm",
  suffix = "",
}: {
  delta: number;
  pct?: string | null;
  size?: "sm" | "xs";
  suffix?: string;
}) {
  if (delta === 0 && !pct) {
    return (
      <span className={`text-zinc-400 ${size === "xs" ? "text-[10px]" : "text-xs"}`}>持平</span>
    );
  }
  const up = delta > 0;
  const down = delta < 0;
  const cls = up
    ? "text-emerald-700 bg-emerald-50"
    : down
      ? "text-rose-700 bg-rose-50"
      : "text-zinc-500 bg-zinc-100";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${cls} ${
        size === "xs" ? "text-[10px]" : "text-xs"
      }`}
    >
      {up ? "↑" : down ? "↓" : ""}
      {formatDeltaValue(delta, suffix)}
      {pct ? <span className="opacity-80">({pct})</span> : null}
    </span>
  );
}

function PctOnlyDeltaBadge({
  cur,
  prev,
  size = "xs",
}: {
  cur: number;
  prev: number;
  size?: "sm" | "xs";
}) {
  const pct = formatPctChange(cur, prev);
  if (!pct || pct === "新增") {
    if (cur === prev) {
      return (
        <span className={`text-zinc-400 ${size === "xs" ? "text-[10px]" : "text-xs"}`}>持平</span>
      );
    }
    return (
      <span className={`font-medium text-emerald-700 ${size === "xs" ? "text-[10px]" : "text-xs"}`}>
        ↑ 新增
      </span>
    );
  }
  const up = cur > prev;
  const down = cur < prev;
  const cls = up
    ? "text-emerald-700 bg-emerald-50"
    : down
      ? "text-rose-700 bg-rose-50"
      : "text-zinc-500 bg-zinc-100";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${cls} ${
        size === "xs" ? "text-[10px]" : "text-xs"
      }`}
    >
      {up ? "↑" : down ? "↓" : ""}
      {pct}
    </span>
  );
}

function StatusBadge({ status }: { status: FeatureStatus }) {
  if (status === "idle") return null;
  const map = {
    new: { label: "新增", cls: "bg-sky-50 text-sky-700 border-sky-100" },
    stopped: { label: "停更", cls: "bg-rose-50 text-rose-700 border-rose-100" },
    continued: { label: "持续", cls: "bg-mint-50 text-mint-700 border-mint-100" },
  };
  const item = map[status];
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${item.cls}`}>
      {item.label}
    </span>
  );
}

export function WeeklyTwoWeekCompare() {
  const [anchorDate, setAnchorDate] = useState(defaultAnchorDate);
  const [customMode, setCustomMode] = useState(false);
  const [thisWeekStart, setThisWeekStart] = useState("");
  const [thisWeekEnd, setThisWeekEnd] = useState("");
  const [lastWeekStart, setLastWeekStart] = useState("");
  const [lastWeekEnd, setLastWeekEnd] = useState("");
  const [appliedKey, setAppliedKey] = useState(() => `anchor:${defaultAnchorDate()}`);
  const [showAllThemes, setShowAllThemes] = useState(false);

  const [weeks, setWeeks] = useState<WeeklyInsight[]>([]);
  const [loading, setLoading] = useState(true);

  const preview = useMemo(
    () => getFridayAnchoredComparisonWeeks(new Date(anchorDate)),
    [anchorDate],
  );

  useEffect(() => {
    if (!customMode) {
      setThisWeekStart(toDateInputValue(preview.thisWeek.start));
      setThisWeekEnd(toDateInputValue(preview.thisWeek.end));
      setLastWeekStart(toDateInputValue(preview.lastWeek.start));
      setLastWeekEnd(toDateInputValue(preview.lastWeek.end));
    }
  }, [customMode, preview]);

  useEffect(() => {
    if (customMode) return;
    const timer = setTimeout(() => {
      setAppliedKey(`anchor:${anchorDate}`);
    }, 400);
    return () => clearTimeout(timer);
  }, [anchorDate, customMode]);

  const fetchWeeks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ compare: "2" });
      if (appliedKey.startsWith("custom:")) {
        params.set("thisWeekStart", thisWeekStart);
        params.set("thisWeekEnd", thisWeekEnd);
        params.set("lastWeekStart", lastWeekStart);
        params.set("lastWeekEnd", lastWeekEnd);
      } else {
        const anchor = appliedKey.replace("anchor:", "");
        params.set("anchor", anchor);
      }
      const res = await fetch(`/api/insights/weekly?${params}`);
      const data: WeeklyInsight[] = await res.json();
      setWeeks(data ?? []);
    } finally {
      setLoading(false);
    }
  }, [appliedKey, thisWeekStart, thisWeekEnd, lastWeekStart, lastWeekEnd]);

  useEffect(() => {
    fetchWeeks();
  }, [appliedKey, fetchWeeks]);

  const applyFilters = () => {
    const key = customMode
      ? `custom:${thisWeekStart}-${thisWeekEnd}-${lastWeekStart}-${lastWeekEnd}`
      : `anchor:${anchorDate}`;
    setAppliedKey(key);
  };

  const resetFilters = () => {
    const anchor = defaultAnchorDate();
    setAnchorDate(anchor);
    setCustomMode(false);
    setShowAllThemes(false);
    setAppliedKey(`anchor:${anchor}`);
  };

  const [previous, current] = weeks;

  const themeCompare = useMemo(() => {
    if (!current || !previous) return [];
    const names = new Set([
      ...current.features.map((f) => f.feature),
      ...previous.features.map((f) => f.feature),
    ]);
    const statusOrder: Record<FeatureStatus, number> = {
      new: 0,
      continued: 1,
      stopped: 2,
      idle: 3,
    };
    return [...names]
      .map((feature): ThemeCompareRow => {
        const cur = current.features.find((f) => f.feature === feature);
        const prev = previous.features.find((f) => f.feature === feature);
        const curPosts = cur?.postCount ?? 0;
        const prevPosts = prev?.postCount ?? 0;
        const curEng = cur?.totalEngagement ?? 0;
        const prevEng = prev?.totalEngagement ?? 0;
        const curShare = cur?.share ?? 0;
        const prevShare = prev?.share ?? 0;
        return {
          feature,
          status: featureStatus(curPosts, prevPosts),
          curPosts,
          prevPosts,
          postsDelta: curPosts - prevPosts,
          curEng,
          prevEng,
          engDelta: curEng - prevEng,
          curShare,
          prevShare,
          shareDelta: curShare - prevShare,
          curHighEr: cur?.highErPostCount ?? 0,
          prevHighEr: prev?.highErPostCount ?? 0,
          highErDelta: (cur?.highErPostCount ?? 0) - (prev?.highErPostCount ?? 0),
          curHighErRate: cur?.highErRate ?? 0,
          prevHighErRate: prev?.highErRate ?? 0,
        };
      })
      .sort((a, b) => {
        const sd = statusOrder[a.status] - statusOrder[b.status];
        if (sd !== 0) return sd;
        return b.engDelta - a.engDelta;
      });
  }, [current, previous]);

  const visibleThemes = showAllThemes ? themeCompare : themeCompare.slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-zinc-800">对比周期筛选</h3>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-lg border border-mint-200 bg-mint-50 px-3 py-1.5 text-xs font-medium text-mint-700 hover:bg-mint-100"
          >
            重置为默认
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-xs text-zinc-600">
            锚定日期
            <input
              type="date"
              value={anchorDate}
              disabled={customMode}
              onChange={(e) => setAnchorDate(e.target.value)}
              className={`mt-1 w-full ${inputCls} disabled:bg-zinc-50 disabled:text-zinc-400`}
            />
            <span className="mt-1 block text-[10px] text-zinc-400">
              按周五发文节奏自动推算本周/上周 · 修改后自动应用
            </span>
          </label>
          <div className="rounded-lg bg-mint-50/60 px-3 py-2 text-xs text-zinc-600 sm:col-span-1">
            <p className="font-medium text-zinc-700">推算本周</p>
            <p className="mt-1">{preview.thisWeek.label}</p>
          </div>
          <div className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-600 sm:col-span-1">
            <p className="font-medium text-zinc-700">推算上周</p>
            <p className="mt-1">{preview.lastWeek.label}</p>
          </div>
          <div className="flex items-end">
            {customMode ? (
              <button
                type="button"
                onClick={applyFilters}
                className="w-full rounded-lg bg-mint-600 px-4 py-2 text-sm font-medium text-white hover:bg-mint-700"
              >
                应用对比
              </button>
            ) : (
              <p className="w-full rounded-lg border border-mint-100 bg-mint-50/50 px-4 py-2 text-center text-xs text-mint-700">
                锚定模式已自动应用
              </p>
            )}
          </div>
        </div>

        <label className="mt-3 flex items-center gap-2 text-xs text-zinc-600">
          <input
            type="checkbox"
            checked={customMode}
            onChange={(e) => setCustomMode(e.target.checked)}
            className="rounded border-zinc-300"
          />
          自定义周范围（手动指定两周起止日期）
        </label>

        {customMode && (
          <div className="mt-3 grid gap-3 border-t border-mint-50 pt-3 sm:grid-cols-2">
            <div className="space-y-2 rounded-lg border border-mint-100 bg-mint-50/40 p-3">
              <p className="text-xs font-medium text-mint-800">本周</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={thisWeekStart}
                  onChange={(e) => setThisWeekStart(e.target.value)}
                  className={inputCls}
                />
                <input
                  type="date"
                  value={thisWeekEnd}
                  onChange={(e) => setThisWeekEnd(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
            <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <p className="text-xs font-medium text-zinc-700">上周</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={lastWeekStart}
                  onChange={(e) => setLastWeekStart(e.target.value)}
                  className={inputCls}
                />
                <input
                  type="date"
                  value={lastWeekEnd}
                  onChange={(e) => setLastWeekEnd(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-zinc-500">加载周对比...</p>
      ) : !current || !previous ? (
        <p className="py-8 text-center text-sm text-zinc-500">所选周期内数据不足，请调整日期后重试</p>
      ) : (
        <>
          {current && previous && (
            <WeekDeltaSummary current={current} previous={previous} />
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <WeekCard week={current} label="本周" accent="bg-mint-100" compareTo={previous} />
            <WeekCard week={previous} label="上周" accent="bg-zinc-100" />
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-zinc-900">各主题发文 / 互动 / 高 ER 对比</h3>
                <p className="mt-1 text-sm text-zinc-500">
                  {previous.weekLabel} vs {current.weekLabel} · ER≥3% 发文数
                </p>
              </div>
              {themeCompare.length > 8 && (
                <button
                  type="button"
                  onClick={() => setShowAllThemes((v) => !v)}
                  className="rounded-lg border border-mint-200 bg-mint-50 px-3 py-1.5 text-xs font-medium text-mint-700 hover:bg-mint-100"
                >
                  {showAllThemes ? "收起" : `展开全部 (${themeCompare.length})`}
                </button>
              )}
            </div>
            <div className="mt-6 space-y-5">
              {visibleThemes.map((t) => (
                <div key={t.feature} className="rounded-xl border border-zinc-100 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="font-medium text-zinc-800">{t.feature}</span>
                    <StatusBadge status={t.status} />
                  </div>

                  <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                    <span className="text-emerald-700">
                      高ER 上周 {t.prevHighEr} 篇 ({t.prevHighErRate.toFixed(0)}%)
                    </span>
                    <span className="font-medium text-emerald-700">
                      本周 {t.curHighEr} 篇 ({t.curHighErRate.toFixed(0)}%)
                    </span>
                    {t.highErDelta !== 0 && (
                      <DeltaBadge delta={t.highErDelta} size="xs" />
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <CompareBar
                      panel={METRIC_PANELS[0]}
                      prev={t.prevPosts}
                      cur={t.curPosts}
                    />
                    <CompareBar
                      panel={METRIC_PANELS[1]}
                      prev={t.prevEng}
                      cur={t.curEng}
                    />
                    <CompareBar
                      panel={METRIC_PANELS[2]}
                      prev={t.prevHighEr}
                      cur={t.curHighEr}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function WeekDeltaSummary({
  current,
  previous,
}: {
  current: WeeklyInsight;
  previous: WeeklyInsight;
}) {
  const items = [
    {
      label: "发文",
      delta: current.postCount - previous.postCount,
      pct: formatPctChange(current.postCount, previous.postCount),
    },
    {
      label: "总互动",
      delta: current.totalEngagement - previous.totalEngagement,
      pct: formatPctChange(current.totalEngagement, previous.totalEngagement),
    },
    {
      label: "平均 ER",
      delta: Number((current.avgEr - previous.avgEr).toFixed(2)),
      pct: null,
      suffix: " ER pt",
    },
    {
      label: "高ER篇数",
      delta: current.highErPostCount - previous.highErPostCount,
      pct: null,
    },
  ];

  return (
    <div className="rounded-xl border border-mint-100 bg-mint-50/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-mint-800">本周 vs 上周</p>
      <div className="mt-3 flex flex-wrap gap-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg border border-white bg-white px-3 py-2">
            <p className="text-[10px] text-zinc-500">{item.label}</p>
            <div className="mt-1">
              <DeltaBadge
                delta={item.delta}
                pct={item.pct}
                suffix={item.suffix ?? ""}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekCard({
  week,
  label,
  accent,
  compareTo,
}: {
  week: WeeklyInsight;
  label: string;
  accent: string;
  compareTo?: WeeklyInsight;
}) {
  return (
    <div className={`rounded-2xl border border-[var(--border)] p-6 ${accent}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-zinc-900">{week.weekLabel}</p>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Metric label="发文" value={week.postCount} />
        <Metric label="总互动" value={week.totalEngagement} />
        <Metric label="总浏览" value={week.totalViews} />
        <Metric label="平均 ER" value={week.avgEr} suffix="%" />
        <Metric
          label="ER≥3%"
          value={week.highErPostCount}
          suffix={`篇 (${week.highErRate.toFixed(0)}%)`}
          isText
        />
      </div>
      {compareTo && label === "本周" && (
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-mint-200/60 pt-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-zinc-600">发文</span>
            <DeltaBadge
              delta={week.postCount - compareTo.postCount}
              pct={formatPctChange(week.postCount, compareTo.postCount)}
              size="xs"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-zinc-600">平均ER</span>
            <PctOnlyDeltaBadge cur={week.avgEr} prev={compareTo.avgEr} size="xs" />
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-zinc-600">高ER篇数</span>
            <DeltaBadge
              delta={week.highErPostCount - compareTo.highErPostCount}
              size="xs"
            />
          </div>
        </div>
      )}
      {week.features[0] && (
        <p className="mt-4 text-sm text-zinc-600">
          最热主题：<span className="font-medium">{week.features[0].feature}</span>
          <span className="text-zinc-400"> · 平均 ER {week.features[0].avgEr.toFixed(2)}%</span>
        </p>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  suffix = "",
  isText = false,
}: {
  label: string;
  value: number;
  suffix?: string;
  isText?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-zinc-900 sm:text-2xl">
        {isText ? (
          <>
            {value}
            <span className="text-sm font-medium text-emerald-700">{suffix}</span>
          </>
        ) : (
          <>
            {suffix === "%" ? value.toFixed(2) : formatNumber(value)}
            {suffix && suffix !== "%" ? suffix : suffix === "%" ? suffix : ""}
          </>
        )}
      </p>
    </div>
  );
}

function CompareBar({
  panel,
  prev,
  cur,
}: {
  panel: (typeof METRIC_PANELS)[number];
  prev: number;
  cur: number;
}) {
  const rowMax = Math.max(prev, cur, 1);
  return (
    <div className={`rounded-xl border p-3 ${panel.bg} ${panel.border}`}>
      <p className={`mb-2.5 text-xs font-semibold ${panel.title}`}>{panel.label}</p>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[11px] text-zinc-700">
          <span className={`w-8 shrink-0 font-medium ${panel.title}`}>本周</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/90">
            <div
              className="h-full rounded-full"
              style={{ width: `${(cur / rowMax) * 100}%`, background: panel.bar }}
            />
          </div>
          <span className="w-12 shrink-0 text-right font-semibold">{formatNumber(cur)}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          <span className="w-8 shrink-0">上周</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/90">
            <div
              className={`h-full rounded-full ${panel.prevBar}`}
              style={{ width: `${(prev / rowMax) * 100}%` }}
            />
          </div>
          <span className="w-12 shrink-0 text-right">{formatNumber(prev)}</span>
        </div>
      </div>
    </div>
  );
}
