/**
 * Hard-block CoinGecko `/coins/markets` before any network I/O.
 * Used by `coinGeckoFetch` and the global fetch patch in `instrumentation.ts`.
 */

const MARKETS_PATH_RE = /(?:^|\/)coins\/markets(?:\/|\?|#|$)/i;
const COINGECKO_HOST_RE = /(?:^|\.)(?:api|pro-api)\.coingecko\.com$/i;

export function urlStringFromFetchInput(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  if (typeof Request !== "undefined" && input instanceof Request) return input.url;
  try {
    return String(input);
  } catch {
    return "";
  }
}

/** True when the URL (absolute or path) targets CoinGecko `/coins/markets`. */
export function isCoinGeckoMarketsUrl(urlOrPath: string): boolean {
  const raw = urlOrPath.trim();
  if (!raw) return false;

  // Fast path for relative CoinGecko API paths.
  if (MARKETS_PATH_RE.test(raw)) {
    // If it is clearly another host, do not block (defensive).
    if (/^https?:\/\//i.test(raw)) {
      try {
        const u = new URL(raw);
        if (!COINGECKO_HOST_RE.test(u.hostname)) return false;
      } catch {
        return true;
      }
    }
    return true;
  }

  if (!/^https?:\/\//i.test(raw)) return false;
  try {
    const u = new URL(raw);
    if (!COINGECKO_HOST_RE.test(u.hostname)) return false;
    return MARKETS_PATH_RE.test(`${u.pathname}${u.search}${u.hash}`);
  } catch {
    return false;
  }
}

export function blockedCoinGeckoMarketsResponse(): Response {
  return new Response("[]", {
    status: 451,
    statusText: "CoinGecko /coins/markets disabled",
    headers: { "content-type": "application/json" },
  });
}

/** Log + return 451. Never throws. */
export function blockCoinGeckoMarkets(opts: {
  route: string;
  urlOrPath: string;
  via: "coinGeckoFetch" | "global-fetch";
}): Response {
  const clipped = opts.urlOrPath.slice(0, 180);
  console.error("[coingecko] BLOCKED /coins/markets", {
    route: opts.route,
    via: opts.via,
    url: clipped,
  });
  return blockedCoinGeckoMarketsResponse();
}
