import type { MetadataRoute } from "next";
import { PUBLIC_CATEGORIES } from "@/lib/coin-categories";
import { NARRATIVES } from "@/lib/narratives";
import { getDexScreenerLowCaps } from "@/lib/dexscreener-low-caps";
import { getJustLaunchedPairs } from "@/lib/dexscreener-just-launched";
import { dexTokenPath } from "@/lib/dex-token-path";
import { isJustLaunchedAge } from "@/lib/pair-age-split";

const SITE = "https://altcoindepot.com";

/** Core static routes — not a 7k coin dump. */
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
  "/just-launched",
  "/market-overview",
  "/compare",
  "/sectors",
  "/watchlist",
  "/portfolio",
  "/alerts",
  "/ecosystem",
] as const;

/**
 * Seed majors only — full universe is on-demand ISR, not sitemap-at-deploy.
 * Live Dex inventory (low caps + just launched) fills token URLs as rendered.
 */
const SEED_COIN_IDS = [
  "bitcoin",
  "ethereum",
  "tether",
  "ripple",
  "binancecoin",
  "solana",
  "usd-coin",
  "dogecoin",
  "tron",
  "cardano",
  "chainlink",
  "sui",
  "avalanche-2",
  "litecoin",
  "toncoin",
  "polkadot",
  "uniswap",
  "aave",
  "near",
  "filecoin",
  "aptos",
  "arbitrum",
  "cosmos",
  "injective-protocol",
  "optimism",
  "stellar",
  "bitcoin-cash",
  "hedera-hashgraph",
  "shiba-inu",
  "pepe",
] as const;

function tokenSitemapEntries(
  rows: { chain: string; contractAddress?: string; address?: string }[],
  now: Date,
): MetadataRoute.Sitemap {
  const seen = new Set<string>();
  const out: MetadataRoute.Sitemap = [];
  for (const row of rows) {
    const address = row.contractAddress ?? row.address;
    const path = dexTokenPath(row.chain, address);
    if (!path || seen.has(path)) continue;
    seen.add(path);
    out.push({
      url: `${SITE}${path}`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.7,
    });
  }
  return out;
}

/**
 * Sitemap = static desks + seed majors + live Dex inventory.
 * Does not dump ~7k Gecko pages at build.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const homepage: MetadataRoute.Sitemap[number] = {
    url: SITE,
    lastModified: now,
    changeFrequency: "daily",
    priority: 1,
  };

  const coinEntries: MetadataRoute.Sitemap = SEED_COIN_IDS.map((coinId) => ({
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
    const [lowCaps, justLaunched] = await Promise.all([
      getDexScreenerLowCaps().catch(() => []),
      getJustLaunchedPairs().catch(() => []),
    ]);
    const jl = justLaunched
      .filter((r) => isJustLaunchedAge(r.pairCreatedAt) && r.chain && r.contractAddress)
      .map((r) => ({
        chain: r.chain as string,
        contractAddress: r.contractAddress as string,
      }));
    const lc = lowCaps.flatMap((r) =>
      r.chain && r.contractAddress
        ? [{ chain: r.chain, contractAddress: r.contractAddress }]
        : [],
    );
    dexTokenEntries = tokenSitemapEntries([...lc, ...jl], now);
  } catch {
    dexTokenEntries = [];
  }

  return [
    homepage,
    ...coinEntries,
    ...staticEntries,
    ...categoryEntries,
    ...narrativeEntries,
    ...dexTokenEntries,
  ];
}
