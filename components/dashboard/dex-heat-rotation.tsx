"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DexHeatBucket, DexHeatSnapshot } from "@/lib/dex-narrative-heat";
import { formatDexPct } from "@/lib/dex-pair-fields";
import { sameDexChain, normalizeDexChainId } from "@/lib/dex-token-path";
import { MarketRow } from "@/components/market-row";
import { ChainIcon } from "@/components/chain-icon";
import { formatChainLabel } from "@/lib/format-chain";

function formatHeat(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function chipTone(bucket: DexHeatBucket, selected: boolean, isTop: boolean): string {
  const ring = selected ? "ring-2 ring-teal-300/70" : "";
  if (bucket.status === "LEADING") {
    return `${ring} heat-chip-leading ${isTop ? "leading-heat-pulse" : ""}`;
  }
  if (bucket.status === "FADING") {
    return `${ring} heat-chip-fading`;
  }
  return ring;
}

/**
 * Mock anatomy: chain logo + name · big % · window momentum · two pair pills.
 * Uses existing glass-card / heat-chip tokens only.
 */
function HeatChip({
  bucket,
  rank,
  selected,
  onSelect,
}: {
  bucket: DexHeatBucket;
  rank: number;
  selected: boolean;
  onSelect: (filterChain: string) => void;
}) {
  const isTop = rank === 0 && bucket.status === "LEADING";
  const up = bucket.heatPct >= 0;
  const preview = bucket.children.slice(0, 2);
  const windowLabel = `${bucket.window.toUpperCase()} momentum`;
  const empty = bucket.sampleSize === 0;

  return (
    <article
      className={`glass-card flex min-h-[8.25rem] flex-col rounded-xl p-2.5 sm:min-h-[12rem] sm:rounded-2xl sm:p-5 ${chipTone(bucket, selected, isTop)}`}
    >
      <button
        type="button"
        onClick={() => onSelect(bucket.filterChain)}
        aria-pressed={selected}
        className="block w-full min-h-10 flex-1 text-left active:opacity-90 sm:min-h-11"
      >
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <ChainIcon chainId={bucket.filterChain} size={24} />
          <p className="truncate text-[13px] font-bold tracking-tight text-zinc-50 sm:text-lg">
            {bucket.label}
          </p>
        </div>
        <p
          className={`mt-2 font-mono text-2xl font-black tabular-nums leading-none sm:mt-3 sm:text-4xl ${
            empty ? "text-zinc-600" : up ? "text-teal-300" : "text-rose-300"
          }`}
        >
          {empty ? "—" : formatHeat(bucket.heatPct)}
        </p>
        <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-zinc-500 sm:mt-1.5 sm:text-[10px]">
          {empty ? "Waiting for liquid pairs" : windowLabel}
        </p>
      </button>

      {preview.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1 border-t border-white/10 pt-2 sm:mt-3 sm:gap-1.5 sm:pt-3">
          {preview.map((child) => {
            const childUp = child.changePct >= 0;
            return (
              <Link
                key={child.id}
                href={child.href}
                className={`inline-flex max-w-full items-center gap-1 truncate rounded-full border px-1.5 py-0.5 font-mono text-[9px] font-semibold tabular-nums sm:px-2.5 sm:py-1 sm:text-[11px] ${
                  childUp
                    ? "border-teal-400/30 bg-teal-500/10 text-teal-200"
                    : "border-rose-400/30 bg-rose-500/10 text-rose-200"
                }`}
              >
                <span className="truncate uppercase text-zinc-100">{child.pairLabel}</span>
                <span>{formatDexPct(child.changePct)}</span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-2 border-t border-white/10 pt-2 sm:mt-3 sm:pt-3">
          <p className="text-[9px] text-zinc-600 sm:text-[10px]">No pair previews yet</p>
        </div>
      )}
    </article>
  );
}

/**
 * Home What’s rotating — 2×2 heat chips on all breakpoints (smaller on phone).
 */
export function DexHeatRotation({
  snapshot,
  className = "",
  chipGridClassName = "grid grid-cols-2 gap-2 sm:gap-3",
}: {
  snapshot: DexHeatSnapshot;
  className?: string;
  chipGridClassName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const chainParam = searchParams.get("chain")?.trim() ?? "";
  const selectedChain = normalizeDexChainId(chainParam) ?? "";

  const selectedBucket = useMemo(() => {
    if (!selectedChain) return null;
    const match = (b: DexHeatBucket) => sameDexChain(b.filterChain, selectedChain);
    return (
      snapshot.buckets.find((b) => b.kind === "chain" && match(b)) ??
      snapshot.buckets.find(match) ??
      null
    );
  }, [snapshot.buckets, selectedChain]);

  const setChain = useCallback(
    (filterChain: string) => {
      const canonical = normalizeDexChainId(filterChain) ?? filterChain;
      const params = new URLSearchParams(searchParams.toString());
      const current = normalizeDexChainId(params.get("chain") ?? "") ?? "";
      if (current === canonical) {
        params.delete("chain");
      } else {
        params.set("chain", canonical);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  if (snapshot.buckets.length === 0) {
    return (
      <section
        aria-labelledby="dex-heat-heading"
        className={`glass-panel rounded-2xl px-3 py-4 ${className}`.trim()}
      >
        <h2 id="dex-heat-heading" className="text-base font-bold text-zinc-50 sm:text-2xl">
          What&apos;s rotating
        </h2>
        <p className="mt-1 text-[11px] text-zinc-500">
          Live Dex heat by chain · waiting for liquid pairs…
        </p>
      </section>
    );
  }

  return (
    <section id="whats-rotating" aria-labelledby="dex-heat-heading" className={className}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id="dex-heat-heading"
            className="text-base font-bold tracking-tight text-zinc-50 sm:text-2xl"
          >
            What&apos;s rotating
          </h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-[10px] leading-snug text-zinc-500 sm:mt-1 sm:text-xs">
            <span className="inline-block size-1.5 shrink-0 rounded-full bg-teal-400" aria-hidden />
            Real-time momentum across key ecosystems
          </p>
        </div>
        {selectedChain ? (
          <button
            type="button"
            onClick={() => setChain(selectedChain)}
            className="text-[11px] font-semibold text-teal-300 underline-offset-2 hover:underline"
          >
            Clear {formatChainLabel(selectedChain)} filter
          </button>
        ) : null}
      </div>

      <div className={chipGridClassName}>
        {snapshot.buckets.map((bucket, i) => (
          <HeatChip
            key={bucket.id}
            bucket={bucket}
            rank={i}
            selected={Boolean(selectedChain && sameDexChain(bucket.filterChain, selectedChain))}
            onSelect={setChain}
          />
        ))}
      </div>

      {selectedBucket && selectedBucket.children.length > 0 ? (
        <div className="ds-list-shell mt-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-400/15 px-3 py-2.5 sm:px-4">
            <div>
              <p className="text-sm font-bold text-zinc-50">
                {formatChainLabel(selectedBucket.filterChain)} only
              </p>
              <p className="text-[10px] text-zinc-500">
                {selectedBucket.label} heat · {selectedBucket.window.toUpperCase()} · no other
                chains
              </p>
            </div>
            <Link
              href={selectedBucket.href}
              className="inline-flex min-h-9 items-center rounded-full nav-pill-active px-3 text-[11px] font-semibold"
            >
              All {formatChainLabel(selectedBucket.filterChain)} pairs →
            </Link>
          </div>
          <ul className="divide-y divide-white/[0.06]">
            {selectedBucket.children.map((child) => (
              <li key={child.id}>
                <MarketRow
                  href={child.href}
                  symbol={child.symbol}
                  name={child.name}
                  chain={selectedBucket.filterChain}
                  priceUsd={child.priceUsd}
                  changePct={child.changePct}
                  changeWindow={selectedBucket.window}
                  pairLabel={child.pairLabel}
                  compact
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
