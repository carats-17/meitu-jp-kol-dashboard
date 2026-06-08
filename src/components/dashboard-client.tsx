"use client";

import { useCallback, useEffect, useState } from "react";
import type { DashboardMetrics, KolWithStats } from "@/lib/types";
import { KolFilters, defaultFilters, type FilterState } from "./kol-filters";
import { KolTable } from "./kol-table";
import { MetricsCards } from "./metrics-cards";

function filtersToParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams({ withOptions: "1" });
  (Object.entries(filters) as [keyof FilterState, string][]).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params;
}

export function DashboardClient() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [kols, setKols] = useState<KolWithStats[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [features, setFeatures] = useState<string[]>([]);
  const [themes, setThemes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (currentFilters: FilterState) => {
    setLoading(true);
    try {
      const params = filtersToParams(currentFilters);
      const [kolsRes, metricsRes] = await Promise.all([
        fetch(`/api/kols?${params}`),
        fetch("/api/metrics"),
      ]);

      const kolsData = await kolsRes.json();
      const metricsData = await metricsRes.json();

      setKols(kolsData.kols ?? []);
      if (kolsData.options) {
        setFeatures(kolsData.options.features ?? []);
        setThemes(kolsData.options.themes ?? []);
      }
      setMetrics(metricsData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchData(filters), 300);
    return () => clearTimeout(timer);
  }, [filters, fetchData]);

  return (
    <div className="space-y-6">
      {metrics && <MetricsCards metrics={metrics} />}
      <KolFilters
        filters={filters}
        features={features}
        themes={themes}
        onChange={setFilters}
        onReset={() => setFilters(defaultFilters)}
      />
      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500">
          加载中...
        </div>
      ) : (
        <KolTable kols={kols} />
      )}
    </div>
  );
}
