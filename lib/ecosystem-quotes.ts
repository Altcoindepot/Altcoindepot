import { unstable_cache } from "next/cache";
import { isProductionBuild } from "@/lib/build-phase";
import { coinGeckoFetch } from "@/lib/coingecko";
import { ecosystemWikiData } from "@/lib/ecosystem-wiki";

/** CoinGecko id → 24h price change %. */
export type WikiChange24hMap = Record<string, number | null>;

async function loadWikiChange24h(): Promise<WikiChange24hMap> {
  if (isProductionBuild()) return {};
  const ids = Object.keys(ecosystemWikiData);
  if (ids.length === 0) return {};

  try {
    const res = await coinGeckoFetch(
      `/coins/markets?vs_currency=usd&ids=${encodeURIComponent(ids.join(","))}&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h`,
    );
    if (!res.ok) return {};
    const data: unknown = await res.json();
    if (!Array.isArray(data)) return {};

    const out: WikiChange24hMap = {};
    for (const row of data) {
      if (!row || typeof row !== "object") continue;
      const id = (row as { id?: unknown }).id;
      const ch = (row as { price_change_percentage_24h?: unknown }).price_change_percentage_24h;
      if (typeof id !== "string" || !id) continue;
      out[id] = typeof ch === "number" && Number.isFinite(ch) ? ch : null;
    }
    return out;
  } catch {
    return {};
  }
}

export const getWikiChange24h = unstable_cache(loadWikiChange24h, ["wiki-change-24h-v1"], {
  revalidate: 3600,
});
