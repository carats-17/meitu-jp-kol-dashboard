import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { getKolById } from "@/lib/kol-service";
import { PLATFORM_LABELS } from "@/lib/types";
import {
  engagementRate,
  engagementTotal,
  formatCurrency,
  formatDate,
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

  return (
    <div className="min-h-screen bg-zinc-50">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <Link href="/" className="text-sm text-rose-600 hover:underline">
          ← 返回看板
        </Link>

        <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900">@{kol.handle}</h1>
              <p className="mt-1 text-sm text-zinc-500">
                {kol.name !== kol.handle ? `${kol.name} · ` : ""}
                {PLATFORM_LABELS[kol.platform]}
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

        <div className="mt-6">
          <h2 className="mb-3 text-sm font-medium text-zinc-700">
            近 12 个月合作时间线
          </h2>
          <div className="space-y-3">
            {kol.collaborations.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-zinc-500">发文日期</span>{" "}
                      <span className="font-medium text-zinc-900">
                        {formatDate(c.publishedAt)}
                      </span>
                    </p>
                    <p>
                      <span className="text-zinc-500">推广功能</span>{" "}
                      <span className="text-zinc-900">{c.feature}</span>
                      <span className="mx-2 text-zinc-300">·</span>
                      <span className="text-zinc-500">平台</span>{" "}
                      <span className="text-zinc-900">{PLATFORM_LABELS[c.platform]}</span>
                    </p>
                    <p>
                      <span className="text-zinc-500">内容形式</span>{" "}
                      <span className="text-zinc-900">{c.contentTheme}</span>
                    </p>
                  </div>
                  <p className="font-semibold text-zinc-900">
                    {c.currency === "USD" ? "合作价格（美元）" : "合作价格（日元）"}{" "}
                    {formatCurrency(c.price, c.currency)}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-600">
                  <span>👍 {formatNumber(c.likes)}</span>
                  <span>💬 {formatNumber(c.comments)}</span>
                  <span>↗ {formatNumber(c.shares)}</span>
                  {c.views > 0 && <span>👁 {formatNumber(c.views)}</span>}
                  <span>
                    互动率 {engagementRate(c, kol.followers).toFixed(2)}%
                  </span>
                  <span>总互动 {formatNumber(engagementTotal(c))}</span>
                </div>

                <a
                  href={c.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm text-rose-600 hover:underline"
                >
                  发布链接 →
                </a>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
