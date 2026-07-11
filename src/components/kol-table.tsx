"use client";

import Link from "next/link";
import type { KolSortField, KolWithStats } from "@/lib/types";
import { displayPlatform } from "@/lib/platform-display";
import { formatCurrency, formatNumber, formatShortDate } from "@/lib/utils";
import { SortableHeader } from "@/components/sortable-header";

type Props = {
  kols: KolWithStats[];
  sortBy: KolSortField;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
  /** Current list URL with filters — used for back-navigation and deep links */
  listHref: string;
};

function themeSectionId(feature: string) {
  return `theme-${encodeURIComponent(feature)}`;
}

function kolDetailHref(kolId: string, listHref: string, feature?: string) {
  const from = encodeURIComponent(listHref);
  const hash = feature ? `#${themeSectionId(feature)}` : "";
  return `/kols/${kolId}?from=${from}${hash}`;
}

export function KolTable({ kols, sortBy, sortOrder, onSort, listHref }: Props) {
  if (kols.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-mint-200 bg-white p-12 text-center">
        <p className="text-sm text-zinc-500">没有符合筛选条件的达人</p>
        <Link href="/import" className="mt-2 inline-block text-sm text-mint-600 hover:underline">
          去导入合作数据 →
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-left text-sm">
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[7%]" />
            <col className="w-[9%]" />
            <col className="w-[6%]" />
            <col className="w-[11%]" />
            <col className="w-[7%]" />
            <col className="w-[8%]" />
            <col className="w-[15%]" />
          </colgroup>
          <thead className="border-b border-[var(--border)] bg-mint-50/60 text-xs text-zinc-500">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500">达人账号</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-zinc-500">平台</th>
              <SortableHeader label="粉丝数" field="followers" activeField={sortBy} order={sortOrder} onSort={onSort} align="right" />
              <SortableHeader label="合作" field="collabCount" activeField={sortBy} order={sortOrder} onSort={onSort} align="right" />
              <SortableHeader label="均价" field="avgPrice" activeField={sortBy} order={sortOrder} onSort={onSort} align="right" />
              <SortableHeader label="ER" field="avgEngagement" activeField={sortBy} order={sortOrder} onSort={onSort} align="right" />
              <SortableHeader label="最近发文" field="lastCollabDate" activeField={sortBy} order={sortOrder} onSort={onSort} align="right" />
              <th className="px-2 py-3 text-left text-xs font-medium text-zinc-500">推广功能</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-mint-50">
            {kols.map((kol) => {
              const posts = kol.featurePosts ?? kol.features.map((f) => ({
                feature: f,
                postUrl: "",
                collabId: "",
                postCount: 1,
              }));
              const visible = posts.slice(0, 3);

              return (
                <tr key={kol.id} className="hover:bg-mint-50/40">
                  <td className="px-3 py-2.5">
                    <Link href={kolDetailHref(kol.id, listHref)} className="group">
                      <p className="break-all font-medium leading-snug text-zinc-900 group-hover:text-mint-600">
                        @{kol.handle}
                      </p>
                      {kol.name !== kol.handle && (
                        <p className="mt-0.5 break-all text-xs leading-snug text-zinc-500">{kol.name}</p>
                      )}
                    </Link>
                  </td>
                  <td className="px-2 py-2.5">
                    <span className="inline-block rounded-full bg-mint-100 px-1.5 py-0.5 text-[11px] font-medium text-mint-700">
                      {displayPlatform(kol.platform)}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-right text-zinc-600">
                    {kol.followers ? formatNumber(kol.followers) : "—"}
                  </td>
                  <td className="px-2 py-2.5 text-right font-medium text-zinc-900">{kol.collabCount}</td>
                  <td className="px-2 py-2.5 text-right text-zinc-600">{formatCurrency(kol.avgPrice)}</td>
                  <td className="px-2 py-2.5 text-right">
                    <span
                      className={
                        kol.avgEngagement >= 3
                          ? "font-medium text-emerald-600"
                          : "text-zinc-600"
                      }
                    >
                      {kol.avgEngagement.toFixed(2)}%
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-2 py-2.5 text-right text-xs text-zinc-600">
                    {kol.lastCollabDate ? formatShortDate(kol.lastCollabDate) : "—"}
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex flex-wrap gap-0.5">
                      {visible.map((fp) => {
                        const title =
                          fp.postCount > 1
                            ? `${fp.feature} · ${fp.postCount} 篇 · 查看成效对比`
                            : `${fp.feature} · 打开贴文`;
                        const className =
                          "max-w-full truncate rounded bg-mint-100 px-1 py-0.5 text-[10px] text-mint-700 underline decoration-mint-300 underline-offset-2 hover:bg-mint-200 hover:text-mint-800";

                        if (fp.postCount === 1 && fp.postUrl) {
                          return (
                            <a
                              key={fp.feature}
                              href={fp.postUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={className}
                              title={title}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {fp.feature}
                            </a>
                          );
                        }

                        return (
                          <Link
                            key={fp.feature}
                            href={kolDetailHref(kol.id, listHref, fp.feature)}
                            className={className}
                            title={title}
                          >
                            {fp.feature}
                            {fp.postCount > 1 ? ` (${fp.postCount})` : ""}
                          </Link>
                        );
                      })}
                      {posts.length > 3 && (
                        <Link
                          href={kolDetailHref(kol.id, listHref)}
                          className="text-[10px] text-mint-600 hover:underline"
                        >
                          +{posts.length - 3}
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-mint-50 px-4 py-2 text-xs text-zinc-500">
        共 {kols.length} 位达人 · 推广功能可点击直达贴文或成效对比
      </div>
    </div>
  );
}
