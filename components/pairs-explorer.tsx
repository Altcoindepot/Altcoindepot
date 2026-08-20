"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DexLivePairRow } from "@/lib/dexscreener-live-pairs";
import { DEX_EXPLORER_MAX_ROWS } from "@/lib/dexscreener-live-pairs";
import {
  applyDexListQuery,
  dexListQuerySearchParams,
  MAJOR_DEX_CHAIN_FILTERS,
  PAIRS_DEFAULT_QUERY,
  parseDexListQuery,
  type DexListMinLiq,
  type DexListSort,
} from "@/lib/dex-list-query";
import { DexPairPriceTable } from "@/components/dex-pair-price-table";

const PAGE_STEP = 50;
const INITIAL_VISIBLE = 100;

const SORT_OPTIONS: Array<{ id: DexListSort; label: string }> = [
  { id: "volume", label: "Volume" },
  { id: "liquidity", label: "Liquidity" },
  { id: "gainers", label: "24h %" },
  { id: "newest", label: "Newest" },
];

const MIN_LIQ_CHIPS: Array<{ id: DexListMinLiq; label: string }> = [
  { id: "all", label: "All liq" },
  { id: "25k", label: "$25k+" },
  { id: "50k", label: "$50k+" },
];

const CHAIN_CHIPS = [
  { id: "all", label: "All" },
  ...MAJOR_DEX_CHAIN_FILTERS.filter((c) =>
    ["solana", "eth", "base", "bsc", "arbitrum"].includes(c.id),
  ).map((c) => ({ id: c.id === "eth" ? "ethereum" : c.id, label: c.label })),
] as const;

function toSortable(rows: DexLivePairRow[]) {
  return rows.map((r) => ({
    ...r,
    volume: r.volume24h,
    liquidity: r.liquidityUsd,
    change24h: r.change24h,
  }));
}

export function PairsExplorer({
  rows,
  error,
}: {
  rows: DexLivePairRow[];
  error?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "/pairs";
  const searchParams = useSearchParams();
  const query = parseDexListQuery(searchParams, PAIRS_DEFAULT_QUERY);
  const [visible, setVisible] = useState(INITIAL_VISIBLE);

  const filtered = useMemo(() => {
    const sorted = applyDexListQuery(toSortable(rows), {
      ...query,
      // Explorer is not pulse-driven
      pulse: "all",
      age: "all",
    });
    return sorted as DexLivePairRow[];
  }, [rows, query]);

  const shown = filtered.slice(0, Math.min(visible, DEX_EXPLORER_MAX_ROWS));

  const pushQuery = (next: typeof query) => {
    setVisible(INITIAL_VISIBLE);
    const href = `${pathname}${dexListQuerySearchParams(next, null, PAIRS_DEFAULT_QUERY)}`;
    router.replace(href, { scroll: false });
  };

  const chipClass = (active: boolean) =>
    `inline-flex min-h-9 shrink-0 items-center rounded-full px-3 text-xs font-semibold transition-colors ${
      active
        ? "bg-teal-500/20 text-teal-200"
        : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200"
    }`;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Chain</p>
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Sort</p>
          <div className="flex flex-wrap gap-1.5">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={chipClass(query.sort === opt.id)}
                onClick={() =>
                  pushQuery({
                    ...query,
                    sort: opt.id,
                    dir: "desc",
                  })
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
            Min liquidity
          </p>
          <div className="flex flex-wrap gap-1.5">
            {MIN_LIQ_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                className={chipClass(query.minLiq === chip.id)}
                onClick={() => pushQuery({ ...query, minLiq: chip.id })}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          DexScreener fetch failed: {error}
        </p>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-[#0c0e14] px-4 py-8 text-center text-sm text-zinc-500">
          No pairs match this chain and filter set right now.
        </p>
      ) : (
        <>
          <DexPairPriceTable rows={shown} title="DEX trading pairs" />
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <p className="text-[11px] tabular-nums text-zinc-500">
              Showing {shown.length} of {filtered.length}
              {filtered.length >= DEX_EXPLORER_MAX_ROWS ? ` (capped at ${DEX_EXPLORER_MAX_ROWS})` : ""}
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

      <p className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-600">
        <Link href="/just-launched" className="text-teal-300/90 underline-offset-2 hover:underline">
          Just Launched (0–15m) →
        </Link>
        <Link href="/new-low-caps" className="text-teal-300/90 underline-offset-2 hover:underline">
          New &amp; Low Caps →
        </Link>
      </p>
    </div>
  );
}
