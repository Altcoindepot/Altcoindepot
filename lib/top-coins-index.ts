import { unstable_cache } from "next/cache";
import { coinGeckoHeaders } from "@/lib/coingecko";

export type TopCoinSearchEntry = {
  id: string;
  name: string;
  symbol: string;
  image: string;
  rank: number;
};

export const TOP_COINS_SEARCH_LIMIT = 3000;

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

async function fetchTopMarketsPage(page: number): Promise<TopCoinSearchEntry[]> {
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${PER_PAGE}&page=${page}&sparkline=false&price_change_percentage=24h`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: coinGeckoHeaders(),
    });
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
  ["top-coins-search-index-v1"],
  { revalidate: 3600 },
);

function rankBonus(rank: number): number {
  return Math.max(0, 400 - rank * 0.05);
}

function scoreEntry(entry: TopCoinSearchEntry, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return -1;

  const id = entry.id.toLowerCase();
  const sym = entry.symbol.toLowerCase();
  const name = entry.name.toLowerCase();

  if (id === q) return 1000 + rankBonus(entry.rank);
  if (sym === q) return 900 + rankBonus(entry.rank);
  if (name === q) return 850 + rankBonus(entry.rank);
  if (sym.startsWith(q)) return 700 + rankBonus(entry.rank);
  if (name.startsWith(q)) return 650 + rankBonus(entry.rank);
  if (id.startsWith(q)) return 600 + rankBonus(entry.rank);
  if (name.includes(q)) return 400 + rankBonus(entry.rank);
  if (sym.includes(q)) return 350 + rankBonus(entry.rank);
  if (id.includes(q)) return 300 + rankBonus(entry.rank);
  return -1;
}

export function searchTopCoinsIndex(
  entries: TopCoinSearchEntry[],
  query: string,
  limit = 12,
): TopCoinSearchEntry[] {
  const q = query.trim();
  if (!q) return [];

  const scored = entries
    .map((entry) => ({ entry, score: scoreEntry(entry, q) }))
    .filter((row) => row.score >= 0)
    .sort((a, b) => b.score - a.score || a.entry.rank - b.entry.rank);

  const seen = new Set<string>();
  const results: TopCoinSearchEntry[] = [];
  for (const { entry } of scored) {
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);
    results.push(entry);
    if (results.length >= limit) break;
  }
  return results;
}

/** Best single match for redirect-style search (exact symbol/id/name preferred). */
export function pickBestTopCoinMatch(
  entries: TopCoinSearchEntry[],
  query: string,
): TopCoinSearchEntry | null {
  const hits = searchTopCoinsIndex(entries, query, 20);
  if (hits.length === 0) return null;

  const q = query.trim().toLowerCase();
  const exact = hits.find(
    (h) =>
      h.id.toLowerCase() === q ||
      h.symbol.toLowerCase() === q ||
      h.name.toLowerCase() === q,
  );
  if (exact) return exact;
  if (hits.length === 1) return hits[0]!;
  return null;
}
