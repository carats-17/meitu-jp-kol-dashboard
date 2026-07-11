"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { KolWithStats } from "@/lib/types";
import { PLATFORM_LABELS } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { KolFilters, defaultFilters, type FilterState } from "./kol-filters";

function filtersToParams(filters: FilterState, limit?: number): URLSearchParams {
  const params = new URLSearchParams({ withOptions: "1" });
  (Object.entries(filters) as [keyof FilterState, string][]).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  if (limit) params.set("limit", String(limit));
  return params;
}

export function KolSearchPreview() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [kols, setKols] = useState<KolWithStats[]>([]);
  const [total, setTotal] = useState(0);
  const [features, setFeatures] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (current: FilterState) => {
    setLoading(true);
    try {
      const params = filtersToParams(current, 6);
      const res = await fetch(`/api/kols?${params}`);
      const data = await res.json();
      setKols(data.kols ?? []);
      setTotal(data.total ?? 0);
      if (data.options) {
        setFeatures(data.options.features ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchData(filters), 300);
    return () => clearTimeout(timer);
  }, [filters, fetchData]);

  const queryString = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v) as [string, string][],
  ).toString();

  return (
    <div className="space-y-4">
      <KolFilters
        filters={filters}
        features={features}
        onChange={setFilters}
        onReset={() => setFilters(defaultFilters)}
      />

      {loading ? (
        <p className="py-8 text-center text-sm text-zinc-500">搜索中...</p>
      ) : kols.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">没有符合条件的达人</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {kols.map((kol) => (
            <Link
              key={kol.id}
              href={`/kols/${kol.id}`}
              className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-rose-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-zinc-900">@{kol.handle}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {PLATFORM_LABELS[kol.platform]} · {kol.collabCount} 次合作
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    kol.avgEngagement >= 3
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  ER {kol.avgEngagement.toFixed(1)}%
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-zinc-50 p-2">
                  <p className="text-zinc-500">总合作价格</p>
                  <p className="font-medium text-zinc-900">
                    {formatCurrency(kol.totalSpend)}
                  </p>
                </div>
                <div className="rounded-lg bg-zinc-50 p-2">
                  <p className="text-zinc-500">合作次数</p>
                  <p className="font-medium text-zinc-900">{kol.collabCount}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {kol.features.map((f) => (
                  <span
                    key={f}
                    className="max-w-full truncate rounded bg-rose-50 px-1.5 py-0.5 text-xs text-rose-700"
                    title={f}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-zinc-200 pt-4">
        <p className="text-sm text-zinc-500">
          共 {total} 位达人符合条件
          {total > 6 ? "，以下为前 6 位" : ""}
        </p>
        <Link
          href={`/kols${queryString ? `?${queryString}` : ""}`}
          className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
        >
          查看全部达人 →
        </Link>
      </div>
    </div>
  );
}
