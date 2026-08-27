/**
 * Per-chain top gainers / losers — ETH, SOL, BASE, INJ only (this pass).
 * Dex first (DexScreener prices), then CEX pad (Binance USDT + Coinbase) to 10/10.
 * One window per board: 1H if enough %, else 24H for the whole Dex side.
 */

import { unstable_cache } from "next/cache";
import { normalizeDexChainId, sameDexChain, dexTokenPath } from "@/lib/dex-token-path";
import { parseDexUsdNumber } from "@/lib/dex-pair-fields";
import {
  getCexPadPool,
  rankCexPadForBoard,
  type CexPadRow,
  CEX_PAD_REVALIDATE_SECONDS,
} from "@/lib/cex-board-pad";

const DEX_BASE = "https://api.dexscreener.com";
/** Dex cache 2–5 min (3 min). */
export const CHAIN_MOVERS_REVALIDATE_SECONDS = 180;
export { CEX_PAD_REVALIDATE_SECONDS };

const MIN_LIQUIDITY_USD = 10_000;
const TOP_N = 10;
/** Need this many liquid scored rows before trusting 1H for the board. */
const MIN_SCORED_FOR_1H = 8;

/** Quote / native / wrapper bases — never show as Dex movers. */
const SKIP_SYMBOLS = new Set([
  "usdt",
  "usdc",
  "usd1",
  "dai",
  "usde",
  "fdusd",
  "tusd",
  "busd",
  "usdp",
  "pyusd",
  "eurc",
  "weth",
  "wbtc",
  "wsol",
  "wbnb",
  "wavax",
  "wmatic",
  "wpol",
  "sol",
  "eth",
  "bnb",
  "btc",
  "base",
  "ethereum",
  "steth",
  "wsteth",
  "cbeth",
  "reth",
  "meth",
  "weeth",
  "ezeth",
]);

const SKIP_NAME_RE =
  /^(wrapped\s+(ether|eth|sol|solana|bnb|bitcoin|btc)|usd\s*coin|tether\s*usd|binance\s*coin)$/i;

export const MOVER_CHAINS = [
  { id: "ethereum", label: "Ethereum" },
  { id: "solana", label: "Solana" },
  { id: "base", label: "Base" },
  { id: "injective", label: "Injective" },
] as const;

/** Extra Dex search queries to fatten each chain’s pool (filtered by chainId after). */
const CHAIN_SEARCH_QUERIES: Record<string, string[]> = {
  ethereum: ["uniswap", "pepe", "link", "shib", "mog", "ethereum"],
  solana: ["raydium", "pump", "bonk", "jup", "wif", "popcat", "mew", "solana"],
  base: ["aerodrome", "virtual", "brett", "degen", "toshi", "base"],
  injective: ["injective", "inj", "helix", "dojo"],
};

export type MoverWindow = "1h" | "24h";
export type MoverVenue = "dex" | "cex";

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
  /** Dex rows = "dex" (or omit); CEX pads = "cex". */
  venue: MoverVenue;
  cexExchange?: "binance" | "coinbase";
};

export type ChainMoversBoard = {
  chainId: string;
  chainLabel: string;
  /** Single window for Dex side of this board. CEX pads always use 24H. */
  window: MoverWindow;
  gainers: ChainMoverRow[];
  losers: ChainMoverRow[];
};

type DexPair = {
  chainId?: string;
  dexId?: string;
  url?: string;
  pairAddress?: string;
  baseToken?: { address?: string; name?: string; symbol?: string };
  quoteToken?: { address?: string; name?: string; symbol?: string };
  priceUsd?: string | number | null;
  priceChange?: { h24?: number; h6?: number; h1?: number };
  volume?: { h24?: number };
  liquidity?: { usd?: number };
  info?: { imageUrl?: string };
};

type Candidate = {
  chain: string;
  address: string;
  symbol: string;
  name: string;
  priceUsd: number;
  change1h: number | null;
  change24h: number | null;
  liquidityUsd: number;
  imageUrl: string | null;
};

let memory: { at: number; boards: ChainMoversBoard[] } | null = null;

async function dexFetch(path: string): Promise<unknown | null> {
  try {
    const res = await fetch(`${DEX_BASE}${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: CHAIN_MOVERS_REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function asPairs(data: unknown): DexPair[] {
  if (Array.isArray(data)) {
    return data.filter((p): p is DexPair => Boolean(p) && typeof p === "object");
  }
  if (!data || typeof data !== "object") return [];
  const obj = data as { pairs?: unknown };
  if (Array.isArray(obj.pairs)) {
    return obj.pairs.filter((p): p is DexPair => Boolean(p) && typeof p === "object");
  }
  return [];
}

function pickBestPair(pairs: DexPair[]): DexPair | null {
  if (pairs.length === 0) return null;
  return (
    [...pairs].sort(
      (a, b) =>
        (parseDexUsdNumber(b.liquidity?.usd) ?? 0) - (parseDexUsdNumber(a.liquidity?.usd) ?? 0),
    )[0] ?? null
  );
}

function shouldSkipBase(symbol: string, name: string): boolean {
  const s = symbol.trim().toLowerCase();
  if (!s || SKIP_SYMBOLS.has(s)) return true;
  if (SKIP_NAME_RE.test(name.trim())) return true;
  return false;
}

function pairChain(pair: DexPair): string {
  return normalizeDexChainId(pair.chainId) ?? pair.chainId?.trim().toLowerCase() ?? "";
}

function pairToCandidate(pair: DexPair, expectChain: string): Candidate | null {
  const base = pair.baseToken;
  if (!base?.address || !base.symbol) return null;
  const chain = pairChain(pair);

  if (expectChain === "injective") {
    const isInjChain = chain === "injective";
    const isInjToken = base.symbol.trim().toUpperCase() === "INJ";
    if (!isInjChain && !isInjToken) return null;
  } else if (chain !== expectChain) {
    return null;
  }

  const symbol = base.symbol.trim();
  const name = (base.name ?? symbol).trim();
  // Allow INJ itself on injective board (native); skip other natives via SKIP_SYMBOLS
  if (expectChain === "injective" && symbol.toUpperCase() === "INJ") {
    // keep
  } else if (shouldSkipBase(symbol, name)) {
    return null;
  }

  const liquidityUsd = parseDexUsdNumber(pair.liquidity?.usd);
  if (liquidityUsd == null || liquidityUsd < MIN_LIQUIDITY_USD) return null;

  const priceUsd = parseDexUsdNumber(pair.priceUsd);
  if (priceUsd == null || !Number.isFinite(priceUsd) || priceUsd <= 0) return null;

  const change1h = parseDexUsdNumber(pair.priceChange?.h1);
  const change24h = parseDexUsdNumber(pair.priceChange?.h24);
  if (
    (change1h == null || !Number.isFinite(change1h)) &&
    (change24h == null || !Number.isFinite(change24h))
  ) {
    return null;
  }

  return {
    chain: expectChain === "injective" ? "injective" : chain,
    address: base.address,
    symbol: symbol.toUpperCase(),
    name: name || symbol,
    priceUsd,
    change1h: change1h != null && Number.isFinite(change1h) ? change1h : null,
    change24h: change24h != null && Number.isFinite(change24h) ? change24h : null,
    liquidityUsd,
    imageUrl: typeof pair.info?.imageUrl === "string" ? pair.info.imageUrl : null,
  };
}

function dedupeByAddress(pairs: DexPair[], expectChain: string): Candidate[] {
  const grouped = new Map<string, DexPair[]>();
  for (const pair of pairs) {
    const addr = pair.baseToken?.address?.trim().toLowerCase();
    if (!addr) continue;
    const chain = pairChain(pair);
    if (expectChain === "injective") {
      const isInjChain = chain === "injective";
      const isInjToken = (pair.baseToken?.symbol ?? "").trim().toUpperCase() === "INJ";
      if (!isInjChain && !isInjToken) continue;
    } else if (chain !== expectChain) {
      continue;
    }
    const key = `${expectChain}:${addr}`;
    const bucket = grouped.get(key) ?? [];
    bucket.push(pair);
    grouped.set(key, bucket);
  }

  const out: Candidate[] = [];
  for (const bucket of grouped.values()) {
    const best = pickBestPair(bucket);
    if (!best) continue;
    const row = pairToCandidate(best, expectChain);
    if (row) out.push(row);
  }
  return out;
}

async function fetchBoostPairsForChain(chainId: string): Promise<DexPair[]> {
  const topRaw = await dexFetch("/token-boosts/top/v1");
  if (!Array.isArray(topRaw)) return [];

  const addresses: string[] = [];
  for (const item of topRaw) {
    if (!item || typeof item !== "object") continue;
    const row = item as { chainId?: unknown; tokenAddress?: unknown };
    if (typeof row.chainId !== "string" || typeof row.tokenAddress !== "string") continue;
    const chain = normalizeDexChainId(row.chainId) ?? row.chainId.trim().toLowerCase();
    if (chain !== chainId) continue;
    addresses.push(row.tokenAddress.trim());
  }

  const out: DexPair[] = [];
  for (let i = 0; i < addresses.length; i += 30) {
    const batch = addresses.slice(i, i + 30);
    if (batch.length === 0) continue;
    const path = `/tokens/v1/${encodeURIComponent(chainId)}/${batch
      .map(encodeURIComponent)
      .join(",")}`;
    const data = await dexFetch(path);
    out.push(...asPairs(data));
  }
  return out;
}

async function fetchSearchPairsForChain(chainId: string): Promise<DexPair[]> {
  const queries = CHAIN_SEARCH_QUERIES[chainId] ?? [chainId];
  const chunks = await Promise.all(
    queries.map(async (q) => {
      const data = await dexFetch(`/latest/dex/search?q=${encodeURIComponent(q)}`);
      return asPairs(data);
    }),
  );
  return chunks.flat();
}

/** Real per-chain pool — boosts on that chain + filtered searches (+ INJ relatives). */
async function collectPairsForChain(chainId: string): Promise<DexPair[]> {
  if (chainId === "injective") {
    const [boosts, searches] = await Promise.all([
      fetchBoostPairsForChain("injective"),
      fetchSearchPairsForChain("injective"),
    ]);
    return [...boosts, ...searches];
  }
  const [boosts, searches] = await Promise.all([
    fetchBoostPairsForChain(chainId),
    fetchSearchPairsForChain(chainId),
  ]);
  return [...boosts, ...searches];
}

function toMoverRow(c: Candidate, window: MoverWindow, changePct: number): ChainMoverRow {
  return {
    id: `dex:${c.chain}:${c.address.toLowerCase()}`,
    symbol: c.symbol,
    name: c.name,
    chain: c.chain,
    address: c.address,
    priceUsd: c.priceUsd,
    changePct,
    window,
    imageUrl: c.imageUrl,
    liquidityUsd: c.liquidityUsd,
    venue: "dex",
  };
}

function toCexMoverRow(row: CexPadRow, boardChainId: string): ChainMoverRow {
  return {
    id: `cex:${row.id}`,
    symbol: row.base,
    name: row.pairLabel,
    chain: boardChainId,
    address: "",
    priceUsd: row.priceUsd,
    changePct: row.change24hPct,
    window: "24h",
    imageUrl: null,
    liquidityUsd: null,
    venue: "cex",
    cexExchange: row.exchange,
  };
}

/**
 * Pick ONE window for the whole Dex side of the board.
 * Prefer 1H only when most scored pairs actually have h1 — never mix Dex windows.
 */
function pickWindow(pool: Candidate[]): MoverWindow {
  const withAny = pool.filter(
    (c) =>
      (c.change1h != null && Number.isFinite(c.change1h)) ||
      (c.change24h != null && Number.isFinite(c.change24h)),
  );
  if (withAny.length === 0) return "24h";
  const with1h = withAny.filter((c) => c.change1h != null && Number.isFinite(c.change1h));
  if (with1h.length >= MIN_SCORED_FOR_1H && with1h.length / withAny.length >= 0.5) return "1h";
  return "24h";
}

function splitGainersLosers(
  chainId: string,
  chainLabel: string,
  window: MoverWindow,
  scored: ChainMoverRow[],
): ChainMoversBoard {
  const gainers = [...scored]
    .filter((r) => r.changePct > 0)
    .sort((a, b) => b.changePct - a.changePct)
    .slice(0, TOP_N);

  const gainerIds = new Set(gainers.map((r) => r.id));
  const gainerSymbols = new Set(gainers.map((r) => r.symbol.toUpperCase()));

  const losers = [...scored]
    .filter(
      (r) =>
        r.changePct < 0 &&
        !gainerIds.has(r.id) &&
        !gainerSymbols.has(r.symbol.toUpperCase()),
    )
    .sort((a, b) => a.changePct - b.changePct)
    .slice(0, TOP_N);

  return { chainId, chainLabel, window, gainers, losers };
}

function buildBoardForChain(
  chainId: string,
  chainLabel: string,
  pool: Candidate[],
): ChainMoversBoard {
  const window = pickWindow(pool);
  const scored = pool
    .map((c) => {
      const changePct = window === "1h" ? c.change1h : c.change24h;
      if (changePct == null || !Number.isFinite(changePct)) return null;
      return toMoverRow(c, window, changePct);
    })
    .filter((r): r is ChainMoverRow => r != null);

  if (window === "1h" && scored.length < MIN_SCORED_FOR_1H) {
    const scored24 = pool
      .map((c) => {
        if (c.change24h == null || !Number.isFinite(c.change24h)) return null;
        return toMoverRow(c, "24h", c.change24h);
      })
      .filter((r): r is ChainMoverRow => r != null);
    return splitGainersLosers(chainId, chainLabel, "24h", scored24);
  }

  return splitGainersLosers(chainId, chainLabel, window, scored);
}

/**
 * Append CEX rows until gainers and losers each hit TOP_N.
 * Prefer ecosystem-ranked CEX; fall back to any remaining so columns never blank.
 */
function padBoardWithCex(board: ChainMoversBoard, cexRows: CexPadRow[]): ChainMoversBoard {
  const ranked = rankCexPadForBoard(board.chainId, { rows: cexRows, fetchedAt: 0 });
  const usedSymbols = new Set(
    [...board.gainers, ...board.losers].map((r) => r.symbol.toUpperCase()),
  );
  const usedIds = new Set([...board.gainers, ...board.losers].map((r) => r.id));

  const take = (
    side: "gainers" | "losers",
    existing: ChainMoverRow[],
  ): ChainMoverRow[] => {
    const out = [...existing];
    const wantPositive = side === "gainers";

    const tryAppend = (pool: CexPadRow[]) => {
      for (const row of pool) {
        if (out.length >= TOP_N) break;
        const sym = row.base.toUpperCase();
        if (usedSymbols.has(sym) || usedIds.has(`cex:${row.id}`)) continue;
        const positive = row.change24hPct > 0;
        const negative = row.change24hPct < 0;
        if (wantPositive && !positive) continue;
        if (!wantPositive && !negative) continue;
        const mover = toCexMoverRow(row, board.chainId);
        out.push(mover);
        usedSymbols.add(sym);
        usedIds.add(mover.id);
      }
    };

    // Ecosystem-first, then any remaining CEX of the right sign
    tryAppend(ranked);
    if (out.length < TOP_N) {
      tryAppend(
        [...cexRows].sort((a, b) =>
          wantPositive
            ? b.change24hPct - a.change24hPct
            : a.change24hPct - b.change24hPct,
        ),
      );
    }

    // Still short: allow 0% CEX as last resort so column isn't empty
    if (out.length < TOP_N) {
      for (const row of ranked) {
        if (out.length >= TOP_N) break;
        const sym = row.base.toUpperCase();
        if (usedSymbols.has(sym) || usedIds.has(`cex:${row.id}`)) continue;
        const mover = toCexMoverRow(row, board.chainId);
        // Force sign for display if flat
        if (wantPositive && mover.changePct <= 0) mover.changePct = Math.abs(mover.changePct) || 0.01;
        if (!wantPositive && mover.changePct >= 0) mover.changePct = -Math.abs(mover.changePct) || -0.01;
        out.push(mover);
        usedSymbols.add(sym);
        usedIds.add(mover.id);
      }
    }

    return out.slice(0, TOP_N);
  };

  return {
    ...board,
    gainers: take("gainers", board.gainers),
    losers: take("losers", board.losers),
  };
}

async function loadBoardForChain(chainId: string, chainLabel: string): Promise<ChainMoversBoard> {
  const pairs = await collectPairsForChain(chainId);
  const candidates = dedupeByAddress(pairs, chainId);
  return buildBoardForChain(chainId, chainLabel, candidates);
}

async function loadChainMoversUncached(): Promise<ChainMoversBoard[]> {
  const [dexBoards, cexPool] = await Promise.all([
    Promise.all(MOVER_CHAINS.map((c) => loadBoardForChain(c.id, c.label))),
    getCexPadPool(),
  ]);
  return dexBoards.map((board) => padBoardWithCex(board, cexPool.rows));
}

const loadCached = unstable_cache(loadChainMoversUncached, ["dex-chain-movers-v4-eth-sol-base-inj"], {
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
        cexGainers: b.gainers.filter((r) => r.venue === "cex").length,
        cexLosers: b.losers.filter((r) => r.venue === "cex").length,
      })),
    );
    return boards;
  } catch (err) {
    console.warn("[chain-movers] fetch failed", err);
    return (
      memory?.boards ??
      MOVER_CHAINS.map((c) => ({
        chainId: c.id,
        chainLabel: c.label,
        window: "24h" as const,
        gainers: [],
        losers: [],
      }))
    );
  }
}

export function peekChainMoversFetchedAt(): number | null {
  return memory?.at ?? null;
}

/**
 * Flatten cached boards into the best absolute movers for the homepage fold.
 * Optional `chainFilter` keeps ONLY that chain.
 */
export function pickHomeTopMovers(
  boards: ChainMoversBoard[],
  limit = 5,
  chainFilter?: string | null,
): ChainMoverRow[] {
  const want = chainFilter?.trim() ? normalizeDexChainId(chainFilter) : null;
  const scoped = want
    ? boards.filter((b) => sameDexChain(b.chainId, want) || b.chainId === want)
    : boards;
  const scored: ChainMoverRow[] = [];
  for (const board of scoped) {
    scored.push(...board.gainers, ...board.losers);
  }
  const seen = new Set<string>();
  const unique = scored.filter((row) => {
    if (want && row.chain !== want && !sameDexChain(row.chain, want)) return false;
    const key = row.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  // Prefer Dex on the home fold when mixing
  return unique
    .sort((a, b) => {
      if (a.venue !== b.venue) return a.venue === "dex" ? -1 : 1;
      return Math.abs(b.changePct) - Math.abs(a.changePct);
    })
    .slice(0, limit);
}

/** Href for a mover row — Dex token path, or coin search for CEX pads. */
export function chainMoverHref(row: ChainMoverRow): string {
  if (row.venue === "cex" || !row.address) {
    return `/coin?q=${encodeURIComponent(row.symbol)}`;
  }
  return (
    dexTokenPath(row.chain, row.address) ??
    `/token/${encodeURIComponent(row.chain)}/${encodeURIComponent(row.address)}`
  );
}
