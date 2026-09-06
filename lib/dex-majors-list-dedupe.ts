/**
 * Dex list hygiene for Tokens / Pairs / Scanner — no CoinGecko.
 *
 * Every list: one row per base ticker (case-insensitive). PEPE ≠ PEPE2.
 * Winner: highest volume24h → higher liquidity → USDT then USDC quote.
 * Stable bases (USDT/USDC as the token): hidden unless includeStableBases.
 */

export const DEX_LIST_MAJOR_TICKERS = new Set([
  "BTC",
  "ETH",
  "SOL",
  "BNB",
  "XRP",
  "DOGE",
  "ADA",
  "AVAX",
  "SUI",
  "LINK",
  "INJ",
  "TON",
  "TRX",
  "DOT",
  "LTC",
  "USDT",
  "USDC",
  // Existing wrapped / L2 majors map
  "WBTC",
  "WETH",
  "WSOL",
  "WBNB",
  "WAVAX",
  "MATIC",
  "WMATIC",
  "POL",
  "ARB",
  "OP",
  "HYPE",
  "UNI",
  "AAVE",
]);

export const DEX_LIST_STABLE_BASES = new Set(["USDT", "USDC"]);

export function isDexListMajorTicker(symbol: string): boolean {
  const s = symbol.trim().toUpperCase();
  if (!s) return false;
  if (DEX_LIST_MAJOR_TICKERS.has(s)) return true;
  if (s.startsWith("W") && DEX_LIST_MAJOR_TICKERS.has(s.slice(1))) return true;
  return false;
}

export function isDexListStableBase(symbol: string): boolean {
  return DEX_LIST_STABLE_BASES.has(symbol.trim().toUpperCase());
}

/** Lower is better: USDT → USDC → anything else. */
export function majorQuoteRank(quote: string | null | undefined): number {
  const q = (quote ?? "").trim().toUpperCase();
  if (q === "USDT") return 0;
  if (q === "USDC") return 1;
  return 2;
}

function rowLiquidity(row: {
  liquidityUsd?: number | null;
  liquidity?: number | null;
}): number {
  return row.liquidityUsd ?? row.liquidity ?? 0;
}

/**
 * < 0 when `a` should win over `b`.
 * Volume → liquidity → USDT/USDC quote.
 */
export function compareTickerListPreference(
  a: {
    quoteSymbol?: string | null;
    volume24h?: number | null;
    liquidityUsd?: number | null;
    liquidity?: number | null;
  },
  b: {
    quoteSymbol?: string | null;
    volume24h?: number | null;
    liquidityUsd?: number | null;
    liquidity?: number | null;
  },
): number {
  const volA = a.volume24h ?? 0;
  const volB = b.volume24h ?? 0;
  if (volA !== volB) return volB - volA;
  const liqA = rowLiquidity(a);
  const liqB = rowLiquidity(b);
  if (liqA !== liqB) return liqB - liqA;
  return majorQuoteRank(a.quoteSymbol) - majorQuoteRank(b.quoteSymbol);
}

/** @deprecated Use compareTickerListPreference — same ranking. */
export function compareMajorListPreference(
  a: {
    quoteSymbol?: string | null;
    volume24h?: number | null;
    liquidityUsd?: number | null;
    liquidity?: number | null;
  },
  b: {
    quoteSymbol?: string | null;
    volume24h?: number | null;
    liquidityUsd?: number | null;
    liquidity?: number | null;
  },
): number {
  return compareTickerListPreference(a, b);
}

export type FinalizeDexListOpts = {
  includeStableBases?: boolean;
  /** When false, only hide stables — keep duplicate tickers (for multi-chain caches). Default true. */
  dedupeTickers?: boolean;
  /** When false, leave winner order as insertion order. Default true. */
  sortByVolume?: boolean;
};

/**
 * Optionally collapse to one row per ticker; optionally drop USDT/USDC bases.
 * Call after chain/DEX filters so per-chain views keep their own best PEPE/SOL.
 */
export function finalizeDexListRows<
  T extends {
    symbol: string;
    quoteSymbol?: string | null;
    volume24h?: number | null;
    liquidityUsd?: number | null;
    liquidity?: number | null;
  },
>(rows: T[], opts?: FinalizeDexListOpts): T[] {
  const includeStableBases = Boolean(opts?.includeStableBases);
  const dedupeTickers = opts?.dedupeTickers !== false;
  const sortByVolume = opts?.sortByVolume !== false;

  if (!dedupeTickers) {
    const out: T[] = [];
    for (const row of rows) {
      const sym = row.symbol.trim().toUpperCase();
      if (!sym) continue;
      if (!includeStableBases && isDexListStableBase(sym)) continue;
      out.push(sym === row.symbol ? row : { ...row, symbol: sym });
    }
    if (sortByVolume) {
      out.sort((a, b) => (b.volume24h ?? 0) - (a.volume24h ?? 0));
    }
    return out;
  }

  const byTicker = new Map<string, T>();
  for (const row of rows) {
    const sym = row.symbol.trim().toUpperCase();
    if (!sym) continue;
    if (!includeStableBases && isDexListStableBase(sym)) continue;

    const prev = byTicker.get(sym);
    if (!prev || compareTickerListPreference(row, prev) < 0) {
      byTicker.set(sym, sym === row.symbol ? row : { ...row, symbol: sym });
    }
  }

  const out = [...byTicker.values()];
  if (sortByVolume) {
    out.sort((a, b) => (b.volume24h ?? 0) - (a.volume24h ?? 0));
  }
  return out;
}

/** True when a search/filter string is asking for stables. */
export function wantsDexStableBases(query: string | null | undefined): boolean {
  const s = (query ?? "").trim().toLowerCase();
  if (!s) return false;
  return /\b(usdt|usdc|stable|stables|stablecoin|stablecoins)\b/i.test(s);
}
