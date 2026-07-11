"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DashboardMetrics } from "@/lib/types";
import { FeatureShareChart } from "./feature-share-chart";
import { KolSearchPreview } from "./kol-search-preview";
import { MetricsCards } from "./metrics-cards";
import { SectionShell } from "./section-shell";
import { WeeklyWow } from "./weekly-wow";

export function DashboardClient() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    fetch("/api/metrics")
      .then((r) => r.json())
      .then(setMetrics);
  }, []);

  return (
    <div className="space-y-8">
      <SectionShell
        title="历史合作汇总"
        description="2025.7 – 2026.6 排程周期内全部合作数据"
        variant="muted"
      >
        {metrics ? <MetricsCards metrics={metrics} /> : (
          <p className="text-sm text-zinc-500">加载中...</p>
        )}
      </SectionShell>

      <SectionShell
        title="每周 / 每月成效"
        description="按任意日期查看本期 vs 上期推广功能对比，为次周或次月选品提供参考"
        variant="white"
        action={
          <Link
            href="/insights/weekly"
            className="text-sm font-medium text-rose-600 hover:underline"
          >
            查看全部周数据 →
          </Link>
        }
      >
        <WeeklyWow />
      </SectionShell>

      <SectionShell
        title="推广功能占比"
        description="按周/月查看各推广功能在总互动量和发文数量中的占比"
        variant="muted"
      >
        <FeatureShareChart />
      </SectionShell>

      <SectionShell
        title="贴文搜索"
        description="按条件筛选达人，点击进入查看完整合作明细"
        variant="rose"
      >
        <KolSearchPreview />
      </SectionShell>
    </div>
  );
}
