/**
 * Reliable DexScreener live pair fetch for scanner tables.
 * Primary: token-boosts/top → tokens/v1 (full pair stats incl. priceUsd).
 * Fallback: latest/dex/search.
 */

import { dexVenueLabel } from "@/lib/dex-venue";
import { normalizeDexChainId } from "@/lib/dex-token-path";
import { parseDexUsdNumber } from "@/lib/dex-pair-fields";

const DEX_BASE = "https://api.dexscreener.com";
export const LIVE_PAIRS_REVALIDATE_SECONDS = 120;
export const LIVE_PAIRS_MIN_ROWS = 10;

export type DexLivePairRow = {
  id: string;
  symbol: string;
  name: string;
  address: string;
  chain: string;
  dex: string;
  dexLabel: string;
  priceUsd: number | null;
  change24h: number | null;
  volume24h: number | null;
  liquidityUsd: number | null;
  pairCreatedAt: number | null;
  ageLabel: string;
};

type DexPair = {
  chainId?: string;
  dexId?: string;
  baseToken?: { address?: string; name?: string; symbol?: string };
  priceUsd?: string | number | null;
  priceChange?: { h24?: number; h6?: number; h1?: number };
  volume?: { h24?: number };
  liquidity?: { usd?: number };
  pairCreatedAt?: number | null;
};

type TokenBoostRef = { chainId: string; tokenAddress: string };

export class DexScreenerFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DexScreenerFetchError";
  }
}

function ageLabelFromCreated(createdAt: number | null): string {
  if (createdAt == null || !Number.isFinite(createdAt)) return "—";
  const mins = Math.max(0, Math.floor((Date.now() - createdAt) / 60_000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function mapDexPairToLiveRow(pair: DexPair): DexLivePairRow | null {
  const base = pair.baseToken;
  if (!base?.address || !base.symbol) return null;
  const chain =
    normalizeDexChainId(pair.chainId) ?? pair.chainId?.trim().toLowerCase() ?? "";
  if (!chain) return null;
  const dex = typeof pair.dexId === "string" ? pair.dexId : "";
  const priceUsd = parseDexUsdNumber(pair.priceUsd);
  const change24h = parseDexUsdNumber(pair.priceChange?.h24);
  const volume24h = parseDexUsdNumber(pair.volume?.h24);
  const liquidityUsd = parseDexUsdNumber(pair.liquidity?.usd);
  const pairCreatedAt =
    typeof pair.pairCreatedAt === "number" && Number.isFinite(pair.pairCreatedAt)
      ? pair.pairCreatedAt
      : null;

  return {
    id: `${chain}:${base.address.toLowerCase()}`,
    symbol: base.symbol.toUpperCase(),
    name: base.name ?? base.symbol,
    address: base.address,
    chain,
    dex,
    dexLabel: dexVenueLabel(dex) || dex || "—",
    priceUsd,
    change24h,
    volume24h,
    liquidityUsd,
    pairCreatedAt,
    ageLabel: ageLabelFromCreated(pairCreatedAt),
  };
}

export function logDexLivePairSamples(rows: DexLivePairRow[], label: string) {
  const sample = rows.slice(0, 3).map((r) => ({
    symbol: r.symbol,
    priceUsd: r.priceUsd,
    change24h: r.change24h,
    volume24h: r.volume24h,
    liquidityUsd: r.liquidityUsd,
    chain: r.chain,
    dex: r.dex,
    address: r.address,
  }));
  console.info(`[${label}] first 3 mapped rows: ${JSON.stringify(sample)}`);
}

async function dexFetch(path: string): Promise<unknown> {
  const res = await fetch(`${DEX_BASE}${path}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new DexScreenerFetchError(`DexScreener ${path}: HTTP ${res.status}`);
  }
  return res.json();
}

function pickBestPair(pairs: DexPair[]): DexPair | null {
  if (pairs.length === 0) return null;
  return [...pairs].sort(
    (a, b) => (parseDexUsdNumber(b.volume?.h24) ?? 0) - (parseDexUsdNumber(a.volume?.h24) ?? 0),
  )[0] ?? null;
}

async function fetchPairsFromTopBoosts(): Promise<DexPair[]> {
  const topRaw = await dexFetch("/token-boosts/top/v1");
  if (!Array.isArray(topRaw) || topRaw.length === 0) return [];

  const refs: TokenBoostRef[] = [];
  for (const item of topRaw) {
    if (!item || typeof item !== "object") continue;
    const row = item as { chainId?: unknown; tokenAddress?: unknown };
    if (typeof row.chainId !== "string" || typeof row.tokenAddress !== "string") continue;
    refs.push({ chainId: row.chainId.trim().toLowerCase(), tokenAddress: row.tokenAddress.trim() });
  }

  const byChain = new Map<string, string[]>();
  for (const ref of refs) {
    const list = byChain.get(ref.chainId) ?? [];
    list.push(ref.tokenAddress);
    byChain.set(ref.chainId, list);
  }

  const out: DexPair[] = [];
  await Promise.all(
    [...byChain.entries()].map(async ([chain, addresses]) => {
      for (let i = 0; i < addresses.length; i += 30) {
        const batch = addresses.slice(i, i + 30);
        const path = `/tokens/v1/${encodeURIComponent(chain)}/${batch.map(encodeURIComponent).join(",")}`;
        try {
          const data = await dexFetch(path);
          if (Array.isArray(data)) out.push(...(data as DexPair[]));
        } catch {
          /* batch failure — continue */
        }
      }
    }),
  );
  return out;
}

async function fetchPairsFromSearch(): Promise<DexPair[]> {
  const queries = ["SOL", "PEPE", "WIF", "BONK", "ETH"];
  const out: DexPair[] = [];
  await Promise.all(
    queries.map(async (q) => {
      try {
        const data = (await dexFetch(`/latest/dex/search?q=${encodeURIComponent(q)}`)) as {
          pairs?: DexPair[];
        };
        if (Array.isArray(data.pairs)) out.push(...data.pairs);
      } catch {
        /* search failure — continue */
      }
    }),
  );
  return out;
}

function dedupeLiveRows(pairs: DexPair[]): DexLivePairRow[] {
  const byKey = new Map<string, DexLivePairRow>();
  const grouped = new Map<string, DexPair[]>();

  for (const pair of pairs) {
    const addr = pair.baseToken?.address?.trim().toLowerCase();
    const chain = pair.chainId?.trim().toLowerCase();
    if (!addr || !chain) continue;
    const key = `${chain}:${addr}`;
    const bucket = grouped.get(key) ?? [];
    bucket.push(pair);
    grouped.set(key, bucket);
  }

  for (const [key, bucket] of grouped) {
    const best = pickBestPair(bucket);
    if (!best) continue;
    const row = mapDexPairToLiveRow(best);
    if (row) byKey.set(key, row);
  }

  return [...byKey.values()].sort(
    (a, b) => (b.volume24h ?? 0) - (a.volume24h ?? 0),
  );
}

/** Fetch live Dex pairs with prices. Throws DexScreenerFetchError if unusable. */
export async function getLiveDexPairs(limit = 30): Promise<DexLivePairRow[]> {
  let pairs: DexPair[] = [];
  let lastError: string | null = null;

  try {
    pairs = await fetchPairsFromTopBoosts();
  } catch (err) {
    lastError = err instanceof Error ? err.message : String(err);
  }

  if (pairs.length < LIVE_PAIRS_MIN_ROWS) {
    try {
      pairs = [...pairs, ...(await fetchPairsFromSearch())];
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  const rows = dedupeLiveRows(pairs).slice(0, limit);
  const withPrice = rows.filter((r) => r.priceUsd != null).length;

  logDexLivePairSamples(rows, "dex-live-pairs");
  console.info("[dex-live-pairs] summary", {
    totalPairs: pairs.length,
    mapped: rows.length,
    withPrice,
  });

  if (rows.length < LIVE_PAIRS_MIN_ROWS) {
    throw new DexScreenerFetchError(
      lastError ??
        `Only ${rows.length} pairs mapped (need ${LIVE_PAIRS_MIN_ROWS}). DexScreener returned ${pairs.length} raw pairs.`,
    );
  }

  if (withPrice === 0) {
    throw new DexScreenerFetchError("Mapped rows have no priceUsd values from DexScreener.");
  }

  return rows;
}
