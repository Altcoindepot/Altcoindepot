import type { MetadataRoute } from "next";
import { isProductionBuild } from "@/lib/build-phase";
import { coinGeckoFetch } from "@/lib/coingecko";
import { PUBLIC_CATEGORIES } from "@/lib/coin-categories";
import { NARRATIVES } from "@/lib/narratives";

const SITE = "https://altcoindepot.com";

/** Core static routes (homepage + trending handled separately for priority/frequency). */
const STATIC_PATHS = [
  "/about",
  "/contact",
  "/privacy-policy",
  "/terms",
  "/privacy",
  "/disclaimer",
  "/affiliate-disclosure",
  "/coin",
  "/podcasts",
  "/blog",
  "/directory",
  "/tools",
  "/cex-trending",
  "/dex-trending",
  "/top-100-trending",
  "/gainers-losers",
  "/market-overview",
  "/compare",
  "/sectors",
  "/watchlist",
  "/portfolio",
  "/alerts",
  "/ecosystem",
] as const;

/**
 * Offline / rate-limit fallback IDs (same slug shape as `/coin/[id]`).
 * Live sitemap prefers CoinGecko top-200 by market cap when available.
 */
const FALLBACK_TOP_COIN_IDS = [
  "bitcoin",
  "ethereum",
  "tether",
  "ripple",
  "binancecoin",
  "solana",
  "usd-coin",
  "staked-ether",
  "dogecoin",
  "tron",
  "cardano",
  "chainlink",
  "hyperliquid",
  "sui",
  "avalanche-2",
  "stellar",
  "bitcoin-cash",
  "hedera-hashgraph",
  "shiba-inu",
  "litecoin",
  "toncoin",
  "polkadot",
  "uniswap",
  "bitget-token",
  "pepe",
  "mantle",
  "aave",
  "near",
  "internet-computer",
  "crypto-com-chain",
  "ethereum-classic",
  "render-token",
  "vechain",
  "polygon-ecosystem-token",
  "kaspa",
  "fetch-ai",
  "filecoin",
  "aptos",
  "algorand",
  "arbitrum",
  "cosmos",
  "maker",
  "injective-protocol",
  "optimism",
  "blockstack",
  "immutable-x",
  "the-graph",
  "theta-token",
  "bonk",
  "lido-dao",
  "monero",
  "fantom",
  "sei-network",
  "worldcoin-wld",
  "floki",
  "jupiter-exchange-solana",
  "ondo-finance",
  "bittensor",
  "celestia",
  "pyth-network",
] as const;

async function fetchTop200CoinIds(): Promise<string[]> {
  if (isProductionBuild()) return [...FALLBACK_TOP_COIN_IDS];
  try {
    const res = await coinGeckoFetch(
      "/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=200&page=1&sparkline=false",
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return [...FALLBACK_TOP_COIN_IDS];
    const data: unknown = await res.json();
    if (!Array.isArray(data)) return [...FALLBACK_TOP_COIN_IDS];

    const ids: string[] = [];
    const seen = new Set<string>();
    for (const row of data) {
      if (!row || typeof row !== "object") continue;
      const id = (row as { id?: unknown }).id;
      if (typeof id !== "string" || !id.trim()) continue;
      const slug = id.trim().toLowerCase();
      if (seen.has(slug)) continue;
      seen.add(slug);
      ids.push(slug);
      if (ids.length >= 200) break;
    }
    return ids.length > 0 ? ids : [...FALLBACK_TOP_COIN_IDS];
  } catch {
    return [...FALLBACK_TOP_COIN_IDS];
  }
}

/**
 * Native Next.js Metadata sitemap — homepage, trending, top-200 coin pages,
 * plus remaining static / category / narrative routes.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const coinIds = await fetchTop200CoinIds();

  const homepage: MetadataRoute.Sitemap[number] = {
    url: SITE,
    lastModified: now,
    changeFrequency: "daily",
    priority: 1,
  };

  const trending: MetadataRoute.Sitemap[number] = {
    url: `${SITE}/top-200-trending`,
    lastModified: now,
    changeFrequency: "hourly",
    priority: 0.9,
  };

  const coinEntries: MetadataRoute.Sitemap = coinIds.map((coinId) => ({
    url: `${SITE}/coin/${encodeURIComponent(coinId)}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${SITE}${path}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  const categoryEntries: MetadataRoute.Sitemap = PUBLIC_CATEGORIES.map((category) => ({
    url: `${SITE}/category/${encodeURIComponent(category.slug)}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  const narrativeEntries: MetadataRoute.Sitemap = NARRATIVES.map((narrative) => ({
    url: `${SITE}/narrative/${encodeURIComponent(narrative.slug)}`,
    lastModified: now,
    changeFrequency: "hourly",
    priority: 0.75,
  }));

  return [
    homepage,
    trending,
    ...coinEntries,
    ...staticEntries,
    ...categoryEntries,
    ...narrativeEntries,
  ];
}
