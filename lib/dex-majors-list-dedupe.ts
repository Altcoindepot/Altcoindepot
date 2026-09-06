/**
 * Dex list hygiene for Tokens / Pairs / Scanner — no CoinGecko.
 *
 * Majors: one row per ticker (USDT quote → USDC → highest volume24h).
 * Non-majors: unchanged (do not merge by ticker).
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

/** < 0 when `a` should win over `b`. */
export function compareMajorListPreference(
  a: { quoteSymbol?: string | null; volume24h?: number | null },
  b: { quoteSymbol?: string | null; volume24h?: number | null },
): number {
  const qa = majorQuoteRank(a.quoteSymbol);
  const qb = majorQuoteRank(b.quoteSymbol);
  if (qa !== qb) return qa - qb;
  return (b.volume24h ?? 0) - (a.volume24h ?? 0);
}

/**
 * Collapse major tickers to a single best pair; leave non-majors as-is.
 * Optionally drop USDT/USDC base rows.
 */
export function finalizeDexListRows<
  T extends { symbol: string; quoteSymbol?: string | null; volume24h?: number | null },
>(rows: T[], opts?: { includeStableBases?: boolean }): T[] {
  const includeStableBases = Boolean(opts?.includeStableBases);
  const majorsByTicker = new Map<string, T>();
  const nonMajors: T[] = [];

  for (const row of rows) {
    const sym = row.symbol.trim().toUpperCase();
    if (!sym) continue;
    if (!includeStableBases && isDexListStableBase(sym)) continue;

    if (isDexListMajorTicker(sym)) {
      const prev = majorsByTicker.get(sym);
      if (!prev || compareMajorListPreference(row, prev) < 0) {
        majorsByTicker.set(sym, { ...row, symbol: sym });
      }
      continue;
    }

    nonMajors.push(row);
  }

  return [...majorsByTicker.values(), ...nonMajors].sort(
    (a, b) => (b.volume24h ?? 0) - (a.volume24h ?? 0),
  );
}

/** True when a search/filter string is asking for stables. */
export function wantsDexStableBases(query: string | null | undefined): boolean {
  const s = (query ?? "").trim().toLowerCase();
  if (!s) return false;
  return /\b(usdt|usdc|stable|stables|stablecoin|stablecoins)\b/i.test(s);
}
