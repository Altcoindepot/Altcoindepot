/**
 * Per-chain top gainers / losers for the homepage.
 * Prefer DexScreener priceChange.h1; fall back to h24 with an explicit window label.
 * Does not alter list-page price mapping.
 */

import { unstable_cache } from "next/cache";
import { normalizeDexChainId } from "@/lib/dex-token-path";
import { parseDexUsdNumber } from "@/lib/dex-pair-fields";

const DEX_BASE = "https://api.dexscreener.com";
export const CHAIN_MOVERS_REVALIDATE_SECONDS = 180;
const MIN_LIQUIDITY_USD = 10_000;
const TOP_N = 5;

const SKIP_SYMBOLS = new Set([
  "usdt",
  "usdc",
  "usd1",
  "dai",
  "weth",
  "wbtc",
  "sol",
  "bnb",
  "eth",
  "btc",
]);

export const MOVER_CHAINS = [
  { id: "solana", label: "Solana" },
  { id: "ethereum", label: "Ethereum" },
  { id: "base", label: "Base" },
  { id: "bsc", label: "BSC" },
] as const;

export type MoverWindow = "1h" | "24h";

export type ChainMoverRow = {
  id: string;
  symbol: string;
  name: string;
  chain: string;
  address: string;
  priceUsd: number | null;
  changePct: number;
  window: MoverWindow;
  imageUrl?: string | null;
  liquidityUsd: number | null;
};

export type ChainMoversBoard = {
  chainId: string;
  chainLabel: string;
  /** Dominant window used for this chain's lists (1h when enough h1 data). */
  window: MoverWindow;
  gainers: ChainMoverRow[];
  losers: ChainMoverRow[];
};

type DexPair = {
  chainId?: string;
  dexId?: string;
  url?: string;
  baseToken?: { address?: string; name?: string; symbol?: string };
  priceUsd?: string | number | null;
  priceChange?: { h24?: number; h6?: number; h1?: number };
  volume?: { h24?: number };
  liquidity?: { usd?: number };
  info?: { imageUrl?: string };
};

let memory: { at: number; boards: ChainMoversBoard[] } | null = null;

async function dexFetch(path: string): Promise<unknown> {
  const res = await fetch(`${DEX_BASE}${path}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: CHAIN_MOVERS_REVALIDATE_SECONDS },
  });
  if (!res.ok) throw new Error(`DexScreener ${path}: ${res.status}`);
  return res.json();
}

function pickBestPair(pairs: DexPair[]): DexPair | null {
  if (pairs.length === 0) return null;
  return (
    [...pairs].sort(
      (a, b) => (parseDexUsdNumber(b.liquidity?.usd) ?? 0) - (parseDexUsdNumber(a.liquidity?.usd) ?? 0),
    )[0] ?? null
  );
}

type Candidate = {
  chain: string;
  address: string;
  symbol: string;
  name: string;
  priceUsd: number | null;
  change1h: number | null;
  change24h: number | null;
  liquidityUsd: number | null;
  imageUrl: string | null;
};

function pairToCandidate(pair: DexPair): Candidate | null {
  const base = pair.baseToken;
  if (!base?.address || !base.symbol) return null;
  const chain = normalizeDexChainId(pair.chainId) ?? pair.chainId?.trim().toLowerCase() ?? "";
  if (!chain) return null;
  const symbol = base.symbol.trim();
  if (!symbol || SKIP_SYMBOLS.has(symbol.toLowerCase())) return null;
  const liquidityUsd = parseDexUsdNumber(pair.liquidity?.usd);
  if ((liquidityUsd ?? 0) < MIN_LIQUIDITY_USD) return null;
  return {
    chain,
    address: base.address,
    symbol: symbol.toUpperCase(),
    name: base.name ?? symbol,
    priceUsd: parseDexUsdNumber(pair.priceUsd),
    change1h: parseDexUsdNumber(pair.priceChange?.h1),
    change24h: parseDexUsdNumber(pair.priceChange?.h24),
    liquidityUsd,
    imageUrl: typeof pair.info?.imageUrl === "string" ? pair.info.imageUrl : null,
  };
}

async function collectRawPairs(): Promise<DexPair[]> {
  const out: DexPair[] = [];

  try {
    const topRaw = await dexFetch("/token-boosts/top/v1");
    if (Array.isArray(topRaw)) {
      const byChain = new Map<string, string[]>();
      for (const item of topRaw) {
        if (!item || typeof item !== "object") continue;
        const row = item as { chainId?: unknown; tokenAddress?: unknown };
        if (typeof row.chainId !== "string" || typeof row.tokenAddress !== "string") continue;
        const chain = row.chainId.trim().toLowerCase();
        const list = byChain.get(chain) ?? [];
        list.push(row.tokenAddress.trim());
        byChain.set(chain, list);
      }
      await Promise.all(
        [...byChain.entries()].map(async ([chain, addresses]) => {
          for (let i = 0; i < addresses.length; i += 30) {
            const batch = addresses.slice(i, i + 30);
            const path = `/tokens/v1/${encodeURIComponent(chain)}/${batch
              .map(encodeURIComponent)
              .join(",")}`;
            try {
              const data = await dexFetch(path);
              if (Array.isArray(data)) out.push(...(data as DexPair[]));
            } catch {
              /* continue */
            }
          }
        }),
      );
    }
  } catch {
    /* boosts optional */
  }

  const searches = ["SOL", "ETH", "BASE", "BNB", "PEPE", "WIF"];
  await Promise.all(
    searches.map(async (q) => {
      try {
        const data = (await dexFetch(`/latest/dex/search?q=${encodeURIComponent(q)}`)) as {
          pairs?: DexPair[];
        };
        if (Array.isArray(data.pairs)) out.push(...data.pairs);
      } catch {
        /* continue */
      }
    }),
  );

  return out;
}

function dedupeCandidates(pairs: DexPair[]): Candidate[] {
  const grouped = new Map<string, DexPair[]>();
  for (const pair of pairs) {
    const addr = pair.baseToken?.address?.trim().toLowerCase();
    const chain =
      normalizeDexChainId(pair.chainId) ?? pair.chainId?.trim().toLowerCase() ?? "";
    if (!addr || !chain) continue;
    const key = `${chain}:${addr}`;
    const bucket = grouped.get(key) ?? [];
    bucket.push(pair);
    grouped.set(key, bucket);
  }

  const out: Candidate[] = [];
  for (const bucket of grouped.values()) {
    const best = pickBestPair(bucket);
    if (!best) continue;
    const row = pairToCandidate(best);
    if (row) out.push(row);
  }
  return out;
}

function toMoverRow(c: Candidate, window: MoverWindow, changePct: number): ChainMoverRow {
  return {
    id: `${c.chain}:${c.address.toLowerCase()}`,
    symbol: c.symbol,
    name: c.name,
    chain: c.chain,
    address: c.address,
    priceUsd: c.priceUsd,
    changePct,
    window,
    imageUrl: c.imageUrl,
    liquidityUsd: c.liquidityUsd,
  };
}

function buildBoardForChain(
  chainId: string,
  chainLabel: string,
  all: Candidate[],
): ChainMoversBoard {
  const pool = all.filter((c) => c.chain === chainId);
  const with1h = pool.filter((c) => c.change1h != null && Number.isFinite(c.change1h));
  const use1h = with1h.length >= 3;
  const window: MoverWindow = use1h ? "1h" : "24h";
  const scored = (use1h ? with1h : pool)
    .map((c) => {
      const changePct = use1h ? c.change1h! : c.change24h;
      if (changePct == null || !Number.isFinite(changePct)) return null;
      return toMoverRow(c, window, changePct);
    })
    .filter((r): r is ChainMoverRow => r != null);

  const gainers = [...scored]
    .filter((r) => r.changePct > 0)
    .sort((a, b) => b.changePct - a.changePct)
    .slice(0, TOP_N);

  const losers = [...scored]
    .filter((r) => r.changePct < 0)
    .sort((a, b) => a.changePct - b.changePct)
    .slice(0, TOP_N);

  return { chainId, chainLabel, window, gainers, losers };
}

async function loadChainMoversUncached(): Promise<ChainMoversBoard[]> {
  const pairs = await collectRawPairs();
  const candidates = dedupeCandidates(pairs);
  return MOVER_CHAINS.map((c) => buildBoardForChain(c.id, c.label, candidates));
}

const loadCached = unstable_cache(loadChainMoversUncached, ["dex-chain-movers-v1"], {
  revalidate: CHAIN_MOVERS_REVALIDATE_SECONDS,
});

export async function getChainMovers(): Promise<ChainMoversBoard[]> {
  if (memory && Date.now() - memory.at < CHAIN_MOVERS_REVALIDATE_SECONDS * 1000) {
    return memory.boards;
  }
  try {
    const boards = await loadCached();
    memory = { at: Date.now(), boards };
    console.info(
      "[chain-movers]",
      boards.map((b) => ({
        chain: b.chainId,
        window: b.window,
        gainers: b.gainers.length,
        losers: b.losers.length,
      })),
    );
    return boards;
  } catch (err) {
    console.warn("[chain-movers] fetch failed", err);
    return memory?.boards ?? MOVER_CHAINS.map((c) => ({
      chainId: c.id,
      chainLabel: c.label,
      window: "24h" as const,
      gainers: [],
      losers: [],
    }));
  }
}

export function peekChainMoversFetchedAt(): number | null {
  return memory?.at ?? null;
}

/**
 * Flatten cached boards into the best absolute movers for the homepage fold.
 * Prefers gainers, then fills with losers; dedupes by chain:address.
 */
export function pickHomeTopMovers(
  boards: ChainMoversBoard[],
  limit = 5,
): ChainMoverRow[] {
  const scored: ChainMoverRow[] = [];
  for (const board of boards) {
    scored.push(...board.gainers, ...board.losers);
  }
  const seen = new Set<string>();
  const unique = scored.filter((row) => {
    const key = `${row.chain}:${row.address.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return unique
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
    .slice(0, limit);
}
