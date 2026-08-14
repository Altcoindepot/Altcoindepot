import { unstable_cache } from "next/cache";
import { sanitizeAddressParam, sanitizeChainParam } from "@/lib/dex-token-path";

const DEX_BASE = "https://api.dexscreener.com";
export const DEX_TRADES_REVALIDATE_SECONDS = 45;
const TRADE_LIMIT = 20;

export type DexTrade = {
  timeMs: number;
  side: "buy" | "sell";
  priceUsd: number | null;
  amount: number | null;
  amountUsd: number | null;
};

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function asTimeMs(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value < 1e12 ? value * 1000 : value;
  }
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n < 1e12 ? n * 1000 : n;
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function asSide(value: unknown): "buy" | "sell" | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toLowerCase();
  if (v === "buy" || v === "bought" || v === "bid") return "buy";
  if (v === "sell" || v === "sold" || v === "ask") return "sell";
  return null;
}

function looksLikeTxnCounts(item: Record<string, unknown>): boolean {
  const buys = item.buys;
  const sells = item.sells;
  return typeof buys === "number" && typeof sells === "number" && item.priceUsd == null && item.amount == null;
}

function parseTrade(raw: unknown): DexTrade | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  if (looksLikeTxnCounts(row)) return null;

  const side =
    asSide(row.type) ??
    asSide(row.side) ??
    asSide(row.txType) ??
    asSide(row.event) ??
    asSide(row.kind);
  const timeMs =
    asTimeMs(row.timestamp) ??
    asTimeMs(row.blockTimestamp) ??
    asTimeMs(row.blockTime) ??
    asTimeMs(row.time) ??
    asTimeMs(row.date) ??
    asTimeMs(row.createdAt);
  if (!side || timeMs == null) return null;

  const amountUsd =
    asNumber(row.amountUsd) ??
    asNumber(row.volumeUsd) ??
    asNumber(row.usd) ??
    asNumber(row.valueUsd);
  const amount =
    asNumber(row.amount) ??
    asNumber(row.baseAmount) ??
    asNumber(row.tokenAmount) ??
    asNumber(row.amountToken) ??
    asNumber(row.size);
  const priceUsd =
    asNumber(row.priceUsd) ??
    asNumber(row.price) ??
    (amount != null && amount !== 0 && amountUsd != null ? amountUsd / amount : null);

  return { timeMs, side, priceUsd, amount, amountUsd };
}

function collectTradeArrays(input: unknown, into: unknown[][]) {
  if (!input) return;
  if (Array.isArray(input)) {
    if (input.length > 0 && typeof input[0] === "object") into.push(input);
    for (const item of input) collectTradeArrays(item, into);
    return;
  }
  if (typeof input !== "object") return;
  const row = input as Record<string, unknown>;
  for (const [key, value] of Object.entries(row)) {
    if (key === "txns") continue;
    if (/^(trades|swaps|transactions|recentTrades|recentTxs)$/i.test(key) && Array.isArray(value)) {
      into.push(value);
    } else {
      collectTradeArrays(value, into);
    }
  }
}

export function parseDexTrades(payload: unknown): DexTrade[] {
  const buckets: unknown[][] = [];
  collectTradeArrays(payload, buckets);
  const out: DexTrade[] = [];
  const seen = new Set<string>();
  for (const bucket of buckets) {
    for (const item of bucket) {
      const trade = parseTrade(item);
      if (!trade) continue;
      const key = `${trade.timeMs}:${trade.side}:${trade.amountUsd ?? trade.amount ?? 0}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(trade);
    }
  }
  return out.sort((a, b) => b.timeMs - a.timeMs).slice(0, TRADE_LIMIT);
}

async function fetchPairPayload(chain: string, pairAddress: string): Promise<unknown> {
  const res = await fetch(
    `${DEX_BASE}/latest/dex/pairs/${encodeURIComponent(chain)}/${encodeURIComponent(pairAddress)}`,
    {
      headers: { Accept: "application/json" },
      cache: "force-cache",
      next: { revalidate: DEX_TRADES_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(4000),
    },
  );
  if (!res.ok) return null;
  return res.json();
}

async function loadDexTrades(chainRaw: string, pairRaw: string): Promise<DexTrade[]> {
  const chain = sanitizeChainParam(chainRaw);
  const pairAddress = sanitizeAddressParam(pairRaw);
  if (!chain || !pairAddress) return [];
  try {
    const payload = await fetchPairPayload(chain, pairAddress);
    return parseDexTrades(payload);
  } catch (err) {
    console.warn("[dex-trades] DexScreener trades fetch failed", err);
    return [];
  }
}

const loadDexTradesCached = unstable_cache(loadDexTrades, ["dexscreener-trades-v1"], {
  revalidate: DEX_TRADES_REVALIDATE_SECONDS,
});

export async function getDexScreenerTrades(chain: string, pairAddress: string | null): Promise<DexTrade[]> {
  if (!pairAddress) return [];
  try {
    return await loadDexTradesCached(chain, pairAddress);
  } catch (err) {
    console.warn("[dex-trades] cache read failed", err);
    return [];
  }
}

export function dexScreenerTradesEmbedUrl(
  pairUrl: string | null,
  chain: string,
  pairAddress: string | null,
): string | null {
  const base =
    pairUrl && pairUrl.startsWith("https://dexscreener.com/")
      ? pairUrl
      : pairAddress
        ? `https://dexscreener.com/${encodeURIComponent(chain)}/${encodeURIComponent(pairAddress)}`
        : null;
  if (!base) return null;
  try {
    const url = new URL(base);
    url.searchParams.set("embed", "1");
    url.searchParams.set("theme", "dark");
    url.searchParams.set("trades", "1");
    url.searchParams.set("info", "0");
    url.searchParams.set("chartLeftToolbar", "0");
    return url.toString();
  } catch {
    return null;
  }
}
