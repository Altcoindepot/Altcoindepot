/**
 * Dex live price for indexed coins via known contracts.
 * Short cache (3 min). Never uses CoinGecko for price.
 */

import { unstable_cache } from "next/cache";
import { dexTokenPath, sameTokenAddress } from "@/lib/dex-token-path";
import { parseDexUsdNumber } from "@/lib/dex-pair-fields";
import {
  dexScreenerEmbedUrl,
  geckoTerminalChartEmbedUrl,
} from "@/lib/dexscreener-token";
import type { CoinPlatformContract } from "@/lib/gecko-platform-map";

const DEX_BASE = "https://api.dexscreener.com";
export const COIN_DEX_PRICE_REVALIDATE_SECONDS = 180;

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

export type CoinDexLive = {
  chain: string;
  address: string;
  priceUsd: number | null;
  change24h: number | null;
  volume24h: number | null;
  liquidityUsd: number | null;
  quoteSymbol: string;
  pairAddress: string | null;
  pairUrl: string | null;
  /** Primary: DexScreener pair embed for the same pair as price. */
  dexChartEmbedUrl: string | null;
  /** Fallback: GeckoTerminal pool embed for the same pair. */
  geckoTerminalEmbedUrl: string | null;
  /** @deprecated alias of dexChartEmbedUrl ?? geckoTerminalEmbedUrl */
  chartEmbedUrl: string | null;
  tokenHref: string | null;
};

type DexPair = {
  chainId?: string;
  url?: string;
  pairAddress?: string;
  priceUsd?: string | number | null;
  baseToken?: { address?: string; symbol?: string };
  quoteToken?: { symbol?: string };
  priceChange?: { h24?: number };
  volume?: { h24?: number };
  liquidity?: { usd?: number };
};

function quotePreference(quote: string | undefined): number {
  const q = (quote ?? "").trim().toUpperCase();
  if (q === "USDT") return 0;
  if (q === "USDC") return 1;
  if (STABLE_QUOTES.has(q)) return 2;
  return 3;
}

function asPairs(data: unknown): DexPair[] {
  if (Array.isArray(data)) {
    return data.filter((p): p is DexPair => Boolean(p) && typeof p === "object");
  }
  if (data && typeof data === "object") {
    const obj = data as { pairs?: unknown };
    if (Array.isArray(obj.pairs)) {
      return obj.pairs.filter((p): p is DexPair => Boolean(p) && typeof p === "object");
    }
  }
  return [];
}

function pickBestPair(pairs: DexPair[], address: string): DexPair | null {
  const pool = pairs.filter(
    (p) =>
      sameTokenAddress(p.baseToken?.address, address) ||
      sameTokenAddress(p.pairAddress, address),
  );
  const use = pool.length > 0 ? pool : pairs;
  if (use.length === 0) return null;
  return (
    [...use].sort((a, b) => {
      const qa = quotePreference(a.quoteToken?.symbol);
      const qb = quotePreference(b.quoteToken?.symbol);
      if (qa !== qb) return qa - qb;
      const liqA = parseDexUsdNumber(a.liquidity?.usd) ?? 0;
      const liqB = parseDexUsdNumber(b.liquidity?.usd) ?? 0;
      if (liqB !== liqA) return liqB - liqA;
      return (parseDexUsdNumber(b.volume?.h24) ?? 0) - (parseDexUsdNumber(a.volume?.h24) ?? 0);
    })[0] ?? null
  );
}

async function dexGet(path: string): Promise<unknown | null> {
  try {
    const res = await fetch(`${DEX_BASE}${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: COIN_DEX_PRICE_REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function resolveOne(platform: CoinPlatformContract): Promise<CoinDexLive | null> {
  const data = await dexGet(`/latest/dex/tokens/${encodeURIComponent(platform.address)}`);
  const best = pickBestPair(asPairs(data), platform.address);
  if (!best) return null;
  const chain = platform.chain;
  const address = platform.address;
  const pairAddress = best.pairAddress?.trim() || null;
  const pairUrl =
    typeof best.url === "string" && best.url.startsWith("http") ? best.url : null;
  const dexChart = dexScreenerEmbedUrl(pairUrl, chain, pairAddress);
  const gtChart = geckoTerminalChartEmbedUrl(chain, pairAddress);
  return {
    chain,
    address,
    priceUsd: parseDexUsdNumber(best.priceUsd),
    change24h:
      typeof best.priceChange?.h24 === "number" && Number.isFinite(best.priceChange.h24)
        ? best.priceChange.h24
        : null,
    volume24h: parseDexUsdNumber(best.volume?.h24),
    liquidityUsd: parseDexUsdNumber(best.liquidity?.usd),
    quoteSymbol: (best.quoteToken?.symbol ?? "").trim().toUpperCase() || "—",
    pairAddress,
    pairUrl,
    dexChartEmbedUrl: dexChart,
    geckoTerminalEmbedUrl: gtChart,
    chartEmbedUrl: dexChart ?? gtChart,
    tokenHref: dexTokenPath(chain, address),
  };
}

async function resolveDexLiveUncached(
  platforms: CoinPlatformContract[],
): Promise<CoinDexLive | null> {
  for (const p of platforms.slice(0, 4)) {
    const live = await resolveOne(p);
    if (live && live.priceUsd != null) return live;
    if (live) return live;
  }
  return null;
}

/** Cached Dex live for a coin's platform list (key = first few contracts). */
export async function getCoinDexLive(
  platforms: CoinPlatformContract[],
): Promise<CoinDexLive | null> {
  if (!platforms.length) return null;
  const key = platforms
    .slice(0, 4)
    .map((p) => `${p.chain}:${p.address.toLowerCase()}`)
    .join("|");
  const cached = unstable_cache(
    () => resolveDexLiveUncached(platforms),
    ["coin-dex-live-v1", key],
    { revalidate: COIN_DEX_PRICE_REVALIDATE_SECONDS },
  );
  return cached();
}

/** Batch Dex prices for search suggestions (max ~12). */
export async function overlayDexPricesForPlatforms(
  items: { id: string; platforms: CoinPlatformContract[] }[],
): Promise<Map<string, number | null>> {
  const out = new Map<string, number | null>();
  await Promise.all(
    items.map(async (item) => {
      if (!item.platforms.length) {
        out.set(item.id, null);
        return;
      }
      try {
        const live = await getCoinDexLive(item.platforms);
        out.set(item.id, live?.priceUsd ?? null);
      } catch {
        out.set(item.id, null);
      }
    }),
  );
  return out;
}
