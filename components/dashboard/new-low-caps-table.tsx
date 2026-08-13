"use client";

import Image from "next/image";
import Link from "next/link";
import type { LowCapRow } from "@/lib/dashboard-data";
import { formatCompactUsd } from "@/lib/format-compact-usd";
import { statusBadgeClass, rotationSignalLabel } from "@/lib/narratives";
import { ds } from "@/lib/ui-classes";
import { useWatchlist } from "@/components/use-watchlist";
import { WatchlistStarButton } from "@/components/watchlist-star-button";
import { InfoTooltip } from "@/components/info-tooltip";
import { PulseSparkline } from "@/components/dashboard/pulse-sparkline";

function formatPct(n: number | null) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

/** Left-edge accent for mobile New & Low Caps cards. */
function mobileCardRailClass(row: LowCapRow): string {
  if (row.status === "FADING") {
    return "border-l-[3px] border-l-[#fb7185]";
  }
  const slug = row.narrativeSlug.toLowerCase();
  const title = row.narrativeTitle.toLowerCase();
  if (slug.includes("ai") || title.includes("ai")) {
    return "border-l-[3px] border-l-[#34d399]";
  }
  if (slug === "rwa" || title.includes("rwa")) {
    return "border-l-[3px] border-l-[#6366f1]";
  }
  return "border-l-[3px] border-l-[#3f3f46]";
}

export function NewLowCapsTable({
  rows,
  className = "",
  watchlistOnly = false,
}: {
  rows: LowCapRow[];
  className?: string;
  /** When true, show only coins saved in `altcoin-depot-watchlist`. */
  watchlistOnly?: boolean;
}) {
  const { entries, mounted } = useWatchlist();
  const watchIds = new Set(entries.map((e) => e.id));

  const visibleRows =
    watchlistOnly && mounted ? rows.filter((row) => watchIds.has(row.id)) : rows;

  const filtering = watchlistOnly && mounted;

  return (
    <section
      aria-labelledby="new-low-caps-heading"
      className={`${ds.panelLg} flex h-full min-h-0 flex-col !p-0 overflow-hidden ${className}`.trim()}
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3 sm:px-5">
        <h2 id="new-low-caps-heading" className="text-sm font-semibold text-zinc-100 sm:text-base">
          {filtering ? "Watchlist · New & Low Caps" : "New & Low Caps"}
        </h2>
        <div className="flex items-center gap-3">
          {filtering ? (
            <Link
              href="/"
              className="text-xs font-medium text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline"
            >
              Show all
            </Link>
          ) : null}
          <Link
            href={filtering ? "/watchlist" : "/gainers-losers"}
            className="text-xs font-medium text-teal-300/90 underline-offset-2 hover:underline"
          >
            {filtering ? "Full watchlist →" : "View all →"}
          </Link>
        </div>
      </div>

      {!mounted && watchlistOnly ? (
        <p className="px-4 py-8 text-sm text-zinc-500 sm:px-5">Loading watchlist…</p>
      ) : visibleRows.length === 0 ? (
        <div className="px-4 py-8 sm:px-5">
          <p className="text-sm text-zinc-500">
            {filtering
              ? "No watchlist coins in this New & Low Caps set. Star a token below (or from a coin page), or open your full watchlist."
              : "Low-cap narrative names will appear here when CoinGecko category data loads."}
          </p>
          {filtering ? (
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/"
                className="text-xs font-medium text-teal-300/90 underline-offset-2 hover:underline"
              >
                ← Back to full dashboard
              </Link>
              <Link
                href="/watchlist"
                className="text-xs font-medium text-teal-300/90 underline-offset-2 hover:underline"
              >
                Open watchlist page →
              </Link>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <ul className="flex flex-col gap-2.5 p-3 md:hidden">
            {visibleRows.map((row) => {
              const signal = rotationSignalLabel(row.status);
              const strongInflow = signal === "STRONG INFLOW";
              return (
                <li key={`${row.id}-${row.narrativeSlug}-card`}>
                  <article
                    className={`flex items-center gap-3 rounded-xl border border-white/10 bg-[#0c0e14] px-3 py-3 ${
                      strongInflow
                        ? "border-emerald-400/25 bg-gradient-to-r from-emerald-500/[0.08] to-[#0c0e14] shadow-[0_0_15px_rgba(16,185,129,0.12)]"
                        : ""
                    } ${mobileCardRailClass(row)}`}
                  >
                    <WatchlistStarButton
                      coinId={row.id}
                      name={row.name}
                      symbol={row.symbol}
                      image={row.image || undefined}
                    />
                    <Link
                      href={`/coin/${encodeURIComponent(row.id)}`}
                      className="flex min-w-0 flex-1 items-center gap-3"
                    >
                      {row.image ? (
                        <Image
                          src={row.image}
                          alt=""
                          width={36}
                          height={36}
                          className="shrink-0 rounded-full"
                        />
                      ) : (
                        <span className="size-9 shrink-0 rounded-full bg-zinc-800" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-zinc-100">
                          {row.name}
                        </span>
                        <span className="mt-0.5 block font-mono text-[11px] uppercase text-zinc-500">
                          {row.symbol}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span
                          className={`block font-mono text-sm font-bold tabular-nums ${
                            (row.change7d ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"
                          }`}
                        >
                          {formatPct(row.change7d)}
                        </span>
                        <span className="mt-0.5 block text-[10px] uppercase tracking-wide text-zinc-500">
                          7D
                        </span>
                      </span>
                    </Link>
                  </article>
                </li>
              );
            })}
          </ul>

          <table className="hidden w-full min-w-[44rem] border-collapse text-left md:table">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-zinc-500">
                <th className="w-11 px-2 py-2.5 text-center font-semibold sm:px-3">
                  <span className="sr-only">Watchlist</span>
                  ★
                </th>
                <th className="px-2 py-2.5 font-semibold sm:px-4">Token</th>
                <th className="w-[85px] px-3 py-2.5 text-center font-semibold">Narrative</th>
                <th className="px-3 py-2.5 font-semibold">Market Cap</th>
                <th className="px-3 py-2.5 font-semibold">7D Change</th>
                <th className="px-3 py-2.5 font-semibold">Volume</th>
                <th className="px-3 py-2.5 font-semibold">
                  <span className="inline-flex items-center">
                    <InfoTooltip
                      label="About Rotation Signal"
                      text="Calculates real-time volume momentum. GREEN indicates strong capital entering; RED indicates interest is fading."
                    >
                      <span>Rotation Signal</span>
                    </InfoTooltip>
                  </span>
                </th>
                <th className="px-3 py-2.5 font-semibold">Added</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => {
                const signal = rotationSignalLabel(row.status);
                const strongInflow = signal === "STRONG INFLOW";
                return (
                  <tr
                    key={`${row.id}-${row.narrativeSlug}`}
                    className={`border-b border-white/5 last:border-0 transition-all duration-200 hover:bg-slate-800/30 hover:shadow-[0_0_12px_rgba(255,255,255,0.02)] ${
                      strongInflow
                        ? "bg-gradient-to-r from-emerald-500/[0.07] to-transparent shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                        : ""
                    }`}
                  >
                    <td className="px-2 py-3 text-center sm:px-3">
                      <WatchlistStarButton
                        coinId={row.id}
                        name={row.name}
                        symbol={row.symbol}
                        image={row.image || undefined}
                      />
                    </td>
                    <td className="px-2 py-3 sm:px-4">
                      <Link
                        href={`/coin/${encodeURIComponent(row.id)}`}
                        className="inline-flex items-center gap-2"
                      >
                        {row.image ? (
                          <Image
                            src={row.image}
                            alt=""
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        ) : null}
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-zinc-100">
                            {row.name}
                          </span>
                          <span className="mt-0.5 flex items-center gap-1.5">
                            <span
                              className={`inline-block h-4 w-4 shrink-0 rounded-full ${row.narrativeGlowClass}`}
                              title={row.narrativeTitle}
                              aria-label={`${row.narrativeTitle} narrative`}
                            />
                            <span className="font-mono text-[11px] uppercase text-zinc-500">
                              {row.symbol}
                            </span>
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="w-[85px] px-3 py-3">
                      <Link
                        href={`/narrative/${encodeURIComponent(row.narrativeSlug)}`}
                        className={`${ds.badgeInfo} inline-flex w-[85px] shrink-0 items-center justify-center truncate text-center transition-colors hover:border-teal-400/40 hover:text-teal-200`}
                        title={row.narrativeTitle}
                      >
                        {row.narrativeTitle}
                      </Link>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs tabular-nums text-zinc-300">
                      {formatCompactUsd(row.marketCap)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-start gap-2">
                        <span
                          className={`font-mono text-xs font-semibold tabular-nums ${
                            (row.change7d ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"
                          }`}
                        >
                          {formatPct(row.change7d)}
                        </span>
                        <PulseSparkline
                          points={row.sparkline}
                          positive={(row.change7d ?? 0) >= 0}
                          className="h-4 w-14 shrink-0"
                        />
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs tabular-nums text-zinc-400">
                      {formatCompactUsd(row.volume)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`ds-badge relative inline-flex items-center gap-1.5 ${statusBadgeClass(row.status)}`}
                      >
                        {strongInflow ? (
                          <span
                            className="strong-inflow-dot inline-block size-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.85)]"
                            aria-hidden
                          />
                        ) : null}
                        {signal}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-zinc-500">{row.addedLabel}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
