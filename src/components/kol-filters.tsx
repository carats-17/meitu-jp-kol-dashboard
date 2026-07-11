"use client";

import Link from "next/link";
import type { Platform } from "@prisma/client";
import { PLATFORM_LABELS, PLATFORM_OPTIONS } from "@/lib/types";
import {
  KOL_SORT_OPTIONS,
  POST_SORT_OPTIONS,
  SortControls,
  THEME_SORT_OPTIONS,
} from "@/components/sort-controls";

export type FilterState = {
  q: string;
  platform: string;
  feature: string;
  minFollowers: string;
  maxPrice: string;
  minEngagement: string;
  dateFrom: string;
  dateTo: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
};

export const defaultFilters: FilterState = {
  q: "",
  platform: "",
  feature: "",
  minFollowers: "",
  maxPrice: "",
  minEngagement: "",
  dateFrom: "",
  dateTo: "",
  sortBy: "avgEngagement",
  sortOrder: "desc",
};

export const defaultPostFilters: FilterState = {
  ...defaultFilters,
  sortBy: "er",
};

type Props = {
  filters: FilterState;
  features: string[];
  onChange: (filters: FilterState) => void;
  onReset: () => void;
  variant?: "kol" | "post" | "theme";
  showSort?: boolean;
};

export function KolFilters({
  filters,
  features,
  onChange,
  onReset,
  variant = "kol",
  showSort = false,
}: Props) {
  function update(key: keyof FilterState, value: string) {
    onChange({ ...filters, [key]: value });
  }

  const sortOptions =
    variant === "post"
      ? POST_SORT_OPTIONS
      : variant === "theme"
        ? THEME_SORT_OPTIONS
        : KOL_SORT_OPTIONS;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-zinc-700">筛选条件</h2>
        <div className="flex items-center gap-3">
          {showSort && (
            <SortControls
              sortBy={filters.sortBy}
              sortOrder={filters.sortOrder}
              options={sortOptions}
              onSortByChange={(v) => update("sortBy", v)}
              onSortOrderChange={(v) => update("sortOrder", v)}
            />
          )}
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg border border-mint-200 bg-mint-50 px-3 py-1.5 text-xs font-medium text-mint-600 hover:bg-mint-100"
          >
            清除筛选
          </button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          type="search"
          placeholder="搜索达人账号/名字/主题/发文链接"
          value={filters.q}
          onChange={(e) => update("q", e.target.value)}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-mint-400"
        />
        <select
          value={filters.platform}
          onChange={(e) => update("platform", e.target.value)}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-mint-400"
        >
          <option value="">全部平台</option>
          {PLATFORM_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {PLATFORM_LABELS[p as Platform]}
            </option>
          ))}
        </select>
        <div className="flex gap-1">
          <select
            value={filters.feature}
            onChange={(e) => update("feature", e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-mint-400"
          >
            <option value="">全部推广主题</option>
            {features.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <Link
            href="/themes"
            className="shrink-0 rounded-lg border border-[var(--border)] px-2 py-2 text-xs text-zinc-600 hover:bg-mint-50"
            title="查看主题明细"
          >
            明细
          </Link>
        </div>
        <input
          type="number"
          placeholder="平台粉丝数 ≥（来自导入表）"
          value={filters.minFollowers}
          onChange={(e) => update("minFollowers", e.target.value)}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-mint-400"
        />
        <input
          type="number"
          placeholder="最高单次合作价格（日元）"
          value={filters.maxPrice}
          onChange={(e) => update("maxPrice", e.target.value)}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-mint-400"
        />
        {variant !== "theme" && (
          <input
            type="number"
            placeholder="最低互动率 (%)"
            value={filters.minEngagement}
            onChange={(e) => update("minEngagement", e.target.value)}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-mint-400"
          />
        )}
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => update("dateFrom", e.target.value)}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-mint-400"
        />
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => update("dateTo", e.target.value)}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-mint-400"
        />
      </div>
    </div>
  );
}
