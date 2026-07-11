import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { KolDetailBackLink } from "@/components/kol-detail-back-link";
import { KolThemeCompareBoard } from "@/components/kol-theme-compare-board";
import { getKolById } from "@/lib/kol-service";
import { displayPlatform } from "@/lib/platform-display";
import {
  engagementRate,
  engagementTotal,
  formatCurrency,
  formatNumber,
} from "@/lib/utils";

export default async function KolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const kol = await getKolById(id);

  if (!kol) notFound();

  const collabRows = kol.collaborations.map((c) => ({
    id: c.id,
    publishedAt: c.publishedAt,
    platform: c.platform,
    feature: c.feature,
    contentTheme: c.contentTheme,
    postUrl: c.postUrl,
    price: c.price,
    organicViews: c.organicViews,
    views: c.views,
    likes: c.likes,
    comments: c.comments,
    saves: c.saves,
    shares: c.shares,
    totalEngagement: engagementTotal(c),
    er: engagementRate(c, kol.followers),
    viewsHidden: c.viewsHidden,
  }));

  return (
    <AppShell title={`@${kol.handle}`} description={`${kol.name} · 历史合作明细`}>
      <div className="space-y-6">
        <Suspense fallback={<span className="text-sm text-zinc-400">...</span>}>
          <KolDetailBackLink />
        </Suspense>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900">@{kol.handle}</h1>
              <p className="mt-1 text-sm text-zinc-500">
                {kol.name !== kol.handle ? `${kol.name} · ` : ""}
                {displayPlatform(kol.platform)}
                {kol.category ? ` · ${kol.category}` : ""}
              </p>
              {kol.email && (
                <p className="mt-1 text-sm text-zinc-500">{kol.email}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-zinc-500">粉丝数</p>
              <p className="text-xl font-semibold text-zinc-900">
                {kol.followers ? formatNumber(kol.followers) : "—"}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            {[
              { label: "合作次数", value: String(kol.stats.collabCount) },
              { label: "总合作价格（日元）", value: formatCurrency(kol.stats.totalSpend) },
              { label: "平均合作价格", value: formatCurrency(kol.stats.avgPrice) },
              {
                label: "平均互动率",
                value: `${kol.stats.avgEngagement.toFixed(2)}%`,
              },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-zinc-50 p-3">
                <p className="text-xs text-zinc-500">{item.label}</p>
                <p className="mt-1 font-semibold text-zinc-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-zinc-900">
            按推广主题对比（{kol.collaborations.length} 条）
          </h2>
          <p className="mb-4 text-xs text-zinc-500">
            同一主题多次合作时，在同一看板中横向对比每次发文成效；「打开」可跳转贴文正文
          </p>
          <KolThemeCompareBoard collaborations={collabRows} />
        </div>
      </div>
    </AppShell>
  );
}
