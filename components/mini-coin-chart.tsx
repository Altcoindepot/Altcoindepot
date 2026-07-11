function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function toNum(v: number | null | undefined) {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function buildSeries(change24h: number | null | undefined, change7d?: number | null): number[] {
  const c24 = clamp(toNum(change24h), -25, 25);
  const c7 = clamp(toNum(change7d), -35, 35);
  // Synthetic intraday path so every card can show a compact trend shape.
  return [c7 * 0.5, c24 * 0.15, c24 * 0.45, c24 * 0.75, c24];
}

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
  const chartPoints =
    Array.isArray(points) && points.filter((v) => Number.isFinite(v)).length >= 2
      ? points.filter((v): v is number => Number.isFinite(v)).slice(-40)
      : buildSeries(change24h, change7d);
  const positive = chartPoints[chartPoints.length - 1] >= chartPoints[0];
  const color = positive ? "#34d399" : "#f87171";
  const width = 90;
  const height = 28;
  const min = Math.min(...chartPoints);
  const max = Math.max(...chartPoints);
  const range = max - min || 1;
  const step = width / (chartPoints.length - 1);
  const polyline = chartPoints
    .map((p, i) => {
      const x = i * step;
      const y = height - ((p - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  const area = `0,${height} ${polyline} ${width},${height}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className ?? "h-7 w-full rounded border border-white/10 bg-[#0a0a0a]"}
      role="img"
      aria-label="Mini trend chart"
    >
      <defs>
        <linearGradient id={`mini-fill-${positive ? "up" : "down"}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.03" />
        </linearGradient>
      </defs>
      <polyline points={area} fill={`url(#mini-fill-${positive ? "up" : "down"})`} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
