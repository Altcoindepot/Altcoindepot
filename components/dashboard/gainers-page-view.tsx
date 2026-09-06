"use client";

import Link from "next/link";
import {
  chainMoverHref,
  type ChainMoverRow,
  type ChainMoversBoard,
  MOVER_CHAINS,
} from "@/lib/dex-chain-movers";
import { formatDexPct, formatDexPriceUsd } from "@/lib/dex-pair-fields";
import { formatChainLabel } from "@/lib/format-chain";
import { TokenAvatar } from "@/components/token-avatar";
import { MiniCoinChart } from "@/components/mini-coin-chart";

function pairLabel(row: ChainMoverRow): string {
  const quote =
    row.quoteSymbol?.trim() ||
    (row.chain === "solana" ? "SOL" : formatChainLabel(row.chain));
  return `${row.symbol.toUpperCase()} / ${quote.toUpperCase()}`;
}

function absChange(row: ChainMoverRow): string | null {
  if (row.priceUsd == null || !Number.isFinite(row.priceUsd)) return null;
  const delta = row.priceUsd * (row.changePct / 100);
  if (!Number.isFinite(delta)) return null;
  const abs = Math.abs(delta);
  const digits = abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6;
  const body = abs.toFixed(digits).replace(/\.?0+$/, "");
  return `${delta >= 0 ? "+" : "−"}${body}`;
}

function HottestNowCard({ row }: { row: ChainMoverRow }) {
  const up = row.changePct >= 0;
  const href = chainMoverHref(row);
  const delta = absChange(row);

  return (
    <article className="glass-card rounded-[1.35rem] p-4 sm:p-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-200">
        <span aria-hidden>🔥 </span>
        Hottest now
      </p>

      <div className="mt-3 flex items-start gap-3">
        <TokenAvatar symbol={row.symbol} imageUrl={row.imageUrl} size={52} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-lg font-bold tracking-tight text-zinc-50 sm:text-xl">
                {pairLabel(row)}
              </p>
              <p className="mt-0.5 truncate text-sm text-zinc-500">{row.name}</p>
            </div>
            <div className="hidden w-[7.5rem] shrink-0 sm:block">
              <MiniCoinChart
                change24h={row.changePct}
                tone={up ? "up" : "down"}
                className="h-12 w-full border-0 bg-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-2xl font-bold tabular-nums tracking-tight text-zinc-50 sm:text-3xl">
            {formatDexPriceUsd(row.priceUsd)}
          </p>
          <p className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span
              className={`font-mono text-sm font-bold tabular-nums ${
                up ? "text-emerald-300" : "text-rose-300"
              }`}
            >
              {formatDexPct(row.changePct)}
            </span>
            {delta ? (
              <span className="font-mono text-xs tabular-nums text-zinc-500">{delta}</span>
            ) : null}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-24 shrink-0 sm:hidden">
            <MiniCoinChart
              change24h={row.changePct}
              tone={up ? "up" : "down"}
              className="h-10 w-full border-0 bg-transparent"
            />
          </div>
          <Link
            href={href}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-teal-300/40 bg-gradient-to-b from-teal-400/35 to-teal-600/25 px-4 text-sm font-semibold text-teal-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_0_18px_rgba(16,255,196,0.18)]"
          >
            Open Pair
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

function MoverRow({ row }: { row: ChainMoverRow }) {
  const up = row.changePct >= 0;
  return (
    <li>
      <Link
        href={chainMoverHref(row)}
        className="flex min-h-14 items-center gap-3 px-3.5 py-3 transition-colors active:bg-white/[0.04] sm:hover:bg-white/[0.03]"
      >
        <TokenAvatar symbol={row.symbol} imageUrl={row.imageUrl} size={36} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-bold tracking-tight text-zinc-50">
            {pairLabel(row)}
          </span>
          <span className="mt-0.5 block truncate text-[12px] text-zinc-500">{row.name}</span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-0.5">
          <span className="font-mono text-[13px] font-semibold tabular-nums text-zinc-100">
            {formatDexPriceUsd(row.priceUsd)}
          </span>
          <span
            className={`font-mono text-[12px] font-bold tabular-nums ${
              up ? "text-emerald-300" : "text-rose-300"
            }`}
          >
            {formatDexPct(row.changePct)}
          </span>
        </span>
        <span className="shrink-0 text-zinc-600" aria-hidden>
          ›
        </span>
      </Link>
    </li>
  );
}

function MoverListCard({
  title,
  seeAllHref,
  rows,
  emptyLabel,
}: {
  title: string;
  seeAllHref?: string;
  rows: ChainMoverRow[];
  emptyLabel: string;
}) {
  return (
    <section className="ds-list-shell">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
        <h2 className="text-base font-bold tracking-tight text-zinc-50">{title}</h2>
        {seeAllHref ? (
          <Link
            href={seeAllHref}
            className="text-[12px] font-semibold text-zinc-400 hover:text-teal-200"
          >
            See All ›
          </Link>
        ) : null}
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-zinc-500">{emptyLabel}</p>
      ) : (
        <ul className="divide-y divide-white/[0.06]">
          {rows.map((row) => (
            <MoverRow key={row.id} row={row} />
          ))}
        </ul>
      )}
    </section>
  );
}

function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Link
        href="/dex-scanner"
        className="glass-card flex min-h-[5.25rem] items-center gap-3 rounded-2xl p-3.5 transition-colors active:bg-white/[0.04]"
      >
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-teal-400/30 bg-teal-500/10 text-teal-200"
          aria-hidden
        >
          <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" strokeLinecap="round" />
            <path d="M7 12h10" strokeLinecap="round" />
          </svg>
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold text-zinc-50">Scanner</span>
          <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500">
            Scan QR or address
          </span>
        </span>
      </Link>
      <Link
        href="/new-low-caps"
        className="glass-card flex min-h-[5.25rem] items-center gap-3 rounded-2xl p-3.5 transition-colors active:bg-white/[0.04]"
      >
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-teal-400/30 bg-teal-500/10 text-teal-200"
          aria-hidden
        >
          <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M12 19V9" strokeLinecap="round" />
            <path d="m8 12 4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 19h10" strokeLinecap="round" />
            <path d="M9.5 7.5c.8-1.6 1.7-2.5 2.5-2.5s1.7.9 2.5 2.5" strokeLinecap="round" />
          </svg>
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold text-zinc-50">Low Caps</span>
          <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500">
            Undiscovered gems
          </span>
        </span>
      </Link>
    </div>
  );
}

function flattenGainers(boards: ChainMoversBoard[], limit: number): ChainMoverRow[] {
  const seen = new Set<string>();
  const rows = boards
    .flatMap((b) => b.gainers)
    .sort((a, b) => b.changePct - a.changePct);
  const out: ChainMoverRow[] = [];
  for (const row of rows) {
    const key = row.id;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
    if (out.length >= limit) break;
  }
  return out;
}

function flattenLosers(boards: ChainMoversBoard[], limit: number): ChainMoverRow[] {
  const seen = new Set<string>();
  const rows = boards
    .flatMap((b) => b.losers)
    .sort((a, b) => a.changePct - b.changePct);
  const out: ChainMoverRow[] = [];
  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * Gainers page — mock-aligned mobile composition:
 * Hottest Now → Top Gainers list → Top Losers → Scanner/Low Caps tiles.
 */
export function GainersPageView({
  boards,
  chainFilter = "",
}: {
  boards: ChainMoversBoard[];
  chainFilter?: string;
}) {
  const gainers = flattenGainers(boards, 12);
  const losers = flattenLosers(boards, 8);
  const hottest = gainers[0] ?? null;
  const listGainers = hottest ? gainers.slice(1) : gainers;
  const windowHint =
    boards.find((b) => b.gainers.length > 0)?.window === "1h" ? "1H" : "24H";

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 sm:max-w-2xl sm:gap-5 lg:max-w-3xl">
      <div className="-mx-0.5 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link
          href="/gainers-losers"
          className={`inline-flex min-h-9 shrink-0 items-center rounded-full px-3.5 text-xs font-semibold ${
            !chainFilter
              ? "nav-pill-active"
              : "border border-white/10 bg-white/[0.03] text-zinc-400"
          }`}
        >
          All
        </Link>
        {MOVER_CHAINS.map((c) => {
          const active = chainFilter === c.id;
          return (
            <Link
              key={c.id}
              href={`/gainers-losers?chain=${c.id}`}
              className={`inline-flex min-h-9 shrink-0 items-center rounded-full px-3.5 text-xs font-semibold ${
                active
                  ? "nav-pill-active"
                  : "border border-white/10 bg-white/[0.03] text-zinc-400"
              }`}
            >
              {c.id === "injective" ? "INJ" : formatChainLabel(c.id)}
            </Link>
          );
        })}
      </div>

      {hottest ? <HottestNowCard row={hottest} /> : null}

      <MoverListCard
        title="Top Gainers"
        seeAllHref="/dex-scanner"
        rows={listGainers}
        emptyLabel={`No ${windowHint} gainers right now`}
      />

      <MoverListCard
        title="Top Losers"
        rows={losers}
        emptyLabel={`No ${windowHint} losers right now`}
      />

      <QuickActions />
    </div>
  );
}
