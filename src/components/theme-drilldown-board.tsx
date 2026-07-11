"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { KolBubblePoint, ThemeBubblePoint } from "@/lib/analytics-service";
import { BubbleChart, type BubbleDatum } from "@/components/bubble-chart";
import { KolThemeHistoryDashboard } from "@/components/kol-theme-history-dashboard";
import type { ThemeFilterState } from "@/components/theme-analysis-filters";

export type ThemeDrillState = {
  level: "theme" | "kol" | "detail";
  feature: string | null;
  kolId: string | null;
};

const AXIS_LABELS = {
  totalSpend: "合作花费 JPY",
  totalViews: "总浏览",
  totalEngagement: "总互动量",
  postCount: "发文数",
};

function buildFilterParams(filters: ThemeFilterState) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.platform) params.set("platform", filters.platform);
  if (filters.feature) params.set("feature", filters.feature);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.minFollowers) params.set("minFollowers", filters.minFollowers);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  return params;
}

export function ThemeDrilldownBoard({
  filters,
  themes,
  themesLoading,
  drill,
  onDrillChange,
}: {
  filters: ThemeFilterState;
  themes: ThemeBubblePoint[];
  themesLoading: boolean;
  drill: ThemeDrillState;
  onDrillChange: (next: ThemeDrillState) => void;
}) {
  const [kols, setKols] = useState<KolBubblePoint[]>([]);
  const [kolsLoading, setKolsLoading] = useState(false);

  const themeBubbles: BubbleDatum[] = useMemo(
    () =>
      themes.map((t) => ({
        id: t.feature,
        label: t.feature,
        x: t[filters.xAxis],
        y: t[filters.yAxis],
        size: t[filters.sizeMetric],
        sublabel: `${t.postCount} 篇`,
      })),
    [themes, filters.xAxis, filters.yAxis, filters.sizeMetric],
  );

  const fetchKols = useCallback(async () => {
    if (!drill.feature) return;
    setKolsLoading(true);
    try {
      const params = buildFilterParams(filters);
      const res = await fetch(
        `/api/themes/${encodeURIComponent(drill.feature)}/bubbles?${params}`,
      );
      const data = await res.json();
      setKols(data.kols ?? []);
    } finally {
      setKolsLoading(false);
    }
  }, [drill.feature, filters]);

  useEffect(() => {
    if (drill.level === "kol" || drill.level === "detail") {
      fetchKols();
    }
  }, [drill.level, fetchKols]);

  const kolBubbles: BubbleDatum[] = useMemo(
    () =>
      kols.map((k) => ({
        id: k.kolId,
        label: k.handle,
        x: k.totalSpend,
        y: k.totalEngagement,
        size: k.postCount,
        sublabel: `${k.postCount} 篇`,
      })),
    [kols],
  );

  const selectedKol = kols.find((k) => k.kolId === drill.kolId) ?? null;

  if (drill.level === "detail" && drill.feature && drill.kolId) {
    return (
      <KolThemeHistoryDashboard
        feature={drill.feature}
        kolId={drill.kolId}
        kolPreview={selectedKol}
        filters={filters}
        onBack={() =>
          onDrillChange({ level: "kol", feature: drill.feature, kolId: null })
        }
      />
    );
  }

  if (drill.level === "kol" && drill.feature) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onDrillChange({ level: "theme", feature: null, kolId: null })}
            className="rounded-lg border border-mint-200 bg-mint-50 px-3 py-1.5 text-sm font-medium text-mint-700 hover:bg-mint-100"
          >
            ← 返回主题层
          </button>
          <p className="text-sm text-zinc-600">
            主题：<span className="font-medium text-zinc-900">{drill.feature}</span>
          </p>
        </div>
        {kolsLoading ? (
          <p className="py-16 text-center text-sm text-zinc-500">加载 KOL 泡泡图...</p>
        ) : (
          <BubbleChart
            points={kolBubbles}
            xLabel="合作花费 JPY"
            yLabel="总互动量"
            sizeLabel="发文数"
            title={`达人层级 · ${drill.feature}`}
            emptyText="该主题下暂无达人数据"
            onPointClick={(p) =>
              onDrillChange({
                level: "detail",
                feature: drill.feature,
                kolId: p.id,
              })
            }
          />
        )}
      </div>
    );
  }

  return themesLoading ? (
    <p className="py-16 text-center text-sm text-zinc-500">加载主题泡泡图...</p>
  ) : (
    <BubbleChart
      points={themeBubbles}
      xLabel={AXIS_LABELS[filters.xAxis]}
      yLabel={AXIS_LABELS[filters.yAxis]}
      sizeLabel={AXIS_LABELS[filters.sizeMetric]}
      emptyText="当前筛选下没有主题数据"
      title="主题层级"
      onPointClick={(p) =>
        onDrillChange({ level: "kol", feature: p.id, kolId: null })
      }
    />
  );
}
