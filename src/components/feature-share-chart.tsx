"use client";

import { useEffect, useState } from "react";
import type { FeatureSharePoint } from "@/lib/insights-service";

const COLORS = [
  "bg-rose-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-cyan-500",
  "bg-zinc-400",
];

export function FeatureShareChart() {
  const [granularity, setGranularity] = useState<"week" | "month">("week");
  const [metric, setMetric] = useState<"engagement" | "posts">("engagement");
  const [data, setData] = useState<FeatureSharePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/insights/share?granularity=${granularity}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [granularity]);

  const points = data.slice(0, 8);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="flex rounded-lg bg-white p-1 shadow-sm">
          {(["week", "month"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setGranularity(value)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                granularity === value
                  ? "bg-rose-500 text-white"
                  : "text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {value === "week" ? "按周" : "按月"}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg bg-white p-1 shadow-sm">
          {(["engagement", "posts"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMetric(value)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                metric === value
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {value === "engagement" ? "总互动量占比" : "发文数量占比"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="py-6 text-center text-sm text-zinc-500">加载占比数据...</p>
      ) : points.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-500">暂无占比数据</p>
      ) : (
        <div className="space-y-4">
          {points.map((point) => {
            const features = [...point.features]
              .sort((a, b) =>
                metric === "engagement"
                  ? b.share - a.share
                  : b.postShare - a.postShare,
              )
              .slice(0, 6);
            return (
            <div key={point.key} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-900">{point.label}</p>
                <p className="text-xs text-zinc-500">
                  {metric === "engagement" ? "按互动量" : "按发文数量"}，Top{" "}
                  {Math.min(features.length, 6)}
                </p>
              </div>
              <div className="flex h-5 overflow-hidden rounded-full bg-zinc-100">
                {features.map((feature, idx) => (
                  <div
                    key={feature.feature}
                    className={`${COLORS[idx % COLORS.length]} h-full`}
                    style={{
                      width: `${metric === "engagement" ? feature.share : feature.postShare}%`,
                    }}
                    title={`${feature.feature}: ${
                      metric === "engagement"
                        ? feature.share.toFixed(1)
                        : feature.postShare.toFixed(1)
                    }%`}
                  />
                ))}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {features.map((feature, idx) => (
                  <div
                    key={feature.feature}
                    className="rounded-lg bg-zinc-50 p-2 text-xs text-zinc-600"
                  >
                    <div className="flex items-center gap-1">
                      <span
                        className={`h-2 w-2 rounded-full ${COLORS[idx % COLORS.length]}`}
                      />
                      <span className="line-clamp-1">{feature.feature}</span>
                    </div>
                    <p className="mt-1 font-medium text-zinc-900">
                      {metric === "engagement"
                        ? feature.share.toFixed(1)
                        : feature.postShare.toFixed(1)}
                      %
                      <span className="ml-1 font-normal text-zinc-400">
                        {metric === "engagement"
                          ? `${feature.totalEngagement.toLocaleString("ja-JP")}互动`
                          : `${feature.postCount}条`}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}
