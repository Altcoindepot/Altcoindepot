import { cache } from "react";
import { unstable_cache } from "next/cache";
import { PUBLIC_CATEGORIES } from "@/lib/coin-categories";

/**
 * Single control point for all CoinGecko traffic.
 *
 * Env (server-only — never prefix with NEXT_PUBLIC_):
 * - COINGECKO_API_KEY — Demo or Pro API key from CoinGecko
 * - COINGECKO_API_PLAN — "demo" (default) or "pro"
 */
export type CoinGeckoApiPlan = "demo" | "pro";

export function getCoinGeckoApiPlan(): CoinGeckoApiPlan {
  const plan = process.env.COINGECKO_API_PLAN?.trim().toLowerCase();
  return plan === "pro" ? "pro" : "demo";
}

export function getCoinGeckoApiBase(): string {
  return getCoinGeckoApiPlan() === "pro"
    ? "https://pro-api.coingecko.com/api/v3"
    : "https://api.coingecko.com/api/v3";
}

/** Auth + Accept headers for every CoinGecko request. */
export function coinGeckoHeaders(): HeadersInit {
  const headers: Record<string, string> = { Accept: "application/json" };
  const key = process.env.COINGECKO_API_KEY?.trim();
  if (key) {
    if (getCoinGeckoApiPlan() === "pro") {
      headers["x-cg-pro-api-key"] = key;
    } else {
      headers["x-cg-demo-api-key"] = key;
    }
  }
  return headers;
}

/** Fetch a CoinGecko path (e.g. `/coins/markets?...`) with the shared base URL + API key. */
export async function coinGeckoFetch(
  path: string,
  init?: RequestInit & { next?: { revalidate?: number } },
): Promise<Response> {
  const normalized = path.startsWith("http")
    ? path
    : `${getCoinGeckoApiBase()}${path.startsWith("/") ? path : `/${path}`}`;
  return fetch(normalized, {
    ...init,
    headers: {
      ...coinGeckoHeaders(),
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
}

export const MARKETS_PATH =
  "/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=24h%2C7d";

/** @deprecated Prefer {@link coinGeckoFetch} with {@link MARKETS_PATH}; kept for any external imports. */
export const MARKETS_URL = `https://api.coingecko.com/api/v3${MARKETS_PATH}`;

export type CoinMarket = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number | null;
  market_cap: number | null;
  total_volume: number | null;
  price_change_percentage_24h: number | null;
  price_change_percentage_7d_in_currency?: number | null;
  sparkline_in_7d?: { price?: number[] };
};

export type CategoryHomeColumn = {
  slug: string;
  title: string;
  description: string;
  accentClass: string;
  coins: CoinMarket[];
};

export type MarketsBundle = {
  topMarkets: CoinMarket[];
  ecosystemMarkets: CoinMarket[];
  categoryHomeColumns: CategoryHomeColumn[];
  stale: boolean;
};

let lastKnownMarketsBundle: MarketsBundle | null = null;

/** Always available for the homepage Featured strip (may sit outside top-100 / category spotlights). */
const FEATURED_EXTRA_GECKO_IDS = ["lighter", "injective-protocol"] as const;

async function loadMarketsByGeckoIds(
  ids: readonly string[],
  init?: RequestInit & { next?: { revalidate?: number } },
): Promise<CoinMarket[]> {
  if (ids.length === 0) return [];
  const path = `/coins/markets?vs_currency=usd&ids=${encodeURIComponent(
    ids.join(","),
  )}&order=market_cap_desc&per_page=250&page=1&sparkline=true&price_change_percentage=24h%2C7d`;
  const res = await coinGeckoFetch(path, init);
  if (!res.ok) {
    return [];
  }
  const data: unknown = await res.json();
  if (!Array.isArray(data)) {
    return [];
  }
  return data as CoinMarket[];
}

function mergeEcosystemWithFeaturedPins(
  topMarkets: CoinMarket[],
  baseEcosystem: CoinMarket[],
  pinned: CoinMarket[],
): CoinMarket[] {
  const topIds = new Set(topMarkets.map((c) => c.id));
  const byId = new Map<string, CoinMarket>();
  for (const c of baseEcosystem) {
    if (!topIds.has(c.id)) {
      byId.set(c.id, c);
    }
  }
  for (const c of pinned) {
    if (!topIds.has(c.id)) {
      byId.set(c.id, c);
    }
  }
  return Array.from(byId.values());
}

export async function loadMarkets(
  init?: RequestInit & { next?: { revalidate?: number } },
): Promise<CoinMarket[]> {
  const res = await coinGeckoFetch(MARKETS_PATH, init);
  if (!res.ok) {
    throw new Error(`CoinGecko error: ${res.status}`);
  }
  const data: unknown = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("Invalid CoinGecko response");
  }
  return data as CoinMarket[];
}

export async function loadMarketsByGeckoCategory(
  categoryId: string,
  perPage: number,
  init?: RequestInit & { next?: { revalidate?: number } },
): Promise<CoinMarket[]> {
  const path = `/coins/markets?vs_currency=usd&category=${encodeURIComponent(
    categoryId,
  )}&order=market_cap_desc&per_page=${perPage}&page=1&sparkline=true&price_change_percentage=24h%2C7d`;
  const res = await coinGeckoFetch(path, init);
  if (!res.ok) {
    throw new Error(`CoinGecko category ${categoryId}: ${res.status}`);
  }
  const data: unknown = await res.json();
  if (!Array.isArray(data)) {
    return [];
  }
  return data as CoinMarket[];
}

async function loadCategoryHomeColumns(
  init?: RequestInit & { next?: { revalidate?: number } },
): Promise<CategoryHomeColumn[]> {
  const results: CategoryHomeColumn[] = [];
  for (const def of PUBLIC_CATEGORIES) {
    const need = Math.min(250, def.spotlightLimit + 8);
    let rows: CoinMarket[] = [];
    // CoinGecko free-tier rate limits are strict; sequential fetch + backoff reduces empty categories.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        rows = await loadMarketsByGeckoCategory(def.coingeckoCategoryId, need, init);
        break;
      } catch {
        if (attempt < 2) {
          await sleep(350 + attempt * 500);
        }
      }
    }
    results.push({
      slug: def.slug,
      title: def.title,
      description: def.description,
      accentClass: def.accentClass,
      coins: rows.slice(0, def.spotlightLimit),
    });
    await sleep(150);
  }
  return results;
}

function buildEcosystemMarketsFromColumns(
  topMarkets: CoinMarket[],
  columns: CategoryHomeColumn[],
): CoinMarket[] {
  const topIds = new Set(topMarkets.map((c) => c.id));
  const byId = new Map<string, CoinMarket>();
  for (const col of columns) {
    for (const c of col.coins) {
      if (!topIds.has(c.id)) {
        byId.set(c.id, c);
      }
    }
  }
  return Array.from(byId.values());
}

export async function loadMarketsBundle(
  init?: RequestInit & { next?: { revalidate?: number } },
): Promise<MarketsBundle> {
  try {
    const [topMarkets, categoryHomeColumns, featuredExtra] = await Promise.all([
      loadMarkets(init),
      loadCategoryHomeColumns(init),
      loadMarketsByGeckoIds(FEATURED_EXTRA_GECKO_IDS, init),
    ]);
    const ecosystemMarkets = mergeEcosystemWithFeaturedPins(
      topMarkets,
      buildEcosystemMarketsFromColumns(topMarkets, categoryHomeColumns),
      featuredExtra,
    );
    const fresh = { topMarkets, ecosystemMarkets, categoryHomeColumns, stale: false };
    lastKnownMarketsBundle = fresh;
    return fresh;
  } catch (error) {
    if (lastKnownMarketsBundle) {
      return { ...lastKnownMarketsBundle, stale: true };
    }
    throw error;
  }
}

export const getMarketsBundle = cache(async (): Promise<MarketsBundle> => {
  return loadMarketsBundle({ next: { revalidate: 45 } });
});

/** CoinGecko `/coins/{id}` — trimmed to fields we render */
export type CoinGeckoDetail = {
  id: string;
  name: string;
  symbol: string;
  web_slug?: string;
  image?: { large?: string; small?: string };
  description?: { en?: string };
  market_cap_rank?: number | null;
  links?: {
    homepage?: string[];
    blockchain_site?: string[];
    announcement_url?: string[];
    official_forum_url?: string[];
    whitepaper?: string[];
    /** Official project X handle from CoinGecko (no @). */
    twitter_screen_name?: string;
  };
  tickers?: Array<{
    base?: string;
    target?: string;
    trade_url?: string | null;
    converted_volume?: Record<string, number>;
    market?: { identifier?: string; name?: string };
  }>;
  market_data?: {
    current_price?: Record<string, number>;
    market_cap?: Record<string, number>;
    fully_diluted_valuation?: Record<string, number>;
    total_volume?: Record<string, number>;
    high_24h?: Record<string, number>;
    low_24h?: Record<string, number>;
    ath?: Record<string, number>;
    atl?: Record<string, number>;
    ath_change_percentage?: Record<string, number>;
    atl_change_percentage?: Record<string, number>;
    price_change_percentage_24h?: number | null;
    price_change_percentage_7d?: number | null;
    price_change_percentage_7d_in_currency?: Record<string, number>;
    price_change_percentage_30d?: number | null;
    price_change_percentage_1y?: number | null;
    market_cap_change_24h?: number | null;
    market_cap_change_percentage_24h?: number | null;
    circulating_supply?: number | null;
    total_supply?: number | null;
    max_supply?: number | null;
  };
};

const coinDetailParams =
  "localization=false&tickers=true&market_data=true&community_data=false&developer_data=false&sparkline=false";
const coinDetailParamsLite =
  "localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Status codes where retrying may succeed (rate limits, overload, edge timeouts). */
function isTransientCoinGeckoFailure(status: number): boolean {
  return status === 408 || status === 429 || (status >= 500 && status <= 599);
}

async function fetchCoinDetailWithRetries(safe: string): Promise<CoinLookupResult> {
  const maxWaves = 4;

  for (let wave = 0; wave < maxWaves; wave++) {
    if (wave > 0) {
      await sleep(Math.min(250 + wave * 500, 3500));
    }

    for (const lite of [false, true] as const) {
      const q = lite ? coinDetailParamsLite : coinDetailParams;
      let res: Response;
      try {
        res = await coinGeckoFetch(`/coins/${encodeURIComponent(safe)}?${q}`, {
          next: { revalidate: 60 },
        });
      } catch {
        continue;
      }

      if (res.status === 404) {
        return { status: "not_found" };
      }

      if (res.ok) {
        try {
          const data: unknown = await res.json();
          if (typeof data !== "object" || data === null || !("id" in data)) {
            return { status: "not_found" };
          }
          return { status: "ok", coin: data as CoinGeckoDetail };
        } catch {
          continue;
        }
      }

      if (!isTransientCoinGeckoFailure(res.status)) {
        return { status: "unavailable" };
      }
    }
  }

  return { status: "unavailable" };
}

const getCachedCoinDetailLookup = unstable_cache(
  async (safe: string) => fetchCoinDetailWithRetries(safe),
  ["coingecko-coin-detail"],
  { revalidate: 120 },
);

/** Result of fetching `/coins/{id}` — never throws; use this when you must distinguish API failure from missing coin. */
export type CoinLookupResult =
  | { status: "ok"; coin: CoinGeckoDetail }
  | { status: "not_found" }
  | { status: "unavailable" };

export const lookupCoinById = cache(async (id: string): Promise<CoinLookupResult> => {
  const safe = id.trim().toLowerCase();
  if (!/^[a-z0-9_-]+$/i.test(safe)) {
    return { status: "not_found" };
  }
  return getCachedCoinDetailLookup(safe);
});

/** Coin detail or `null` if missing or unavailable — callers cannot tell which; prefer {@link lookupCoinById} when routing UX depends on it. */
export async function getCoinById(id: string): Promise<CoinGeckoDetail | null> {
  const r = await lookupCoinById(id);
  return r.status === "ok" ? r.coin : null;
}
