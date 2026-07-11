"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { KolHistoryRow } from "@/lib/analytics-service";
import { SortableHeader, useSortState } from "@/components/sortable-header";
import { displayPlatform } from "@/lib/platform-display";
import type { KolSortField } from "@/lib/types";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

const TIER_LABELS: Record<KolHistoryRow["performanceTier"], string> = {
  excellent: "效果佳",
  normal: "效果普通",
  poor: "效果差",
};

const TIER_STYLES: Record<KolHistoryRow["performanceTier"], string> = {
  excellent: "bg-emerald-50 text-emerald-700 border-emerald-100",
  normal: "bg-amber-50 text-amber-700 border-amber-100",
  poor: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

type HistorySortField = KolSortField | "totalViews" | "totalEngagement";

export function HistoryPageClient() {
  const [q, setQ] = useState("");
  const [platform, setPlatform] = useState("");
  const [tier, setTier] = useState("");
  const { sortBy, sortOrder, toggleSort } = useSortState<HistorySortField>("avgEngagement", "desc");
  const [allKols, setAllKols] = useState<KolHistoryRow[]>([]);
  const [kols, setKols] = useState<KolHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (platform) params.set("platform", platform);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      const res = await fetch(`/api/history?${params}`);
      const data = await res.json();
      let rows: KolHistoryRow[] = data.kols ?? [];
      setAllKols(rows);
      if (tier) rows = rows.filter((k) => k.performanceTier === tier);
      setKols(rows);
    } finally {
      setLoading(false);
    }
  }, [q, platform, tier, sortBy, sortOrder]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 250);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const tierCounts = {
    excellent: allKols.filter((k) => k.performanceTier === "excellent").length,
    normal: allKols.filter((k) => k.performanceTier === "normal").length,
    poor: allKols.filter((k) => k.performanceTier === "poor").length,
  };

  const clearFilters = () => {
    setQ("");
    setPlatform("");
    setTier("");
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {(["excellent", "normal", "poor"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTier(tier === t ? "" : t)}
            className={`rounded-xl border p-4 text-left transition ${TIER_STYLES[t]} ${tier === t ? "ring-2 ring-mint-300" : ""}`}
          >
            <p className="text-xs font-medium">{TIER_LABELS[t]}</p>
            <p className="mt-1 text-2xl font-semibold">{tierCounts[t]}</p>
            <p className="mt-1 text-xs opacity-80">平均 ER {t === "excellent" ? "≥3%" : t === "poor" ? "<1%" : "1-3%"}</p>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-zinc-700">筛选条件</h2>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border border-mint-200 bg-mint-50 px-3 py-1.5 text-xs font-medium text-mint-600 hover:bg-mint-100"
          >
            清除筛选
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            type="search"
            placeholder="搜索达人账号/姓名"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-mint-400 sm:col-span-2"
          />
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-mint-400"
          >
            <option value="">全部平台</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="X">X</option>
            <option value="TIKTOK">TikTok</option>
            <option value="THREADS">Threads</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-white shadow-sm">
        {loading ? (
          <p className="py-10 text-center text-sm text-zinc-500">加载中...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-mint-50/60 text-left text-xs text-zinc-500">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">达人</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">平台</th>
                  <SortableHeader label="粉丝数" field="followers" activeField={sortBy} order={sortOrder} onSort={toggleSort} align="right" />
                  <SortableHeader label="合作次数" field="collabCount" activeField={sortBy} order={sortOrder} onSort={toggleSort} align="right" />
                  <SortableHeader label="平均单价" field="avgPrice" activeField={sortBy} order={sortOrder} onSort={toggleSort} align="right" />
                  <SortableHeader label="总曝光" field="totalViews" activeField={sortBy} order={sortOrder} onSort={toggleSort} align="right" />
                  <SortableHeader label="总互动" field="totalEngagement" activeField={sortBy} order={sortOrder} onSort={toggleSort} align="right" />
                  <SortableHeader label="平均 ER" field="avgEngagement" activeField={sortBy} order={sortOrder} onSort={toggleSort} align="right" />
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">效果评级</th>
                  <SortableHeader label="最近合作" field="lastCollabDate" activeField={sortBy} order={sortOrder} onSort={toggleSort} />
                </tr>
              </thead>
              <tbody>
                {kols.map((kol) => (
                  <tr key={kol.id} className="border-t border-mint-50 hover:bg-mint-50/40">
                    <td className="px-4 py-3">
                      <Link href={`/kols/${kol.id}`} className="font-medium text-mint-600 hover:underline">
                        {kol.name}
                      </Link>
                      <p className="text-xs text-zinc-400">@{kol.handle}</p>
                    </td>
                    <td className="px-4 py-3">{displayPlatform(kol.platform)}</td>
                    <td className="px-4 py-3 text-right">{kol.followers ? formatNumber(kol.followers) : "—"}</td>
                    <td className="px-4 py-3 text-right">{kol.collabCount}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(kol.avgPrice)}</td>
                    <td className="px-4 py-3 text-right">{formatNumber(kol.totalViews)}</td>
                    <td className="px-4 py-3 text-right">{formatNumber(kol.totalEngagement)}</td>
                    <td className="px-4 py-3 text-right font-medium">{kol.avgEngagement.toFixed(2)}%</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2 py-0.5 text-xs ${TIER_STYLES[kol.performanceTier]}`}>
                        {TIER_LABELS[kol.performanceTier]}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {kol.lastCollabDate ? formatDate(kol.lastCollabDate) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
