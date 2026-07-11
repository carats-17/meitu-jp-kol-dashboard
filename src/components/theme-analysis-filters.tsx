"use client";

import type { Platform } from "@prisma/client";
import { PLATFORM_LABELS, PLATFORM_OPTIONS } from "@/lib/types";

export type ThemeFilterState = {
  q: string;
  platform: string;
  feature: string;
  dateFrom: string;
  dateTo: string;
  minFollowers: string;
  maxPrice: string;
  xAxis: "totalSpend" | "totalViews";
  yAxis: "totalEngagement" | "totalViews";
  sizeMetric: "postCount" | "totalEngagement";
};

export const defaultThemeFilters: ThemeFilterState = {
  q: "",
  platform: "",
  feature: "",
  dateFrom: "",
  dateTo: "",
  minFollowers: "",
  maxPrice: "",
  xAxis: "totalSpend",
  yAxis: "totalEngagement",
  sizeMetric: "postCount",
};

type Props = {
  filters: ThemeFilterState;
  features: string[];
  onChange: (filters: ThemeFilterState) => void;
  onReset: () => void;
};

const inputCls =
  "w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-mint-400";

export function ThemeAnalysisFilters({ filters, features, onChange, onReset }: Props) {
  function update<K extends keyof ThemeFilterState>(key: K, value: ThemeFilterState[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="space-y-4 rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">图表指标</h3>
        <div className="mt-2 space-y-2">
          <label className="block text-xs text-zinc-600">
            横轴
            <select
              value={filters.xAxis}
              onChange={(e) => update("xAxis", e.target.value as ThemeFilterState["xAxis"])}
              className={`mt-1 ${inputCls}`}
            >
              <option value="totalSpend">合作花费 JPY</option>
              <option value="totalViews">总浏览</option>
            </select>
          </label>
          <label className="block text-xs text-zinc-600">
            纵轴
            <select
              value={filters.yAxis}
              onChange={(e) => update("yAxis", e.target.value as ThemeFilterState["yAxis"])}
              className={`mt-1 ${inputCls}`}
            >
              <option value="totalEngagement">总互动量</option>
              <option value="totalViews">总浏览</option>
            </select>
          </label>
          <label className="block text-xs text-zinc-600">
            泡泡大小
            <select
              value={filters.sizeMetric}
              onChange={(e) => update("sizeMetric", e.target.value as ThemeFilterState["sizeMetric"])}
              className={`mt-1 ${inputCls}`}
            >
              <option value="postCount">发文数</option>
              <option value="totalEngagement">总互动</option>
            </select>
          </label>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">筛选</h3>
        <div className="mt-2 space-y-2">
          <input
            type="search"
            placeholder="搜索达人 / 账号 / 主题"
            value={filters.q}
            onChange={(e) => update("q", e.target.value)}
            className={inputCls}
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={filters.platform}
              onChange={(e) => update("platform", e.target.value)}
              className={inputCls}
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
              className={inputCls}
            >
              <option value="">全部主题</option>
              {features.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => update("dateFrom", e.target.value)}
              className={inputCls}
            />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => update("dateTo", e.target.value)}
              className={inputCls}
            />
          </div>
          <input
            type="number"
            placeholder="最低粉丝数"
            value={filters.minFollowers}
            onChange={(e) => update("minFollowers", e.target.value)}
            className={inputCls}
          />
          <input
            type="number"
            placeholder="最高合作费用（日元）"
            value={filters.maxPrice}
            onChange={(e) => update("maxPrice", e.target.value)}
            className={inputCls}
          />
        </div>
      </section>

      <button
        type="button"
        onClick={onReset}
        className="w-full rounded-lg border border-mint-200 bg-mint-50 py-2.5 text-sm font-medium text-mint-700 hover:bg-mint-100"
      >
        清除分析筛选
      </button>
      <p className="text-[10px] leading-relaxed text-zinc-400">点击泡泡可进入主题二级页查看达人分布</p>
    </div>
  );
}
