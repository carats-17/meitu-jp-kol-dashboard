"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ThemeBubblePoint } from "@/lib/analytics-service";
import {
  ThemeAnalysisFilters,
  defaultThemeFilters,
  type ThemeFilterState,
} from "@/components/theme-analysis-filters";
import { SortableHeader, useSortState } from "@/components/sortable-header";
import {
  ThemeDrilldownBoard,
  type ThemeDrillState,
} from "@/components/theme-drilldown-board";
import { WeeklyTwoWeekCompare } from "@/components/weekly-two-week-compare";
import type { ThemeSortField } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

const defaultDrill: ThemeDrillState = { level: "theme", feature: null, kolId: null };

export function ThemesPageClient() {
  const boardRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<ThemeFilterState>(defaultThemeFilters);
  const [drill, setDrill] = useState<ThemeDrillState>(defaultDrill);
  const { sortBy, sortOrder, toggleSort } = useSortState<ThemeSortField>("totalEngagement", "desc");
  const [features, setFeatures] = useState<string[]>([]);
  const [themes, setThemes] = useState<ThemeBubblePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/kols?withOptions=1&limit=1")
      .then((r) => r.json())
      .then((d) => setFeatures(d.options?.features ?? []));
  }, []);

  const fetchThemes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.q) params.set("q", filters.q);
      if (filters.platform) params.set("platform", filters.platform);
      if (filters.feature) params.set("feature", filters.feature);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      if (filters.minFollowers) params.set("minFollowers", filters.minFollowers);
      if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
      const res = await fetch(`/api/themes/bubbles?${params}`);
      const data = await res.json();
      setThemes(data.themes ?? []);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(fetchThemes, 250);
    return () => clearTimeout(timer);
  }, [fetchThemes]);

  const sortedThemes = useMemo(() => {
    const order = sortOrder === "asc" ? 1 : -1;
    const key = sortBy as keyof ThemeBubblePoint;
    return [...themes].sort((a, b) => {
      const av = a[key] as number;
      const bv = b[key] as number;
      return av === bv ? 0 : av > bv ? order : -order;
    });
  }, [themes, sortBy, sortOrder]);

  const drillToTheme = useCallback((feature: string) => {
    setDrill({ level: "kol", feature, kolId: null });
    requestAnimationFrame(() => {
      boardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row">
        <div className="w-full shrink-0 xl:w-64">
          <ThemeAnalysisFilters
            filters={filters}
            features={features}
            onChange={setFilters}
            onReset={() => setFilters(defaultThemeFilters)}
          />
        </div>
        <div ref={boardRef} className="min-w-0 flex-1 scroll-mt-4">
          <ThemeDrilldownBoard
            filters={filters}
            themes={sortedThemes}
            themesLoading={loading}
            drill={drill}
            onDrillChange={setDrill}
          />
        </div>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-zinc-900">近 2 周主题对比</h2>
        <p className="mt-1 text-sm text-zinc-500">默认锚定前一周周一，对比各主题占比、发文量与总互动量</p>
        <div className="mt-6">
          <WeeklyTwoWeekCompare />
        </div>
      </section>

      <div className="rounded-2xl border border-[var(--border)] bg-white shadow-sm">
        <div className="border-b border-mint-50 px-4 py-3 text-sm font-medium text-zinc-700">
          主题成效明细
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-mint-50/60 text-left text-xs text-zinc-500">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">主题</th>
                <SortableHeader label="发文数" field="postCount" activeField={sortBy} order={sortOrder} onSort={toggleSort} align="right" />
                <SortableHeader label="总花费" field="totalSpend" activeField={sortBy} order={sortOrder} onSort={toggleSort} align="right" />
                <SortableHeader label="总浏览" field="totalViews" activeField={sortBy} order={sortOrder} onSort={toggleSort} align="right" />
                <SortableHeader label="总互动" field="totalEngagement" activeField={sortBy} order={sortOrder} onSort={toggleSort} align="right" />
                <SortableHeader label="平均 ER" field="avgEr" activeField={sortBy} order={sortOrder} onSort={toggleSort} align="right" />
              </tr>
            </thead>
            <tbody>
              {sortedThemes.map((t) => (
                <tr key={t.feature} className="border-t border-mint-50 hover:bg-mint-50/40">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => drillToTheme(t.feature)}
                      className="font-medium text-mint-600 hover:underline"
                    >
                      {t.feature}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">{t.postCount}</td>
                  <td className="px-4 py-3 text-right">{formatNumber(t.totalSpend)}</td>
                  <td className="px-4 py-3 text-right">{formatNumber(t.totalViews)}</td>
                  <td className="px-4 py-3 text-right">{formatNumber(t.totalEngagement)}</td>
                  <td className="px-4 py-3 text-right">{t.avgEr.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
