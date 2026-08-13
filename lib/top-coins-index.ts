import { unstable_cache } from "next/cache";
import { coinGeckoFetch } from "@/lib/coingecko";
import {
  searchTopCoinsIndex,
  pickBestTopCoinMatch,
  type TopCoinSearchEntry,
} from "@/lib/top-coins-search-utils";

export type { TopCoinSearchEntry };
export { searchTopCoinsIndex, pickBestTopCoinMatch };

export const TOP_COINS_SEARCH_LIMIT = 3000;
export const TOP_200_SEARCH_LIMIT = 200;

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
  current_price?: number | null;
  price_change_percentage_24h?: number | null;
  price_change_percentage_7d_in_currency?: number | null;
  market_cap?: number | null;
  total_volume?: number | null;
};

async function fetchTopMarketsPage(page: number): Promise<TopCoinSearchEntry[]> {
  const path = `/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${PER_PAGE}&page=${page}&sparkline=false&price_change_percentage=24h%2C7d`;
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
      current_price:
        typeof row.current_price === "number" && Number.isFinite(row.current_price)
          ? row.current_price
          : null,
      price_change_percentage_24h:
        typeof row.price_change_percentage_24h === "number" &&
        Number.isFinite(row.price_change_percentage_24h)
          ? row.price_change_percentage_24h
          : null,
      price_change_percentage_7d:
        typeof row.price_change_percentage_7d_in_currency === "number" &&
        Number.isFinite(row.price_change_percentage_7d_in_currency)
          ? row.price_change_percentage_7d_in_currency
          : null,
      market_cap:
        typeof row.market_cap === "number" && Number.isFinite(row.market_cap)
          ? row.market_cap
          : null,
      total_volume:
        typeof row.total_volume === "number" && Number.isFinite(row.total_volume)
          ? row.total_volume
          : null,
    });
  }
  return out;
}

async function buildTopCoinsSearchIndex(): Promise<TopCoinSearchEntry[]> {
  const all: TopCoinSearchEntry[] = [];
  for (let page = 1; page <= PAGE_COUNT; page++) {
    const rows = await fetchTopMarketsPage(page);
    if (rows.length === 0) break;
    all.push(...rows);
    if (all.length >= TOP_COINS_SEARCH_LIMIT) break;
    await sleep(120);
  }
  return all.slice(0, TOP_COINS_SEARCH_LIMIT);
}

export const getTopCoinsSearchIndex = unstable_cache(
  buildTopCoinsSearchIndex,
  ["top-coins-search-index-v2"],
  { revalidate: 14400 },
);

async function buildTop200SearchIndex(): Promise<TopCoinSearchEntry[]> {
  const rows = await fetchTopMarketsPage(1);
  return rows.slice(0, TOP_200_SEARCH_LIMIT);
}

export const getTop200CoinsSearchIndex = unstable_cache(
  buildTop200SearchIndex,
  ["top-200-search-index-v2"],
  { revalidate: 3600 },
);

