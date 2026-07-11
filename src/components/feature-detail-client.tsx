"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { FeatureCollabRow } from "@/lib/insights-service";
import { formatCurrency } from "@/lib/utils";
import { PostCard } from "./post-card";

export function FeatureDetailClient({ feature }: { feature: string }) {
  const [collabs, setCollabs] = useState<FeatureCollabRow[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const res = await fetch(
        `/api/features/${encodeURIComponent(feature)}?${params}`,
      );
      const data = await res.json();
      setCollabs(data.collabs ?? []);
    } finally {
      setLoading(false);
    }
  }, [feature, dateFrom, dateTo]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 200);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const totalSpend = collabs.reduce((s, c) => s + c.price, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">发文总数</p>
          <p className="mt-1 text-xl font-semibold">{collabs.length}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">总合作价格</p>
          <p className="mt-1 text-xl font-semibold">{formatCurrency(totalSpend)}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">平均合作价格</p>
          <p className="mt-1 text-xl font-semibold">
            {collabs.length > 0 ? formatCurrency(Math.round(totalSpend / collabs.length)) : "—"}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
        />
      </div>

      {loading ? (
        <p className="text-center text-sm text-zinc-500">加载中...</p>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {collabs.map((c) => (
            <div key={c.id} className="space-y-2">
              <PostCard
                post={{
                  id: c.id,
                  publishedAt: c.publishedAt,
                  platform: c.platform,
                  feature,
                  contentTheme: c.contentTheme,
                  postUrl: c.postUrl,
                  price: c.price,
                  organicViews: c.organicViews,
                  totalEngagement: c.totalEngagement,
                  er: c.er,
                  sourceSheet: c.sourceSheet,
                  handle: c.handle,
                }}
              />
              <Link
                href={`/kols/${c.kolId}`}
                className="inline-block text-xs text-rose-600 hover:underline"
              >
                查看 @{c.handle} 的全部合作 →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
