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
  const res = await fetch(url, { next: { revalidate: 60 }, headers: { Accept: "application/json" } });
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

async function momentumBinanceLike(baseUrl: string, symbol: string): Promise<{ h1: number | null; series: number[] | null }> {
  const raw = await fetchJson(
    `${baseUrl}/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=15m&limit=16`,
  );
  if (!Array.isArray(raw) || raw.length < 5) return { h1: null, series: null };
  const closes = raw.map((c) => parseNum((c as unknown[])[4])).filter((v): v is number => v != null);
  if (closes.length < 5) return { h1: null, series: closes.length >= 2 ? closes : null };
  return { h1: pct(closes[closes.length - 1], closes[closes.length - 5]), series: closes };
}

async function topBybit(): Promise<RawMover[]> {
  const raw = await fetchJson("https://api.bybit.com/v5/market/tickers?category=spot");
  const list = (raw as { result?: { list?: unknown[] } })?.result?.list;
  if (!Array.isArray(list)) return [];
  const rows = list
    .map((r) => {
      const symbol = typeof (r as { symbol?: unknown }).symbol === "string" ? (r as { symbol: string }).symbol : "";
      const last = parseNum((r as { lastPrice?: unknown }).lastPrice);
      const p = parseNum((r as { price24hPcnt?: unknown }).price24hPcnt);
      const volume24h = parseNum((r as { turnover24h?: unknown }).turnover24h);
      const change24hPct = p == null ? null : p * 100;
      if (!symbol || last == null || change24hPct == null || !isUsdLike(symbol)) return null;
      return { symbol, last, change24hPct, volume24h };
    })
    .filter((v): v is RawMover => Boolean(v))
    .sort((a, b) => b.change24hPct - a.change24hPct);
  return rows.slice(0, 5);
}

async function momentumBybit(symbol: string): Promise<{ h1: number | null; series: number[] | null }> {
  const raw = await fetchJson(
    `https://api.bybit.com/v5/market/kline?category=spot&symbol=${encodeURIComponent(symbol)}&interval=15&limit=16`,
  );
  const list = (raw as { result?: { list?: unknown[] } })?.result?.list;
  if (!Array.isArray(list) || list.length < 5) return { h1: null, series: null };
  const closes = [...list]
    .reverse()
    .map((c) => parseNum((c as unknown[])[4]))
    .filter((v): v is number => v != null);
  if (closes.length < 5) return { h1: null, series: closes.length >= 2 ? closes : null };
  return { h1: pct(closes[closes.length - 1], closes[closes.length - 5]), series: closes };
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
    buildBoard("binance", "Binance", () => topBinanceLike("https://api.binance.com"), (s) =>
      momentumBinanceLike("https://api.binance.com", s),
    ),
    buildBoard("bybit", "Bybit", topBybit, momentumBybit),
    buildBoard("kucoin", "KuCoin", topKucoin, momentumKucoin),
    buildBoard("okx", "OKX", topOkx, momentumOkx),
    buildBoard("kraken", "Kraken", topKraken, momentumKraken),
    buildBoard("mexc", "MEXC", () => topBinanceLike("https://api.mexc.com"), (s) =>
      momentumBinanceLike("https://api.mexc.com", s),
    ),
  ]);
  return boards;
}
