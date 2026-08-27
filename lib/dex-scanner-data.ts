/**
 * Advanced DEX Scanner dataset for /dex-scanner.
 * Separate from /pairs explorer and list pages — does not change mapDexPairToLiveRow.
 */

import { unstable_cache } from "next/cache";
import { dexVenueLabel } from "@/lib/dex-venue";
import { normalizeDexChainId, sameDexChain } from "@/lib/dex-token-path";
import { parseDexUsdNumber } from "@/lib/dex-pair-fields";
import { DexScreenerFetchError } from "@/lib/dexscreener-live-pairs";
import {
  type DexScannerQuery,
  DEX_SCANNER_DEFAULT_QUERY,
} from "@/lib/dex-scanner-query";

const DEX_BASE = "https://api.dexscreener.com";
export const DEX_SCANNER_REVALIDATE_SECONDS = 180;
export const DEX_SCANNER_MAX_ROWS = 300;
export const DEX_SCANNER_INITIAL_ROWS = 100;
export const DEX_SCANNER_PAGE_STEP = 50;

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
  "SUI",
  "HYPE",
  "TON",
  "TRX",
  "XRP",
  "DOGE",
  "ADA",
  "DOT",
  "LINK",
  "UNI",
  "AAVE",
]);

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

export type DexScannerRow = {
  id: string;
  symbol: string;
  name: string;
  address: string;
  chain: string;
  dex: string;
  dexLabel: string;
  quoteSymbol: string;
  priceUsd: number | null;
  change24h: number | null;
  volume24h: number | null;
  liquidityUsd: number | null;
  marketCap: number | null;
  pairCreatedAt: number | null;
  ageLabel: string;
  pairUrl?: string;
  isMajor: boolean;
};

type DexPair = {
  chainId?: string;
  dexId?: string;
  url?: string;
  pairAddress?: string;
  baseToken?: { address?: string; name?: string; symbol?: string };
  quoteToken?: { address?: string; name?: string; symbol?: string };
  priceUsd?: string | number | null;
  priceChange?: { h24?: number; h6?: number; h1?: number };
  volume?: { h24?: number };
  liquidity?: { usd?: number };
  marketCap?: number | null;
  fdv?: number | null;
  pairCreatedAt?: number | null;
};

type TokenBoostRef = { chainId: string; tokenAddress: string };

function ageLabelFromCreated(createdAt: number | null): string {
  if (createdAt == null || !Number.isFinite(createdAt)) return "—";
  const mins = Math.max(0, Math.floor((Date.now() - createdAt) / 60_000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function isMajorSymbol(symbol: string): boolean {
  const s = symbol.trim().toUpperCase();
  if (MAJOR_SYMBOLS.has(s)) return true;
  if (s.startsWith("W") && MAJOR_SYMBOLS.has(s.slice(1))) return true;
  return false;
}

function quotePreference(quote: string | undefined): number {
  const q = (quote ?? "").trim().toUpperCase();
  if (q === "USDT") return 0;
  if (q === "USDC") return 1;
  if (STABLE_QUOTES.has(q)) return 2;
  return 3;
}

async function dexFetch(path: string): Promise<unknown> {
  const res = await fetch(`${DEX_BASE}${path}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: DEX_SCANNER_REVALIDATE_SECONDS },
  });
  if (!res.ok) {
    throw new DexScreenerFetchError(`DexScreener ${path}: HTTP ${res.status}`);
  }
  return res.json();
}

/** Prefer USDT → USDC → other stables → else highest liquidity (for majors). */
function pickBestScannerPair(pairs: DexPair[]): DexPair | null {
  if (pairs.length === 0) return null;
  const baseSym = pairs[0]?.baseToken?.symbol ?? "";
  const major = isMajorSymbol(baseSym);

  return (
    [...pairs].sort((a, b) => {
      if (major) {
        const qa = quotePreference(a.quoteToken?.symbol);
        const qb = quotePreference(b.quoteToken?.symbol);
        if (qa !== qb) return qa - qb;
      }
      const liqA = parseDexUsdNumber(a.liquidity?.usd) ?? 0;
      const liqB = parseDexUsdNumber(b.liquidity?.usd) ?? 0;
      if (liqB !== liqA) return liqB - liqA;
      return (parseDexUsdNumber(b.volume?.h24) ?? 0) - (parseDexUsdNumber(a.volume?.h24) ?? 0);
    })[0] ?? null
  );
}

function mapPairToScannerRow(pair: DexPair): DexScannerRow | null {
  const base = pair.baseToken;
  if (!base?.address || !base.symbol) return null;
  const chain =
    normalizeDexChainId(pair.chainId) ?? pair.chainId?.trim().toLowerCase() ?? "";
  if (!chain) return null;
  const dex = typeof pair.dexId === "string" ? pair.dexId : "";
  const symbol = base.symbol.toUpperCase();
  const priceUsd = parseDexUsdNumber(pair.priceUsd);
  const change24h = parseDexUsdNumber(pair.priceChange?.h24);
  const volume24h = parseDexUsdNumber(pair.volume?.h24);
  const liquidityUsd = parseDexUsdNumber(pair.liquidity?.usd);
  const marketCap =
    parseDexUsdNumber(pair.marketCap) ?? parseDexUsdNumber(pair.fdv);
  const pairCreatedAt =
    typeof pair.pairCreatedAt === "number" && Number.isFinite(pair.pairCreatedAt)
      ? pair.pairCreatedAt
      : null;
  const quoteSymbol = (pair.quoteToken?.symbol ?? "").toUpperCase() || "—";

  return {
    id: `${chain}:${base.address.toLowerCase()}`,
    symbol,
    name: base.name ?? base.symbol,
    address: base.address,
    chain,
    dex,
    dexLabel: dexVenueLabel(dex) || dex || "—",
    quoteSymbol,
    priceUsd,
    change24h,
    volume24h,
    liquidityUsd,
    marketCap,
    pairCreatedAt,
    ageLabel: ageLabelFromCreated(pairCreatedAt),
    pairUrl: typeof pair.url === "string" && pair.url.startsWith("http") ? pair.url : undefined,
    isMajor: isMajorSymbol(symbol),
  };
}

async function fetchBoostPairs(): Promise<DexPair[]> {
  const topRaw = await dexFetch("/token-boosts/top/v1");
  if (!Array.isArray(topRaw) || topRaw.length === 0) return [];

  const refs: TokenBoostRef[] = [];
  for (const item of topRaw) {
    if (!item || typeof item !== "object") continue;
    const row = item as { chainId?: unknown; tokenAddress?: unknown };
    if (typeof row.chainId !== "string" || typeof row.tokenAddress !== "string") continue;
    refs.push({
      chainId: row.chainId.trim().toLowerCase(),
      tokenAddress: row.tokenAddress.trim(),
    });
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
        const path = `/tokens/v1/${encodeURIComponent(chain)}/${batch
          .map(encodeURIComponent)
          .join(",")}`;
        try {
          const data = await dexFetch(path);
          if (Array.isArray(data)) out.push(...(data as DexPair[]));
        } catch {
          /* continue */
        }
      }
    }),
  );
  return out;
}

async function fetchSearchPairs(): Promise<DexPair[]> {
  const queries = [
    "SOL",
    "ETH",
    "BASE",
    "BNB",
    "BTC",
    "USDT",
    "USDC",
    "PEPE",
    "WIF",
    "BONK",
    "AI",
    "meme",
    "ARB",
    "AVAX",
  ];
  const out: DexPair[] = [];
  await Promise.all(
    queries.map(async (q) => {
      try {
        const data = (await dexFetch(`/latest/dex/search?q=${encodeURIComponent(q)}`)) as {
          pairs?: DexPair[];
        };
        if (Array.isArray(data.pairs)) out.push(...data.pairs);
      } catch {
        /* continue */
      }
    }),
  );
  return out;
}

function dedupeScannerRows(pairs: DexPair[]): DexScannerRow[] {
  const grouped = new Map<string, DexPair[]>();
  for (const pair of pairs) {
    const addr = pair.baseToken?.address?.trim().toLowerCase();
    const chain =
      normalizeDexChainId(pair.chainId) ?? pair.chainId?.trim().toLowerCase() ?? "";
    if (!addr || !chain) continue;
    const key = `${chain}:${addr}`;
    const bucket = grouped.get(key) ?? [];
    bucket.push(pair);
    grouped.set(key, bucket);
  }

  const rows: DexScannerRow[] = [];
  for (const bucket of grouped.values()) {
    const best = pickBestScannerPair(bucket);
    if (!best) continue;
    const row = mapPairToScannerRow(best);
    if (row) rows.push(row);
  }
  return rows;
}

async function loadScannerUncached(): Promise<DexScannerRow[]> {
  let pairs: DexPair[] = [];
  let lastError: string | null = null;
  try {
    pairs = await fetchBoostPairs();
  } catch (err) {
    lastError = err instanceof Error ? err.message : String(err);
  }
  try {
    pairs = [...pairs, ...(await fetchSearchPairs())];
  } catch (err) {
    lastError = err instanceof Error ? err.message : String(err);
  }

  const rows = dedupeScannerRows(pairs);
  console.info("[dex-scanner] summary", {
    raw: pairs.length,
    mapped: rows.length,
    withPrice: rows.filter((r) => r.priceUsd != null).length,
    lastError,
  });

  if (rows.length === 0) {
    throw new DexScreenerFetchError(
      lastError ?? "DexScreener returned no usable pairs for the scanner.",
    );
  }
  return rows;
}

const loadCached = unstable_cache(loadScannerUncached, ["dex-scanner-rows-v1"], {
  revalidate: DEX_SCANNER_REVALIDATE_SECONDS,
});

export async function getDexScannerRows(): Promise<DexScannerRow[]> {
  return loadCached();
}

function inRange(value: number | null, min: number, max: number | null): boolean {
  const v = value ?? 0;
  if (v < min) return false;
  if (max != null && v > max) return false;
  return true;
}

function chainOk(rowChain: string, filter: string): boolean {
  if (!filter || filter === "all") return true;
  return sameDexChain(rowChain, filter);
}

/** Apply scanner filters + sort. Always drops dead liq=0 & vol=0 rows. */
export function applyDexScannerQuery(
  rows: DexScannerRow[],
  query: DexScannerQuery = DEX_SCANNER_DEFAULT_QUERY,
): DexScannerRow[] {
  const q = query.q.trim().toLowerCase();
  const filtered = rows.filter((row) => {
    const liq = row.liquidityUsd ?? 0;
    const vol = row.volume24h ?? 0;
    // Dead-row guard even when mins are 0
    if (liq === 0 && vol === 0) return false;
    if (!chainOk(row.chain, query.chain)) return false;
    if (!query.includeMajors && row.isMajor) return false;
    if (!inRange(row.liquidityUsd, query.minLiq, query.maxLiq)) return false;
    if (!inRange(row.volume24h, query.minVol, query.maxVol)) return false;
    if (!inRange(row.marketCap, query.minMcap, query.maxMcap)) return false;
    if (q) {
      const hay = `${row.symbol} ${row.name} ${row.address}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const missing = Number.NEGATIVE_INFINITY;
  const dirMul = query.dir === "asc" ? -1 : 1;
  const copy = [...filtered];
  copy.sort((a, b) => {
    let cmp = 0;
    if (query.sort === "volume") {
      cmp = (b.volume24h ?? missing) - (a.volume24h ?? missing);
    } else if (query.sort === "liquidity") {
      cmp = (b.liquidityUsd ?? missing) - (a.liquidityUsd ?? missing);
    } else if (query.sort === "mcap") {
      cmp = (b.marketCap ?? missing) - (a.marketCap ?? missing);
    } else if (query.sort === "change") {
      cmp = (b.change24h ?? missing) - (a.change24h ?? missing);
    } else {
      cmp = (b.pairCreatedAt ?? missing) - (a.pairCreatedAt ?? missing);
    }
    return cmp * dirMul;
  });
  return copy;
}
