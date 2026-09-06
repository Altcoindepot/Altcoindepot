import { unstable_cache } from "next/cache";

/** CoinGecko id → 24h price change %. */
export type WikiChange24hMap = Record<string, number | null>;

/** CoinGecko id → live logo URL from markets payload. */
export type WikiLogoMap = Record<string, string>;

export type WikiMarketMeta = {
  change24h: WikiChange24hMap;
  logos: WikiLogoMap;
};

/**
 * DISABLED — previously `/coins/markets?ids=` for wiki 24h % + logos.
 * Never call CoinGecko markets. Logos stay static from ecosystem-wiki.
 */
async function loadWikiMarketMeta(): Promise<WikiMarketMeta> {
  console.error("[coingecko] BLOCKED /coins/markets", {
    route: "loadWikiMarketMeta",
    via: "hard-return",
  });
  return { change24h: {}, logos: {} };
}

export const getWikiMarketMeta = unstable_cache(loadWikiMarketMeta, ["wiki-market-meta-v2-nomarkets"], {
  revalidate: 3600,
});

/** @deprecated Prefer getWikiMarketMeta — kept for call-site clarity. */
export async function getWikiChange24h(): Promise<WikiChange24hMap> {
  const meta = await getWikiMarketMeta();
  return meta.change24h;
}
