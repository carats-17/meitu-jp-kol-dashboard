"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { LibraryOverview } from "@/lib/analytics-service";
import {
  filtersFromSearchParams,
  libraryListHref,
  libraryStateToSearchParams,
  sortFromSearchParams,
} from "@/lib/filter-url";
import type { KolSortField, KolWithStats } from "@/lib/types";
import { KolFilters, defaultFilters, type FilterState } from "@/components/kol-filters";
import { KolTable } from "@/components/kol-table";
import { OverviewCharts } from "@/components/overview-charts";

export function LibraryHome() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlSynced = useRef(false);

  const [overview, setOverview] = useState<LibraryOverview | null>(null);
  const [filters, setFilters] = useState<FilterState>(() =>
    filtersFromSearchParams(searchParams),
  );
  const [sortBy, setSortBy] = useState<KolSortField>(
    () => sortFromSearchParams(searchParams).sortBy,
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    () => sortFromSearchParams(searchParams).sortOrder,
  );
  const [features, setFeatures] = useState<string[]>([]);
  const [kols, setKols] = useState<KolWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  // Browser back/forward: restore filters from URL
  useEffect(() => {
    setFilters(filtersFromSearchParams(searchParams));
    const sort = sortFromSearchParams(searchParams);
    setSortBy(sort.sortBy);
    setSortOrder(sort.sortOrder);
    urlSynced.current = true;
  }, [searchParams]);

  // User changes → write to URL (debounced)
  useEffect(() => {
    if (!urlSynced.current) return;
    const timer = setTimeout(() => {
      const params = libraryStateToSearchParams(filters, sortBy, sortOrder);
      const qs = params.toString();
      const next = qs ? `${pathname}?${qs}` : pathname;
      const current = searchParams.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname;
      if (next !== current) {
        router.replace(next, { scroll: false });
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [filters, sortBy, sortOrder, pathname, router, searchParams]);

  const listHref = useMemo(
    () => libraryListHref(filters, sortBy, sortOrder),
    [filters, sortBy, sortOrder],
  );

  useEffect(() => {
    fetch("/api/library/overview").then((r) => r.json()).then(setOverview);
    fetch("/api/kols?withOptions=1&limit=1")
      .then((r) => r.json())
      .then((d) => setFeatures(d.options?.features ?? []));
  }, []);

  const fetchKols = useCallback(async () => {
    setLoading(true);
    try {
      const params = libraryStateToSearchParams(filters, sortBy, sortOrder);
      const res = await fetch(`/api/kols?${params}`);
      const data = await res.json();
      setKols(data.kols ?? []);
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, sortOrder]);

  useEffect(() => {
    const timer = setTimeout(fetchKols, 250);
    return () => clearTimeout(timer);
  }, [fetchKols]);

  const toggleSort = useCallback((field: string) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === "desc" ? "asc" : "desc"));
      return;
    }
    setSortBy(field as KolSortField);
    setSortOrder("desc");
  }, [sortBy]);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setSortBy("avgEngagement");
    setSortOrder("desc");
  }, []);

  return (
    <div className="space-y-8">
      {overview ? <OverviewCharts overview={overview} /> : (
        <p className="text-sm text-zinc-500">加载总览数据...</p>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">达人检索</h2>
            <p className="mt-1 text-sm text-zinc-500">
              支持按达人账号/名字/主题/发文链接模糊搜索；推广功能可点击直达贴文
            </p>
          </div>
          <Link href="/history" className="text-sm font-medium text-mint-600 hover:underline">
            查看历史合作成效 →
          </Link>
        </div>
        <div className="sticky top-2 z-20">
          <KolFilters
            filters={filters}
            features={features}
            onChange={setFilters}
            onReset={resetFilters}
            variant="kol"
          />
        </div>
        {loading ? (
          <p className="py-8 text-center text-sm text-zinc-500">检索中...</p>
        ) : (
          <KolTable
            kols={kols}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={toggleSort}
            listHref={listHref}
          />
        )}
      </section>
    </div>
  );
}
