import { unstable_cache } from "next/cache";
import { isProductionBuild } from "@/lib/build-phase";
import { coinGeckoFetch } from "@/lib/coingecko";
import { ecosystemWikiData } from "@/lib/ecosystem-wiki";

/** CoinGecko id → 24h price change %. */
export type WikiChange24hMap = Record<string, number | null>;

/** CoinGecko id → live logo URL from markets payload. */
export type WikiLogoMap = Record<string, string>;

export type WikiMarketMeta = {
  change24h: WikiChange24hMap;
  logos: WikiLogoMap;
};

async function loadWikiMarketMeta(): Promise<WikiMarketMeta> {
  if (isProductionBuild()) return { change24h: {}, logos: {} };
  const ids = Object.keys(ecosystemWikiData);
  if (ids.length === 0) return { change24h: {}, logos: {} };

  try {
    const res = await coinGeckoFetch(
      `/coins/markets?vs_currency=usd&ids=${encodeURIComponent(ids.join(","))}&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h`,
    );
    if (!res.ok) return { change24h: {}, logos: {} };
    const data: unknown = await res.json();
    if (!Array.isArray(data)) return { change24h: {}, logos: {} };

    const change24h: WikiChange24hMap = {};
    const logos: WikiLogoMap = {};
    for (const row of data) {
      if (!row || typeof row !== "object") continue;
      const id = (row as { id?: unknown }).id;
      if (typeof id !== "string" || !id) continue;
      const ch = (row as { price_change_percentage_24h?: unknown }).price_change_percentage_24h;
      change24h[id] = typeof ch === "number" && Number.isFinite(ch) ? ch : null;
      const image = (row as { image?: unknown }).image;
      if (typeof image === "string" && /^https?:\/\//i.test(image)) {
        logos[id] = image;
      }
    }
    return { change24h, logos };
  } catch {
    return { change24h: {}, logos: {} };
  }
}

export const getWikiMarketMeta = unstable_cache(loadWikiMarketMeta, ["wiki-market-meta-v1"], {
  revalidate: 3600,
});

/** @deprecated Prefer getWikiMarketMeta — kept for call-site clarity. */
export async function getWikiChange24h(): Promise<WikiChange24hMap> {
  const meta = await getWikiMarketMeta();
  return meta.change24h;
}
