/**
 * Server boot hook — patch global fetch so `/coins/markets` never reaches CoinGecko,
 * including Next Data Cache revalidation of stale fetch URLs from older deploys.
 */
import {
  blockCoinGeckoMarkets,
  isCoinGeckoMarketsUrl,
  urlStringFromFetchInput,
} from "@/lib/coingecko-markets-block";

export async function register() {
  const runtime = process.env.NEXT_RUNTIME;
  if (runtime !== "nodejs" && runtime !== "edge") return;

  const g = globalThis as typeof globalThis & {
    __altcoindepotMarketsFetchPatched?: boolean;
  };
  if (g.__altcoindepotMarketsFetchPatched) return;
  g.__altcoindepotMarketsFetchPatched = true;

  const originalFetch = globalThis.fetch.bind(globalThis);

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = urlStringFromFetchInput(input);
    if (isCoinGeckoMarketsUrl(url)) {
      return blockCoinGeckoMarkets({
        route: "global-fetch",
        urlOrPath: url,
        via: "global-fetch",
      });
    }
    return originalFetch(input, init);
  };

  console.info("[coingecko] markets fetch guard armed", { runtime });
}
