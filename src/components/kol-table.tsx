import Link from "next/link";
import type { KolWithStats } from "@/lib/types";
import { PLATFORM_LABELS } from "@/lib/types";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

export function KolTable({ kols }: { kols: KolWithStats[] }) {
  if (kols.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
        <p className="text-sm text-zinc-500">没有符合筛选条件的达人</p>
        <Link href="/import" className="mt-2 inline-block text-sm text-rose-600 hover:underline">
          去导入合作数据 →
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">达人账号名</th>
              <th className="px-4 py-3">平台</th>
              <th className="px-4 py-3">合作次数</th>
              <th className="px-4 py-3">总合作价格（日元）</th>
              <th className="px-4 py-3">互动率</th>
              <th className="px-4 py-3">最近发文日期</th>
              <th className="px-4 py-3">推广功能</th>
              <th className="px-4 py-3">内容形式</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {kols.map((kol) => (
              <tr key={kol.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3">
                  <Link href={`/kols/${kol.id}`} className="group">
                    <p className="font-medium text-zinc-900 group-hover:text-rose-600">
                      @{kol.handle}
                    </p>
                    {kol.name !== kol.handle && (
                      <p className="text-xs text-zinc-500">{kol.name}</p>
                    )}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                    {PLATFORM_LABELS[kol.platform]}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-zinc-900">{kol.collabCount}</td>
                <td className="px-4 py-3 text-zinc-600">{formatCurrency(kol.totalSpend)}</td>
                <td className="px-4 py-3">
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
                <td className="px-4 py-3 text-zinc-600">
                  {kol.lastCollabDate ? formatDate(kol.lastCollabDate) : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {kol.features.slice(0, 2).map((f) => (
                      <span
                        key={f}
                        className="rounded bg-rose-50 px-1.5 py-0.5 text-xs text-rose-700"
                      >
                        {f}
                      </span>
                    ))}
                    {kol.features.length > 2 && (
                      <span className="text-xs text-zinc-400">+{kol.features.length - 2}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {kol.themes.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700"
                      >
                        {t}
                      </span>
                    ))}
                    {kol.themes.length > 2 && (
                      <span className="text-xs text-zinc-400">+{kol.themes.length - 2}</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-zinc-100 px-4 py-2 text-xs text-zinc-500">
        共 {kols.length} 位达人
      </div>
    </div>
  );
}
