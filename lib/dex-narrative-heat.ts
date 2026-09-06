/**
 * Dex-only narrative / rotation heat — no CoinGecko, no mock %.
 * Solana / Base / Ethereum = chain buckets. INJ = Injective token card.
 */

import { unstable_cache } from "next/cache";
import {
  DEX_EXPLORER_MIN_LIQ_USD,
  DEX_EXPLORER_REVALIDATE_SECONDS,
  getCachedDexExplorerPairs,
  mapDexPairToLiveRow,
  type DexLivePairRow,
} from "@/lib/dexscreener-live-pairs";
import { dexTokenPath, sameDexChain, sameTokenAddress } from "@/lib/dex-token-path";
import { majorQuoteRank } from "@/lib/dex-majors-list-dedupe";

export type DexHeatWindow = "1h" | "24h";
export type DexHeatStatus = "LEADING" | "FADING" | "NEUTRAL";

export type DexHeatChild = {
  id: string;
  symbol: string;
  name: string;
  pairLabel: string;
  priceUsd: number | null;
  changePct: number;
  href: string;
  imageUrl?: string | null;
};

export type DexHeatBucket = {
  id: string;
  label: string;
  kind: "chain" | "venue" | "token";
  filterChain: string;
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

const DEX_BASE = "https://api.dexscreener.com";
const MIN_LIQ = DEX_EXPLORER_MIN_LIQ_USD;
const MIN_SAMPLES_FOR_1H = 3;
const MIN_SAMPLES_BUCKET = 2;

/** Official INJ contracts — not an injective-chain scan. */
const OFFICIAL_INJ = [
  { chain: "ethereum", address: "0xe28b3B32B6c345A34Ff64674606124Dd5Aceca30" },
  { chain: "bsc", address: "0xa2B726B1145A4773F68593CF171187d8EBe4d495" },
  { chain: "injective", address: "inj" },
] as const;

const CHAIN_BUCKETS: Array<{ id: string; label: string; chains: string[] }> = [
  { id: "solana", label: "Solana", chains: ["solana"] },
  { id: "base", label: "Base", chains: ["base"] },
  { id: "ethereum", label: "Ethereum", chains: ["ethereum"] },
];

type DexPairRaw = {
  chainId?: string;
  dexId?: string;
  pairAddress?: string;
  baseToken?: { address?: string; name?: string; symbol?: string };
  quoteToken?: { address?: string; name?: string; symbol?: string };
  priceUsd?: string | number | null;
  priceChange?: { h24?: number; h6?: number; h1?: number };
  volume?: { h24?: number };
  liquidity?: { usd?: number };
  pairCreatedAt?: number | null;
};

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1]! + sorted[mid]!) / 2;
  return sorted[mid]!;
}

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
  const heatPct =
    totalVol > 0
      ? scored.reduce((s, r) => s + r.change * r.vol, 0) / totalVol
      : median(scored.map((r) => r.change));
  if (heatPct == null || !Number.isFinite(heatPct)) return null;
  return { heatPct, window: use1h ? "1h" : "24h", sampleSize: scored.length };
}

function statusFromHeat(heatPct: number): DexHeatStatus {
  if (heatPct >= 3) return "LEADING";
  if (heatPct <= -2) return "FADING";
  return "NEUTRAL";
}

function childFromPair(p: DexLivePairRow, changePct: number): DexHeatChild {
  const pairLabel = p.quoteSymbol ? `${p.symbol}/${p.quoteSymbol}` : p.symbol;
  return {
    id: p.id,
    symbol: p.symbol,
    name: p.name,
    pairLabel,
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

function emptyBucket(
  id: string,
  label: string,
  filterChain: string,
  href: string,
  kind: DexHeatBucket["kind"] = "chain",
): DexHeatBucket {
  return {
    id,
    label,
    kind,
    filterChain,
    href,
    heatPct: 0,
    window: "24h",
    status: "NEUTRAL",
    sampleSize: 0,
    children: [],
  };
}

function buildBucketFromPairs(
  id: string,
  label: string,
  kind: "chain" | "venue",
  filterChain: string,
  href: string,
  pairs: DexLivePairRow[],
): DexHeatBucket {
  const liquid = liquidPairs(pairs.filter((p) => sameDexChain(p.chain, filterChain)));
  if (liquid.length < MIN_SAMPLES_BUCKET) return emptyBucket(id, label, filterChain, href, kind);
  const with1h = liquid.filter((p) => p.change1h != null && Number.isFinite(p.change1h));
  const use1h = with1h.length >= MIN_SAMPLES_FOR_1H;
  const heat = heatFromPairs(liquid, use1h);
  if (!heat) return emptyBucket(id, label, filterChain, href, kind);
  const children = topChildren(liquid, use1h, 10);
  if (children.length === 0) return emptyBucket(id, label, filterChain, href, kind);
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

function asPairs(data: unknown): DexPairRaw[] {
  if (Array.isArray(data)) {
    return data.filter((p): p is DexPairRaw => Boolean(p) && typeof p === "object");
  }
  if (data && typeof data === "object") {
    const obj = data as { pairs?: unknown };
    if (Array.isArray(obj.pairs)) {
      return obj.pairs.filter((p): p is DexPairRaw => Boolean(p) && typeof p === "object");
    }
  }
  return [];
}

function isOfficialInjBase(pair: DexPairRaw): boolean {
  if ((pair.baseToken?.symbol ?? "").trim().toUpperCase() !== "INJ") return false;
  const addr = pair.baseToken?.address?.trim() ?? "";
  return Boolean(addr) && OFFICIAL_INJ.some((c) => sameTokenAddress(c.address, addr));
}

function isUsdtUsdcQuote(row: DexLivePairRow): boolean {
  const q = (row.quoteSymbol ?? "").trim().toUpperCase();
  return q === "USDT" || q === "USDC";
}

/** Highest-volume INJ/USDT, else INJ/USDC (USDT tier wins). */
function compareInjStablePairs(a: DexLivePairRow, b: DexLivePairRow): number {
  const qa = majorQuoteRank(a.quoteSymbol);
  const qb = majorQuoteRank(b.quoteSymbol);
  if (qa !== qb) return qa - qb;
  const vol = (b.volume24h ?? 0) - (a.volume24h ?? 0);
  if (vol !== 0) return vol;
  return (b.liquidityUsd ?? 0) - (a.liquidityUsd ?? 0);
}

function pairKey(p: DexLivePairRow): string {
  return `${p.chain}:${p.address}:${p.dex}:${p.quoteSymbol ?? ""}`.toLowerCase();
}

function changeForInjCard(p: DexLivePairRow): { pct: number; window: DexHeatWindow } | null {
  if (p.change1h != null && Number.isFinite(p.change1h)) return { pct: p.change1h, window: "1h" };
  if (p.change24h != null && Number.isFinite(p.change24h)) return { pct: p.change24h, window: "24h" };
  return null;
}

async function dexGet(path: string): Promise<unknown | null> {
  try {
    const res = await fetch(`${DEX_BASE}${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: DEX_EXPLORER_REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchOfficialInjPairs(): Promise<DexLivePairRow[]> {
  const chunks = await Promise.all([
    dexGet(`/latest/dex/search?q=${encodeURIComponent("INJ")}`),
    ...OFFICIAL_INJ.map((c) => dexGet(`/latest/dex/tokens/${encodeURIComponent(c.address)}`)),
  ]);
  const byKey = new Map<string, DexLivePairRow>();
  for (const data of chunks) {
    for (const pair of asPairs(data)) {
      if (!isOfficialInjBase(pair)) continue;
      const row = mapDexPairToLiveRow(pair);
      if (!row) continue;
      const key = pairKey(row);
      const prev = byKey.get(key);
      if (!prev || (row.volume24h ?? 0) > (prev.volume24h ?? 0)) byKey.set(key, row);
    }
  }
  return [...byKey.values()];
}

/** INJ = Injective token. Primary = highest-vol INJ/USDT else USDC. */
export function buildInjTokenBucket(rows: DexLivePairRow[]): DexHeatBucket {
  const fallbackHref = "/pairs?chain=injective";
  const official = rows.filter(
    (r) =>
      r.symbol.trim().toUpperCase() === "INJ" &&
      OFFICIAL_INJ.some((c) => sameTokenAddress(c.address, r.address)),
  );
  const primary = official.filter(isUsdtUsdcQuote).sort(compareInjStablePairs)[0] ?? null;
  if (!primary) return emptyBucket("injective", "INJ", "injective", fallbackHref, "token");

  const change = changeForInjCard(primary);
  const heatPct = change?.pct ?? 0;
  const window: DexHeatWindow = change?.window ?? "24h";
  const related = [...official]
    .filter((r) => pairKey(r) !== pairKey(primary))
    .sort((a, b) => (b.volume24h ?? 0) - (a.volume24h ?? 0));

  const children: DexHeatChild[] = [
    childFromPair(primary, change?.pct ?? primary.change24h ?? 0),
  ];
  const second = related[0];
  if (second) {
    const sec = changeForInjCard(second);
    children.push(childFromPair(second, sec?.pct ?? second.change24h ?? 0));
  }

  return {
    id: "injective",
    label: "INJ",
    kind: "token",
    filterChain: "injective",
    href:
      dexTokenPath(primary.chain, primary.address) ??
      `/token/${encodeURIComponent(primary.chain)}/${encodeURIComponent(primary.address)}`,
    heatPct,
    window,
    status: statusFromHeat(heatPct),
    sampleSize: Math.max(1, children.length),
    children,
  };
}

export function buildDexHeatSnapshot(
  rows: DexLivePairRow[],
  injRows: DexLivePairRow[] = [],
): DexHeatSnapshot {
  const buckets: DexHeatBucket[] = CHAIN_BUCKETS.map((def) => {
    const filterChain = def.chains[0]!;
    return buildBucketFromPairs(
      def.id,
      def.label,
      "chain",
      filterChain,
      `/pairs?chain=${encodeURIComponent(filterChain)}`,
      rows.filter((r) => sameDexChain(r.chain, filterChain)),
    );
  });
  buckets.push(buildInjTokenBucket(injRows.length > 0 ? injRows : rows));
  return {
    buckets,
    windowLabel: buckets.some((b) => b.window === "1h" && b.sampleSize > 0) ? "1H" : "24H",
    updatedAt: Date.now(),
  };
}

async function loadDexHeatUncached(): Promise<DexHeatSnapshot> {
  const [rows, injRows] = await Promise.all([
    getCachedDexExplorerPairs(),
    fetchOfficialInjPairs(),
  ]);
  return buildDexHeatSnapshot(rows, injRows);
}

const getCachedDexHeat = unstable_cache(loadDexHeatUncached, ["dex-narrative-heat-v5-inj-token"], {
  revalidate: DEX_EXPLORER_REVALIDATE_SECONDS,
});

function emptySnapshot(): DexHeatSnapshot {
  return {
    buckets: [
      ...CHAIN_BUCKETS.map((def) =>
        emptyBucket(
          def.id,
          def.label,
          def.chains[0]!,
          `/pairs?chain=${encodeURIComponent(def.chains[0]!)}`,
        ),
      ),
      emptyBucket("injective", "INJ", "injective", "/pairs?chain=injective", "token"),
    ],
    windowLabel: "24H",
    updatedAt: Date.now(),
  };
}

export async function getDexNarrativeHeat(): Promise<DexHeatSnapshot> {
  try {
    return await getCachedDexHeat();
  } catch (err) {
    console.warn("[dex-narrative-heat] failed", err);
    return emptySnapshot();
  }
}
