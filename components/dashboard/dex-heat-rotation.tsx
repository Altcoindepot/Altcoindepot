"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DexHeatBucket, DexHeatSnapshot } from "@/lib/dex-narrative-heat";
import { formatDexPct, formatDexPriceUsd } from "@/lib/dex-pair-fields";
import { sameDexChain, normalizeDexChainId } from "@/lib/dex-token-path";
import { TokenAvatar } from "@/components/token-avatar";
import { MarketRow } from "@/components/market-row";
import { formatChainLabel } from "@/lib/format-chain";

function formatHeat(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function chipTone(bucket: DexHeatBucket, selected: boolean, isTop: boolean): string {
  const ring = selected ? "ring-2 ring-teal-300/70" : "";
  if (bucket.status === "LEADING") {
    return `${ring} ${
      isTop
        ? "border-teal-400/55 bg-teal-500/15 shadow-[0_0_36px_rgba(45,212,191,0.28)] leading-heat-pulse"
        : "border-emerald-400/45 bg-emerald-500/12 shadow-[0_0_22px_rgba(16,185,129,0.18)]"
    }`;
  }
  if (bucket.status === "FADING") {
    return `${ring} border-rose-400/40 bg-rose-500/[0.08] opacity-95 shadow-[0_8px_24px_rgba(0,0,0,0.4)]`;
  }
  return `${ring} border-teal-400/25 bg-[#0c0e14] shadow-[0_8px_24px_rgba(0,0,0,0.4)]`;
}

function statusLabel(bucket: DexHeatBucket): string {
  if (bucket.status === "LEADING") return "Leading";
  if (bucket.status === "FADING") return "Fading";
  return "Neutral";
}

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

  return (
    <article className={`rounded-2xl border p-3.5 sm:p-4 ${chipTone(bucket, selected, isTop)}`}>
      <button
        type="button"
        onClick={() => onSelect(bucket.filterChain)}
        aria-pressed={selected}
        className="block w-full min-h-11 text-left active:opacity-90"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-lg font-extrabold tracking-tight text-zinc-50 sm:text-xl">
              {bucket.label}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              {statusLabel(bucket)} · {bucket.window.toUpperCase()} ·{" "}
              {formatChainLabel(bucket.filterChain)} only
            </p>
          </div>
          <span
            className={`shrink-0 rounded-xl px-2.5 py-1.5 font-mono text-2xl font-black tabular-nums leading-none sm:text-3xl ${
              up
                ? "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/35"
                : "bg-rose-500/20 text-rose-200 ring-1 ring-rose-400/35"
            }`}
          >
            {formatHeat(bucket.heatPct)}
          </span>
        </div>
      </button>

      <ul className="mt-3 space-y-1.5">
        {preview.map((child) => {
          const childUp = child.changePct >= 0;
          return (
            <li key={child.id}>
              <Link
                href={child.href}
                className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-2.5 py-1.5 active:bg-white/[0.06]"
              >
                <TokenAvatar symbol={child.symbol} size={24} />
                <span className="min-w-0 flex-1 truncate font-mono text-[13px] font-bold uppercase text-zinc-100">
                  {child.symbol}
                </span>
                <span className="shrink-0 font-mono text-[11px] tabular-nums text-zinc-400">
                  {formatDexPriceUsd(child.priceUsd)}
                </span>
                <span
                  className={`shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-bold tabular-nums ${
                    childUp ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"
                  }`}
                >
                  {formatDexPct(child.changePct)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

/**
 * Mobile-first Dex heat — click a chain chip to show ONLY that chain’s coins.
 * Syncs `?chain=` into the URL so movers / pairs / scanner share the same filter.
 */
export function DexHeatRotation({
  snapshot,
  className = "",
}: {
  snapshot: DexHeatSnapshot;
  className?: string;
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
        className={`rounded-2xl border border-white/10 bg-[#0c0e14] px-3 py-4 ${className}`.trim()}
      >
        <h2 id="dex-heat-heading" className="text-base font-bold text-zinc-50">
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
      <div className="mb-2.5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id="dex-heat-heading"
            className="text-base font-bold tracking-tight text-zinc-50 sm:text-xl"
          >
            What&apos;s rotating
          </h2>
          <p className="mt-0.5 text-[11px] leading-snug text-zinc-500 sm:text-xs">
            Tap a chain — only that chain&apos;s coins · {snapshot.windowLabel}
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

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

      {selectedBucket ? (
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
              className="inline-flex min-h-9 items-center rounded-full border border-teal-400/35 bg-teal-500/15 px-3 text-[11px] font-semibold text-teal-200"
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
