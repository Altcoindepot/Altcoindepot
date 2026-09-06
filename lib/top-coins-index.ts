/**
 * Search universe index — **no CoinGecko /coins/markets fan-out**.
 * Built from Coinbase+Binance majors catalog (identity) + optional preferred contracts.
 * Live prices come from Dex overlays in universe-search — never Gecko.
 *
 * Previously rebuilt ~7k markets pages + /coins/list per revalidation (Demo quota burn).
 */

import { unstable_cache } from "next/cache";
import { getMajorsCatalog } from "@/lib/majors-catalog";
import {
  searchTopCoinsIndex,
  pickBestTopCoinMatch,
  type TopCoinSearchEntry,
} from "@/lib/top-coins-search-utils";
import type { CoinPlatformContract } from "@/lib/gecko-platform-map";

export type { TopCoinSearchEntry, CoinPlatformContract };
export { searchTopCoinsIndex, pickBestTopCoinMatch };

export const TOP_COINS_SEARCH_LIMIT = 7000;
export const TOP_200_SEARCH_LIMIT = 200;
/** Long TTL — index is majors-only and does not call CoinGecko. */
export const UNIVERSE_INDEX_REVALIDATE_SECONDS = 12 * 60 * 60;

async function buildMajorsOnlyIndex(): Promise<TopCoinSearchEntry[]> {
  const catalog = await getMajorsCatalog();
  const out: TopCoinSearchEntry[] = [];
  let rank = 1;
  for (const m of catalog) {
    const platforms: CoinPlatformContract[] = [];
    if (m.preferred?.chain && m.preferred?.address) {
      platforms.push({
        chain: m.preferred.chain,
        address: m.preferred.address,
        geckoPlatform: m.preferred.chain,
      });
    }
    out.push({
      id: m.geckoId || m.symbol.toLowerCase(),
      name: m.name,
      symbol: m.symbol.toLowerCase(),
      image: "",
      rank: rank++,
      current_price: null,
      price_change_percentage_24h: null,
      platforms,
    });
    if (out.length >= TOP_COINS_SEARCH_LIMIT) break;
  }
  console.info("[coin-universe] majors-only index (0 CoinGecko markets calls)", {
    count: out.length,
  });
  return out;
}

export const getTopCoinsSearchIndex = unstable_cache(
  buildMajorsOnlyIndex,
  ["top-coins-search-index-v4-majors-only"],
  { revalidate: UNIVERSE_INDEX_REVALIDATE_SECONDS },
);

export const getTop200CoinsSearchIndex = unstable_cache(
  async () => {
    const all = await buildMajorsOnlyIndex();
    return all.slice(0, TOP_200_SEARCH_LIMIT);
  },
  ["top-200-search-index-v4-majors-only"],
  { revalidate: UNIVERSE_INDEX_REVALIDATE_SECONDS },
);

export async function getIndexedCoinById(id: string): Promise<TopCoinSearchEntry | null> {
  const safe = id.trim().toLowerCase();
  if (!safe) return null;
  const index = await getTopCoinsSearchIndex();
  return index.find((e) => e.id === safe) ?? null;
}
