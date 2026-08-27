/**
 * DexScreener search — ticker/name or contract address.
 * Live prices only; not CoinGecko.
 */

import {
  normalizeDexChainId,
  dexTokenPath,
  isTokenAddress,
  sameTokenAddress,
} from "@/lib/dex-token-path";
import { parseDexUsdNumber } from "@/lib/dex-pair-fields";
import { formatDexPct, formatDexPriceUsd } from "@/lib/dex-pair-fields";

const DEX_BASE = "https://api.dexscreener.com";
const SEARCH_REVALIDATE_SECONDS = 60;

const STABLE_QUOTES = new Set([
  "USDT",
  "USDC",
  "USD1",
  "DAI",
  "FDUSD",
  "TUSD",
  "USDE",
  "BUSD",
  "USD",
]);

const MAJOR_SYMBOLS = new Set([
  "BTC",
  "WBTC",
  "ETH",
  "WETH",
  "SOL",
  "WSOL",
  "BNB",
  "WBNB",
  "AVAX",
  "WAVAX",
  "MATIC",
  "WMATIC",
  "POL",
  "ARB",
  "OP",
]);

export type DexSearchHit = {
  id: string;
  symbol: string;
  name: string;
  chain: string;
  address: string;
  quoteSymbol: string;
  priceUsd: number | null;
  change24h: number | null;
  liquidityUsd: number | null;
  volume24h: number | null;
  imageUrl: string | null;
  href: string;
  pairUrl: string | null;
  pairAddress: string | null;
};

type DexPair = {
  chainId?: string;
  url?: string;
  pairAddress?: string;
  priceUsd?: string | number | null;
  baseToken?: { address?: string; name?: string; symbol?: string };
  quoteToken?: { address?: string; name?: string; symbol?: string };
  priceChange?: { h24?: number };
  volume?: { h24?: number };
  liquidity?: { usd?: number };
  info?: { imageUrl?: string };
};

/** EVM 0x+40 hex or long base58 mint — route to token/pair-by-address first. */
export function looksLikeContractQuery(value: string): boolean {
  const v = value.trim();
  if (/^0x[a-fA-F0-9]{40}$/i.test(v)) return true;
  if (/^[1-9A-HJ-NP-Za-km-z]{32,64}$/.test(v)) return true;
  return false;
}

export function truncateContract(address: string): string {
  const a = address.trim();
  if (a.length <= 13) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function quotePreference(quote: string | undefined): number {
  const q = (quote ?? "").trim().toUpperCase();
  if (q === "USDT") return 0;
  if (q === "USDC") return 1;
  if (STABLE_QUOTES.has(q)) return 2;
  return 3;
}

function isMajorSymbol(symbol: string): boolean {
  const s = symbol.trim().toUpperCase();
  if (MAJOR_SYMBOLS.has(s)) return true;
  if (s.startsWith("W") && MAJOR_SYMBOLS.has(s.slice(1))) return true;
  return false;
}

function asPairs(data: unknown): DexPair[] {
  if (Array.isArray(data)) {
    return data.filter((p): p is DexPair => Boolean(p) && typeof p === "object");
  }
  if (!data || typeof data !== "object") return [];
  const obj = data as { pairs?: unknown; pair?: unknown };
  if (Array.isArray(obj.pairs)) {
    return obj.pairs.filter((p): p is DexPair => Boolean(p) && typeof p === "object");
  }
  if (obj.pair && typeof obj.pair === "object") return [obj.pair as DexPair];
  return [];
}

async function dexGet(path: string): Promise<unknown | null> {
  try {
    const res = await fetch(`${DEX_BASE}${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: SEARCH_REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("[dex-search] fetch failed", path, err);
    return null;
  }
}

function mapHit(pair: DexPair, preferAddress?: string): DexSearchHit | null {
  const chain = normalizeDexChainId(pair.chainId);
  let address = pair.baseToken?.address?.trim();
  // If the query was a pair address, still route to the base token page.
  if (
    preferAddress &&
    sameTokenAddress(pair.pairAddress, preferAddress) &&
    pair.baseToken?.address
  ) {
    address = pair.baseToken.address.trim();
  }
  const symbol = (pair.baseToken?.symbol ?? "").trim();
  if (!chain || !address || !symbol) return null;
  const href = dexTokenPath(chain, address);
  if (!href) return null;
  return {
    id: `${chain}:${address.toLowerCase()}`,
    symbol,
    name: (pair.baseToken?.name ?? symbol).trim() || symbol,
    chain,
    address,
    quoteSymbol: (pair.quoteToken?.symbol ?? "").trim().toUpperCase() || "—",
    priceUsd: parseDexUsdNumber(pair.priceUsd),
    change24h:
      typeof pair.priceChange?.h24 === "number" && Number.isFinite(pair.priceChange.h24)
        ? pair.priceChange.h24
        : null,
    liquidityUsd: parseDexUsdNumber(pair.liquidity?.usd),
    volume24h: parseDexUsdNumber(pair.volume?.h24),
    imageUrl: typeof pair.info?.imageUrl === "string" ? pair.info.imageUrl : null,
    href,
    pairUrl: typeof pair.url === "string" && pair.url.startsWith("http") ? pair.url : null,
    pairAddress: typeof pair.pairAddress === "string" ? pair.pairAddress.trim() : null,
  };
}

/**
 * Rank: exact ticker match → USDT then USDC for majors → liquidity → volume.
 * Dedupe by chain:address.
 */
function rankAndDedupe(
  pairs: DexPair[],
  limit: number,
  opts?: { query?: string; preferAddress?: string },
): DexSearchHit[] {
  const qSym = (opts?.query ?? "").trim().toUpperCase();
  const queryIsMajor = Boolean(qSym) && MAJOR_SYMBOLS.has(qSym);

  const sorted = [...pairs].sort((a, b) => {
    if (qSym) {
      const aExact = (a.baseToken?.symbol ?? "").trim().toUpperCase() === qSym ? 0 : 1;
      const bExact = (b.baseToken?.symbol ?? "").trim().toUpperCase() === qSym ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
    }

    const aMaj = isMajorSymbol(a.baseToken?.symbol ?? "") || queryIsMajor;
    const bMaj = isMajorSymbol(b.baseToken?.symbol ?? "") || queryIsMajor;
    if (aMaj || bMaj) {
      const qa = quotePreference(a.quoteToken?.symbol);
      const qb = quotePreference(b.quoteToken?.symbol);
      if (qa !== qb) return qa - qb;
    }

    const liqA = parseDexUsdNumber(a.liquidity?.usd) ?? 0;
    const liqB = parseDexUsdNumber(b.liquidity?.usd) ?? 0;
    if (liqB !== liqA) return liqB - liqA;
    return (parseDexUsdNumber(b.volume?.h24) ?? 0) - (parseDexUsdNumber(a.volume?.h24) ?? 0);
  });

  const seen = new Set<string>();
  const out: DexSearchHit[] = [];
  for (const pair of sorted) {
    const hit = mapHit(pair, opts?.preferAddress);
    if (!hit) continue;
    if (seen.has(hit.id)) continue;
    seen.add(hit.id);
    out.push(hit);
    if (out.length >= limit) break;
  }
  return out;
}

async function lookupByContract(address: string, limit: number): Promise<DexSearchHit[]> {
  // Token-by-address (any chain), then pair-by-address via search fallback.
  const byToken = await dexGet(`/latest/dex/tokens/${encodeURIComponent(address)}`);
  let pairs = asPairs(byToken);

  if (pairs.length === 0) {
    const bySearch = await dexGet(`/latest/dex/search?q=${encodeURIComponent(address)}`);
    pairs = asPairs(bySearch);
  }

  // Prefer pairs where base or pair address matches the query.
  const matched = pairs.filter(
    (p) =>
      sameTokenAddress(p.baseToken?.address, address) ||
      sameTokenAddress(p.pairAddress, address),
  );
  const pool = matched.length > 0 ? matched : pairs;
  return rankAndDedupe(pool, limit, { preferAddress: address });
}

async function lookupBySymbolOrName(query: string, limit: number): Promise<DexSearchHit[]> {
  const data = await dexGet(`/latest/dex/search?q=${encodeURIComponent(query)}`);
  if (!data) throw new Error("DexScreener search unavailable");
  return rankAndDedupe(asPairs(data), limit, { query });
}

export async function searchDexPairs(query: string, limit = 10): Promise<DexSearchHit[]> {
  const q = query.trim();
  if (q.length < 1) return [];
  const finalLimit = Math.min(12, Math.max(1, Math.floor(limit)));

  if (looksLikeContractQuery(q)) {
    return lookupByContract(q, finalLimit);
  }
  return lookupBySymbolOrName(q, finalLimit);
}

/** Display helpers for client UI. */
export { formatDexPct, formatDexPriceUsd, isTokenAddress };
