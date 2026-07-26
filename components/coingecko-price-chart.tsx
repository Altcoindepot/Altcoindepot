"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { readResponseJsonSafely } from "@/lib/read-response-json";

const RANGES = [
  { label: "24H", days: "1" },
  { label: "7D", days: "7" },
  { label: "30D", days: "30" },
  { label: "90D", days: "90" },
  { label: "1Y", days: "365" },
] as const;

type Candle = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
};

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n < 1 ? 6 : 2,
  }).format(n);
}

function downsampleCandles(candles: Candle[], maxBars: number): Candle[] {
  if (candles.length <= maxBars) return candles;
  const step = candles.length / maxBars;
  const out: Candle[] = [];
  for (let i = 0; i < maxBars; i++) {
    const start = Math.floor(i * step);
    const end = Math.floor((i + 1) * step);
    const slice = candles.slice(start, Math.max(end, start + 1));
    if (slice.length === 0) continue;
    const first = slice[0]!;
    const last = slice[slice.length - 1]!;
    out.push({
      t: last.t,
      o: first.o,
      h: Math.max(...slice.map((c) => c.h)),
      l: Math.min(...slice.map((c) => c.l)),
      c: last.c,
    });
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
  const svgRef = useRef<SVGSVGElement>(null);
  const [days, setDays] = useState<string>("7");
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setScrubIndex(null);

    void (async () => {
      try {
        const res = await fetch(
          `/api/coin-chart?id=${encodeURIComponent(coinId)}&days=${encodeURIComponent(days)}`,
          { signal: controller.signal, cache: "no-store" },
        );
        const data = await readResponseJsonSafely(res);
        if (!res.ok || !data || typeof data !== "object") {
          throw new Error(
            res.status === 429
              ? "Chart is rate-limited right now. Tap retry in a few seconds."
              : "We couldn’t load this chart. CoinGecko may be slow — try again.",
          );
        }
        const raw = (data as { ohlc?: unknown }).ohlc;
        if (!Array.isArray(raw) || raw.length < 2) {
          throw new Error("No chart data is available for this range.");
        }
        const parsed: Candle[] = [];
        for (const row of raw) {
          if (
            Array.isArray(row) &&
            row.length >= 5 &&
            typeof row[0] === "number" &&
            typeof row[1] === "number" &&
            typeof row[2] === "number" &&
            typeof row[3] === "number" &&
            typeof row[4] === "number" &&
            Number.isFinite(row[0]) &&
            Number.isFinite(row[1]) &&
            Number.isFinite(row[2]) &&
            Number.isFinite(row[3]) &&
            Number.isFinite(row[4])
          ) {
            parsed.push({ t: row[0], o: row[1], h: row[2], l: row[3], c: row[4] });
          }
        }
        if (parsed.length < 2) throw new Error("No chart data is available for this range.");
        if (!controller.signal.aborted) setCandles(parsed);
      } catch (e) {
        if (controller.signal.aborted) return;
        setCandles([]);
        setError(
          e instanceof Error ? e.message : "Chart unavailable. Please try again shortly.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [coinId, days, reloadKey]);

  const series = useMemo(() => downsampleCandles(candles, 72), [candles]);
  const first = series[0]?.c ?? null;
  const last = series[series.length - 1]?.c ?? null;
  const changePct =
    first != null && last != null && first !== 0 ? ((last - first) / first) * 100 : null;
  const positive = (changePct ?? 0) >= 0;

  const width = 640;
  const height = 280;
  const padX = 10;
  const padY = 14;

  const layout = useMemo(() => {
    if (series.length < 2) return null;
    const highs = series.map((c) => c.h);
    const lows = series.map((c) => c.l);
    const min = Math.min(...lows);
    const max = Math.max(...highs);
    const range = max - min || 1;
    const slot = (width - padX * 2) / series.length;
    const bodyW = Math.max(2.5, Math.min(10, slot * 0.62));
    const yFor = (price: number) =>
      height - padY - ((price - min) / range) * (height - padY * 2);

    return series.map((candle, i) => {
      const cx = padX + i * slot + slot / 2;
      const yO = yFor(candle.o);
      const yC = yFor(candle.c);
      const yH = yFor(candle.h);
      const yL = yFor(candle.l);
      const up = candle.c >= candle.o;
      return {
        candle,
        cx,
        yO,
        yC,
        yH,
        yL,
        bodyTop: Math.min(yO, yC),
        bodyH: Math.max(1.5, Math.abs(yC - yO)),
        bodyW,
        up,
        color: up ? "#34d399" : "#f87171",
      };
    });
  }, [series]);

  const updateScrub = useCallback(
    (clientX: number) => {
      const svg = svgRef.current;
      if (!svg || series.length < 2) return;
      const rect = svg.getBoundingClientRect();
      if (rect.width <= 0) return;
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const idx = Math.min(series.length - 1, Math.max(0, Math.floor(ratio * series.length)));
      setScrubIndex(idx);
    },
    [series.length],
  );

  const scrubCandle = scrubIndex != null ? series[scrubIndex] : null;
  const scrubBar = scrubIndex != null && layout ? layout[scrubIndex] : null;
  const displayPrice = scrubCandle?.c ?? last;
  const displayTime = scrubCandle?.t;

  const geckoHref = `https://www.coingecko.com/en/coins/${encodeURIComponent(coinId)}`;
  const sym = symbol.toUpperCase() || "—";

  return (
    <article className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-[#111111]">
      <div className="flex flex-col gap-3 border-b border-white/10 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div>
          <h3 className="text-base font-semibold text-zinc-100 sm:text-sm">
            {coinName} ({sym}) chart
          </h3>
          <p className="text-xs text-zinc-500 sm:text-[10px]">
            Candlesticks · CoinGecko OHLC · USD · Drag to inspect
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {displayPrice != null ? (
            <p className="font-mono text-base text-zinc-100 sm:text-sm">
              {formatUsd(displayPrice)}{" "}
              {scrubCandle == null && changePct != null ? (
                <span className={positive ? "text-emerald-300" : "text-red-300"}>
                  {positive ? "+" : ""}
                  {changePct.toFixed(2)}%
                </span>
              ) : null}
            </p>
          ) : null}
          {scrubCandle ? (
            <p className="font-mono text-[11px] text-zinc-400">
              O {formatUsd(scrubCandle.o)} · H {formatUsd(scrubCandle.h)} · L{" "}
              {formatUsd(scrubCandle.l)} · C {formatUsd(scrubCandle.c)}
            </p>
          ) : null}
          {displayTime != null ? (
            <p className="text-xs text-zinc-500">
              {new Date(displayTime).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          ) : null}
          <a
            href={geckoHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center text-sm font-medium text-[#00ff9f] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a855f7] sm:min-h-0 sm:text-xs"
          >
            Open on CoinGecko
          </a>
        </div>
      </div>

      <div
        className="flex flex-wrap gap-2 border-b border-white/10 bg-[#0d0d0d] px-2 py-2.5 sm:gap-1 sm:px-3"
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
              className={`min-h-11 min-w-[3.25rem] flex-1 rounded-lg border px-3 py-2 text-sm font-semibold tabular-nums transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a855f7] sm:min-h-9 sm:flex-none sm:px-2.5 sm:py-1.5 sm:text-[11px] ${
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

      <div className="relative min-h-[260px] w-full touch-pan-y bg-[#0a0a0a] sm:min-h-[280px]">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
            <p className="text-sm text-zinc-400">Loading chart…</p>
            <p className="text-xs text-zinc-600">Fetching OHLC candles from CoinGecko</p>
          </div>
        ) : null}
        {!loading && error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center">
            <p className="max-w-sm text-sm text-zinc-300">{error}</p>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="min-h-11 rounded-lg border border-[#d1a173]/45 bg-[#d1a173]/10 px-4 text-sm font-semibold text-[#d7ad82]"
            >
              Retry chart
            </button>
          </div>
        ) : null}
        {!loading && !error && layout ? (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            className="h-[260px] w-full touch-none select-none sm:h-[280px]"
            role="img"
            aria-label={`${coinName} candlestick chart. Drag or tap to inspect prices.`}
            onPointerDown={(e) => {
              (e.target as Element).setPointerCapture?.(e.pointerId);
              updateScrub(e.clientX);
            }}
            onPointerMove={(e) => {
              if (e.buttons === 0 && e.pointerType === "mouse") return;
              updateScrub(e.clientX);
            }}
            onPointerUp={() => setScrubIndex(null)}
            onPointerCancel={() => setScrubIndex(null)}
            onPointerLeave={() => {
              if (window.matchMedia("(pointer: fine)").matches) setScrubIndex(null);
            }}
          >
            {layout.map((bar, i) => (
              <g key={`${bar.candle.t}-${i}`}>
                <line
                  x1={bar.cx}
                  x2={bar.cx}
                  y1={bar.yH}
                  y2={bar.yL}
                  stroke={bar.color}
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                <rect
                  x={bar.cx - bar.bodyW / 2}
                  y={bar.bodyTop}
                  width={bar.bodyW}
                  height={bar.bodyH}
                  fill={bar.color}
                  rx="0.5"
                />
              </g>
            ))}
            {scrubBar ? (
              <line
                x1={scrubBar.cx}
                x2={scrubBar.cx}
                y1={padY}
                y2={height - padY}
                stroke="rgba(244,221,195,0.45)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
            ) : null}
          </svg>
        ) : null}
      </div>
    </article>
  );
}
