import type { MetadataRoute } from "next";
import { isProductionBuild } from "@/lib/build-phase";
import { coinGeckoFetch } from "@/lib/coingecko";
import { PUBLIC_CATEGORIES } from "@/lib/coin-categories";
import { NARRATIVES } from "@/lib/narratives";
import { getDexScreenerLowCaps } from "@/lib/dexscreener-low-caps";
import { dexTokenPath } from "@/lib/dex-token-path";

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
  "/news",
  "/blog",
  "/directory",
  "/tools",
  "/cex-trending",
  "/dex-trending",
  "/top-100-trending",
  "/gainers-losers",
  "/pairs",
  "/dex-scanner",
  "/new-low-caps",
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
 * Live sitemap prefers a CoinGecko markets batch (not all ~7k at once).
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

/** First sitemap batch — grow over time; do not dump all ~7k at once. */
const SITEMAP_COIN_BATCH = 500;

async function fetchSitemapCoinIds(): Promise<string[]> {
  if (isProductionBuild()) return [...FALLBACK_TOP_COIN_IDS];
  try {
    const ids: string[] = [];
    const seen = new Set<string>();
    const pages = Math.ceil(SITEMAP_COIN_BATCH / 250);
    for (let page = 1; page <= pages; page++) {
      const res = await coinGeckoFetch(
        `/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${page}&sparkline=false`,
        { next: { revalidate: 86_400 } },
      );
      if (!res.ok) break;
      const data: unknown = await res.json();
      if (!Array.isArray(data)) break;
      for (const row of data) {
        if (!row || typeof row !== "object") continue;
        const id = (row as { id?: unknown }).id;
        if (typeof id !== "string" || !id.trim()) continue;
        const slug = id.trim().toLowerCase();
        if (seen.has(slug)) continue;
        seen.add(slug);
        ids.push(slug);
        if (ids.length >= SITEMAP_COIN_BATCH) break;
      }
      if (ids.length >= SITEMAP_COIN_BATCH) break;
    }
    return ids.length > 0 ? ids : [...FALLBACK_TOP_COIN_IDS];
  } catch {
    return [...FALLBACK_TOP_COIN_IDS];
  }
}

/**
 * Native Next.js Metadata sitemap — homepage, trending, coin batch,
 * plus remaining static / category / narrative routes.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const coinIds = await fetchSitemapCoinIds();

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

  const justLaunched: MetadataRoute.Sitemap[number] = {
    url: `${SITE}/just-launched`,
    lastModified: now,
    changeFrequency: "hourly",
    priority: 0.8,
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

  let dexTokenEntries: MetadataRoute.Sitemap = [];
  try {
    const rows = await getDexScreenerLowCaps();
    dexTokenEntries = rows.flatMap((row) => {
      const path = dexTokenPath(row.chain, row.contractAddress);
      if (!path) return [];
      return [
        {
          url: `${SITE}${path}`,
          lastModified: now,
          changeFrequency: "hourly" as const,
          priority: 0.7,
        },
      ];
    });
  } catch {
    dexTokenEntries = [];
  }

  return [
    homepage,
    trending,
    justLaunched,
    ...coinEntries,
    ...staticEntries,
    ...categoryEntries,
    ...narrativeEntries,
    ...dexTokenEntries,
  ];
}
