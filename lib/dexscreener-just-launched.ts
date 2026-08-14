import { unstable_cache } from "next/cache";
import { KNOWN_DEX_CHAINS } from "@/lib/format-chain";
import {
  mergeDexProjectLinks,
  parseDexPairInfoLinks,
  parseDexProjectLinks,
  type DexProjectLink,
} from "@/lib/dex-project-links";

const DEX_BASE = "https://api.dexscreener.com";
/** 5 minutes — just-launched pairs go stale quickly. */
export const JUST_LAUNCHED_REVALIDATE_SECONDS = 300;
const MAX_AGE_MS = 60 * 60 * 1000;
const MIN_LIQUIDITY_USD = 5_000;
const LIST_LIMIT = 40;

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

export type JustLaunchedRow = {
  id: string;
  name: string;
  symbol: string;
  image: string;
  chain: string;
  contractAddress: string;
  change: number | null;
  liquidity: number | null;
  volume: number | null;
  marketCap: number | null;
  ageLabel: string;
  pairCreatedAt: number;
  pairUrl?: string;
  projectLinks?: DexProjectLink[];
};

type DexPair = {
  chainId?: string;
  url?: string;
  pairAddress?: string;
  baseToken?: { address?: string; name?: string; symbol?: string };
  priceChange?: { h24?: number; h6?: number; h1?: number };
  volume?: { h24?: number };
  liquidity?: { usd?: number };
  marketCap?: number | null;
  fdv?: number | null;
  pairCreatedAt?: number | null;
  info?: { imageUrl?: string; websites?: unknown; socials?: unknown };
};

type TokenRef = { chainId: string; tokenAddress: string; icon?: string; links?: unknown };

let memory: { at: number; rows: JustLaunchedRow[] } | null = null;

async function dexFetch(path: string): Promise<unknown> {
  const res = await fetch(`${DEX_BASE}${path}`, {
    headers: { Accept: "application/json" },
    cache: "force-cache",
    next: { revalidate: JUST_LAUNCHED_REVALIDATE_SECONDS },
  });
  if (!res.ok) throw new Error(`DexScreener ${path}: ${res.status}`);
  return res.json();
}

function collectRefs(raw: unknown, into: Map<string, TokenRef>) {
  if (!Array.isArray(raw)) return;
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as { chainId?: unknown; tokenAddress?: unknown; icon?: unknown; links?: unknown };
    if (typeof row.chainId !== "string" || typeof row.tokenAddress !== "string") continue;
    const chain = row.chainId.trim().toLowerCase();
    if (!KNOWN_DEX_CHAINS.has(chain)) continue;
    const address = row.tokenAddress.trim();
    if (!address) continue;
    const key = `${chain}:${address.toLowerCase()}`;
    const existing = into.get(key);
    if (existing) {
      if (existing.links == null && row.links != null) existing.links = row.links;
      if (!existing.icon && typeof row.icon === "string") existing.icon = row.icon;
      continue;
    }
    into.set(key, {
      chainId: chain,
      tokenAddress: address,
      icon: typeof row.icon === "string" ? row.icon : undefined,
      links: row.links,
    });
  }
}

function ageLabel(createdAt: number): string {
  const mins = Math.max(0, Math.floor((Date.now() - createdAt) / 60_000));
  if (mins < 1) return "Just now";
  if (mins === 1) return "1m ago";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function pickBestPair(pairs: DexPair[], address: string): DexPair | null {
  const target = address.toLowerCase();
  const matched = pairs.filter(
    (pair) => pair.baseToken?.address?.trim().toLowerCase() === target,
  );
  const pool = matched.length > 0 ? matched : pairs;
  if (pool.length === 0) return null;
  return [...pool].sort((a, b) => (b.volume?.h24 ?? 0) - (a.volume?.h24 ?? 0))[0] ?? null;
}

function pairToRow(pair: DexPair, iconFallback?: string, profileLinks?: unknown): JustLaunchedRow | null {
  const base = pair.baseToken;
  const chain = pair.chainId?.trim().toLowerCase() ?? "";
  const created = pair.pairCreatedAt ?? null;
  if (!base?.address || !base.name || !base.symbol || !chain || created == null) return null;
  const symbol = base.symbol.trim().toLowerCase();
  if (!symbol || SKIP_SYMBOLS.has(symbol)) return null;
  if (!KNOWN_DEX_CHAINS.has(chain)) return null;
  const age = Date.now() - created;
  if (age < -60_000 || age > MAX_AGE_MS) return null;
  const liq = pair.liquidity?.usd ?? 0;
  if (liq < MIN_LIQUIDITY_USD) return null;
  const change = pair.priceChange?.h1 ?? pair.priceChange?.h6 ?? pair.priceChange?.h24 ?? null;
  const marketCap = pair.marketCap ?? pair.fdv ?? null;
  const projectLinks = mergeDexProjectLinks(
    parseDexPairInfoLinks(pair.info),
    parseDexProjectLinks({ profileLinks }),
  );
  return {
    id: `launch-${chain}-${base.address}`,
    name: base.name,
    symbol: base.symbol,
    image: pair.info?.imageUrl ?? iconFallback ?? "",
    chain,
    contractAddress: base.address,
    change: typeof change === "number" && Number.isFinite(change) ? change : null,
    liquidity: liq,
    volume: pair.volume?.h24 ?? null,
    marketCap: typeof marketCap === "number" && Number.isFinite(marketCap) ? marketCap : null,
    ageLabel: ageLabel(created),
    pairCreatedAt: created,
    pairUrl: typeof pair.url === "string" && pair.url.startsWith("http") ? pair.url : undefined,
    projectLinks: projectLinks.length > 0 ? projectLinks : undefined,
  };
}

async function loadJustLaunchedUncached(): Promise<JustLaunchedRow[]> {
  const refs = new Map<string, TokenRef>();
  const [profiles, boosts] = await Promise.all([
    dexFetch("/token-profiles/latest/v1").catch(() => null),
    dexFetch("/token-boosts/latest/v1").catch(() => null),
  ]);
  collectRefs(profiles, refs);
  collectRefs(boosts, refs);
  if (refs.size === 0) return [];

  const byChain = new Map<string, TokenRef[]>();
  for (const ref of refs.values()) {
    const list = byChain.get(ref.chainId) ?? [];
    list.push(ref);
    byChain.set(ref.chainId, list);
  }

  const iconByKey = new Map(
    [...refs.entries()].map(([key, ref]) => [key, ref.icon] as const),
  );
  const linksByKey = new Map(
    [...refs.entries()].map(([key, ref]) => [key, ref.links] as const),
  );
  const rows: JustLaunchedRow[] = [];

  await Promise.all(
    [...byChain.entries()].map(async ([chain, list]) => {
      for (let i = 0; i < list.length; i += 30) {
        const batch = list.slice(i, i + 30);
        const path = `/tokens/v1/${encodeURIComponent(chain)}/${batch
          .map((ref) => encodeURIComponent(ref.tokenAddress))
          .join(",")}`;
        let data: unknown;
        try {
          data = await dexFetch(path);
        } catch {
          continue;
        }
        if (!Array.isArray(data)) continue;
        const pairsByAddress = new Map<string, DexPair[]>();
        for (const raw of data) {
          if (!raw || typeof raw !== "object") continue;
          const pair = raw as DexPair;
          const addr = pair.baseToken?.address?.trim();
          if (!addr) continue;
          const key = addr.toLowerCase();
          const bucket = pairsByAddress.get(key) ?? [];
          bucket.push(pair);
          pairsByAddress.set(key, bucket);
        }
        for (const ref of batch) {
          const pairs = pairsByAddress.get(ref.tokenAddress.toLowerCase()) ?? [];
          const best = pickBestPair(pairs, ref.tokenAddress);
          if (!best) continue;
          const refKey = `${chain}:${ref.tokenAddress.toLowerCase()}`;
          const row = pairToRow(
            best,
            iconByKey.get(refKey),
            linksByKey.get(refKey),
          );
          if (row) rows.push(row);
        }
      }
    }),
  );

  const unique = new Map<string, JustLaunchedRow>();
  for (const row of rows) {
    if (!unique.has(row.id)) unique.set(row.id, row);
  }

  return [...unique.values()]
    .sort((a, b) => b.pairCreatedAt - a.pairCreatedAt)
    .slice(0, LIST_LIMIT);
}

const loadJustLaunchedCached = unstable_cache(
  loadJustLaunchedUncached,
  ["dexscreener-just-launched-v2"],
  { revalidate: JUST_LAUNCHED_REVALIDATE_SECONDS },
);

export async function getJustLaunchedPairs(): Promise<JustLaunchedRow[]> {
  if (memory && Date.now() - memory.at < JUST_LAUNCHED_REVALIDATE_SECONDS * 1000) {
    return memory.rows;
  }
  try {
    const rows = await loadJustLaunchedCached();
    memory = { at: Date.now(), rows };
    console.info("[just-launched] DexScreener pairs", { count: rows.length });
    return rows;
  } catch (err) {
    console.warn("[just-launched] DexScreener fetch failed", err);
    return memory?.rows ?? [];
  }
}
