"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatNumber } from "@/lib/utils";

export type BubbleDatum = {
  id: string;
  label: string;
  x: number;
  y: number;
  size: number;
  href?: string;
  sublabel?: string;
};

const COLORS = [
  { fill: "#fde8f0", stroke: "#e879a9", text: "#9d174d" },
  { fill: "#e0f5ef", stroke: "#6ecfb8", text: "#2d6a5a" },
  { fill: "#e8f0fd", stroke: "#7eb8da", text: "#1e4a6e" },
  { fill: "#f0ede8", stroke: "#c4b5a8", text: "#5c4a3a" },
  { fill: "#f5f0e8", stroke: "#f0c987", text: "#7a5a20" },
  { fill: "#ede8f5", stroke: "#c4b5e8", text: "#5a3d8a" },
];

const W = 900;
const H = 560;
const PAD = 72;

function sqrtNorm(v: number, max: number) {
  return Math.sqrt(Math.max(v, 0)) / Math.sqrt(Math.max(max, 1));
}

function labelLines(label: string, maxChars: number): string[] {
  const text = label.trim();
  if (text.length <= maxChars) return [text];
  if (text.length <= maxChars * 2) {
    const mid = Math.ceil(text.length / 2);
    return [text.slice(0, mid), text.slice(mid)];
  }
  return [`${text.slice(0, maxChars - 1)}…`];
}

function labelFontSize(r: number, lines: number) {
  if (lines > 1) return Math.max(8, Math.min(10, r * 0.28));
  return Math.max(9, Math.min(12, r * 0.32));
}

function axisMax(values: number[]) {
  if (values.length === 0) return 1;
  const sorted = [...values].sort((a, b) => a - b);
  const p90 = sorted[Math.floor(sorted.length * 0.9)] ?? sorted[sorted.length - 1];
  return Math.max(p90, 1);
}

export function BubbleChart({
  points,
  xLabel,
  yLabel,
  sizeLabel,
  emptyText = "暂无数据",
  title = "主题层级",
  onPointClick,
}: {
  points: BubbleDatum[];
  xLabel: string;
  yLabel: string;
  sizeLabel: string;
  emptyText?: string;
  title?: string;
  onPointClick?: (point: BubbleDatum) => void;
}) {
  const router = useRouter();
  const shellRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState<{ x: number; y: number; point: BubbleDatum } | null>(null);

  const panSpeed = isFullscreen ? 0.75 : 1;

  const { positions } = useMemo(() => {
    if (points.length === 0) {
      return { positions: [] as Array<BubbleDatum & { cx: number; cy: number; r: number; idx: number }> };
    }
    const mx = axisMax(points.map((p) => p.x));
    const my = axisMax(points.map((p) => p.y));
    const ms = Math.max(...points.map((p) => p.size), 1);
    const chartW = W - PAD * 2;
    const chartH = H - PAD * 2;
    const pos = points.map((p, idx) => {
      const cx = PAD + sqrtNorm(p.x, mx) * chartW;
      const cy = H - PAD - sqrtNorm(p.y, my) * chartH;
      const baseR = Math.max(28, Math.sqrt(p.size / ms) * 42);
      return { ...p, cx, cy, r: baseR, idx };
    });
    return { positions: pos };
  }, [points]);

  useEffect(() => {
    const onFullscreenChange = () => {
      const active = document.fullscreenElement === shellRef.current;
      setIsFullscreen(active);
      if (!active) {
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!shellRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await shellRef.current.requestFullscreen();
    }
  }, []);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const step = isFullscreen ? 0.94 : 0.92;
      setZoom((z) => Math.min(4, Math.max(0.5, z * (e.deltaY > 0 ? step : 2 - step))));
    },
    [isFullscreen],
  );

  const onDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-bubble]")) return;
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      last.current = { x: e.clientX, y: e.clientY };
      setPan((p) => ({
        x: p.x + (dx * panSpeed) / zoom,
        y: p.y + (dy * panSpeed) / zoom,
      }));
    },
    [zoom, panSpeed],
  );

  const onUp = useCallback(() => {
    dragging.current = false;
  }, []);

  if (points.length === 0) {
    return (
      <div className="flex h-[560px] items-center justify-center rounded-xl border border-[var(--border)] bg-white text-sm text-zinc-500">
        {emptyText}
      </div>
    );
  }

  const btnCls =
    "rounded border border-[var(--border)] px-2.5 py-1 text-xs hover:bg-mint-50";

  return (
    <div
      ref={shellRef}
      className={`rounded-xl border border-[var(--border)] bg-white shadow-sm ${
        isFullscreen ? "flex h-full w-full flex-col p-5" : "p-4"
      }`}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            {points.length} 个泡泡 · 横轴 {xLabel} · 纵轴 {yLabel} · 大小 {sizeLabel}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {["放大", "缩小", "重置"].map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                if (i === 0) setZoom((z) => Math.min(4, z * 1.2));
                else if (i === 1) setZoom((z) => Math.max(0.5, z / 1.2));
                else {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }
              }}
              className={btnCls}
            >
              {label}
            </button>
          ))}
          <button type="button" onClick={toggleFullscreen} className={btnCls}>
            {isFullscreen ? "退出全屏" : "全屏"}
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className={`relative cursor-grab overflow-hidden rounded-xl border border-mint-100 bg-[#fafcfb] active:cursor-grabbing ${
          isFullscreen ? "min-h-0 flex-1" : ""
        }`}
        style={isFullscreen ? undefined : { height: 560 }}
        onWheel={onWheel}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={() => {
          onUp();
          setHoveredId(null);
          setTooltip(null);
        }}
      >
        <svg width="100%" height="100%" viewBox={`${-pan.x} ${-pan.y} ${W / zoom} ${H / zoom}`}>
          <line x1={PAD} y1={H - PAD} x2={W - 20} y2={H - PAD} stroke="#b8ddd2" strokeWidth={1.5} />
          <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="#b8ddd2" strokeWidth={1.5} />
          <text x={W - 24} y={H - PAD + 24} fontSize={12} fill="#5a7a70" textAnchor="end">
            {xLabel}
          </text>
          <text x={PAD - 12} y={PAD - 12} fontSize={12} fill="#5a7a70" textAnchor="end">
            {yLabel}
          </text>

          {[0.25, 0.5, 0.75].map((t) => (
            <g key={t} opacity={0.6}>
              <line
                x1={PAD + (W - PAD * 2) * t}
                y1={PAD}
                x2={PAD + (W - PAD * 2) * t}
                y2={H - PAD}
                stroke="#dceee8"
                strokeDasharray="5 5"
              />
              <line
                x1={PAD}
                y1={H - PAD - (H - PAD * 2) * t}
                x2={W - 20}
                y2={H - PAD - (H - PAD * 2) * t}
                stroke="#dceee8"
                strokeDasharray="5 5"
              />
            </g>
          ))}

          {positions.map((p) => {
            const palette = COLORS[p.idx % COLORS.length];
            const hovered = hoveredId === p.id;
            const scale = hovered ? 1.35 : 1;
            const r = p.r * scale;
            const maxChars = r < 34 ? 5 : r < 44 ? 8 : 12;
            const lines = labelLines(p.label, maxChars);
            const fontSize = labelFontSize(r, lines.length);
            const lineHeight = fontSize + 2;
            return (
              <g
                key={p.id}
                data-bubble="1"
                transform={`translate(${p.cx}, ${p.cy})`}
                style={{ cursor: "pointer", transition: "transform 0.15s ease" }}
                onMouseEnter={(e) => {
                  setHoveredId(p.id);
                  const rect = viewportRef.current?.getBoundingClientRect();
                  if (rect) {
                    setTooltip({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                      point: p,
                    });
                  }
                }}
                onMouseMove={(e) => {
                  const rect = viewportRef.current?.getBoundingClientRect();
                  if (rect) {
                    setTooltip({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                      point: p,
                    });
                  }
                }}
                onMouseLeave={() => {
                  setHoveredId(null);
                  setTooltip(null);
                }}
                onClick={() => {
                  if (onPointClick) onPointClick(p);
                  else if (p.href) router.push(p.href);
                }}
              >
                <circle
                  r={r}
                  fill={palette.fill}
                  stroke={palette.stroke}
                  strokeWidth={hovered ? 3 : 2}
                  opacity={hovered ? 1 : 0.95}
                />
                <text
                  textAnchor="middle"
                  fill={palette.text}
                  fontSize={fontSize}
                  fontWeight={600}
                  pointerEvents="none"
                  stroke="white"
                  strokeWidth={2.5}
                  paintOrder="stroke"
                >
                  {lines.map((line, i) => (
                    <tspan key={i} x={0} dy={i === 0 ? -((lines.length - 1) * lineHeight) / 2 : lineHeight}>
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          })}
        </svg>

        {tooltip && hoveredId === tooltip.point.id && (
          <div
            className="pointer-events-none absolute z-20 max-w-[220px] rounded-lg border border-[var(--border)] bg-white p-3 text-xs shadow-lg"
            style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
          >
            <p className="font-semibold text-zinc-900">{tooltip.point.label}</p>
            <p className="mt-1 text-zinc-600">{xLabel}: {formatNumber(tooltip.point.x)}</p>
            <p className="text-zinc-600">{yLabel}: {formatNumber(tooltip.point.y)}</p>
            <p className="text-zinc-600">{sizeLabel}: {formatNumber(tooltip.point.size)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
