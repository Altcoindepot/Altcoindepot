import { unstable_cache } from "next/cache";
import {
  DEXSCREENER_REVALIDATE_SECONDS,
  getDexScreenerLowCaps,
} from "@/lib/dexscreener-low-caps";
import {
  sanitizeAddressParam,
  sanitizeChainParam,
  sameTokenAddress,
} from "@/lib/dex-token-path";

const DEX_BASE = "https://api.dexscreener.com";

export type DexTokenPageData = {
  chain: string;
  address: string;
  name: string;
  symbol: string;
  image: string;
  priceUsd: number | null;
  change24h: number | null;
  volume: number | null;
  liquidity: number | null;
  marketCap: number | null;
  pairAgeLabel: string;
  pairAddress: string | null;
  pairUrl: string | null;
};

type DexPair = {
  chainId?: string;
  url?: string;
  pairAddress?: string;
  priceUsd?: string | number;
  baseToken?: { address?: string; name?: string; symbol?: string };
  priceChange?: { h24?: number };
  volume?: { h24?: number };
  liquidity?: { usd?: number };
  marketCap?: number | null;
  fdv?: number | null;
  pairCreatedAt?: number | null;
  info?: { imageUrl?: string };
};

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function pairAgeLabel(createdAt: number | null | undefined): string {
  if (createdAt == null || !Number.isFinite(createdAt)) return "New";
  const days = Math.max(0, Math.floor((Date.now() - createdAt) / 86_400_000));
  if (days < 1) return "Today";
  if (days === 1) return "1d ago";
  if (days < 14) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

async function fetchTokenPairs(chain: string, address: string): Promise<DexPair[]> {
  const res = await fetch(
    `${DEX_BASE}/tokens/v1/${encodeURIComponent(chain)}/${encodeURIComponent(address)}`,
    {
      headers: { Accept: "application/json" },
      cache: "force-cache",
      next: { revalidate: DEXSCREENER_REVALIDATE_SECONDS },
    },
  );
  if (!res.ok) return [];
  const data: unknown = await res.json();
  if (!Array.isArray(data)) return [];
  return data.filter((row): row is DexPair => Boolean(row) && typeof row === "object");
}

const fetchTokenPairsCached = unstable_cache(
  fetchTokenPairs,
  ["dexscreener-token-v1"],
  { revalidate: DEXSCREENER_REVALIDATE_SECONDS },
);

function pickBestPair(pairs: DexPair[], address: string): DexPair | null {
  const matched = pairs.filter((pair) => sameTokenAddress(pair.baseToken?.address, address));
  const pool = matched.length > 0 ? matched : pairs;
  if (pool.length === 0) return null;
  return [...pool].sort((a, b) => (b.volume?.h24 ?? 0) - (a.volume?.h24 ?? 0))[0] ?? null;
}

/**
 * Lightweight DexScreener token page. Only resolves tokens currently in the
 * New & Low Caps set so we do not mint pages for arbitrary junk addresses.
 */
export async function getDexScreenerTokenPage(
  chainRaw: string,
  addressRaw: string,
): Promise<DexTokenPageData | null> {
  const chain = sanitizeChainParam(chainRaw);
  const address = sanitizeAddressParam(addressRaw);
  if (!chain || !address) return null;

  let listed;
  try {
    const rows = await getDexScreenerLowCaps();
    listed = rows.find(
      (row) =>
        (row.chain ?? "").trim().toLowerCase() === chain &&
        sameTokenAddress(row.contractAddress, address),
    );
  } catch {
    listed = undefined;
  }
  if (!listed) return null;

  let pair: DexPair | null = null;
  try {
    pair = pickBestPair(await fetchTokenPairsCached(chain, address), address);
  } catch (err) {
    console.warn("[dex-token] DexScreener token lookup failed", err);
  }

  const pairUrl =
    (typeof pair?.url === "string" && pair.url.startsWith("http") ? pair.url : null) ??
    listed.href ??
    null;

  return {
    chain,
    address: listed.contractAddress ?? address,
    name: pair?.baseToken?.name ?? listed.name,
    symbol: pair?.baseToken?.symbol ?? listed.symbol,
    image: pair?.info?.imageUrl ?? listed.image ?? "",
    priceUsd: asNumber(pair?.priceUsd),
    change24h: asNumber(pair?.priceChange?.h24) ?? listed.change7d,
    volume: pair?.volume?.h24 ?? listed.volume,
    liquidity: pair?.liquidity?.usd ?? listed.liquidity ?? null,
    marketCap: asNumber(pair?.marketCap) ?? asNumber(pair?.fdv) ?? listed.marketCap,
    pairAgeLabel:
      pair?.pairCreatedAt != null ? pairAgeLabel(pair.pairCreatedAt) : listed.addedLabel,
    pairAddress: pair?.pairAddress ?? listed.pairAddress ?? null,
    pairUrl,
  };
}

export function dexScreenerEmbedUrl(pairUrl: string | null, chain: string, pairAddress: string | null): string | null {
  if (pairUrl && pairUrl.startsWith("https://dexscreener.com/")) {
    try {
      const url = new URL(pairUrl);
      url.searchParams.set("embed", "1");
      url.searchParams.set("theme", "dark");
      url.searchParams.set("trades", "0");
      url.searchParams.set("info", "0");
      return url.toString();
    } catch {
      /* fall through */
    }
  }
  if (pairAddress) {
    return `https://dexscreener.com/${encodeURIComponent(chain)}/${encodeURIComponent(pairAddress)}?embed=1&theme=dark&trades=0&info=0`;
  }
  return null;
}
