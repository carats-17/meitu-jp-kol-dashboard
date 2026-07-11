"use client";

import { useCallback, useEffect, useState } from "react";
import type { KolSortField, KolWithStats } from "@/lib/types";
import { KolFilters, defaultFilters, type FilterState } from "./kol-filters";
import { KolTable } from "./kol-table";
import { useSortState } from "./sortable-header";

function filtersToParams(
  filters: FilterState,
  sortBy: KolSortField,
  sortOrder: "asc" | "desc",
): URLSearchParams {
  const params = new URLSearchParams({ withOptions: "1", sortBy, sortOrder });
  (Object.entries(filters) as [keyof FilterState, string][]).forEach(([key, value]) => {
    if (value && key !== "sortBy" && key !== "sortOrder") params.set(key, value);
  });
  return params;
}

export function KolsListClient({
  initialFilters,
}: {
  initialFilters?: Partial<FilterState>;
}) {
  const [filters, setFilters] = useState<FilterState>({
    ...defaultFilters,
    ...initialFilters,
  });
  const { sortBy, sortOrder, toggleSort } = useSortState<KolSortField>("avgEngagement", "desc");
  const [kols, setKols] = useState<KolWithStats[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = filtersToParams(filters, sortBy, sortOrder);
      const res = await fetch(`/api/kols?${params}`);
      const data = await res.json();
      setKols(data.kols ?? []);
      if (data.options) {
        setFeatures(data.options.features ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, sortOrder]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 200);
    return () => clearTimeout(timer);
  }, [fetchData]);

  return (
    <div className="space-y-4">
      <KolFilters
        filters={filters}
        features={features}
        onChange={setFilters}
        onReset={() => setFilters(defaultFilters)}
      />

      {loading ? (
        <p className="py-12 text-center text-sm text-zinc-500">加载中...</p>
      ) : (
        <KolTable
          kols={kols}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={toggleSort}
          listHref="/"
        />
      )}
    </div>
  );
}
