import { cache } from "react";
import { unstable_cache } from "next/cache";
import { isProductionBuild } from "@/lib/build-phase";

/**
 * Single control point for all CoinGecko traffic.
 *
 * Env (server-only — never prefix with NEXT_PUBLIC_):
 * - COINGECKO_API_KEY — Demo or Pro API key from CoinGecko
 * - COINGECKO_API_PLAN — "demo" (default) or "pro"
 * - COINGECKO_LIVE — "true" to allow live calls locally; Production defaults on
 *   when the flag is unset and an API key is present
 *
 * `/coins/markets` is HARD-BLOCKED. Allowed: `/coins/{id}` and contract lookups only.
 */
export type CoinGeckoApiPlan = "demo" | "pro";

/**
 * Static `process.env.COINGECKO_*` reads so Next/Vercel keep these in the
 * serverless bundle. Dynamic `process.env[name]` can drop them at runtime.
 */
export function getCoinGeckoApiPlan(): CoinGeckoApiPlan {
  const plan = process.env.COINGECKO_API_PLAN?.trim().toLowerCase();
  return plan === "pro" ? "pro" : "demo";
}

export function getCoinGeckoApiBase(): string {
  return getCoinGeckoApiPlan() === "pro"
    ? "https://pro-api.coingecko.com/api/v3"
    : "https://api.coingecko.com/api/v3";
}

export function getCoinGeckoApiKey(): string {
  return process.env.COINGECKO_API_KEY?.trim() ?? "";
}

/**
 * Live CoinGecko is opt-in except on Vercel Production (unset flag + API key).
 * Local `next dev` never hits the API unless COINGECKO_LIVE=true.
 */
export function getCoinGeckoLiveSkipReason(): string | null {
  if (isProductionBuild()) return "build-phase";
  if (!getCoinGeckoApiKey()) return "missing-api-key";

  const flag = process.env.COINGECKO_LIVE?.trim().toLowerCase();
  if (flag === "false" || flag === "0" || flag === "no") return "COINGECKO_LIVE=false";
  if (flag === "true" || flag === "1" || flag === "yes") return null;

  if (process.env.NODE_ENV === "development") return "dev/mock mode";
  if (process.env.VERCEL_ENV === "production") return null;
  return "dev/mock mode";
}

export function shouldUseLiveCoinGecko(): boolean {
  return getCoinGeckoLiveSkipReason() === null;
}

let loggedCoinGeckoSkip = false;

export function logCoinGeckoSkip(reason: string) {
  if (loggedCoinGeckoSkip) return;
  loggedCoinGeckoSkip = true;
  console.info(`[dashboard] skipping CoinGecko (${reason})`);
}

/** Auth + Accept headers for every CoinGecko request. */
export function coinGeckoHeaders(): HeadersInit {
  const headers: Record<string, string> = { Accept: "application/json" };
  const key = getCoinGeckoApiKey();
  if (key) {
    if (getCoinGeckoApiPlan() === "pro") {
      headers["x-cg-pro-api-key"] = key;
    } else {
      headers["x-cg-demo-api-key"] = key;
    }
  }
  return headers;
}

/** Demo/Pro keys as query params — some runtimes drop the custom auth headers. */
function withCoinGeckoApiKey(url: string): string {
  const key = getCoinGeckoApiKey();
  if (!key) return url;
  const parsed = new URL(url);
  const param =
    getCoinGeckoApiPlan() === "pro" ? "x_cg_pro_api_key" : "x_cg_demo_api_key";
  if (!parsed.searchParams.get(param)) {
    parsed.searchParams.set(param, key);
  }
  return parsed.toString();
}

/** Default HTTP cache TTL — CoinGecko Demo/free-tier friendly (1 hour). */
export const COINGECKO_REVALIDATE_SECONDS = 3600;

/** Fetch a CoinGecko path with the shared base URL + API key. */
export async function coinGeckoFetch(
  path: string,
  init?: RequestInit & { next?: { revalidate?: number }; route?: string },
): Promise<Response> {
  const endpoint = (path.split("?")[0] ?? path).replace(/^https?:\/\/[^/]+\/api\/v3/i, "");
  const route = init?.route ?? "unknown";

  // HARD BLOCK — Demo quota leak. Never call /coins/markets from runtime.
  if (/\/coins\/markets\b/i.test(path) || /\/coins\/markets\b/i.test(endpoint)) {
    console.error("[coingecko] BLOCKED /coins/markets", { route, endpoint, path: path.slice(0, 120) });
    return new Response("[]", {
      status: 451,
      statusText: "CoinGecko /coins/markets disabled",
      headers: { "content-type": "application/json" },
    });
  }

  const skip = getCoinGeckoLiveSkipReason();
  if (skip) {
    logCoinGeckoSkip(skip);
    console.info("[coingecko]", {
      route,
      endpoint,
      cacheHit: false,
      status: `skipped:${skip}`,
    });
    return new Response("[]", {
      status: 503,
      statusText: `CoinGecko skipped (${skip})`,
      headers: { "content-type": "application/json" },
    });
  }

  const normalized = withCoinGeckoApiKey(
    path.startsWith("http")
      ? path
      : `${getCoinGeckoApiBase()}${path.startsWith("/") ? path : `/${path}`}`,
  );
  const { next: nextInit, cache, route: _route, ...rest } = init ?? {};
  const revalidate = nextInit?.revalidate ?? COINGECKO_REVALIDATE_SECONDS;
  const useForceCache = cache === "force-cache";

  const res = await fetch(normalized, {
    ...rest,
    // Never cache: "no-store" on Gecko — use revalidate TTL for encyclopedia only.
    next: { revalidate },
    headers: {
      ...coinGeckoHeaders(),
      ...(init?.headers as Record<string, string> | undefined),
    },
  });

  console.info("[coingecko]", {
    route,
    endpoint,
    cacheHit: false,
    status: res.status,
    forceCache: useForceCache,
  });

  return res;
}

/** Thrown when CoinGecko returns HTTP 429 (rate limited). */
export class CoinGeckoRateLimitError extends Error {
  readonly status = 429 as const;
  constructor(message = "CoinGecko rate limit (429)") {
    super(message);
    this.name = "CoinGeckoRateLimitError";
  }
}

export const MARKETS_PATH =
  "/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=24h%2C7d";

/** @deprecated Markets API disabled — do not use. */
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
  price_change_percentage_30d_in_currency?: number | null;
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

const EMPTY_MARKETS_BUNDLE: MarketsBundle = {
  topMarkets: [],
  ecosystemMarkets: [],
  categoryHomeColumns: [],
  stale: true,
};

/**
 * DISABLED — never calls CoinGecko `/coins/markets`.
 * Kept so old imports compile; always returns [].
 */
export async function loadMarkets(
  _init?: RequestInit & { next?: { revalidate?: number } },
): Promise<CoinMarket[]> {
  console.warn("[coingecko] loadMarkets blocked — use Dex lists");
  return [];
}

/** DISABLED — never calls `/coins/markets?category=`. */
export async function loadMarketsByGeckoCategory(
  _categoryId: string,
  _perPage: number,
  _init?: RequestInit & { next?: { revalidate?: number } },
  _opts?: { sparkline?: boolean },
): Promise<CoinMarket[]> {
  console.warn("[coingecko] loadMarketsByGeckoCategory blocked — use Dex lists");
  return [];
}

/** DISABLED — empty category markets (no Gecko). */
export async function getCachedCategoryPageMarkets(_categoryId: string): Promise<CoinMarket[]> {
  return [];
}

/** DISABLED — empty markets bundle (no Gecko). */
export async function loadMarketsBundle(
  _init?: RequestInit & { next?: { revalidate?: number } },
): Promise<MarketsBundle> {
  console.warn("[coingecko] loadMarketsBundle blocked — use Dex lists");
  return EMPTY_MARKETS_BUNDLE;
}

export const getMarketsBundle = cache(async (): Promise<MarketsBundle> => {
  return EMPTY_MARKETS_BUNDLE;
});

/** CoinGecko `/coins/{id}` — trimmed to fields we render */
export type CoinGeckoDetail = {
  id: string;
  name: string;
  symbol: string;
  web_slug?: string;
  image?: { large?: string; small?: string };
  description?: { en?: string };
  categories?: string[];
  /** platform id → contract address */
  platforms?: Record<string, string | null | undefined>;
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
  // One wave only — no 429 retry storm (Demo quota).
  for (const lite of [false, true] as const) {
    const q = lite ? coinDetailParamsLite : coinDetailParams;
    let res: Response;
    try {
      res = await coinGeckoFetch(`/coins/${encodeURIComponent(safe)}?${q}`, {
        cache: "force-cache",
        next: { revalidate: 7200 },
        route: "/coin/[id]",
      });
    } catch {
      continue;
    }

    if (res.status === 404) {
      return { status: "not_found" };
    }

    if (res.status === 429) {
      console.warn("[coingecko] coin detail 429 — no retry", { id: safe });
      return { status: "unavailable" };
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

  return { status: "unavailable" };
}

const getCachedCoinDetailLookup = unstable_cache(
  async (safe: string) => fetchCoinDetailWithRetries(safe),
  ["coingecko-coin-detail-v2"],
  { revalidate: 7200 },
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
