import { unstable_cache } from "next/cache";
import { sanitizeAddressParam, sanitizeChainParam } from "@/lib/dex-token-path";

const GT_BASE = "https://api.geckoterminal.com/api/v2";
export const GECKO_TRADES_REVALIDATE_SECONDS = 45;
const TRADE_LIMIT = 20;
const FETCH_TIMEOUT_MS = 4000;

/** Shared trade row used by the token-page Recent trades UI. */
export type DexTrade = {
  timeMs: number;
  side: "buy" | "sell";
  priceUsd: number | null;
  amount: number | null;
  amountUsd: number | null;
};

/** DexScreener chainId → GeckoTerminal network id. */
const DEX_TO_GECKO_NETWORK: Record<string, string> = {
  eth: "eth",
  ethereum: "eth",
  solana: "solana",
  sol: "solana",
  base: "base",
  bsc: "bsc",
  "binance-smart-chain": "bsc",
  arbitrum: "arbitrum",
  polygon: "polygon_pos",
  avalanche: "avax",
  optimism: "optimism",
  sui: "sui",
  fantom: "ftm",
  cronos: "cro",
  blast: "blast",
  linea: "linea",
  scroll: "scroll",
  zksync: "zksync",
  mantle: "mantle",
  pulsechain: "pulsechain",
};

export function geckoNetworkFromDexChain(chain: string | undefined): string | null {
  if (!chain) return null;
  const key = chain.trim().toLowerCase();
  return DEX_TO_GECKO_NETWORK[key] ?? null;
}

function normalizePoolAddress(network: string, address: string): string {
  if (network === "solana" || network === "sui") return address;
  return address.startsWith("0x") ? address.toLowerCase() : address;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function asTimeMs(value: unknown): number | null {
  if (typeof value === "string" && value.trim()) {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value < 1e12 ? value * 1000 : value;
  }
  return null;
}

function parseGeckoTrade(raw: unknown): DexTrade | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as { attributes?: unknown };
  if (!row.attributes || typeof row.attributes !== "object") return null;
  const a = row.attributes as Record<string, unknown>;

  const kind = typeof a.kind === "string" ? a.kind.trim().toLowerCase() : "";
  const side = kind === "buy" || kind === "sell" ? kind : null;
  const timeMs = asTimeMs(a.block_timestamp);
  if (!side || timeMs == null) return null;

  // kind is relative to the pool base token (GeckoTerminal default).
  const priceUsd = side === "buy" ? asNumber(a.price_to_in_usd) : asNumber(a.price_from_in_usd);
  const amount = side === "buy" ? asNumber(a.to_token_amount) : asNumber(a.from_token_amount);
  const amountUsd = asNumber(a.volume_in_usd);

  return { timeMs, side, priceUsd, amount, amountUsd };
}

export function parseGeckoTerminalTrades(payload: unknown): DexTrade[] {
  if (!payload || typeof payload !== "object") return [];
  const data = (payload as { data?: unknown }).data;
  if (!Array.isArray(data)) return [];

  const out: DexTrade[] = [];
  const seen = new Set<string>();
  for (const item of data) {
    const trade = parseGeckoTrade(item);
    if (!trade) continue;
    const key = `${trade.timeMs}:${trade.side}:${trade.amountUsd ?? trade.amount ?? 0}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trade);
  }
  return out.sort((a, b) => b.timeMs - a.timeMs).slice(0, TRADE_LIMIT);
}

async function fetchPoolTrades(network: string, poolAddress: string): Promise<DexTrade[]> {
  const url =
    `${GT_BASE}/networks/${encodeURIComponent(network)}` +
    `/pools/${encodeURIComponent(poolAddress)}/trades` +
    `?trade_volume_in_usd_greater_than=0`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "force-cache",
      next: { revalidate: GECKO_TRADES_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (err) {
    console.warn("[gecko-trades] fetch failed/timeout", { network, err });
    return [];
  }

  if (res.status === 429) {
    console.warn("[gecko-trades] rate limited", { network });
    return [];
  }
  if (!res.ok) {
    console.warn("[gecko-trades] non-OK", { network, status: res.status });
    return [];
  }

  try {
    const payload: unknown = await res.json();
    return parseGeckoTerminalTrades(payload);
  } catch (err) {
    console.warn("[gecko-trades] JSON parse failed", err);
    return [];
  }
}

async function loadGeckoTrades(chainRaw: string, pairRaw: string): Promise<DexTrade[]> {
  const chain = sanitizeChainParam(chainRaw);
  const pairAddress = sanitizeAddressParam(pairRaw);
  if (!chain || !pairAddress) return [];

  const network = geckoNetworkFromDexChain(chain);
  if (!network) return [];

  const pool = normalizePoolAddress(network, pairAddress);
  return fetchPoolTrades(network, pool);
}

const loadGeckoTradesCached = unstable_cache(loadGeckoTrades, ["geckoterminal-trades-v1"], {
  revalidate: GECKO_TRADES_REVALIDATE_SECONDS,
});

/**
 * Recent pool trades from GeckoTerminal only.
 * Always resolves (empty array on timeout / 429 / error / unsupported chain).
 * Hard 5s outer timeout so the token page never hangs on trades.
 */
export async function getGeckoTerminalTrades(
  chain: string,
  pairAddress: string | null,
): Promise<DexTrade[]> {
  if (!pairAddress) return [];

  const work = (async (): Promise<DexTrade[]> => {
    try {
      return await loadGeckoTradesCached(chain, pairAddress);
    } catch (err) {
      console.warn("[gecko-trades] cache read failed", err);
      return [];
    }
  })();

  try {
    return await Promise.race([
      work,
      new Promise<DexTrade[]>((resolve) => {
        setTimeout(() => {
          console.warn("[gecko-trades] hard timeout");
          resolve([]);
        }, 5000);
      }),
    ]);
  } catch (err) {
    console.warn("[gecko-trades] unexpected failure", err);
    return [];
  }
}
