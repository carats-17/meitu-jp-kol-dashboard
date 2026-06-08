"use client";

import type { Platform } from "@prisma/client";
import { PLATFORM_LABELS, PLATFORM_OPTIONS } from "@/lib/types";

export type FilterState = {
  q: string;
  platform: string;
  feature: string;
  theme: string;
  minFollowers: string;
  maxPrice: string;
  minEngagement: string;
  dateFrom: string;
  dateTo: string;
};

export const defaultFilters: FilterState = {
  q: "",
  platform: "",
  feature: "",
  theme: "",
  minFollowers: "",
  maxPrice: "",
  minEngagement: "",
  dateFrom: "",
  dateTo: "",
};

type Props = {
  filters: FilterState;
  features: string[];
  themes: string[];
  onChange: (filters: FilterState) => void;
  onReset: () => void;
};

export function KolFilters({ filters, features, themes, onChange, onReset }: Props) {
  function update(key: keyof FilterState, value: string) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-700">筛选条件</h2>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-rose-600 hover:text-rose-700"
        >
          重置
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          type="search"
          placeholder="搜索达人账号名"
          value={filters.q}
          onChange={(e) => update("q", e.target.value)}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
        />
        <select
          value={filters.platform}
          onChange={(e) => update("platform", e.target.value)}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
        >
          <option value="">全部平台</option>
          {PLATFORM_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {PLATFORM_LABELS[p as Platform]}
            </option>
          ))}
        </select>
        <select
          value={filters.feature}
          onChange={(e) => update("feature", e.target.value)}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
        >
          <option value="">全部推广功能</option>
          {features.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <select
          value={filters.theme}
          onChange={(e) => update("theme", e.target.value)}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
        >
          <option value="">全部内容形式</option>
          {themes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="最低粉丝数"
          value={filters.minFollowers}
          onChange={(e) => update("minFollowers", e.target.value)}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
        />
        <input
          type="number"
          placeholder="最高合作价格（日元）"
          value={filters.maxPrice}
          onChange={(e) => update("maxPrice", e.target.value)}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
        />
        <input
          type="number"
          placeholder="最低互动率 (%)"
          value={filters.minEngagement}
          onChange={(e) => update("minEngagement", e.target.value)}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => update("dateFrom", e.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => update("dateTo", e.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
          />
        </div>
      </div>
    </div>
  );
}
