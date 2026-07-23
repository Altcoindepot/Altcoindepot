import { coinGeckoFetch } from "@/lib/coingecko";

type RawMover = {
  symbol: string;
  last: number;
  change24hPct: number;
  volume24h: number | null;
};

export type CexMover = {
  symbol: string;
  last: number;
  change24hPct: number;
  volume24h: number | null;
  change1hPct: number | null;
  miniSeries: number[] | null;
};

export type CexBoard = {
  id: string;
  label: string;
  movers: CexMover[];
  error?: string;
};

const FETCH_HEADERS: HeadersInit = {
  Accept: "application/json",
  "User-Agent": "AltCoinDepot/1.0 (+https://altcoindepot.com)",
};

/** Binance blocks many US/cloud IPs on api.binance.com (HTTP 451). Prefer the public data host. */
const BINANCE_BASES = [
  "https://data-api.binance.vision",
  "https://data.binance.com",
  "https://api.binance.com",
] as const;

const STABLE_BASES = new Set(["USDT", "USDC", "USD", "BUSD", "DAI", "FDUSD", "TUSD", "USDE"]);

function pct(now: number, then: number): number | null {
  if (!Number.isFinite(now) || !Number.isFinite(then) || then === 0) return null;
  return ((now - then) / then) * 100;
}

function isUsdLike(symbol: string): boolean {
  const s = symbol.toUpperCase();
  return (
    s.endsWith("USDT") ||
    s.endsWith("USDC") ||
    s.endsWith("USD") ||
    s.endsWith("-USDT") ||
    s.endsWith("-USDC") ||
    s.endsWith("-USD")
  );
}

function parseNum(value: unknown): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? n : null;
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    next: { revalidate: 60 },
    headers: FETCH_HEADERS,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

async function topBinanceLike(baseUrl: string): Promise<RawMover[]> {
  const raw = await fetchJson(`${baseUrl}/api/v3/ticker/24hr`);
  if (!Array.isArray(raw)) return [];
  const rows = raw
    .map((r) => {
      const symbol = typeof (r as { symbol?: unknown }).symbol === "string" ? (r as { symbol: string }).symbol : "";
      const last = parseNum((r as { lastPrice?: unknown }).lastPrice);
      const change24hPct = parseNum((r as { priceChangePercent?: unknown }).priceChangePercent);
      const volume24h = parseNum((r as { quoteVolume?: unknown }).quoteVolume);
      if (!symbol || last == null || change24hPct == null || !isUsdLike(symbol)) return null;
      return { symbol, last, change24hPct, volume24h };
    })
    .filter((v): v is RawMover => Boolean(v))
    .sort((a, b) => b.change24hPct - a.change24hPct);
  return rows.slice(0, 5);
}

async function topBinance(): Promise<RawMover[]> {
  let lastError: Error | null = null;
  for (const base of BINANCE_BASES) {
    try {
      const rows = await topBinanceLike(base);
      if (rows.length > 0) return rows;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }
  // Last resort: CoinGecko exchange tickers + market % change
  try {
    return await topFromCoinGeckoExchange("binance");
  } catch (error) {
    throw lastError ?? (error instanceof Error ? error : new Error(String(error)));
  }
}

async function momentumBinanceLike(
  baseUrl: string,
  symbol: string,
): Promise<{ h1: number | null; series: number[] | null }> {
  const raw = await fetchJson(
    `${baseUrl}/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=15m&limit=16`,
  );
  if (!Array.isArray(raw) || raw.length < 5) return { h1: null, series: null };
  const closes = raw.map((c) => parseNum((c as unknown[])[4])).filter((v): v is number => v != null);
  if (closes.length < 5) return { h1: null, series: closes.length >= 2 ? closes : null };
  return { h1: pct(closes[closes.length - 1]!, closes[closes.length - 5]!), series: closes };
}

async function momentumBinance(symbol: string): Promise<{ h1: number | null; series: number[] | null }> {
  for (const base of BINANCE_BASES) {
    try {
      const result = await momentumBinanceLike(base, symbol);
      if (result.series || result.h1 != null) return result;
    } catch {
      // try next host
    }
  }
  return { h1: null, series: null };
}

async function topCoinbase(): Promise<RawMover[]> {
  try {
    const raw = await fetchJson("https://api.coinbase.com/api/v3/brokerage/market/products");
    const products = (raw as { products?: unknown[] })?.products;
    if (!Array.isArray(products)) throw new Error("Invalid Coinbase products response");

    const rows = products
      .map((p) => {
        const productId =
          typeof (p as { product_id?: unknown }).product_id === "string"
            ? (p as { product_id: string }).product_id
            : "";
        const quote =
          typeof (p as { quote_currency_id?: unknown }).quote_currency_id === "string"
            ? (p as { quote_currency_id: string }).quote_currency_id.toUpperCase()
            : productId.includes("-")
              ? productId.split("-").pop()?.toUpperCase() ?? ""
              : "";
        const status =
          typeof (p as { status?: unknown }).status === "string"
            ? (p as { status: string }).status.toLowerCase()
            : "online";
        const last = parseNum((p as { price?: unknown }).price);
        const change24hPct = parseNum((p as { price_percentage_change_24h?: unknown }).price_percentage_change_24h);
        const volume24h = parseNum((p as { volume_24h?: unknown }).volume_24h);
        const base = productId.includes("-") ? productId.split("-")[0]!.toUpperCase() : "";

        if (!productId || last == null || change24hPct == null) return null;
        // Prefer USD spot pairs so top movers aren't duplicated across USDC aliases.
        if (quote !== "USD") return null;
        if (status && status !== "online") return null;
        if (STABLE_BASES.has(base)) return null;
        if ((p as { trading_disabled?: unknown }).trading_disabled === true) return null;
        if ((p as { is_disabled?: unknown }).is_disabled === true) return null;

        const quoteVolume =
          parseNum((p as { approximate_quote_24h_volume?: unknown }).approximate_quote_24h_volume) ??
          (volume24h != null ? volume24h * last : null);

        return {
          symbol: productId.replace("-", "/"),
          last,
          change24hPct,
          volume24h: quoteVolume,
        };
      })
      .filter((v): v is RawMover => Boolean(v))
      .sort((a, b) => b.change24hPct - a.change24hPct);

    if (rows.length > 0) return rows.slice(0, 5);
  } catch {
    // fall through
  }

  try {
    return await topFromCoinGeckoExchange("gdax");
  } catch {
    return topFromCoinGeckoExchange("coinbase_exchange");
  }
}

async function momentumCoinbase(symbol: string): Promise<{ h1: number | null; series: number[] | null }> {
  const productId = symbol.includes("/")
    ? symbol.replace("/", "-")
    : symbol.includes("-")
      ? symbol
      : symbol;
  try {
    const raw = await fetchJson(
      `https://api.exchange.coinbase.com/products/${encodeURIComponent(productId)}/candles?granularity=900`,
    );
    if (!Array.isArray(raw) || raw.length < 5) return { h1: null, series: null };
    // Coinbase candles: [ time, low, high, open, close, volume ], newest first
    const closes = raw
      .slice(0, 16)
      .map((c) => parseNum((c as unknown[])[4]))
      .filter((v): v is number => v != null)
      .reverse();
    if (closes.length < 5) return { h1: null, series: closes.length >= 2 ? closes : null };
    return { h1: pct(closes[closes.length - 1]!, closes[closes.length - 5]!), series: closes };
  } catch {
    return { h1: null, series: null };
  }
}

/**
 * Fallback when exchange APIs are geo/CDN blocked.
 * Uses CoinGecko exchange tickers + /coins/markets for 24h % change.
 */
async function topFromCoinGeckoExchange(exchangeId: string): Promise<RawMover[]> {
  const tickersRes = await coinGeckoFetch(
    `/exchanges/${encodeURIComponent(exchangeId)}/tickers?order=volume_desc&page=1`,
    { next: { revalidate: 60 } },
  );
  if (!tickersRes.ok) throw new Error(`CoinGecko exchange ${exchangeId}: ${tickersRes.status}`);
  const tickersJson = (await tickersRes.json()) as {
    tickers?: Array<{
      base?: string;
      target?: string;
      last?: number;
      coin_id?: string;
      converted_volume?: { usd?: number };
    }>;
  };
  const tickers = Array.isArray(tickersJson.tickers) ? tickersJson.tickers : [];

  const byCoin = new Map<
    string,
    { symbol: string; last: number; volume24h: number | null }
  >();
  for (const t of tickers) {
    const base = (t.base ?? "").toUpperCase();
    const target = (t.target ?? "").toUpperCase();
    const coinId = t.coin_id?.trim();
    const last = parseNum(t.last);
    if (!coinId || !base || last == null) continue;
    if (!(target === "USDT" || target === "USD" || target === "USDC")) continue;
    if (STABLE_BASES.has(base)) continue;
    if (byCoin.has(coinId)) continue;
    byCoin.set(coinId, {
      symbol: `${base}${target === "USD" ? "USDT" : target}`,
      last,
      volume24h: parseNum(t.converted_volume?.usd),
    });
  }

  const ids = Array.from(byCoin.keys()).slice(0, 80);
  if (ids.length === 0) return [];

  const marketsRes = await coinGeckoFetch(
    `/coins/markets?vs_currency=usd&ids=${encodeURIComponent(ids.join(","))}&order=price_change_percentage_24h_desc&per_page=80&page=1&sparkline=false&price_change_percentage=24h`,
    { next: { revalidate: 60 } },
  );
  if (!marketsRes.ok) throw new Error(`CoinGecko markets fallback: ${marketsRes.status}`);
  const markets = (await marketsRes.json()) as Array<{
    id?: string;
    current_price?: number | null;
    price_change_percentage_24h?: number | null;
    total_volume?: number | null;
  }>;
  if (!Array.isArray(markets)) return [];

  const rows: RawMover[] = [];
  for (const m of markets) {
    if (!m.id) continue;
    const meta = byCoin.get(m.id);
    if (!meta) continue;
    const change24hPct = parseNum(m.price_change_percentage_24h);
    if (change24hPct == null) continue;
    const last = parseNum(m.current_price) ?? meta.last;
    rows.push({
      symbol: meta.symbol,
      last,
      change24hPct,
      volume24h: parseNum(m.total_volume) ?? meta.volume24h,
    });
  }

  rows.sort((a, b) => b.change24hPct - a.change24hPct);
  return rows.slice(0, 5);
}

async function topKucoin(): Promise<RawMover[]> {
  const raw = await fetchJson("https://api.kucoin.com/api/v1/market/allTickers");
  const list = (raw as { data?: { ticker?: unknown[] } })?.data?.ticker;
  if (!Array.isArray(list)) return [];
  const rows = list
    .map((r) => {
      const symbol = typeof (r as { symbol?: unknown }).symbol === "string" ? (r as { symbol: string }).symbol : "";
      const last = parseNum((r as { last?: unknown }).last);
      const p = parseNum((r as { changeRate?: unknown }).changeRate);
      const volume24h = parseNum((r as { volValue?: unknown }).volValue);
      const change24hPct = p == null ? null : p * 100;
      if (!symbol || last == null || change24hPct == null || !isUsdLike(symbol)) return null;
      return { symbol, last, change24hPct, volume24h };
    })
    .filter((v): v is RawMover => Boolean(v))
    .sort((a, b) => b.change24hPct - a.change24hPct);
  return rows.slice(0, 5);
}

async function momentumKucoin(symbol: string): Promise<{ h1: number | null; series: number[] | null }> {
  const raw = await fetchJson(
    `https://api.kucoin.com/api/v1/market/candles?type=15min&symbol=${encodeURIComponent(symbol)}`,
  );
  const data = (raw as { data?: unknown[] })?.data;
  if (!Array.isArray(data) || data.length < 5) return { h1: null, series: null };
  const closes = [...data]
    .slice(0, 16)
    .reverse()
    .map((c) => parseNum((c as unknown[])[2]))
    .filter((v): v is number => v != null);
  if (closes.length < 5) return { h1: null, series: closes.length >= 2 ? closes : null };
  return { h1: pct(closes[closes.length - 1], closes[closes.length - 5]), series: closes };
}

async function topOkx(): Promise<RawMover[]> {
  const raw = await fetchJson("https://www.okx.com/api/v5/market/tickers?instType=SPOT");
  const list = (raw as { data?: unknown[] })?.data;
  if (!Array.isArray(list)) return [];
  const rows = list
    .map((r) => {
      const symbol = typeof (r as { instId?: unknown }).instId === "string" ? (r as { instId: string }).instId : "";
      const last = parseNum((r as { last?: unknown }).last);
      const open24h = parseNum((r as { open24h?: unknown }).open24h);
      const volume24h = parseNum((r as { volCcy24h?: unknown }).volCcy24h);
      const change24hPct = last != null && open24h != null ? pct(last, open24h) : null;
      if (!symbol || last == null || change24hPct == null || !isUsdLike(symbol)) return null;
      return { symbol, last, change24hPct, volume24h };
    })
    .filter((v): v is RawMover => Boolean(v))
    .sort((a, b) => b.change24hPct - a.change24hPct);
  return rows.slice(0, 5);
}

async function topKraken(): Promise<RawMover[]> {
  const raw = await fetchJson("https://api.kraken.com/0/public/Ticker");
  const result = (raw as { result?: Record<string, unknown> })?.result;
  if (!result || typeof result !== "object") return [];
  const rows: RawMover[] = [];
  for (const [symbol, payload] of Object.entries(result)) {
    const pair = symbol.toUpperCase();
    if (!isUsdLike(pair)) continue;
    const c = (payload as { c?: unknown[] }).c;
    const o = (payload as { o?: unknown }).o;
    const v = (payload as { v?: unknown[] }).v;
    const last = Array.isArray(c) ? parseNum(c[0]) : null;
    const open24h = parseNum(o);
    const volume24h = Array.isArray(v) ? parseNum(v[1]) : null;
    const change24hPct = last != null && open24h != null ? pct(last, open24h) : null;
    if (last == null || change24hPct == null) continue;
    rows.push({ symbol: pair, last, change24hPct, volume24h });
  }
  rows.sort((a, b) => b.change24hPct - a.change24hPct);
  return rows.slice(0, 5);
}

async function momentumKraken(symbol: string): Promise<{ h1: number | null; series: number[] | null }> {
  const raw = await fetchJson(
    `https://api.kraken.com/0/public/OHLC?pair=${encodeURIComponent(symbol)}&interval=15`,
  );
  const result = (raw as { result?: Record<string, unknown> })?.result;
  if (!result || typeof result !== "object") return { h1: null, series: null };
  const seriesKey = Object.keys(result).find((k) => k !== "last");
  if (!seriesKey) return { h1: null, series: null };
  const series = result[seriesKey];
  if (!Array.isArray(series) || series.length < 5) return { h1: null, series: null };
  const closes = series
    .slice(-16)
    .map((c) => parseNum((c as unknown[])[4]))
    .filter((v): v is number => v != null);
  if (closes.length < 5) return { h1: null, series: closes.length >= 2 ? closes : null };
  return { h1: pct(closes[closes.length - 1], closes[closes.length - 5]), series: closes };
}

async function momentumOkx(symbol: string): Promise<{ h1: number | null; series: number[] | null }> {
  const raw = await fetchJson(
    `https://www.okx.com/api/v5/market/candles?instId=${encodeURIComponent(symbol)}&bar=15m&limit=16`,
  );
  const data = (raw as { data?: unknown[] })?.data;
  if (!Array.isArray(data) || data.length < 5) return { h1: null, series: null };
  const closes = [...data]
    .reverse()
    .map((c) => parseNum((c as unknown[])[4]))
    .filter((v): v is number => v != null);
  if (closes.length < 5) return { h1: null, series: closes.length >= 2 ? closes : null };
  return { h1: pct(closes[closes.length - 1], closes[closes.length - 5]), series: closes };
}

async function buildBoard(
  id: string,
  label: string,
  topFn: () => Promise<RawMover[]>,
  momentumFn: (symbol: string) => Promise<{ h1: number | null; series: number[] | null }>,
): Promise<CexBoard> {
  try {
    const top = await topFn();
    const movers: CexMover[] = await Promise.all(
      top.map(async (row) => {
        const momentum = await momentumFn(row.symbol).catch(() => ({ h1: null, series: null }));
        return {
          symbol: row.symbol,
          last: row.last,
          change24hPct: row.change24hPct,
          volume24h: row.volume24h,
          change1hPct: momentum.h1,
          miniSeries: momentum.series,
        };
      }),
    );
    return { id, label, movers };
  } catch (error) {
    return {
      id,
      label,
      movers: [],
      error: error instanceof Error ? error.message : "Failed to load exchange data",
    };
  }
}

export async function getCexTrendingBoards(): Promise<CexBoard[]> {
  const boards = await Promise.all([
    buildBoard("binance", "Binance", topBinance, momentumBinance),
    buildBoard("coinbase", "Coinbase", topCoinbase, momentumCoinbase),
    buildBoard("kucoin", "KuCoin", topKucoin, momentumKucoin),
    buildBoard("okx", "OKX", topOkx, momentumOkx),
    buildBoard("kraken", "Kraken", topKraken, momentumKraken),
    buildBoard("mexc", "MEXC", () => topBinanceLike("https://api.mexc.com"), (s) =>
      momentumBinanceLike("https://api.mexc.com", s),
    ),
  ]);
  return boards;
}
