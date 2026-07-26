"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MiniCoinChart } from "@/components/mini-coin-chart";
import { SectionHeading } from "@/components/section-heading";
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
/** Keep each side short so the section stays scannable. */
const PER_SIDE = 5;

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

function MoverCard({ coin, tone, rank }: { coin: Mover; tone: "up" | "down"; rank: number }) {
  const ch = coin.price_change_percentage_24h;
  const border =
    tone === "up"
      ? "border-emerald-500/30 hover:border-emerald-400/50"
      : "border-red-500/30 hover:border-red-400/50";
  const badgeCls =
    tone === "up"
      ? "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/35"
      : "bg-red-500/20 text-red-200 ring-1 ring-red-400/35";
  const rankCls =
    tone === "up"
      ? "bg-emerald-500/25 text-emerald-100"
      : "bg-red-500/25 text-red-100";

  return (
    <Link
      href={`/coin/${encodeURIComponent(coin.id)}`}
      className={`glass-card block rounded-xl border bg-[#0c0e14]/80 p-4 transition-colors sm:p-5 ${border}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold ${rankCls}`}
        >
          {rank}
        </span>
        {coin.image ? (
          <Image
            src={coin.image}
            alt=""
            width={36}
            height={36}
            className="mt-0.5 size-9 rounded-full ring-1 ring-white/10"
          />
        ) : (
          <span className="mt-0.5 size-9 rounded-full bg-zinc-700" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-mono text-base font-bold uppercase tracking-wide text-zinc-50">
                {coin.symbol}
              </p>
              <p className="truncate text-xs text-zinc-500">{coin.name}</p>
            </div>
            <span
              className={`shrink-0 rounded-lg px-2.5 py-1.5 font-mono text-sm font-bold tabular-nums ${badgeCls}`}
            >
              {formatPct(ch)}
            </span>
          </div>
          <p className="mt-2 font-mono text-sm tabular-nums text-zinc-200">
            {formatUsd(coin.current_price)}
            <span className="mx-1.5 text-zinc-600">·</span>
            <span className="text-xs text-zinc-500">Vol {formatCompactUsd(coin.total_volume)}</span>
          </p>
        </div>
      </div>
      <div className="mt-3.5">
        <MiniCoinChart
          change24h={ch}
          points={coin.sparkline_in_7d?.price}
          className="h-14 w-full rounded-md border border-white/12 bg-[#06070a]"
        />
      </div>
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
    tone === "up"
      ? "border-emerald-500/25 bg-gradient-to-b from-emerald-950/25 to-[#0c0e14]/40"
      : "border-red-500/25 bg-gradient-to-b from-red-950/25 to-[#0c0e14]/40";
  const titleCls = tone === "up" ? "text-emerald-200" : "text-red-200";
  const accentBar = tone === "up" ? "bg-emerald-400" : "bg-red-400";

  return (
    <div className={`rounded-2xl border ${panelBorder} p-4 sm:p-5`}>
      <div className="flex items-start gap-2.5">
        <span className={`mt-1.5 h-8 w-1 shrink-0 rounded-full ${accentBar}`} aria-hidden />
        <div>
          <h3
            id={headingId}
            className={`text-lg font-extrabold tracking-tight sm:text-xl ${titleCls}`}
          >
            {title}
          </h3>
          <p className="mt-1 text-xs text-zinc-400">{subtitle}</p>
        </div>
      </div>
      {coins.length === 0 ? (
        <p className="mt-5 text-sm text-zinc-500">No coins in this list right now.</p>
      ) : (
        <ul className="mt-5 flex flex-col gap-3" aria-labelledby={headingId}>
          {coins.map((coin, i) => (
            <li key={coin.id}>
              <MoverCard coin={coin} tone={tone} rank={i + 1} />
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
          const list = legacy as Mover[];
          setGainers(
            list
              .filter((c) => (c.price_change_percentage_24h ?? 0) > 0)
              .sort(
                (a, b) =>
                  (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0),
              )
              .slice(0, PER_SIDE),
          );
          setLosers(
            list
              .filter((c) => (c.price_change_percentage_24h ?? 0) < 0)
              .sort(
                (a, b) =>
                  (a.price_change_percentage_24h ?? 0) - (b.price_change_percentage_24h ?? 0),
              )
              .slice(0, PER_SIDE),
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
  const topGainers = gainers.slice(0, PER_SIDE);
  const topLosers = losers.slice(0, PER_SIDE);

  return (
    <section
      aria-labelledby="live-trending-heading"
      className="border-b border-[#f4ddc3]/10 bg-[#0f131b]/55 px-4 py-12 sm:px-6 sm:py-14"
    >
      <div className="glass-panel mx-auto max-w-6xl rounded-2xl p-5 sm:p-6 md:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <SectionHeading id="live-trending-heading">Gainers and Losers</SectionHeading>
            <p className="mt-2 text-sm text-zinc-400 sm:pl-4">
              Top gainers and losers among liquid coins ($5M+ 24h volume) · refreshes about every
              25s
            </p>
          </div>
          {updatedAt ? (
            <p className="font-mono text-[10px] text-zinc-500">
              Updated {new Date(updatedAt).toLocaleTimeString()}
            </p>
          ) : null}
        </div>

        {loading && empty ? (
          <p className="mt-5 text-sm text-zinc-500">Loading gainers and losers…</p>
        ) : null}

        {error && empty ? (
          <div className="mt-5 rounded-lg border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
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
          <div className="mt-6 flex flex-col gap-10 lg:grid lg:grid-cols-2 lg:gap-6">
            <MoversColumn
              headingId="top-gainers-heading"
              title="Top gainers"
              subtitle="Biggest 24h % rises · $5M+ volume"
              tone="up"
              coins={topGainers}
            />
            <div
              className="mx-1 border-t border-[#f4ddc3]/15 pt-2 lg:hidden"
              aria-hidden
            />
            <MoversColumn
              headingId="top-losers-heading"
              title="Top losers"
              subtitle="Biggest 24h % declines · $5M+ volume"
              tone="down"
              coins={topLosers}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
