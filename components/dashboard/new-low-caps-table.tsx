"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { LowCapRow } from "@/lib/dashboard-data";
import { formatCompactUsd } from "@/lib/format-compact-usd";
import { formatChainLabel } from "@/lib/format-chain";
import { ds } from "@/lib/ui-classes";
import { useWatchlist } from "@/components/use-watchlist";
import { WatchlistStarButton } from "@/components/watchlist-star-button";
import { CopyAddressButton } from "@/components/copy-address-button";
import { DexProjectLinks } from "@/components/dex-project-links";
import { DexListControls } from "@/components/dex-list-controls";
import { DexVenueBadge } from "@/components/dex-venue-badge";
import { DexPulseChips } from "@/components/dex-pulse-chips";
import { DexListSegment } from "@/components/dex-list-segment";
import { RecentlyViewedStrip } from "@/components/recently-viewed-strip";
import { BecauseYouViewed } from "@/components/because-you-viewed";
import { dexTokenPath } from "@/lib/dex-token-path";
import {
  applyDexListQuery,
  dexListQuerySearchParams,
  LOW_CAPS_DEFAULT_QUERY,
  parseDexListQuery,
} from "@/lib/dex-list-query";

function formatPct(n: number | null) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function formatPrice(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1000) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  if (abs >= 1) return `$${n.toFixed(2)}`;
  if (abs >= 0.01) return `$${n.toFixed(4)}`;
  if (abs >= 0.000001) return `$${n.toFixed(8).replace(/0+$/, "").replace(/\.$/, "")}`;
  return `$${n.toExponential(2)}`;
}

/** Primary name click stays on-site; never uses DexScreener `row.href`. */
function tokenHref(row: LowCapRow): string {
  const onSite = dexTokenPath(row.chain, row.contractAddress);
  if (onSite) return onSite;
  // Fallback if address shape is unusual — still on-site token route.
  if (row.chain && row.contractAddress) {
    return `/token/${encodeURIComponent(row.chain.trim().toLowerCase())}/${encodeURIComponent(row.contractAddress.trim())}`;
  }
  return `/new-low-caps`;
}

function TokenNameLink({
  row,
  className,
  children,
}: {
  row: LowCapRow;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={tokenHref(row)} className={className}>
      {children}
    </Link>
  );
}

export function NewLowCapsTable({
  rows,
  className = "",
  watchlistOnly = false,
  viewAllHref = "/new-low-caps",
  showViewAll = true,
  heading = "New & Low Caps",
  /** When false, omit segment/chips/controls (home embeds Just Launched chrome above). */
  showListChrome = true,
}: {
  rows: LowCapRow[];
  className?: string;
  /** When true, show only coins saved in `altcoin-depot-watchlist`. */
  watchlistOnly?: boolean;
  viewAllHref?: string;
  showViewAll?: boolean;
  heading?: string;
  showListChrome?: boolean;
}) {
  const { entries, mounted } = useWatchlist();
  const searchParams = useSearchParams();
  const listQuery = parseDexListQuery(searchParams, LOW_CAPS_DEFAULT_QUERY);
  const watchIds = new Set(entries.map((e) => e.id));

  const watchFiltered =
    watchlistOnly && mounted ? rows.filter((row) => watchIds.has(row.id)) : rows;

  const visibleRows = useMemo(
    () =>
      applyDexListQuery(
        watchFiltered.map((row) => ({ ...row, change24h: row.change7d })),
        listQuery,
      ),
    [watchFiltered, listQuery],
  );

  const chainIds = useMemo(
    () => [...new Set(rows.map((row) => row.chain).filter((chain): chain is string => Boolean(chain)))],
    [rows],
  );

  const filtering = watchlistOnly && mounted;
  const noFilterMatches = watchFiltered.length > 0 && visibleRows.length === 0;

  return (
    <section
      aria-labelledby="new-low-caps-heading"
      className={`${ds.panelLg} flex flex-col !p-0 overflow-hidden ${className}`.trim()}
    >
      <div className="flex shrink-0 flex-col gap-2 border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="new-low-caps-heading" className="text-sm font-semibold text-zinc-100 sm:text-base">
            {filtering ? "Watchlist · New & Low Caps" : heading}
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
            {filtering ? (
              <Link
                href="/watchlist"
                className="text-xs font-medium text-teal-300/90 underline-offset-2 hover:underline"
              >
                Full watchlist →
              </Link>
            ) : showViewAll ? (
              <Link
                href={`${viewAllHref}${dexListQuerySearchParams(listQuery, null, LOW_CAPS_DEFAULT_QUERY)}`}
                className="text-xs font-medium text-teal-300/90 underline-offset-2 hover:underline"
              >
                View all →
              </Link>
            ) : null}
          </div>
        </div>
        {rows.length > 0 && showListChrome ? (
          <div className="flex flex-col gap-2">
            <DexListSegment />
            <DexPulseChips defaults={LOW_CAPS_DEFAULT_QUERY} />
            <DexListControls chains={chainIds} defaults={LOW_CAPS_DEFAULT_QUERY} />
          </div>
        ) : null}
      </div>

      {!mounted && watchlistOnly ? (
        <p className="px-4 py-8 text-sm text-zinc-500 sm:px-5">Loading watchlist…</p>
      ) : visibleRows.length === 0 ? (
        <div className="px-4 py-8 sm:px-5">
          <p className="text-sm text-zinc-500">
            {filtering && watchFiltered.length === 0
              ? "No watchlist coins in this New & Low Caps set. Star a token below (or from a coin page), or open your full watchlist."
              : noFilterMatches
                ? "No pairs match these filters."
                : "Low-cap names will appear here when live pair data loads."}
          </p>
          {filtering && watchFiltered.length === 0 ? (
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
          <div className="overflow-x-auto">
          {showListChrome ? (
            <div className="space-y-3 px-4 pt-3 sm:px-5">
              <RecentlyViewedStrip />
              <BecauseYouViewed rows={visibleRows} />
            </div>
          ) : null}
          <ul className="divide-y divide-white/5 md:hidden">
            {visibleRows.map((row) => {
              const chain = formatChainLabel(row.chain);
              const useVolume = row.volume != null;
              const secondary = useVolume ? row.volume : (row.liquidity ?? null);
              const secondaryLabel = useVolume ? "Vol" : "Liq";
              return (
                <li key={`${row.id}-${row.narrativeSlug}-card`}>
                  <Link
                    href={tokenHref(row)}
                    className="flex min-h-11 items-center gap-2 px-3 py-1.5 active:bg-white/[0.04]"
                  >
                    {row.image ? (
                      <Image
                        src={row.image}
                        alt=""
                        width={20}
                        height={20}
                        className="size-5 shrink-0 rounded-full"
                      />
                    ) : (
                      <span className="size-5 shrink-0 rounded-full bg-zinc-800" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate text-[13px] font-medium leading-tight text-zinc-100">
                          {row.name}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] uppercase text-zinc-500">
                          {row.symbol}
                        </span>
                        {row.chain ? (
                          <span className="shrink-0 rounded bg-zinc-800 px-1 py-px font-mono text-[9px] uppercase tracking-wide text-zinc-400">
                            {chain}
                            {row.dexLabel ? ` · ${row.dexLabel}` : ""}
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block font-mono text-[10px] tabular-nums leading-tight text-zinc-500">
                        <span className="text-zinc-300">{formatPrice(row.priceUsd)}</span>
                        {" · "}
                        {secondaryLabel} {formatCompactUsd(secondary)}
                        {" · "}
                        {row.addedLabel || "—"}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 font-mono text-xs font-semibold tabular-nums ${
                        (row.change7d ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"
                      }`}
                    >
                      {formatPct(row.change7d)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <table className="hidden w-full min-w-[70rem] border-collapse text-left md:table">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-zinc-500">
                <th className="w-11 px-2 py-2.5 text-center font-semibold sm:px-3">
                  <span className="sr-only">Watchlist</span>
                  ★
                </th>
                <th className="px-2 py-2.5 font-semibold sm:px-4">Token</th>
                <th className="px-3 py-2.5 font-semibold">Price</th>
                <th className="px-3 py-2.5 font-semibold">Chain</th>
                <th className="px-3 py-2.5 font-semibold">DEX</th>
                <th className="px-3 py-2.5 font-semibold">Age</th>
                <th className="px-3 py-2.5 font-semibold">24h %</th>
                <th className="px-3 py-2.5 font-semibold">Liquidity</th>
                <th className="px-3 py-2.5 font-semibold">Volume</th>
                <th className="w-[85px] px-3 py-2.5 text-center font-semibold">Narrative</th>
                <th className="px-3 py-2.5 font-semibold">Contract</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => {
                const chain = formatChainLabel(row.chain);
                return (
                  <tr
                    key={`${row.id}-${row.narrativeSlug}`}
                    className="border-b border-white/5 last:border-0 transition-colors hover:bg-slate-800/30"
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
                      <div className="flex items-start gap-2">
                        <TokenNameLink row={row} className="inline-flex min-w-0 items-center gap-2">
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
                            <span className="font-mono text-[11px] uppercase text-zinc-500">
                              {row.symbol}
                            </span>
                          </span>
                        </TokenNameLink>
                        <span
                          className="shrink-0 pt-0.5"
                          onClick={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          <DexProjectLinks links={row.projectLinks} variant="icons" />
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs tabular-nums text-zinc-200">
                      {formatPrice(row.priceUsd)}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`${ds.badgeInfo}`}>{chain}</span>
                    </td>
                    <td className="px-3 py-3">
                      <DexVenueBadge dexId={row.dexId} dexLabel={row.dexLabel} />
                    </td>
                    <td className="px-3 py-3 text-xs text-zinc-300">{row.addedLabel}</td>
                    <td
                      className={`px-3 py-3 font-mono text-xs font-semibold tabular-nums ${
                        (row.change7d ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"
                      }`}
                    >
                      {formatPct(row.change7d)}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs tabular-nums text-zinc-300">
                      {formatCompactUsd(row.liquidity)}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs tabular-nums text-zinc-400">
                      {formatCompactUsd(row.volume)}
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
                    <td className="px-3 py-3">
                      {row.contractAddress ? (
                        <CopyAddressButton address={row.contractAddress} />
                      ) : (
                        <span className="text-xs text-zinc-600">—</span>
                      )}
                    </td>
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
