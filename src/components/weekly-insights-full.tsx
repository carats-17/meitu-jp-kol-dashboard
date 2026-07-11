"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { WeeklyInsight } from "@/lib/insights-service";
import { formatNumber } from "@/lib/utils";

export function WeeklyInsightsFull() {
  const [weeks, setWeeks] = useState<WeeklyInsight[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const res = await fetch(`/api/insights/weekly?${params}`);
      const data = await res.json();
      setWeeks(data);
      if (data[0] && !compareA) setCompareA(data[0].weekKey);
      if (data[1] && !compareB) setCompareB(data[1].weekKey);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 200);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const weekA = weeks.find((w) => w.weekKey === compareA);
  const weekB = weeks.find((w) => w.weekKey === compareB);

  const compareFeatures = () => {
    if (!weekA || !weekB) return [];
    const names = new Set([
      ...weekA.features.map((f) => f.feature),
      ...weekB.features.map((f) => f.feature),
    ]);
    return [...names].map((feature) => {
      const a = weekA.features.find((f) => f.feature === feature);
      const b = weekB.features.find((f) => f.feature === feature);
      return {
        feature,
        status:
          (a?.postCount ?? 0) > 0 && (b?.postCount ?? 0) === 0
            ? "仅 A 周推广"
            : (a?.postCount ?? 0) === 0 && (b?.postCount ?? 0) > 0
              ? "仅 B 周推广"
              : "两周都推广",
        aPosts: a?.postCount ?? 0,
        bPosts: b?.postCount ?? 0,
        aViews: a?.totalViews ?? 0,
        bViews: b?.totalViews ?? 0,
        aEng: a?.totalEngagement ?? 0,
        bEng: b?.totalEngagement ?? 0,
        aEr: a?.avgEr ?? 0,
        bEr: b?.avgEr ?? 0,
      };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
        />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-medium text-zinc-900">任意两周对比</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <select
            value={compareA}
            onChange={(e) => setCompareA(e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            {weeks.map((w) => (
              <option key={w.weekKey} value={w.weekKey}>
                {w.weekLabel}
              </option>
            ))}
          </select>
          <span className="self-center text-sm text-zinc-400">vs</span>
          <select
            value={compareB}
            onChange={(e) => setCompareB(e.target.value)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            {weeks.map((w) => (
              <option key={w.weekKey} value={w.weekKey}>
                {w.weekLabel}
              </option>
            ))}
          </select>
        </div>

        {weekA && weekB && (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="text-zinc-500">
                <tr>
                  <th className="py-2 pr-4">推广功能</th>
                  <th className="py-2 pr-4">状态</th>
                  <th className="py-2 pr-4">{weekA.weekLabel} 条数</th>
                  <th className="py-2 pr-4">{weekB.weekLabel} 条数</th>
                  <th className="py-2 pr-4">互动 A / B</th>
                  <th className="py-2">ER A / B</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {compareFeatures().map((row) => (
                  <tr key={row.feature}>
                    <td className="py-2 pr-4">
                      <Link
                        href={`/features/${encodeURIComponent(row.feature)}`}
                        className="text-rose-600 hover:underline"
                      >
                        {row.feature}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          row.status === "两周都推广"
                            ? "bg-blue-50 text-blue-700"
                            : row.status === "仅 A 周推广"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2 pr-4">{row.aPosts}</td>
                    <td className="py-2 pr-4">{row.bPosts}</td>
                    <td className="py-2 pr-4">
                      {formatNumber(row.aEng)} / {formatNumber(row.bEng)}
                    </td>
                    <td className="py-2">
                      {row.aEr.toFixed(2)}% / {row.bEr.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-center text-sm text-zinc-500">加载中...</p>
      ) : (
        <div className="space-y-3">
          {weeks.map((week) => (
            <details
              key={week.weekKey}
              className="rounded-xl border border-zinc-200 bg-white shadow-sm"
            >
              <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-zinc-900">
                {week.weekLabel} — {week.postCount} 条 · 浏览{" "}
                {formatNumber(week.totalViews)} · ER {week.avgEr.toFixed(2)}%
              </summary>
              <div className="overflow-x-auto border-t border-zinc-100 px-4 pb-4">
                <table className="mt-3 min-w-full text-left text-xs">
                  <thead className="text-zinc-500">
                    <tr>
                      <th className="py-2 pr-4">推广功能</th>
                      <th className="py-2 pr-4">发布条数</th>
                      <th className="py-2 pr-4">总浏览量</th>
                      <th className="py-2 pr-4">总互动量</th>
                      <th className="py-2">平均 ER</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {week.features.map((f) => (
                      <tr key={f.feature}>
                        <td className="py-2 pr-4">{f.feature}</td>
                        <td className="py-2 pr-4">{f.postCount}</td>
                        <td className="py-2 pr-4">{formatNumber(f.totalViews)}</td>
                        <td className="py-2 pr-4">{formatNumber(f.totalEngagement)}</td>
                        <td className="py-2">{f.avgEr.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
