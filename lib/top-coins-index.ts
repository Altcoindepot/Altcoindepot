/**
 * ~7,000-coin searchable universe from CoinGecko markets + platforms.
 * Cached 12h — built once per revalidation window, not per visitor.
 * Does NOT drive live prices (Dex overlays those separately).
 */

import { unstable_cache } from "next/cache";
import { coinGeckoFetch } from "@/lib/coingecko";
import { parseGeckoPlatforms, type CoinPlatformContract } from "@/lib/gecko-platform-map";
import {
  searchTopCoinsIndex,
  pickBestTopCoinMatch,
  type TopCoinSearchEntry,
} from "@/lib/top-coins-search-utils";

export type { TopCoinSearchEntry, CoinPlatformContract };
export { searchTopCoinsIndex, pickBestTopCoinMatch };

export const TOP_COINS_SEARCH_LIMIT = 7000;
export const TOP_200_SEARCH_LIMIT = 200;
export const UNIVERSE_INDEX_REVALIDATE_SECONDS = 12 * 60 * 60;

const PER_PAGE = 250;
const PAGE_COUNT = Math.ceil(TOP_COINS_SEARCH_LIMIT / PER_PAGE);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type MarketsRow = {
  id?: string;
  name?: string;
  symbol?: string;
  image?: string;
  market_cap_rank?: number | null;
};

type ListRow = {
  id?: string;
  platforms?: Record<string, string | null | undefined>;
};

async function fetchTopMarketsPage(page: number): Promise<TopCoinSearchEntry[]> {
  const path = `/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${PER_PAGE}&page=${page}&sparkline=false`;
  let res: Response;
  try {
    res = await coinGeckoFetch(path);
  } catch {
    return [];
  }
  if (!res.ok) return [];
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  const out: TopCoinSearchEntry[] = [];
  for (const row of data as MarketsRow[]) {
    if (!row.id || !row.name || !row.symbol) continue;
    out.push({
      id: row.id,
      name: row.name,
      symbol: row.symbol,
      image: row.image ?? "",
      rank:
        typeof row.market_cap_rank === "number" && !Number.isNaN(row.market_cap_rank)
          ? row.market_cap_rank
          : (page - 1) * PER_PAGE + out.length + 1,
      current_price: null,
      price_change_percentage_24h: null,
      platforms: [],
    });
  }
  return out;
}

async function fetchPlatformsById(): Promise<Map<string, CoinPlatformContract[]>> {
  const map = new Map<string, CoinPlatformContract[]>();
  let res: Response;
  try {
    res = await coinGeckoFetch("/coins/list?include_platform=true", {
      next: { revalidate: UNIVERSE_INDEX_REVALIDATE_SECONDS },
    });
  } catch {
    return map;
  }
  if (!res.ok) return map;
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return map;
  }
  if (!Array.isArray(data)) return map;
  for (const row of data as ListRow[]) {
    if (!row.id) continue;
    const platforms = parseGeckoPlatforms(row.platforms);
    if (platforms.length > 0) map.set(row.id, platforms);
  }
  return map;
}

async function buildTopCoinsSearchIndex(): Promise<TopCoinSearchEntry[]> {
  const all: TopCoinSearchEntry[] = [];
  for (let page = 1; page <= PAGE_COUNT; page++) {
    const rows = await fetchTopMarketsPage(page);
    if (rows.length === 0) break;
    all.push(...rows);
    if (all.length >= TOP_COINS_SEARCH_LIMIT) break;
    await sleep(150);
  }

  const sliced = all.slice(0, TOP_COINS_SEARCH_LIMIT);
  const platformsById = await fetchPlatformsById();
  for (const entry of sliced) {
    entry.platforms = platformsById.get(entry.id) ?? [];
  }

  console.info("[coin-universe] built index", {
    count: sliced.length,
    withPlatforms: sliced.filter((e) => (e.platforms?.length ?? 0) > 0).length,
  });
  return sliced;
}

export const getTopCoinsSearchIndex = unstable_cache(
  buildTopCoinsSearchIndex,
  ["top-coins-search-index-v3-7k"],
  { revalidate: UNIVERSE_INDEX_REVALIDATE_SECONDS },
);

async function buildTop200SearchIndex(): Promise<TopCoinSearchEntry[]> {
  const rows = await fetchTopMarketsPage(1);
  const platformsById = await fetchPlatformsById();
  return rows.slice(0, TOP_200_SEARCH_LIMIT).map((entry) => ({
    ...entry,
    platforms: platformsById.get(entry.id) ?? [],
  }));
}

export const getTop200CoinsSearchIndex = unstable_cache(
  buildTop200SearchIndex,
  ["top-200-search-index-v3"],
  { revalidate: 3600 },
);

export async function getIndexedCoinById(id: string): Promise<TopCoinSearchEntry | null> {
  const safe = id.trim().toLowerCase();
  if (!safe) return null;
  const index = await getTopCoinsSearchIndex();
  return index.find((e) => e.id === safe) ?? null;
}
