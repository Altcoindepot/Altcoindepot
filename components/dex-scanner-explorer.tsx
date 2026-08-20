"use client";

import { useMemo, useState } from "react";
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
        className="h-10 w-full rounded-lg border border-white/12 bg-[#0c0e14] px-2.5 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-teal-400/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
      />
    </label>
  );
}

function ScannerRowMobile({ row }: { row: DexScannerRow }) {
  return (
    <Link
      href={tokenHref(row)}
      className="flex items-center gap-2.5 px-3 py-2.5 active:bg-white/[0.04]"
    >
      <TokenAvatar symbol={row.symbol} size={28} />
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-baseline gap-1.5">
          <span className="truncate font-mono text-[13px] font-bold uppercase text-zinc-50">
            {row.symbol}
          </span>
          <span className="truncate text-[11px] text-zinc-500">{row.name}</span>
        </span>
        <span className="mt-1 flex items-center gap-1.5">
          <ChainIcon chainId={row.chain} size={16} />
          <DexVenueBadge dexId={row.dex} dexLabel={row.dexLabel} iconOnly size={16} />
        </span>
        <span className="mt-0.5 block font-mono text-[10px] tabular-nums text-zinc-500">
          {formatCompactUsd(row.volume24h)} vol · {formatCompactUsd(row.liquidityUsd)} liq ·{" "}
          {formatCompactUsd(row.marketCap)} mcap · {row.ageLabel}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="font-mono text-[13px] font-semibold tabular-nums text-zinc-100">
          {formatDexPriceUsd(row.priceUsd)}
        </span>
        <span
          className={`font-mono text-xs font-semibold tabular-nums ${
            (row.change24h ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"
          }`}
        >
          {formatDexPct(row.change24h)}
        </span>
      </span>
    </Link>
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

  const push = (next: DexScannerQuery) => {
    setVisible(DEX_SCANNER_INITIAL_ROWS);
    router.replace(`${pathname}${dexScannerSearchParams(next)}`, { scroll: false });
  };

  const chipClass = (active: boolean) =>
    `inline-flex min-h-9 shrink-0 items-center rounded-full px-3 text-xs font-semibold transition-colors ${
      active
        ? "bg-teal-500/20 text-teal-200"
        : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200"
    }`;

  const filterPanel = (
    <div className="space-y-3 rounded-xl border border-white/10 bg-[#0c0e14] p-3 sm:p-4">
      <p className="text-[11px] leading-relaxed text-amber-200/80">
        Low thresholds include illiquid / high-risk pairs. Not financial advice.
      </p>

      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
          Chain
        </p>
        <div className="-mx-0.5 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SCANNER_CHAIN_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              className={chipClass(query.chain === chip.id)}
              onClick={() => push({ ...query, chain: chip.id })}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <NumberField
          key={`minLiq-${query.minLiq}`}
          id="minLiq"
          label="Min liquidity"
          value={query.minLiq}
          placeholder="5000"
          onCommit={(n) => push({ ...query, minLiq: n ?? 0 })}
        />
        <NumberField
          key={`maxLiq-${query.maxLiq ?? "x"}`}
          id="maxLiq"
          label="Max liquidity"
          value={query.maxLiq}
          onCommit={(n) => push({ ...query, maxLiq: n })}
        />
        <NumberField
          key={`minVol-${query.minVol}`}
          id="minVol"
          label="Min volume 24h"
          value={query.minVol}
          placeholder="1000"
          onCommit={(n) => push({ ...query, minVol: n ?? 0 })}
        />
        <NumberField
          key={`maxVol-${query.maxVol ?? "x"}`}
          id="maxVol"
          label="Max volume 24h"
          value={query.maxVol}
          onCommit={(n) => push({ ...query, maxVol: n })}
        />
        <NumberField
          key={`minMcap-${query.minMcap}`}
          id="minMcap"
          label="Min mcap"
          value={query.minMcap}
          placeholder="0"
          onCommit={(n) => push({ ...query, minMcap: n ?? 0 })}
        />
        <NumberField
          key={`maxMcap-${query.maxMcap ?? "x"}`}
          id="maxMcap"
          label="Max mcap"
          value={query.maxMcap}
          onCommit={(n) => push({ ...query, maxMcap: n })}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1.5">
          <label className="block text-[11px] font-medium text-zinc-400" htmlFor="scanner-q">
            Search
          </label>
          <input
            id="scanner-q"
            type="search"
            defaultValue={query.q}
            key={query.q}
            placeholder="Symbol, name, or contract"
            className="h-10 w-full max-w-md rounded-lg border border-white/12 bg-[#0a0a0a] px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-teal-400/40 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
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

  return (
    <div className="space-y-3">
      {/* Mobile sticky summary + expand */}
      <div className="sticky top-[3.25rem] z-30 -mx-3 border-b border-white/10 bg-[#0a0a0a]/95 px-3 py-2 backdrop-blur-xl sm:top-[3.5rem] lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        <div className="flex items-start justify-between gap-2 lg:hidden">
          <p className="min-w-0 flex-1 truncate text-[11px] text-zinc-400">{summary}</p>
          <button
            type="button"
            className="shrink-0 text-[11px] font-semibold text-teal-300"
            onClick={() => setFiltersOpen((v) => !v)}
          >
            {filtersOpen ? "Hide filters" : "Filters"}
          </button>
        </div>
        <div className={`mt-2 lg:mt-0 ${filtersOpen ? "block" : "hidden lg:block"}`}>
          {filterPanel}
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          DexScreener fetch failed: {error}
        </p>
      ) : null}

      {!error && filtered.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-[#0c0e14] px-4 py-8 text-center">
          <p className="text-sm text-zinc-500">No pairs match these filters</p>
          <button
            type="button"
            className="mt-3 text-xs font-semibold text-teal-300 underline-offset-2 hover:underline"
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

          <ul className="divide-y divide-white/5 md:hidden">
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
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <p className="text-[11px] tabular-nums text-zinc-500">
            Showing {shown.length} of {Math.min(filtered.length, DEX_SCANNER_MAX_ROWS)}
            {filtered.length > DEX_SCANNER_MAX_ROWS
              ? ` (capped at ${DEX_SCANNER_MAX_ROWS})`
              : ""}
          </p>
          {shown.length < Math.min(filtered.length, DEX_SCANNER_MAX_ROWS) ? (
            <button
              type="button"
              className="inline-flex min-h-11 items-center rounded-full border border-white/12 bg-white/[0.04] px-4 text-xs font-semibold text-zinc-200 hover:bg-white/[0.08]"
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

      <p className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-600">
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
