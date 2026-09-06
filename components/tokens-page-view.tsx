"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DexLivePairRow } from "@/lib/dexscreener-live-pairs";
import { DEX_EXPLORER_MAX_ROWS } from "@/lib/dexscreener-live-pairs";
import {
  applyDexListQuery,
  dexListQuerySearchParams,
  MAJOR_DEX_CHAIN_FILTERS,
  PAIRS_DEFAULT_QUERY,
  parseDexListQuery,
  type DexListSort,
} from "@/lib/dex-list-query";
import { formatDexPct, formatDexPriceUsd } from "@/lib/dex-pair-fields";
import { formatCompactUsd } from "@/lib/format-compact-usd";
import { dexTokenPath } from "@/lib/dex-token-path";
import { formatChainLabel } from "@/lib/format-chain";
import {
  becauseYouViewedLabel,
  clearRecentlyViewed,
  readRecentlyViewed,
  recommendFromHistory,
  type RecentlyViewedToken,
} from "@/lib/recently-viewed";
import { TokenAvatar } from "@/components/token-avatar";
import { DexVenueBadge } from "@/components/dex-venue-badge";
import { MarketRow } from "@/components/market-row";

const PAGE_STEP = 50;
const INITIAL_VISIBLE = 100;

const SORT_OPTIONS: Array<{ id: DexListSort; label: string }> = [
  { id: "liquidity", label: "Liquidity" },
  { id: "volume", label: "Volume" },
  { id: "gainers", label: "24H %" },
  { id: "newest", label: "Newest" },
];

const CHAIN_CHIPS = [
  { id: "all", label: "All" },
  ...MAJOR_DEX_CHAIN_FILTERS.filter((c) =>
    ["solana", "ethereum", "base", "bsc", "arbitrum"].includes(c.id),
  ).map((c) => ({ id: c.id, label: c.label })),
] as const;

function tokenHref(row: DexLivePairRow): string {
  return (
    dexTokenPath(row.chain, row.address) ??
    `/token/${encodeURIComponent(row.chain)}/${encodeURIComponent(row.address)}`
  );
}

function pairTag(row: DexLivePairRow): string {
  return row.quoteSymbol ? `${row.symbol}/${row.quoteSymbol}` : row.symbol;
}

function TokensRecentlyViewed() {
  const [rows, setRows] = useState<RecentlyViewedToken[]>([]);

  useEffect(() => {
    const sync = () => setRows(readRecentlyViewed());
    sync();
    window.addEventListener("recently-viewed-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("recently-viewed-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (rows.length === 0) return null;

  return (
    <section aria-label="Recently viewed" className="glass-panel overflow-hidden rounded-2xl p-0">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight text-zinc-50">
          <svg
            className="size-4 text-teal-300/80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            aria-hidden
          >
            <circle cx="12" cy="12" r="8.25" />
            <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Recently viewed
        </h2>
        <button
          type="button"
          onClick={() => {
            clearRecentlyViewed();
            setRows([]);
          }}
          className="text-[11px] font-medium text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
        >
          Clear
        </button>
      </div>
      <div className="flex gap-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {rows.slice(0, 12).map((row, i) => {
          const href =
            dexTokenPath(row.chain, row.address) ??
            `/token/${encodeURIComponent(row.chain)}/${encodeURIComponent(row.address)}`;
          return (
            <Link
              key={`${row.chain}-${row.address}`}
              href={href}
              className={`flex min-w-[8.5rem] shrink-0 items-center gap-2.5 px-4 py-3.5 transition-colors hover:bg-white/[0.03] ${
                i > 0 ? "border-l border-white/10" : ""
              }`}
            >
              <TokenAvatar symbol={row.symbol} size={32} />
              <span className="min-w-0">
                <span className="block truncate font-mono text-[13px] font-bold uppercase text-zinc-50">
                  {row.symbol}
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-zinc-500">
                  {row.name || formatChainLabel(row.chain)}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function BecauseYouViewedChips({ rows }: { rows: DexLivePairRow[] }) {
  const [history, setHistory] = useState<RecentlyViewedToken[]>([]);

  useEffect(() => {
    const sync = () => setHistory(readRecentlyViewed());
    sync();
    window.addEventListener("recently-viewed-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("recently-viewed-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const recommendable = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        contractAddress: r.address,
        dexId: r.dex,
        dexLabel: r.dexLabel,
      })),
    [rows],
  );

  const picks = useMemo(
    () => recommendFromHistory(history, recommendable, 8),
    [history, recommendable],
  );
  const label = becauseYouViewedLabel(history);

  if (!label || picks.length === 0) return null;

  return (
    <section
      aria-label={label}
      className="chrome-glass flex flex-col gap-2.5 rounded-2xl px-3.5 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-4"
    >
      <p className="flex shrink-0 items-center gap-2 text-[12px] font-semibold text-zinc-300">
        <svg
          className="size-4 text-teal-300/80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          aria-hidden
        >
          <path d="M4 16.5 9 11l3.5 3.5L20 7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 7h6v6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {label}
      </p>
      <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {picks.map((row) => {
          const up = (row.change24h ?? 0) >= 0;
          return (
            <Link
              key={row.id}
              href={tokenHref(row)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-1.5"
            >
              <DexVenueBadge dexId={row.dex} dexLabel={row.dexLabel} iconOnly size={14} />
              <span className="font-mono text-[11px] font-semibold uppercase text-zinc-100">
                {pairTag(row)}
              </span>
              <span
                className={`font-mono text-[10px] font-bold tabular-nums ${
                  up ? "text-emerald-300" : "text-rose-300"
                }`}
              >
                {formatDexPct(row.change24h)}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function TokensPairsTable({
  rows,
  title,
  windowLabel,
}: {
  rows: DexLivePairRow[];
  title: string;
  windowLabel: string;
}) {
  if (rows.length === 0) return null;

  return (
    <section className="ds-list-shell overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight text-zinc-50 sm:text-base">
            <svg
              className="size-4 text-teal-300/80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              aria-hidden
            >
              <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
            </svg>
            {title}
          </h2>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            Live DEX data · Sorted by {windowLabel} · DexScreener
          </p>
        </div>
        <p className="font-mono text-[11px] tabular-nums text-zinc-500">{rows.length} pairs</p>
      </div>

      <ul className="divide-y divide-white/[0.06] lg:hidden">
        {rows.map((row) => (
          <li key={row.id}>
            <MarketRow
              href={tokenHref(row)}
              symbol={row.symbol}
              name={`${row.name} · ${row.dexLabel} Pool`}
              chain={row.chain}
              dexId={row.dex}
              dexLabel={row.dexLabel}
              pairLabel={pairTag(row)}
              priceUsd={row.priceUsd}
              changePct={row.change24h}
              metaLine={`${formatCompactUsd(row.volume24h)} vol · ${formatCompactUsd(row.liquidityUsd)} liq`}
            />
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[64rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-zinc-500">
              <th className="w-10 px-3 py-2.5 text-center font-semibold">#</th>
              <th className="px-3 py-2.5 font-semibold">Token</th>
              <th className="px-3 py-2.5 font-semibold">Price</th>
              <th className="px-3 py-2.5 font-semibold">24H %</th>
              <th className="px-3 py-2.5 font-semibold">1H %</th>
              <th className="px-3 py-2.5 font-semibold">Volume 24H</th>
              <th className="px-3 py-2.5 font-semibold">Liquidity</th>
              <th className="px-3 py-2.5 font-semibold">Age</th>
              <th className="px-3 py-2.5 font-semibold">DEX</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const up24 = (row.change24h ?? 0) >= 0;
              const up1 = (row.change1h ?? 0) >= 0;
              return (
                <tr
                  key={row.id}
                  className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.025]"
                >
                  <td className="px-3 py-3 text-center font-mono text-[11px] tabular-nums text-zinc-600">
                    {i + 1}
                  </td>
                  <td className="px-3 py-3">
                    <Link href={tokenHref(row)} className="inline-flex min-w-0 items-center gap-3">
                      <TokenAvatar symbol={row.symbol} size={34} />
                      <span className="min-w-0">
                        <span className="block truncate text-[14px] font-bold uppercase tracking-tight text-zinc-50">
                          {row.symbol}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-zinc-500">
                          {row.name} · {row.dexLabel} Pool
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-3 font-mono text-[14px] font-semibold tabular-nums text-zinc-100">
                    {formatDexPriceUsd(row.priceUsd)}
                  </td>
                  <td
                    className={`px-3 py-3 font-mono text-[13px] font-semibold tabular-nums ${
                      up24 ? "text-emerald-300" : "text-rose-300"
                    }`}
                  >
                    {formatDexPct(row.change24h)}
                  </td>
                  <td
                    className={`px-3 py-3 font-mono text-[13px] font-semibold tabular-nums ${
                      row.change1h == null
                        ? "text-zinc-600"
                        : up1
                          ? "text-emerald-300"
                          : "text-rose-300"
                    }`}
                  >
                    {formatDexPct(row.change1h)}
                  </td>
                  <td className="px-3 py-3 font-mono text-[13px] tabular-nums text-zinc-200">
                    {formatCompactUsd(row.volume24h)}
                  </td>
                  <td className="px-3 py-3 font-mono text-[13px] tabular-nums text-zinc-200">
                    {formatCompactUsd(row.liquidityUsd)}
                  </td>
                  <td className="px-3 py-3 text-[12px] text-zinc-400">{row.ageLabel}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <DexVenueBadge dexId={row.dex} dexLabel={row.dexLabel} size={18} />
                      <span className="font-mono text-[11px] text-zinc-500">({pairTag(row)})</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * Tokens page (/top-100-trending) — mock-aligned:
 * Recently viewed cards → Because you viewed chips → dense Dex pairs table.
 * Keeps site header / mobile tabs elsewhere.
 */
export function TokensPageView({
  rows,
  error,
}: {
  rows: DexLivePairRow[];
  error?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "/top-100-trending";
  const searchParams = useSearchParams();
  const query = parseDexListQuery(searchParams, {
    ...PAIRS_DEFAULT_QUERY,
    sort: "liquidity",
  });
  const [visible, setVisible] = useState(INITIAL_VISIBLE);

  const filtered = useMemo(() => {
    const sorted = applyDexListQuery(
      rows.map((r) => ({
        ...r,
        volume: r.volume24h,
        liquidity: r.liquidityUsd,
        change24h: r.change24h,
      })),
      { ...query, pulse: "all", age: "all" },
    );
    return sorted as DexLivePairRow[];
  }, [rows, query]);

  const shown = filtered.slice(0, Math.min(visible, DEX_EXPLORER_MAX_ROWS));

  const pushQuery = (next: typeof query) => {
    setVisible(INITIAL_VISIBLE);
    const href = `${pathname}${dexListQuerySearchParams(next, null, {
      ...PAIRS_DEFAULT_QUERY,
      sort: "liquidity",
    })}`;
    router.replace(href, { scroll: false });
  };

  const chipClass = (active: boolean) =>
    `inline-flex min-h-9 shrink-0 items-center rounded-full px-3 text-xs font-semibold transition-colors ${
      active
        ? "nav-pill-active"
        : "border border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200"
    }`;

  const dominantDex = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of shown.slice(0, 30)) {
      const key = r.dexLabel || r.dex || "DEX";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "DEX";
  }, [shown]);

  const tableTitle =
    query.chain !== "all"
      ? `Top ${formatChainLabel(query.chain)} pairs`
      : `Top ${dominantDex} pairs`;

  const sortLabel =
    SORT_OPTIONS.find((s) => s.id === query.sort)?.label.toLowerCase() ?? "liquidity";

  return (
    <div className="space-y-4 sm:space-y-5">
      <TokensRecentlyViewed />
      <BecauseYouViewedChips rows={rows} />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="-mx-0.5 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CHAIN_CHIPS.map((chip) => {
            const active = query.chain === chip.id || (chip.id === "all" && query.chain === "all");
            return (
              <button
                key={chip.id}
                type="button"
                className={chipClass(active)}
                onClick={() => pushQuery({ ...query, chain: chip.id })}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={chipClass(query.sort === opt.id)}
              onClick={() => pushQuery({ ...query, sort: opt.id, dir: "desc" })}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          DexScreener fetch failed: {error}
        </p>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl glass-panel px-4 py-8 text-center text-sm text-zinc-500">
          No pairs match this filter set right now.
        </p>
      ) : (
        <>
          <TokensPairsTable rows={shown} title={tableTitle} windowLabel={sortLabel} />
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <p className="text-[11px] tabular-nums text-zinc-500">
              Showing {shown.length} of {filtered.length}
            </p>
            {shown.length < filtered.length && shown.length < DEX_EXPLORER_MAX_ROWS ? (
              <button
                type="button"
                className="inline-flex min-h-11 items-center rounded-full border border-white/12 bg-white/[0.04] px-4 text-xs font-semibold text-zinc-200 hover:bg-white/[0.08]"
                onClick={() =>
                  setVisible((v) => Math.min(v + PAGE_STEP, filtered.length, DEX_EXPLORER_MAX_ROWS))
                }
              >
                Load more
              </button>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
