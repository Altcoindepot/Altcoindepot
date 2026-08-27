/**
 * Dex-only narrative / rotation heat — no CoinGecko, no mock %.
 * Buckets live liquid pairs by chain (+ optional venue). Cached with explorer pairs.
 */

import { unstable_cache } from "next/cache";
import {
  DEX_EXPLORER_MIN_LIQ_USD,
  DEX_EXPLORER_REVALIDATE_SECONDS,
  getCachedDexExplorerPairs,
  type DexLivePairRow,
} from "@/lib/dexscreener-live-pairs";
import { dexTokenPath, sameDexChain } from "@/lib/dex-token-path";

export type DexHeatWindow = "1h" | "24h";
export type DexHeatStatus = "LEADING" | "FADING" | "NEUTRAL";

export type DexHeatChild = {
  id: string;
  symbol: string;
  name: string;
  priceUsd: number | null;
  changePct: number;
  href: string;
  imageUrl?: string | null;
};

export type DexHeatBucket = {
  id: string;
  label: string;
  kind: "chain" | "venue";
  /** Canonical Dex chain — coins in this bucket are ONLY this chain. */
  filterChain: string;
  /** Deep link to filtered pairs list for this chain. */
  href: string;
  heatPct: number;
  window: DexHeatWindow;
  status: DexHeatStatus;
  sampleSize: number;
  children: DexHeatChild[];
};

export type DexHeatSnapshot = {
  buckets: DexHeatBucket[];
  windowLabel: string;
  updatedAt: number;
};

const MIN_LIQ = DEX_EXPLORER_MIN_LIQ_USD;
const MIN_SAMPLES_FOR_1H = 3;
const MIN_SAMPLES_BUCKET = 2;

const CHAIN_BUCKETS: Array<{ id: string; label: string; chains: string[] }> = [
  { id: "solana", label: "Solana", chains: ["solana"] },
  { id: "base", label: "Base", chains: ["base"] },
  { id: "ethereum", label: "Ethereum", chains: ["ethereum"] },
  { id: "bsc", label: "BSC", chains: ["bsc"] },
];

const VENUE_BUCKETS: Array<{ id: string; label: string; dexMatch: RegExp }> = [
  { id: "raydium", label: "Raydium", dexMatch: /^raydium/i },
  { id: "pump", label: "Pump", dexMatch: /pump/i },
  { id: "uniswap", label: "Uniswap", dexMatch: /^uniswap/i },
];

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
}

/** Volume-weighted mean; falls back to median if volume missing. */
function heatFromPairs(
  pairs: DexLivePairRow[],
  use1h: boolean,
): { heatPct: number; window: DexHeatWindow; sampleSize: number } | null {
  const scored: Array<{ change: number; vol: number }> = [];
  for (const p of pairs) {
    const change = use1h ? p.change1h : p.change24h;
    if (change == null || !Number.isFinite(change)) continue;
    scored.push({ change, vol: Math.max(0, p.volume24h ?? 0) });
  }
  if (scored.length < MIN_SAMPLES_BUCKET) return null;

  const totalVol = scored.reduce((s, r) => s + r.vol, 0);
  let heatPct: number | null = null;
  if (totalVol > 0) {
    heatPct = scored.reduce((s, r) => s + r.change * r.vol, 0) / totalVol;
  } else {
    heatPct = median(scored.map((r) => r.change));
  }
  if (heatPct == null || !Number.isFinite(heatPct)) return null;

  return {
    heatPct,
    window: use1h ? "1h" : "24h",
    sampleSize: scored.length,
  };
}

function statusFromHeat(heatPct: number): DexHeatStatus {
  if (heatPct >= 3) return "LEADING";
  if (heatPct <= -2) return "FADING";
  return "NEUTRAL";
}

function childFromPair(p: DexLivePairRow, changePct: number): DexHeatChild {
  return {
    id: p.id,
    symbol: p.symbol,
    name: p.name,
    priceUsd: p.priceUsd,
    changePct,
    href:
      dexTokenPath(p.chain, p.address) ??
      `/token/${encodeURIComponent(p.chain)}/${encodeURIComponent(p.address)}`,
  };
}

function topChildren(pairs: DexLivePairRow[], use1h: boolean, limit = 2): DexHeatChild[] {
  const ranked = pairs
    .map((p) => {
      const change = use1h ? p.change1h : p.change24h;
      if (change == null || !Number.isFinite(change)) return null;
      return { p, change };
    })
    .filter((r): r is { p: DexLivePairRow; change: number } => Boolean(r))
    .sort((a, b) => b.change - a.change);

  const seen = new Set<string>();
  const out: DexHeatChild[] = [];
  for (const row of ranked) {
    if (seen.has(row.p.id)) continue;
    seen.add(row.p.id);
    out.push(childFromPair(row.p, row.change));
    if (out.length >= limit) break;
  }
  return out;
}

function liquidPairs(rows: DexLivePairRow[]): DexLivePairRow[] {
  return rows.filter((r) => (r.liquidityUsd ?? 0) >= MIN_LIQ);
}

function buildBucketFromPairs(
  id: string,
  label: string,
  kind: "chain" | "venue",
  filterChain: string,
  href: string,
  pairs: DexLivePairRow[],
): DexHeatBucket | null {
  // Strict: only pairs on this chain — never mix Solana into Base, etc.
  const onChain = pairs.filter((p) => sameDexChain(p.chain, filterChain));
  const liquid = liquidPairs(onChain);
  if (liquid.length < MIN_SAMPLES_BUCKET) return null;

  const with1h = liquid.filter((p) => p.change1h != null && Number.isFinite(p.change1h));
  const use1h = with1h.length >= MIN_SAMPLES_FOR_1H;
  const heat = heatFromPairs(liquid, use1h);
  if (!heat) return null;

  const children = topChildren(liquid, use1h, 10);
  if (children.length === 0) return null;

  return {
    id,
    label,
    kind,
    filterChain,
    href,
    heatPct: heat.heatPct,
    window: heat.window,
    status: statusFromHeat(heat.heatPct),
    sampleSize: heat.sampleSize,
    children,
  };
}

export function buildDexHeatSnapshot(rows: DexLivePairRow[]): DexHeatSnapshot {
  const buckets: DexHeatBucket[] = [];

  for (const def of CHAIN_BUCKETS) {
    const filterChain = def.chains[0]!;
    const pairs = rows.filter((r) => sameDexChain(r.chain, filterChain));
    const bucket = buildBucketFromPairs(
      def.id,
      def.label,
      "chain",
      filterChain,
      `/pairs?chain=${encodeURIComponent(filterChain)}`,
      pairs,
    );
    if (bucket) buckets.push(bucket);
  }

  for (const def of VENUE_BUCKETS) {
    const filterChain =
      def.id === "uniswap" ? "ethereum" : def.id === "raydium" || def.id === "pump" ? "solana" : "";
    if (!filterChain) continue;
    const pairs = rows.filter(
      (r) => sameDexChain(r.chain, filterChain) && def.dexMatch.test(r.dex || r.dexLabel),
    );
    const bucket = buildBucketFromPairs(
      def.id,
      def.label,
      "venue",
      filterChain,
      `/pairs?chain=${encodeURIComponent(filterChain)}`,
      pairs,
    );
    if (bucket) buckets.push(bucket);
  }

  // Strongest heat first; empty already excluded
  buckets.sort((a, b) => b.heatPct - a.heatPct);

  const top = buckets.slice(0, 5);
  const dominantWindow = top.some((b) => b.window === "1h") ? "1H" : "24H";

  return {
    buckets: top,
    windowLabel: dominantWindow,
    updatedAt: Date.now(),
  };
}

async function loadDexHeatUncached(): Promise<DexHeatSnapshot> {
  const rows = await getCachedDexExplorerPairs();
  return buildDexHeatSnapshot(rows);
}

const getCachedDexHeat = unstable_cache(loadDexHeatUncached, ["dex-narrative-heat-v2"], {
  revalidate: DEX_EXPLORER_REVALIDATE_SECONDS,
});

export async function getDexNarrativeHeat(): Promise<DexHeatSnapshot> {
  try {
    return await getCachedDexHeat();
  } catch (err) {
    console.warn("[dex-narrative-heat] failed", err);
    return { buckets: [], windowLabel: "24H", updatedAt: Date.now() };
  }
}
