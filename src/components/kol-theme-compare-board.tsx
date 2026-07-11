"use client";

import { useEffect } from "react";
import type { Platform } from "@prisma/client";
import { normalizeFeatureName } from "@/lib/feature-normalization";
import { displayPlatform, formatViews } from "@/lib/platform-display";
import {
  formatCurrency,
  formatShortDate,
  formatNumber,
} from "@/lib/utils";

type CollabRow = {
  id: string;
  publishedAt: Date | string;
  platform: Platform;
  feature: string;
  contentTheme: string;
  postUrl: string;
  price: number;
  organicViews: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  totalEngagement: number;
  er: number;
  viewsHidden: boolean;
};

export function KolThemeCompareBoard({
  collaborations,
}: {
  collaborations: CollabRow[];
  followers?: number | null;
}) {
  const groups = new Map<string, CollabRow[]>();
  for (const c of collaborations) {
    const key = normalizeFeatureName(c.feature);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }

  const sorted = [...groups.entries()].sort((a, b) => {
    const countDiff = b[1].length - a[1].length;
    if (countDiff !== 0) return countDiff;
    const engA = a[1].reduce((s, c) => s + c.totalEngagement, 0);
    const engB = b[1].reduce((s, c) => s + c.totalEngagement, 0);
    return engB - engA;
  });

  useEffect(() => {
    const raw = window.location.hash.replace(/^#/, "");
    if (!raw.startsWith("theme-")) return;
    const id = raw;
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  return (
    <div className="space-y-5">
      {sorted.map(([feature, posts]) => {
        const sortedPosts = [...posts].sort(
          (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
        );
        const totalEng = posts.reduce((s, c) => s + c.totalEngagement, 0);
        const avgEr = posts.reduce((s, c) => s + c.er, 0) / posts.length;
        const bestEr = Math.max(...posts.map((c) => c.er));
        const totalSpend = posts.reduce((s, c) => s + c.price, 0);

        return (
          <section
            key={feature}
            id={`theme-${encodeURIComponent(feature)}`}
            className="scroll-mt-20 overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm"
          >
            <div className="border-b border-mint-50 bg-mint-50/50 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">{feature}</h3>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {posts.length} 次合作
                    {posts.length > 1 ? " · 同主题成效对比" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-zinc-600">
                  <span>总花费 {formatCurrency(totalSpend)}</span>
                  <span>总互动 {formatNumber(totalEng)}</span>
                  <span>平均 ER {avgEr.toFixed(2)}%</span>
                  {posts.length > 1 && (
                    <span className="font-medium text-emerald-600">最高 ER {bestEr.toFixed(2)}%</span>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-mint-50/40 text-left text-xs text-zinc-500">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">发文日期</th>
                    <th className="px-3 py-2">平台</th>
                    <th className="px-3 py-2 text-right">曝光</th>
                    <th className="px-3 py-2 text-right">点赞</th>
                    <th className="px-3 py-2 text-right">评论</th>
                    <th className="px-3 py-2 text-right">总互动</th>
                    <th className="px-3 py-2 text-right">ER</th>
                    <th className="px-3 py-2 text-right">价格</th>
                    <th className="px-3 py-2">链接</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPosts.map((c, idx) => {
                    const views = c.organicViews > 0 ? c.organicViews : c.views;
                    const viewCell = formatViews(views, c.platform, c.totalEngagement, c.viewsHidden);
                    const isBest = posts.length > 1 && c.er === bestEr && bestEr >= 3;
                    return (
                      <tr
                        key={c.id}
                        className={`border-t border-mint-50 ${isBest ? "bg-emerald-50/60" : "hover:bg-mint-50/30"}`}
                      >
                        <td className="px-3 py-2 text-zinc-400">{posts.length - idx}</td>
                        <td className="whitespace-nowrap px-3 py-2">{formatShortDate(c.publishedAt)}</td>
                        <td className="px-3 py-2">
                          {displayPlatform(c.platform, c.contentTheme, true)}
                        </td>
                        <td
                          className={`px-3 py-2 text-right ${viewCell.hidden ? "font-medium text-amber-600" : ""}`}
                        >
                          {viewCell.text}
                        </td>
                        <td className="px-3 py-2 text-right">{formatNumber(c.likes)}</td>
                        <td className="px-3 py-2 text-right">{formatNumber(c.comments)}</td>
                        <td className="px-3 py-2 text-right">{formatNumber(c.totalEngagement)}</td>
                        <td
                          className={`px-3 py-2 text-right font-medium ${
                            c.er >= 3 ? "text-emerald-600" : "text-zinc-700"
                          }`}
                        >
                          {c.er.toFixed(2)}%
                          {isBest && (
                            <span className="ml-1 text-[10px] text-emerald-500">最佳</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">{formatCurrency(c.price)}</td>
                        <td className="px-3 py-2">
                          <a
                            href={c.postUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-mint-600 hover:underline"
                          >
                            打开
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
