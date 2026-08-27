"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  applyDexScannerQuery,
  DEX_SCANNER_INITIAL_ROWS,
  DEX_SCANNER_MAX_ROWS,
  DEX_SCANNER_PAGE_STEP,
  type DexScannerRow,
} from "@/lib/dex-scanner-data";
import {
  DEX_SCANNER_DEFAULT_QUERY,
  dexScannerSearchParams,
  parseDexScannerQuery,
  SCANNER_CHAIN_CHIPS,
  SCANNER_SORTS,
  scannerQuerySummary,
  type DexScannerQuery,
  type ScannerSort,
} from "@/lib/dex-scanner-query";
import { formatDexPct, formatDexPriceUsd } from "@/lib/dex-pair-fields";
import { formatCompactUsd } from "@/lib/format-compact-usd";
import { dexTokenPath } from "@/lib/dex-token-path";
import { ChainIcon } from "@/components/chain-icon";
import { DexVenueBadge } from "@/components/dex-venue-badge";
import { MarketRow } from "@/components/market-row";
import { TokenAvatar } from "@/components/token-avatar";

const SORT_LABELS: Record<ScannerSort, string> = {
  volume: "Volume",
  liquidity: "Liquidity",
  mcap: "Mcap",
  change: "24h %",
  newest: "Newest",
};

function tokenHref(row: DexScannerRow): string {
  return (
    dexTokenPath(row.chain, row.address) ??
    `/token/${encodeURIComponent(row.chain)}/${encodeURIComponent(row.address)}`
  );
}

function NumberField({
  id,
  label,
  value,
  placeholder,
  onCommit,
}: {
  id: string;
  label: string;
  value: number | null;
  placeholder?: string;
  onCommit: (n: number | null) => void;
}) {
  const [text, setText] = useState(value == null ? "" : String(value));
  return (
    <label className="block min-w-0 text-[11px] text-zinc-500" htmlFor={id}>
      <span className="mb-1 block font-medium text-zinc-400">{label}</span>
      <input
        id={id}
        type="number"
        min={0}
        inputMode="decimal"
        placeholder={placeholder ?? "Any"}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const raw = text.trim();
          if (raw === "") {
            onCommit(null);
            return;
          }
          const n = Number(raw);
          onCommit(Number.isFinite(n) && n >= 0 ? n : null);
        }}
        className="h-11 w-full rounded-lg border border-white/12 bg-[#0c0e14] px-2.5 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-teal-400/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
      />
    </label>
  );
}

function ScannerRowMobile({ row }: { row: DexScannerRow }) {
  return (
    <MarketRow
      href={tokenHref(row)}
      symbol={row.symbol}
      name={row.name}
      chain={row.chain}
      dexId={row.dex}
      dexLabel={row.dexLabel}
      contract={row.address}
      priceUsd={row.priceUsd}
      changePct={row.change24h}
      metaLine={`${formatCompactUsd(row.volume24h)} vol · ${formatCompactUsd(row.liquidityUsd)} liq`}
    />
  );
}

function ChainChips({
  query,
  onSelect,
  chipClass,
}: {
  query: DexScannerQuery;
  onSelect: (chain: string) => void;
  chipClass: (active: boolean) => string;
}) {
  return (
    <div className="-mx-0.5 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {SCANNER_CHAIN_CHIPS.map((chip) => (
        <button
          key={chip.id}
          type="button"
          className={chipClass(query.chain === chip.id)}
          onClick={() => onSelect(chip.id)}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}

function AdvancedFilters({
  query,
  push,
  chipClass,
  idsPrefix = "",
}: {
  query: DexScannerQuery;
  push: (next: DexScannerQuery) => void;
  chipClass: (active: boolean) => string;
  idsPrefix?: string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-[12px] leading-relaxed text-amber-200/85">
        Low thresholds include illiquid / high-risk pairs. Not financial advice.
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <NumberField
          key={`${idsPrefix}minLiq-${query.minLiq}`}
          id={`${idsPrefix}minLiq`}
          label="Min liquidity"
          value={query.minLiq}
          placeholder="5000"
          onCommit={(n) => push({ ...query, minLiq: n ?? 0 })}
        />
        <NumberField
          key={`${idsPrefix}maxLiq-${query.maxLiq ?? "x"}`}
          id={`${idsPrefix}maxLiq`}
          label="Max liquidity"
          value={query.maxLiq}
          onCommit={(n) => push({ ...query, maxLiq: n })}
        />
        <NumberField
          key={`${idsPrefix}minVol-${query.minVol}`}
          id={`${idsPrefix}minVol`}
          label="Min volume 24h"
          value={query.minVol}
          placeholder="1000"
          onCommit={(n) => push({ ...query, minVol: n ?? 0 })}
        />
        <NumberField
          key={`${idsPrefix}maxVol-${query.maxVol ?? "x"}`}
          id={`${idsPrefix}maxVol`}
          label="Max volume 24h"
          value={query.maxVol}
          onCommit={(n) => push({ ...query, maxVol: n })}
        />
        <NumberField
          key={`${idsPrefix}minMcap-${query.minMcap}`}
          id={`${idsPrefix}minMcap`}
          label="Min mcap"
          value={query.minMcap}
          placeholder="0"
          onCommit={(n) => push({ ...query, minMcap: n ?? 0 })}
        />
        <NumberField
          key={`${idsPrefix}maxMcap-${query.maxMcap ?? "x"}`}
          id={`${idsPrefix}maxMcap`}
          label="Max mcap"
          value={query.maxMcap}
          onCommit={(n) => push({ ...query, maxMcap: n })}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1.5">
          <label
            className="block text-[11px] font-medium text-zinc-400"
            htmlFor={`${idsPrefix}scanner-q`}
          >
            Search
          </label>
          <input
            id={`${idsPrefix}scanner-q`}
            type="search"
            defaultValue={query.q}
            key={query.q}
            placeholder="Symbol, name, or contract"
            className="h-11 w-full max-w-md rounded-lg border border-white/12 bg-[#0a0a0a] px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-teal-400/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                push({ ...query, q: (e.target as HTMLInputElement).value.trim() });
              }
            }}
            onBlur={(e) => {
              const next = e.target.value.trim();
              if (next !== query.q) push({ ...query, q: next });
            }}
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Sort</p>
          <div className="flex flex-wrap gap-1.5">
            {SCANNER_SORTS.map((s) => (
              <button
                key={s}
                type="button"
                className={chipClass(query.sort === s)}
                onClick={() => push({ ...query, sort: s })}
              >
                {SORT_LABELS[s]}
              </button>
            ))}
            <button
              type="button"
              className={chipClass(query.dir === "asc")}
              onClick={() =>
                push({ ...query, dir: query.dir === "asc" ? "desc" : "asc" })
              }
            >
              {query.dir === "asc" ? "Asc ↑" : "Desc ↓"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-xs text-zinc-300">
          <input
            type="checkbox"
            checked={query.includeMajors}
            onChange={(e) => push({ ...query, includeMajors: e.target.checked })}
            className="size-4 rounded border-white/20 bg-[#0a0a0a] text-teal-500 focus:ring-teal-400/30"
          />
          Include majors (BTC, ETH, SOL…)
        </label>
        <button
          type="button"
          className="inline-flex min-h-11 items-center rounded-full border border-white/12 px-4 text-xs font-semibold text-zinc-300 hover:bg-white/[0.06]"
          onClick={() => push({ ...DEX_SCANNER_DEFAULT_QUERY })}
        >
          Reset filters
        </button>
      </div>
    </div>
  );
}

export function DexScannerExplorer({
  rows,
  error,
}: {
  rows: DexScannerRow[];
  error?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "/dex-scanner";
  const searchParams = useSearchParams();
  const query = parseDexScannerQuery(searchParams, DEX_SCANNER_DEFAULT_QUERY);
  const [visible, setVisible] = useState(DEX_SCANNER_INITIAL_ROWS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => applyDexScannerQuery(rows, query), [rows, query]);
  const shown = filtered.slice(0, Math.min(visible, DEX_SCANNER_MAX_ROWS));
  const summary = scannerQuerySummary(query);
  const canLoadMore = shown.length < Math.min(filtered.length, DEX_SCANNER_MAX_ROWS);

  const push = (next: DexScannerQuery) => {
    setVisible(DEX_SCANNER_INITIAL_ROWS);
    router.replace(`${pathname}${dexScannerSearchParams(next)}`, { scroll: false });
  };

  useEffect(() => {
    if (!filtersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFiltersOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [filtersOpen]);

  const chipClass = (active: boolean) =>
    `inline-flex min-h-11 shrink-0 items-center rounded-full px-3.5 text-xs font-semibold transition-colors ${
      active
        ? "bg-teal-500/20 text-teal-200"
        : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200"
    }`;

  return (
    <div className="space-y-3 overflow-x-hidden">
      {/* Mobile: sticky summary + chain chips + Filters CTA */}
      <div className="sticky top-[4.35rem] z-30 -mx-3 space-y-2 border-b border-teal-400/20 bg-[#0a0a0a]/90 px-3 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:top-[4.85rem] md:hidden">
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-[11px] tabular-nums text-zinc-400">
            {summary}
          </p>
          <button
            type="button"
            className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-teal-400/30 bg-teal-500/10 px-4 text-xs font-semibold text-teal-200"
            onClick={() => setFiltersOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={filtersOpen}
          >
            Filters
          </button>
        </div>
        <ChainChips
          query={query}
          onSelect={(chain) => push({ ...query, chain })}
          chipClass={chipClass}
        />
      </div>

      {/* Desktop / tablet filters (full panel, including chains) */}
      <div className="hidden space-y-3 rounded-xl border border-white/10 bg-[#0c0e14] p-3 sm:p-4 md:block">
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
            Chain
          </p>
          <ChainChips
            query={query}
            onSelect={(chain) => push({ ...query, chain })}
            chipClass={chipClass}
          />
        </div>
        <AdvancedFilters query={query} push={push} chipClass={chipClass} idsPrefix="desk-" />
        <p className="truncate text-[11px] text-zinc-500">{summary}</p>
      </div>

      {/* Mobile bottom sheet */}
      {filtersOpen ? (
        <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[min(88vh,40rem)] overflow-y-auto rounded-t-2xl border border-white/10 bg-[#0c0e14] shadow-2xl pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-white/10 bg-[#0c0e14] px-4 py-3">
              <p className="text-sm font-semibold text-zinc-100">Filters</p>
              <button
                type="button"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-sm font-semibold text-teal-300"
                onClick={() => setFiltersOpen(false)}
              >
                Done
              </button>
            </div>
            <div className="space-y-3 px-4 py-3">
              <AdvancedFilters
                query={query}
                push={push}
                chipClass={chipClass}
                idsPrefix="sheet-"
              />
            </div>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm leading-relaxed text-red-300">
          DexScreener fetch failed: {error}
        </p>
      ) : null}

      {!error && filtered.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-[#0c0e14] px-4 py-8 text-center">
          <p className="text-sm leading-relaxed text-zinc-500">No pairs match these filters</p>
          <button
            type="button"
            className="mt-3 inline-flex min-h-11 items-center px-4 text-xs font-semibold text-teal-300 underline-offset-2 hover:underline"
            onClick={() => push({ ...DEX_SCANNER_DEFAULT_QUERY })}
          >
            Reset filters
          </button>
        </div>
      ) : null}

      {!error && shown.length > 0 ? (
        <section className="overflow-hidden rounded-xl border border-white/10 bg-[#0c0e14]">
          <div className="flex items-baseline justify-between gap-2 border-b border-white/10 px-3 py-2 sm:px-4">
            <h2 className="text-sm font-semibold text-zinc-100">Scanner results</h2>
            <p className="text-[10px] tabular-nums text-zinc-500">
              {shown.length} of {Math.min(filtered.length, DEX_SCANNER_MAX_ROWS)} · DexScreener
            </p>
          </div>

          <ul className="divide-y divide-white/[0.06] md:hidden">
            {shown.map((row) => (
              <li key={row.id}>
                <ScannerRowMobile row={row} />
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[68rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-zinc-500">
                  <th className="w-10 px-2 py-2 text-center font-semibold">#</th>
                  <th className="px-3 py-2 font-semibold">Token</th>
                  <th className="px-3 py-2 font-semibold">Price</th>
                  <th className="px-3 py-2 font-semibold">24h %</th>
                  <th className="px-3 py-2 font-semibold">Volume</th>
                  <th className="px-3 py-2 font-semibold">Liquidity</th>
                  <th className="px-3 py-2 font-semibold">Mcap</th>
                  <th className="px-3 py-2 font-semibold">Age</th>
                  <th className="px-3 py-2 font-semibold">Chain</th>
                  <th className="px-3 py-2 font-semibold">DEX</th>
                  <th className="px-3 py-2 font-semibold"> </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((row, i) => (
                  <tr
                    key={row.id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]"
                  >
                    <td className="px-2 py-1.5 text-center font-mono text-[11px] tabular-nums text-zinc-600">
                      {i + 1}
                    </td>
                    <td className="px-3 py-1.5">
                      <Link
                        href={tokenHref(row)}
                        className="inline-flex min-w-0 items-center gap-2.5"
                      >
                        <TokenAvatar symbol={row.symbol} size={28} />
                        <span className="min-w-0">
                          <span className="block truncate font-mono text-[13px] font-semibold uppercase text-zinc-100">
                            {row.symbol}
                            {row.quoteSymbol && row.quoteSymbol !== "—" ? (
                              <span className="ml-1 font-normal text-zinc-500">
                                /{row.quoteSymbol}
                              </span>
                            ) : null}
                          </span>
                          <span className="block truncate text-[11px] text-zinc-500">
                            {row.name}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-1.5 font-mono text-[13px] tabular-nums text-zinc-100">
                      {formatDexPriceUsd(row.priceUsd)}
                    </td>
                    <td
                      className={`px-3 py-1.5 font-mono text-[13px] font-semibold tabular-nums ${
                        (row.change24h ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"
                      }`}
                    >
                      {formatDexPct(row.change24h)}
                    </td>
                    <td className="px-3 py-1.5 font-mono text-[13px] tabular-nums text-zinc-300">
                      {formatCompactUsd(row.volume24h)}
                    </td>
                    <td className="px-3 py-1.5 font-mono text-[13px] tabular-nums text-zinc-300">
                      {formatCompactUsd(row.liquidityUsd)}
                    </td>
                    <td className="px-3 py-1.5 font-mono text-[13px] tabular-nums text-zinc-300">
                      {formatCompactUsd(row.marketCap)}
                    </td>
                    <td className="px-3 py-1.5 text-[12px] text-zinc-400">{row.ageLabel}</td>
                    <td className="px-3 py-1.5">
                      <ChainIcon chainId={row.chain} size={18} />
                    </td>
                    <td className="px-3 py-1.5">
                      <DexVenueBadge dexId={row.dex} dexLabel={row.dexLabel} size={18} />
                    </td>
                    <td className="px-3 py-1.5">
                      {row.pairUrl ? (
                        <a
                          href={row.pairUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-medium text-zinc-500 hover:text-teal-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          DexScreener ↗
                        </a>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {!error && shown.length > 0 ? (
        <div className="space-y-2 px-1 pb-2">
          <p className="text-[11px] tabular-nums text-zinc-500">
            Showing {shown.length} of {Math.min(filtered.length, DEX_SCANNER_MAX_ROWS)}
            {filtered.length > DEX_SCANNER_MAX_ROWS
              ? ` (capped at ${DEX_SCANNER_MAX_ROWS})`
              : ""}
          </p>
          {canLoadMore ? (
            <button
              type="button"
              className="flex min-h-11 w-full items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] text-sm font-semibold text-zinc-100 hover:bg-white/[0.08] md:inline-flex md:w-auto md:rounded-full md:px-5"
              onClick={() =>
                setVisible((v) =>
                  Math.min(v + DEX_SCANNER_PAGE_STEP, filtered.length, DEX_SCANNER_MAX_ROWS),
                )
              }
            >
              Load more
            </button>
          ) : null}
        </div>
      ) : null}

      <p className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] leading-relaxed text-zinc-600">
        <Link href="/pairs" className="text-teal-300/90 underline-offset-2 hover:underline">
          Simple Pairs explorer →
        </Link>
        <Link href="/just-launched" className="text-teal-300/90 underline-offset-2 hover:underline">
          Just Launched →
        </Link>
        <Link href="/new-low-caps" className="text-teal-300/90 underline-offset-2 hover:underline">
          New &amp; Low Caps →
        </Link>
      </p>
    </div>
  );
}
