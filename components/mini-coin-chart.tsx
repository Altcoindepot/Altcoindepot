"use client";

import { useId } from "react";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function toNum(v: number | null | undefined) {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function buildSeries(change24h: number | null | undefined, change7d?: number | null): number[] {
  const c24 = clamp(toNum(change24h) ?? 0, -25, 25);
  const c7 = clamp(toNum(change7d) ?? 0, -35, 35);
  // Synthetic path so every card can show a compact trend shape.
  return [c7 * 0.5, c24 * 0.15, c24 * 0.45, c24 * 0.75, c24];
}

const GREEN = "#22c55e";
const RED = "#ef4444";

/** Compact 7d-oriented sparkline (~120px) with gradient fill. */
export function MiniCoinChart({
  change24h,
  change7d,
  points,
  className,
}: {
  change24h: number | null | undefined;
  change7d?: number | null;
  points?: number[] | null;
  className?: string;
}) {
  const gradId = useId().replace(/:/g, "");
  const chartPoints =
    Array.isArray(points) && points.filter((v) => Number.isFinite(v)).length >= 2
      ? points.filter((v): v is number => Number.isFinite(v)).slice(-48)
      : buildSeries(change24h, change7d);

  const first = chartPoints[0] ?? 0;
  const last = chartPoints[chartPoints.length - 1] ?? 0;
  const sevenDay = toNum(change7d);
  const positive = sevenDay != null ? sevenDay >= 0 : last >= first;
  const color = positive ? GREEN : RED;

  const width = 120;
  const height = 36;
  const padY = 3;
  const min = Math.min(...chartPoints);
  const max = Math.max(...chartPoints);
  const range = max - min || 1;
  const step = chartPoints.length > 1 ? width / (chartPoints.length - 1) : width;
  const polyline = chartPoints
    .map((p, i) => {
      const x = i * step;
      const y = height - padY - ((p - min) / range) * (height - padY * 2);
      return `${x},${y}`;
    })
    .join(" ");
  const area = `0,${height} ${polyline} ${width},${height}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={
        className ??
        "h-9 w-[120px] max-w-full rounded border border-white/10 bg-[#0a0a0a]"
      }
      role="img"
      aria-label={positive ? "7-day trend up" : "7-day trend down"}
    >
      <defs>
        <linearGradient id={`mini-fill-${gradId}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polyline points={area} fill={`url(#mini-fill-${gradId})`} />
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
