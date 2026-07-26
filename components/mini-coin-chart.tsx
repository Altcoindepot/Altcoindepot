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
  return [c7 * 0.5, c24 * 0.15, c24 * 0.45, c24 * 0.75, c24];
}

/** High-contrast strokes for dark glass cards. */
const GREEN = "#86efac";
const RED = "#fda4af";

/** Default outer size — taller for clearer presence on coin cards. */
export const MINI_CHART_DEFAULT_CLASS =
  "h-16 w-full max-w-[200px] rounded-md border border-white/12 bg-[#06070a] sm:w-[180px]";

/** Compact 7d-oriented sparkline with strong stroke + fill presence. */
export function MiniCoinChart({
  change24h,
  change7d,
  points,
  className,
  /** Force stroke color (e.g. red for losers even if the series wiggles up). */
  tone,
}: {
  change24h: number | null | undefined;
  change7d?: number | null;
  points?: number[] | null;
  className?: string;
  tone?: "up" | "down";
}) {
  const gradId = useId().replace(/:/g, "");
  const chartPoints =
    Array.isArray(points) && points.filter((v) => Number.isFinite(v)).length >= 2
      ? points.filter((v): v is number => Number.isFinite(v)).slice(-48)
      : buildSeries(change24h, change7d);

  const first = chartPoints[0] ?? 0;
  const last = chartPoints[chartPoints.length - 1] ?? 0;
  const sevenDay = toNum(change7d);
  const positive =
    tone === "up" ? true : tone === "down" ? false : sevenDay != null ? sevenDay >= 0 : last >= first;
  const color = positive ? GREEN : RED;

  const width = 180;
  const height = 64;
  const padY = 5;
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
      className={className ?? MINI_CHART_DEFAULT_CLASS}
      role="img"
      aria-label={positive ? "7-day trend up" : "7-day trend down"}
    >
      <defs>
        <linearGradient id={`mini-fill-${gradId}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.42" />
          <stop offset="50%" stopColor={color} stopOpacity="0.16" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <polyline points={area} fill={`url(#mini-fill-${gradId})`} />
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="3.75"
        strokeOpacity="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
