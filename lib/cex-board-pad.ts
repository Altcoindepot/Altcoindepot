/**
 * CEX pad pool for gainers/losers boards.
 * Binance USDT 24hr + Coinbase USD spot. Cached 1–2 min.
 * Used only to fill Dex boards to 10/10 — never replaces Dex prices on Dex rows.
 */

import { unstable_cache } from "next/cache";

export const CEX_PAD_REVALIDATE_SECONDS = 90;

const FETCH_HEADERS: HeadersInit = {
  Accept: "application/json",
  "User-Agent": "AltCoinDepot/1.0 (+https://altcoindepot.com)",
};

const BINANCE_BASES = [
  "https://data-api.binance.vision",
  "https://data.binance.com",
  "https://api.binance.com",
] as const;

const STABLES = new Set([
  "USDT",
  "USDC",
  "USD",
  "BUSD",
  "DAI",
  "FDUSD",
  "TUSD",
  "USDE",
  "USDP",
  "PYUSD",
  "EURC",
]);

/** Ethereum / L2 ecosystem majors commonly used to pad ETH board. */
export const ETH_ECOSYSTEM = new Set([
  "ETH",
  "LINK",
  "UNI",
  "AAVE",
  "MKR",
  "SHIB",
  "PEPE",
  "LDO",
  "ARB",
  "OP",
  "ENA",
  "ONDO",
  "GRT",
  "ENS",
  "CRV",
  "COMP",
  "SNX",
  "APE",
  "BLUR",
  "IMX",
  "MANA",
  "SAND",
  "AXS",
  "RENDER",
  "FET",
  "RNDR",
  "LRC",
  "DYDX",
  "1INCH",
  "ENS",
  "RPL",
  "SSV",
  "PENDLE",
  "EIGEN",
  "W",
  "STRK",
  "ZK",
  "MASK",
  "BAT",
  "ZRX",
  "YFI",
  "SUSHI",
]);

/** Solana ecosystem symbols for SOL board pad. */
export const SOL_ECOSYSTEM = new Set([
  "SOL",
  "BONK",
  "WIF",
  "JUP",
  "RAY",
  "PYTH",
  "JTO",
  "ORCA",
  "MEW",
  "POPCAT",
  "W",
  "RENDER",
  "RNDR",
  "HNT",
  "MOBILE",
  "IOT",
  "SAMO",
  "MSOL",
  "JITOSOL",
  "BSOL",
  "DRIFT",
  "TNSR",
  "IO",
  "CLOUD",
  "KMNO",
  "JITO",
]);

/** Base ecosystem / Coinbase Base-leaning names. */
export const BASE_ECOSYSTEM = new Set([
  "BASE",
  "AERO",
  "BRETT",
  "DEGEN",
  "TOSHI",
  "VIRTUAL",
  "PRIME",
  "HIGHER",
  "WELL",
  "EXTRA",
  "BSWAP",
  "TVL",
  "KEYCAT",
  "MOG",
  "MIGGLES",
  "BASED",
]);

export type CexPadRow = {
  id: string;
  base: string;
  name: string;
  priceUsd: number;
  change24hPct: number;
  volume24h: number | null;
  exchange: "binance" | "coinbase";
  /** Display pair e.g. ETH/USDT or BRETT-USD */
  pairLabel: string;
};

export type CexPadPool = {
  rows: CexPadRow[];
  fetchedAt: number;
};

function parseNum(value: unknown): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? n : null;
}

async function fetchJson(url: string, revalidate: number): Promise<unknown> {
  const res = await fetch(url, {
    headers: FETCH_HEADERS,
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function loadBinanceUsdt(): Promise<CexPadRow[]> {
  let lastError: Error | null = null;
  for (const host of BINANCE_BASES) {
    try {
      const raw = await fetchJson(`${host}/api/v3/ticker/24hr`, CEX_PAD_REVALIDATE_SECONDS);
      if (!Array.isArray(raw)) continue;
      const out: CexPadRow[] = [];
      for (const item of raw) {
        const symbol =
          typeof (item as { symbol?: unknown }).symbol === "string"
            ? (item as { symbol: string }).symbol.toUpperCase()
            : "";
        if (!symbol.endsWith("USDT")) continue;
        const base = symbol.slice(0, -4);
        if (!base || STABLES.has(base)) continue;
        const last = parseNum((item as { lastPrice?: unknown }).lastPrice);
        const change = parseNum((item as { priceChangePercent?: unknown }).priceChangePercent);
        const vol = parseNum((item as { quoteVolume?: unknown }).quoteVolume);
        if (last == null || last <= 0 || change == null) continue;
        out.push({
          id: `binance:${symbol}`,
          base,
          name: base,
          priceUsd: last,
          change24hPct: change,
          volume24h: vol,
          exchange: "binance",
          pairLabel: `${base}/USDT`,
        });
      }
      if (out.length > 0) return out;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }
  if (lastError) console.warn("[cex-pad] Binance failed", lastError.message);
  return [];
}

async function loadCoinbaseUsd(): Promise<CexPadRow[]> {
  try {
    const raw = await fetchJson(
      "https://api.coinbase.com/api/v3/brokerage/market/products",
      CEX_PAD_REVALIDATE_SECONDS,
    );
    const products = (raw as { products?: unknown[] })?.products;
    if (!Array.isArray(products)) return [];

    const out: CexPadRow[] = [];
    for (const p of products) {
      const productId =
        typeof (p as { product_id?: unknown }).product_id === "string"
          ? (p as { product_id: string }).product_id.toUpperCase()
          : "";
      if (!productId.includes("-")) continue;
      const [base, quote] = productId.split("-");
      if (!base || !quote) continue;
      if (quote !== "USD" && quote !== "USDT" && quote !== "USDC") continue;
      if (STABLES.has(base)) continue;
      const status =
        typeof (p as { status?: unknown }).status === "string"
          ? (p as { status: string }).status.toLowerCase()
          : "online";
      if (status && status !== "online") continue;
      if ((p as { trading_disabled?: unknown }).trading_disabled === true) continue;
      if ((p as { is_disabled?: unknown }).is_disabled === true) continue;

      const last = parseNum((p as { price?: unknown }).price);
      const change = parseNum(
        (p as { price_percentage_change_24h?: unknown }).price_percentage_change_24h,
      );
      if (last == null || last <= 0 || change == null) continue;

      const vol =
        parseNum((p as { approximate_quote_24h_volume?: unknown }).approximate_quote_24h_volume) ??
        (() => {
          const v = parseNum((p as { volume_24h?: unknown }).volume_24h);
          return v != null ? v * last : null;
        })();

      out.push({
        id: `coinbase:${productId}`,
        base,
        name: base,
        priceUsd: last,
        change24hPct: change,
        volume24h: vol,
        exchange: "coinbase",
        pairLabel: productId.replace("-", "/"),
      });
    }
    return out;
  } catch (err) {
    console.warn("[cex-pad] Coinbase failed", err instanceof Error ? err.message : err);
    return [];
  }
}

async function loadCexPadPoolUncached(): Promise<CexPadPool> {
  const [binance, coinbase] = await Promise.all([loadBinanceUsdt(), loadCoinbaseUsd()]);
  // Keep both venues — pad logic dedupes by symbol; ranking prefers ecosystem + exchange.
  const rows = [...binance, ...coinbase];
  return { rows, fetchedAt: Date.now() };
}

const getCachedCexPadPool = unstable_cache(loadCexPadPoolUncached, ["cex-board-pad-v1"], {
  revalidate: CEX_PAD_REVALIDATE_SECONDS,
});

let cexMemory: CexPadPool | null = null;

export async function getCexPadPool(): Promise<CexPadPool> {
  if (cexMemory && Date.now() - cexMemory.fetchedAt < CEX_PAD_REVALIDATE_SECONDS * 1000) {
    return cexMemory;
  }
  try {
    const pool = await getCachedCexPadPool();
    cexMemory = pool;
    return pool;
  } catch (err) {
    console.warn("[cex-pad] pool failed", err);
    return cexMemory ?? { rows: [], fetchedAt: Date.now() };
  }
}

function scoreForBoard(chainId: string, row: CexPadRow): number {
  const base = row.base.toUpperCase();
  if (chainId === "ethereum") {
    if (base === "ETH") return 10_000;
    if (ETH_ECOSYSTEM.has(base)) return 5_000 + Math.abs(row.change24hPct);
    if (SOL_ECOSYSTEM.has(base) || base === "BNB" || base === "INJ") return 10;
    return 100 + Math.abs(row.change24hPct);
  }
  if (chainId === "solana") {
    if (base === "SOL") return 10_000;
    if (SOL_ECOSYSTEM.has(base)) return 5_000 + Math.abs(row.change24hPct);
    if (ETH_ECOSYSTEM.has(base) || base === "BNB" || base === "INJ") return 10;
    return 100 + Math.abs(row.change24hPct);
  }
  if (chainId === "base") {
    if (base === "BASE") return 10_000;
    if (BASE_ECOSYSTEM.has(base)) return 5_000 + Math.abs(row.change24hPct);
    // Prefer Coinbase listings for Base board
    if (row.exchange === "coinbase") return 2_000 + Math.abs(row.change24hPct);
    if (SOL_ECOSYSTEM.has(base) || base === "BNB") return 10;
    return 50 + Math.abs(row.change24hPct);
  }
  if (chainId === "injective") {
    if (base === "INJ") return 10_000;
    // Thin related set — anything with INJ prefix rarely
    if (base.startsWith("INJ")) return 3_000;
    return 5;
  }
  return Math.abs(row.change24hPct);
}

/**
 * Ranked CEX candidates for a board. Prefer ecosystem matches, then fill with
 * remaining USDT/USD so columns never stay empty.
 */
export function rankCexPadForBoard(chainId: string, pool: CexPadPool): CexPadRow[] {
  return [...pool.rows]
    .map((row) => ({ row, score: scoreForBoard(chainId, row) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || Math.abs(b.row.change24hPct) - Math.abs(a.row.change24hPct))
    .map((x) => x.row);
}
