"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MiniCoinChart } from "@/components/mini-coin-chart";
import { formatCompactUsd } from "@/lib/format-compact-usd";
import { readResponseJsonSafely } from "@/lib/read-response-json";

type Mover = {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number | null;
  price_change_percentage_24h: number | null;
  total_volume: number | null;
  sparkline_in_7d?: { price?: number[] };
};

const POLL_MS = 25_000;

function formatUsd(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n < 1 ? 6 : 2,
  }).format(n);
}

function formatPct(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function MoverCard({ coin, tone }: { coin: Mover; tone: "up" | "down" }) {
  const ch = coin.price_change_percentage_24h;
  const border =
    tone === "up"
      ? "border-emerald-500/35 hover:border-emerald-400/60"
      : "border-red-500/35 hover:border-red-400/60";
  const pctCls = tone === "up" ? "text-emerald-300" : "text-red-300";
  const badgeCls =
    tone === "up"
      ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
      : "bg-red-500/15 text-red-300 ring-1 ring-red-500/30";

  return (
    <Link
      href={`/coin/${encodeURIComponent(coin.id)}`}
      className={`glass-card block rounded-lg border-2 bg-[#0c0e14]/70 p-3 transition-colors ${border}`}
    >
      <div className="flex items-center gap-2.5">
        {coin.image ? (
          <Image src={coin.image} alt="" width={28} height={28} className="rounded-full" />
        ) : (
          <span className="size-7 rounded-full bg-zinc-700" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-sm font-bold uppercase text-zinc-100">
            {coin.symbol}
          </p>
          <p className="truncate text-[11px] text-zinc-500">{coin.name}</p>
        </div>
        <span className={`shrink-0 rounded-md px-2 py-1 font-mono text-xs font-semibold ${badgeCls}`}>
          {formatPct(ch)}
        </span>
      </div>
      <div className="mt-2.5 flex items-center justify-between text-[11px]">
        <span className={`font-mono ${pctCls}`}>{formatUsd(coin.current_price)}</span>
        <span className="text-zinc-500">Vol {formatCompactUsd(coin.total_volume)}</span>
      </div>
      <MiniCoinChart
        change24h={ch}
        points={coin.sparkline_in_7d?.price}
        className="mt-2 h-7 w-full rounded border border-white/10 bg-[#0a0a0a]"
      />
    </Link>
  );
}

function MoversColumn({
  title,
  subtitle,
  tone,
  coins,
  headingId,
}: {
  title: string;
  subtitle: string;
  tone: "up" | "down";
  coins: Mover[];
  headingId: string;
}) {
  const panelBorder =
    tone === "up" ? "border-emerald-500/25 bg-emerald-950/20" : "border-red-500/25 bg-red-950/20";
  const titleCls = tone === "up" ? "text-emerald-300" : "text-red-300";
  const accentBar = tone === "up" ? "bg-emerald-400" : "bg-red-400";

  return (
    <div className={`rounded-xl border ${panelBorder} p-3 sm:p-4`}>
      <div className="flex items-start gap-2.5">
        <span className={`mt-1.5 h-8 w-1 shrink-0 rounded-full ${accentBar}`} aria-hidden />
        <div>
          <h3 id={headingId} className={`text-base font-extrabold tracking-tight sm:text-lg ${titleCls}`}>
            {title}
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>
        </div>
      </div>
      {coins.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">No coins in this list right now.</p>
      ) : (
        <ul className="mt-4 grid gap-2.5" aria-labelledby={headingId}>
          {coins.map((coin, i) => (
            <li key={coin.id} className="relative">
              <span
                className={`pointer-events-none absolute -left-0.5 top-3 z-10 flex size-5 items-center justify-center rounded-full font-mono text-[10px] font-bold ${
                  tone === "up"
                    ? "bg-emerald-500/25 text-emerald-200"
                    : "bg-red-500/25 text-red-200"
                }`}
              >
                {i + 1}
              </span>
              <div className="pl-3">
                <MoverCard coin={coin} tone={tone} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function LiveTrendingMovers() {
  const [gainers, setGainers] = useState<Mover[]>([]);
  const [losers, setLosers] = useState<Mover[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(`/api/trending-movers?_=${Date.now()}`, { cache: "no-store" });
        const data = await readResponseJsonSafely(res);
        if (!mounted) return;
        if (!res.ok || !data || typeof data !== "object") {
          setError(true);
          return;
        }

        const g = (data as { gainers?: unknown }).gainers;
        const l = (data as { losers?: unknown }).losers;
        const legacy = (data as { coins?: unknown }).coins;

        if (Array.isArray(g) && Array.isArray(l)) {
          setGainers(g as Mover[]);
          setLosers(l as Mover[]);
          setError(false);
        } else if (Array.isArray(legacy)) {
          // Fallback if an older cached response only has `coins`.
          const list = legacy as Mover[];
          setGainers(
            list
              .filter((c) => (c.price_change_percentage_24h ?? 0) > 0)
              .sort(
                (a, b) =>
                  (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0),
              )
              .slice(0, 6),
          );
          setLosers(
            list
              .filter((c) => (c.price_change_percentage_24h ?? 0) < 0)
              .sort(
                (a, b) =>
                  (a.price_change_percentage_24h ?? 0) - (b.price_change_percentage_24h ?? 0),
              )
              .slice(0, 6),
          );
          setError(false);
        }

        const ts = (data as { updatedAt?: unknown }).updatedAt;
        if (typeof ts === "string") setUpdatedAt(ts);
      } catch {
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    const id = window.setInterval(() => {
      void load();
    }, POLL_MS);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  const empty = gainers.length === 0 && losers.length === 0;

  return (
    <section
      aria-labelledby="live-trending-heading"
      className="border-b border-[#f4ddc3]/15 bg-[#0f131b]/55 px-4 py-8 sm:px-6"
    >
      <div className="glass-panel mx-auto max-w-6xl rounded-2xl p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2
              id="live-trending-heading"
              className="text-xl font-extrabold tracking-tight sm:text-2xl"
            >
              <span className="text-brand-altcoindepot">Live movers</span>
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Top gainers and losers among high-volume coins · 24h · refreshes about every 25s
            </p>
          </div>
          {updatedAt ? (
            <p className="font-mono text-[10px] text-zinc-500">
              Updated {new Date(updatedAt).toLocaleTimeString()}
            </p>
          ) : null}
        </div>

        {loading && empty ? (
          <p className="mt-4 text-sm text-zinc-500">Loading gainers and losers…</p>
        ) : null}

        {error && empty ? (
          <div className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-3 text-sm text-amber-100">
            Movers are unavailable right now (API busy or offline). We’ll keep retrying
            automatically.
          </div>
        ) : null}

        {error && !empty ? (
          <p className="mt-3 text-xs text-amber-200/80">
            Latest refresh failed — showing the last movers we got.
          </p>
        ) : null}

        {!empty ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2 lg:gap-5">
            <MoversColumn
              headingId="top-gainers-heading"
              title="Top gainers"
              subtitle="Biggest 24h % rises · high volume"
              tone="up"
              coins={gainers}
            />
            <MoversColumn
              headingId="top-losers-heading"
              title="Top losers"
              subtitle="Biggest 24h % declines · high volume"
              tone="down"
              coins={losers}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
