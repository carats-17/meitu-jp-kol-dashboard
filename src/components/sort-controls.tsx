"use client";

export type SortOption = { value: string; label: string };

type Props = {
  sortBy: string;
  sortOrder: "asc" | "desc";
  options: SortOption[];
  onSortByChange: (value: string) => void;
  onSortOrderChange: (value: "asc" | "desc") => void;
};

export function SortControls({
  sortBy,
  sortOrder,
  options,
  onSortByChange,
  onSortOrderChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-zinc-500">排序</span>
      <select
        value={sortBy}
        onChange={(e) => onSortByChange(e.target.value)}
        className="rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5 text-sm outline-none focus:border-mint-400"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        value={sortOrder}
        onChange={(e) => onSortOrderChange(e.target.value as "asc" | "desc")}
        className="rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5 text-sm outline-none focus:border-mint-400"
      >
        <option value="desc">从高到低</option>
        <option value="asc">从低到高</option>
      </select>
    </div>
  );
}

export const KOL_SORT_OPTIONS: SortOption[] = [
  { value: "avgEngagement", label: "互动率" },
  { value: "collabCount", label: "合作次数" },
  { value: "avgPrice", label: "平均合作价格" },
  { value: "followers", label: "粉丝数" },
  { value: "totalSpend", label: "总合作价格" },
  { value: "lastCollabDate", label: "最近发文日期" },
];

export const POST_SORT_OPTIONS: SortOption[] = [
  { value: "er", label: "互动率" },
  { value: "publishedAt", label: "发文日期" },
  { value: "organicViews", label: "曝光" },
  { value: "likes", label: "点赞" },
  { value: "saves", label: "收藏" },
  { value: "totalEngagement", label: "总互动" },
  { value: "price", label: "合作价格" },
];

export const THEME_SORT_OPTIONS: SortOption[] = [
  { value: "totalEngagement", label: "总互动" },
  { value: "postCount", label: "发文数" },
  { value: "totalSpend", label: "总花费" },
  { value: "totalViews", label: "总曝光" },
  { value: "avgEr", label: "平均 ER" },
];
