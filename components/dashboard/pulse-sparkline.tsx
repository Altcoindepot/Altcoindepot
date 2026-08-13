"use client";

/**
 * Compact sparkline matching Market Pulse (`MiniSpark`) visual tokens:
 * - Colors: #34d399 up / #f87171 down
 * - strokeWidth 1.6, round caps/joins
 * - viewBox 64×20, height class h-4
 */
const UP = "#34d399";
const DOWN = "#f87171";

function buildFallbackSeries(positive: boolean): number[] {
  return positive
    ? [4, 5, 4.5, 8, 7.5, 12, 14]
    : [14, 12, 13, 8, 9, 5, 3];
}

export function PulseSparkline({
  points,
  positive,
  className = "h-4 w-14 shrink-0",
}: {
  /** Price / series coordinates (at least 2 finite numbers). */
  points?: number[] | null;
  /** Force tone when series is missing or ambiguous. */
  positive?: boolean;
  className?: string;
}) {
  const finite =
    Array.isArray(points) && points.length >= 2
      ? points.filter((v): v is number => typeof v === "number" && Number.isFinite(v))
      : [];

  if (finite.length < 2) {
    const toneUp = positive !== false;
    const color = toneUp ? UP : DOWN;
    const fallback = buildFallbackSeries(toneUp);
    // Still draw a graceful illustrative line when live sparkline is missing.
    return (
      <svg
        viewBox="0 0 64 20"
        className={className}
        aria-hidden
        preserveAspectRatio="none"
      >
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.55"
          points={seriesToPoints(fallback)}
        />
      </svg>
    );
  }

  const first = finite[0]!;
  const last = finite[finite.length - 1]!;
  const up = positive != null ? positive : last >= first;
  const color = up ? UP : DOWN;
  const sampled =
    finite.length > 32
      ? finite.filter((_, i) => i % Math.ceil(finite.length / 32) === 0 || i === finite.length - 1)
      : finite;

  return (
    <svg viewBox="0 0 64 20" className={className} aria-hidden preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={seriesToPoints(sampled)}
      />
    </svg>
  );
}

function seriesToPoints(series: number[]): string {
  const width = 64;
  const height = 20;
  const padY = 3;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const step = series.length > 1 ? width / (series.length - 1) : width;
  return series
    .map((p, i) => {
      const x = i * step;
      const y = height - padY - ((p - min) / range) * (height - padY * 2);
      return `${x},${y}`;
    })
    .join(" ");
}
