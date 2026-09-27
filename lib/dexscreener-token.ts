import { getDexScreenerLowCaps } from "@/lib/dexscreener-low-caps";
import {
  dexChainLookupCandidates,
  normalizeDexChainId,
  canonicalizeTokenAddress,
  sanitizeAddressParam,
  sameDexChain,
  sameTokenAddress,
} from "@/lib/dex-token-path";
import {
  mergeDexProjectLinks,
  parseDexPairInfoLinks,
  type DexProjectLink,
} from "@/lib/dex-project-links";
import { getDexProfileLinksByToken } from "@/lib/dexscreener-profile-links";
import { geckoNetworkFromDexChain } from "@/lib/geckoterminal-trades";
import { dexVenueId, dexVenueLabel } from "@/lib/dex-venue";
import { resolveTokenImageUrl } from "@/lib/token-image";

const DEX_BASE = "https://api.dexscreener.com";
/** Short TTL — avoid long-lived empty/miss caches on cold token pages. */
const TOKEN_FETCH_REVALIDATE_SECONDS = 120;

export type DexTokenOtherPair = {
  pairLabel: string;
  dexLabel: string;
  volume: number | null;
  liquidity: number | null;
  pairAddress: string;
  /** On-site link — same token with preferred pair. */
  href: string;
};

export type DexTokenPageData = {
  chain: string;
  address: string;
  name: string;
  symbol: string;
  image: string;
  priceUsd: number | null;
  change24h: number | null;
  volume: number | null;
  liquidity: number | null;
  marketCap: number | null;
  pairAgeLabel: string;
  pairAddress: string | null;
  pairUrl: string | null;
  dexId?: string;
  dexLabel?: string;
  /** Website / socials from DexScreener when present. */
  projectLinks?: DexProjectLink[];
  /** Other liquid pairs for this base (on-site `?pair=`). */
  otherPairs: DexTokenOtherPair[];
  /** True when this token is in the current New & Low Caps set (UI enrichment). */
  inLowCapsList: boolean;
};

type DexPair = {
  chainId?: string;
  dexId?: string;
  url?: string;
  pairAddress?: string;
  priceUsd?: string | number;
  baseToken?: { address?: string; name?: string; symbol?: string };
  quoteToken?: { address?: string; name?: string; symbol?: string };
  priceChange?: { h24?: number };
  volume?: { h24?: number };
  liquidity?: { usd?: number };
  marketCap?: number | null;
  fdv?: number | null;
  pairCreatedAt?: number | null;
  info?: { imageUrl?: string; websites?: unknown; socials?: unknown };
};

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function pairAgeLabel(createdAt: number | null | undefined): string {
  if (createdAt == null || !Number.isFinite(createdAt)) return "New";
  const days = Math.max(0, Math.floor((Date.now() - createdAt) / 86_400_000));
  if (days < 1) return "Today";
  if (days === 1) return "1d ago";
  if (days < 14) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function asPairArray(data: unknown): DexPair[] {
  if (Array.isArray(data)) {
    return data.filter((row): row is DexPair => Boolean(row) && typeof row === "object");
  }
  if (data && typeof data === "object") {
    const obj = data as { pairs?: unknown; pair?: unknown };
    if (Array.isArray(obj.pairs)) {
      return obj.pairs.filter((row): row is DexPair => Boolean(row) && typeof row === "object");
    }
    if (obj.pair && typeof obj.pair === "object") {
      return [obj.pair as DexPair];
    }
  }
  return [];
}

async function dexGet(path: string): Promise<unknown | null> {
  try {
    const res = await fetch(`${DEX_BASE}${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: TOKEN_FETCH_REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("[dex-token] DexScreener fetch failed", path, err);
    return null;
  }
}

function quotePreference(quote: string | undefined): number {
  const q = (quote ?? "").trim().toUpperCase();
  if (q === "USDT") return 0;
  if (q === "USDC") return 1;
  if (
    q === "USD1" ||
    q === "DAI" ||
    q === "FDUSD" ||
    q === "TUSD" ||
    q === "USDE" ||
    q === "BUSD" ||
    q === "USD"
  ) {
    return 2;
  }
  return 3;
}

function isMajorBase(symbol: string | undefined): boolean {
  const s = (symbol ?? "").trim().toUpperCase();
  const majors = new Set([
    "BTC",
    "WBTC",
    "ETH",
    "WETH",
    "SOL",
    "WSOL",
    "BNB",
    "WBNB",
    "AVAX",
    "WAVAX",
    "MATIC",
    "WMATIC",
    "POL",
  ]);
  if (majors.has(s)) return true;
  if (s.startsWith("W") && majors.has(s.slice(1))) return true;
  return false;
}

function pickBestPair(pairs: DexPair[], address: string, preferChain?: string): DexPair | null {
  if (pairs.length === 0) return null;

  const byChain = preferChain
    ? pairs.filter((p) => sameDexChain(p.chainId, preferChain))
    : pairs;
  const scoped = byChain.length > 0 ? byChain : pairs;

  const asBase = scoped.filter((pair) => sameTokenAddress(pair.baseToken?.address, address));
  const asPair = scoped.filter((pair) => sameTokenAddress(pair.pairAddress, address));
  const pool = asBase.length > 0 ? asBase : asPair.length > 0 ? asPair : scoped;
  if (pool.length === 0) return null;

  const major = isMajorBase(pool[0]?.baseToken?.symbol);

  return (
    [...pool].sort((a, b) => {
      if (major) {
        const qa = quotePreference(a.quoteToken?.symbol);
        const qb = quotePreference(b.quoteToken?.symbol);
        if (qa !== qb) return qa - qb;
      }
      const volA = a.volume?.h24 ?? 0;
      const volB = b.volume?.h24 ?? 0;
      if (volB !== volA) return volB - volA;
      return (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0);
    })[0] ?? null
  );
}

type ResolvedDexPairs = {
  best: DexPair;
  /** Same-base pairs on the preferred chain (includes best). */
  sameBase: DexPair[];
};

function sameBasePairs(pairs: DexPair[], address: string, preferChain?: string): DexPair[] {
  const byChain = preferChain
    ? pairs.filter((p) => sameDexChain(p.chainId, preferChain))
    : pairs;
  const scoped = byChain.length > 0 ? byChain : pairs;
  return scoped.filter((pair) => sameTokenAddress(pair.baseToken?.address, address));
}

function preferPairAddress(pairs: DexPair[], prefer: string | null | undefined): DexPair | null {
  if (!prefer?.trim()) return null;
  return pairs.find((p) => sameTokenAddress(p.pairAddress, prefer)) ?? null;
}

/**
 * Resolve a Dex pair for a route param.
 * Route uses **token contract/mint** from the list; pair address is also accepted.
 * Order: `/tokens/v1` (canonical + aliases) → `/latest/dex/tokens` → `/latest/dex/pairs`.
 */
async function resolveDexPair(
  chain: string,
  address: string,
  preferPair?: string | null,
): Promise<ResolvedDexPairs | null> {
  const chainCandidates = dexChainLookupCandidates(chain);

  const tryPool = (pairs: DexPair[]): ResolvedDexPairs | null => {
    const asBase = sameBasePairs(pairs, address, chain);
    const pool = asBase.length > 0 ? asBase : pairs;
    const preferred = preferPairAddress(pool, preferPair);
    const best = preferred ?? pickBestPair(pairs, address, chain);
    if (!best) return null;
    const sameBase =
      asBase.length > 0
        ? asBase
        : sameTokenAddress(best.baseToken?.address, address)
          ? [best]
          : [];
    return { best, sameBase };
  };

  for (const chainId of chainCandidates) {
    const data = await dexGet(
      `/tokens/v1/${encodeURIComponent(chainId)}/${encodeURIComponent(address)}`,
    );
    const hit = tryPool(asPairArray(data));
    if (hit) return hit;
  }

  const byToken = await dexGet(`/latest/dex/tokens/${encodeURIComponent(address)}`);
  {
    const hit = tryPool(asPairArray(byToken));
    if (hit) return hit;
  }

  for (const chainId of chainCandidates) {
    const data = await dexGet(
      `/latest/dex/pairs/${encodeURIComponent(chainId)}/${encodeURIComponent(address)}`,
    );
    const hit = tryPool(asPairArray(data));
    if (hit) return hit;
  }

  return null;
}

/**
 * Lightweight DexScreener token page.
 * Loads live pair data from DexScreener first so clicks work even when the
 * New & Low Caps cache is cold. List cache is enrichment / last-resort only.
 */
export async function getDexScreenerTokenPage(
  chainRaw: string,
  addressRaw: string,
  preferPairRaw?: string | null,
): Promise<DexTokenPageData | null> {
  const chain = normalizeDexChainId(chainRaw);
  const address = sanitizeAddressParam(addressRaw);
  if (!chain || !address) return null;
  const preferPair = preferPairRaw ? sanitizeAddressParam(preferPairRaw) : null;

  let resolved: ResolvedDexPairs | null = null;
  try {
    resolved = await resolveDexPair(chain, address, preferPair);
  } catch (err) {
    console.warn("[dex-token] DexScreener token lookup failed", err);
  }
  const pair = resolved?.best ?? null;

  let listed;
  try {
    const rows = await getDexScreenerLowCaps();
    listed = rows.find((row) => {
      if (!sameDexChain(row.chain, chain)) return false;
      return (
        sameTokenAddress(row.contractAddress, address) ||
        sameTokenAddress(row.pairAddress, address)
      );
    });
  } catch {
    listed = undefined;
  }

  if (!pair && !listed) return null;

  const resolvedChain =
    normalizeDexChainId(pair?.chainId) ??
    normalizeDexChainId(listed?.chain) ??
    chain;

  const tokenAddress = canonicalizeTokenAddress(
    pair?.baseToken?.address ?? listed?.contractAddress ?? address,
  );

  const pairUrl =
    (typeof pair?.url === "string" && pair.url.startsWith("http") ? pair.url : null) ??
    listed?.href ??
    null;

  let profileLinks: DexProjectLink[] | undefined;
  try {
    const map = await getDexProfileLinksByToken();
    const tokenAddr = tokenAddress.toLowerCase();
    profileLinks =
      map[`${resolvedChain}:${tokenAddr}`] ??
      map[`${chain}:${tokenAddr}`];
  } catch {
    profileLinks = undefined;
  }

  const projectLinks = mergeDexProjectLinks(
    parseDexPairInfoLinks(pair?.info),
    listed?.projectLinks,
    profileLinks,
  );

  const activePair = pair?.pairAddress ?? listed?.pairAddress ?? null;
  const tokenPath = `/token/${encodeURIComponent(resolvedChain)}/${encodeURIComponent(tokenAddress)}`;
  const otherPairs: DexTokenOtherPair[] = (resolved?.sameBase ?? [])
    .filter((p) => p.pairAddress && !sameTokenAddress(p.pairAddress, activePair ?? undefined))
    .sort((a, b) => (b.volume?.h24 ?? 0) - (a.volume?.h24 ?? 0))
    .slice(0, 5)
    .map((p) => {
      const base = (p.baseToken?.symbol ?? "TOKEN").toUpperCase();
      const quote = (p.quoteToken?.symbol ?? "?").toUpperCase();
      const pairAddress = p.pairAddress!;
      return {
        pairLabel: `${base}/${quote}`,
        dexLabel: dexVenueLabel(typeof p.dexId === "string" ? p.dexId : undefined),
        volume: p.volume?.h24 ?? null,
        liquidity: p.liquidity?.usd ?? null,
        pairAddress,
        href: `${tokenPath}?pair=${encodeURIComponent(pairAddress)}`,
      };
    });

  return {
    chain: resolvedChain,
    address: tokenAddress,
    name: pair?.baseToken?.name ?? listed?.name ?? "Token",
    symbol: pair?.baseToken?.symbol ?? listed?.symbol ?? "TOKEN",
    image:
      resolveTokenImageUrl({
        dexImage: pair?.info?.imageUrl ?? listed?.image,
        chain: resolvedChain,
        address: tokenAddress,
      }) ?? "",
    priceUsd: asNumber(pair?.priceUsd),
    change24h: asNumber(pair?.priceChange?.h24) ?? listed?.change7d ?? null,
    volume: pair?.volume?.h24 ?? listed?.volume ?? null,
    liquidity: pair?.liquidity?.usd ?? listed?.liquidity ?? null,
    marketCap: asNumber(pair?.marketCap) ?? asNumber(pair?.fdv) ?? listed?.marketCap ?? null,
    pairAgeLabel:
      pair?.pairCreatedAt != null
        ? pairAgeLabel(pair.pairCreatedAt)
        : (listed?.addedLabel ?? "New"),
    pairAddress: activePair,
    pairUrl,
    dexId:
      dexVenueId(typeof pair?.dexId === "string" ? pair.dexId : undefined) ??
      listed?.dexId,
    dexLabel: dexVenueLabel(
      (typeof pair?.dexId === "string" ? pair.dexId : undefined) ?? listed?.dexId,
    ),
    projectLinks: projectLinks.length > 0 ? projectLinks : undefined,
    otherPairs,
    /** Enrichment flag for UI — not used for robots indexing. */
    inLowCapsList: Boolean(listed),
  };
}

export function dexScreenerEmbedUrl(
  pairUrl: string | null,
  chain: string,
  pairAddress: string | null,
): string | null {
  const chainId = normalizeDexChainId(chain) ?? (chain?.trim().toLowerCase() || null);
  // Prefer the pair-address embed path — token URLs often hang on “Loading pair…”.
  if (chainId && pairAddress) {
    return `https://dexscreener.com/${encodeURIComponent(chainId)}/${encodeURIComponent(pairAddress)}?embed=1&theme=dark&trades=0&info=0`;
  }
  if (pairUrl && pairUrl.startsWith("https://dexscreener.com/")) {
    try {
      const url = new URL(pairUrl);
      url.searchParams.set("embed", "1");
      url.searchParams.set("theme", "dark");
      url.searchParams.set("trades", "0");
      url.searchParams.set("info", "0");
      return url.toString();
    } catch {
      return null;
    }
  }
  return null;
}

/** GeckoTerminal pool chart embed — fallback when DexScreener embed fails. */
export function geckoTerminalChartEmbedUrl(
  chain: string | undefined,
  pairAddress: string | null | undefined,
): string | null {
  if (!pairAddress) return null;
  const network = geckoNetworkFromDexChain(chain);
  if (!network) return null;
  const pool =
    network === "solana" || network === "sui"
      ? pairAddress.trim()
      : pairAddress.trim().toLowerCase();
  if (!pool) return null;
  return `https://www.geckoterminal.com/${encodeURIComponent(network)}/pools/${encodeURIComponent(pool)}?embed=1&info=0&swaps=0`;
}
