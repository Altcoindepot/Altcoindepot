"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { readResponseJsonSafely } from "@/lib/read-response-json";

const RANGES = [
  { label: "24H", days: "1" },
  { label: "7D", days: "7" },
  { label: "30D", days: "30" },
  { label: "90D", days: "90" },
  { label: "1Y", days: "365" },
] as const;

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n < 1 ? 6 : 2,
  }).format(n);
}

function downsample(points: [number, number][], maxPoints: number): [number, number][] {
  if (points.length <= maxPoints) return points;
  const step = (points.length - 1) / (maxPoints - 1);
  const out: [number, number][] = [];
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round(i * step);
    out.push(points[idx]!);
  }
  return out;
}

export function CoinGeckoPriceChart({
  coinId,
  coinName,
  symbol,
}: {
  coinId: string;
  coinName: string;
  symbol: string;
}) {
  const gradId = useId().replace(/:/g, "");
  const [days, setDays] = useState<string>("7");
  const [prices, setPrices] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const res = await fetch(
          `/api/coin-chart?id=${encodeURIComponent(coinId)}&days=${encodeURIComponent(days)}`,
          { signal: controller.signal, cache: "no-store" },
        );
        const data = await readResponseJsonSafely(res);
        if (!res.ok || !data || typeof data !== "object") {
          throw new Error("Chart failed to load");
        }
        const raw = (data as { prices?: unknown }).prices;
        if (!Array.isArray(raw) || raw.length < 2) {
          throw new Error("No chart data available");
        }
        const parsed: [number, number][] = [];
        for (const row of raw) {
          if (
            Array.isArray(row) &&
            typeof row[0] === "number" &&
            typeof row[1] === "number" &&
            Number.isFinite(row[0]) &&
            Number.isFinite(row[1])
          ) {
            parsed.push([row[0], row[1]]);
          }
        }
        if (parsed.length < 2) throw new Error("No chart data available");
        if (!controller.signal.aborted) setPrices(parsed);
      } catch (e) {
        if (controller.signal.aborted) return;
        setPrices([]);
        setError(e instanceof Error ? e.message : "Chart unavailable");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [coinId, days]);

  const series = useMemo(() => downsample(prices, 120), [prices]);
  const first = series[0]?.[1] ?? null;
  const last = series[series.length - 1]?.[1] ?? null;
  const changePct =
    first != null && last != null && first !== 0 ? ((last - first) / first) * 100 : null;
  const positive = (changePct ?? 0) >= 0;
  const stroke = positive ? "#34d399" : "#f87171";

  const width = 640;
  const height = 280;
  const padX = 8;
  const padY = 12;

  let polyline = "";
  let area = "";
  if (series.length >= 2) {
    const values = series.map((p) => p[1]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const step = (width - padX * 2) / (series.length - 1);
    const coords = series.map((p, i) => {
      const x = padX + i * step;
      const y = height - padY - ((p[1] - min) / range) * (height - padY * 2);
      return `${x},${y}`;
    });
    polyline = coords.join(" ");
    area = `${padX},${height - padY} ${polyline} ${width - padX},${height - padY}`;
  }

  const geckoHref = `https://www.coingecko.com/en/coins/${encodeURIComponent(coinId)}`;
  const sym = symbol.toUpperCase() || "—";

  return (
    <article className="mt-4 overflow-hidden rounded-lg border border-white/10 bg-[#111111]">
      <div className="flex flex-col gap-2 border-b border-white/10 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">
            {coinName} ({sym}) chart
          </h3>
          <p className="text-[10px] text-zinc-500">Powered by CoinGecko · USD</p>
        </div>
        <div className="flex items-center gap-3">
          {last != null ? (
            <p className="font-mono text-sm text-zinc-100">
              {formatUsd(last)}{" "}
              {changePct != null ? (
                <span className={positive ? "text-emerald-300" : "text-red-300"}>
                  {positive ? "+" : ""}
                  {changePct.toFixed(2)}%
                </span>
              ) : null}
            </p>
          ) : null}
          <a
            href={geckoHref}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-xs font-medium text-[#00ff9f] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a855f7]"
          >
            Open on CoinGecko
          </a>
        </div>
      </div>

      <div
        className="flex flex-wrap gap-1 border-b border-white/10 bg-[#0d0d0d] px-2 py-2"
        role="group"
        aria-label="Chart range"
      >
        {RANGES.map((r) => {
          const active = days === r.days;
          return (
            <button
              key={r.days}
              type="button"
              onClick={() => setDays(r.days)}
              className={`rounded-md border px-2.5 py-1.5 text-[11px] font-semibold tabular-nums transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a855f7] ${
                active
                  ? "border-[#00ff9f]/50 bg-[#00ff9f]/10 text-[#00ff9f]"
                  : "border-white/12 bg-[#111111] text-zinc-400 hover:border-white/25 hover:text-zinc-200"
              }`}
              aria-pressed={active}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      <div className="relative min-h-[220px] w-full bg-[#0a0a0a] sm:min-h-[280px]">
        {loading ? (
          <p className="absolute inset-0 flex items-center justify-center text-xs text-zinc-500">
            Loading chart…
          </p>
        ) : null}
        {!loading && error ? (
          <p className="absolute inset-0 flex items-center justify-center px-4 text-center text-xs text-zinc-400">
            {error}
          </p>
        ) : null}
        {!loading && !error && polyline ? (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-[220px] w-full sm:h-[280px]"
            role="img"
            aria-label={`${coinName} price chart`}
          >
            <defs>
              <linearGradient id={`cg-fill-${gradId}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
                <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <polyline points={area} fill={`url(#cg-fill-${gradId})`} />
            <polyline
              points={polyline}
              fill="none"
              stroke={stroke}
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </div>
    </article>
  );
}
