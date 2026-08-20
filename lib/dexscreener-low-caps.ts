import { unstable_cache } from "next/cache";
import type { LowCapRow } from "@/lib/dashboard-data";
import { NARRATIVES, rotationStatusFromChange, type NarrativeDef } from "@/lib/narratives";
import { parseDexPairInfoLinks } from "@/lib/dex-project-links";
import { normalizeDexChainId } from "@/lib/dex-token-path";
import { dexVenueId, dexVenueLabel } from "@/lib/dex-venue";

const DEX_BASE = "https://api.dexscreener.com";
/** 10 minutes — DexScreener is free but we should not poll on every refresh. */
export const DEXSCREENER_REVALIDATE_SECONDS = 600;
/** Homepage New & Low Caps table size (20–30). */
export const HOMEPAGE_LOW_CAP_LIMIT = 24;
/** Full list for /new-low-caps (target ~40–50). */
export const DEXSCREENER_LIST_LIMIT = 50;
const TRENDING_META_LIMIT = 8;

const LOW_MAX = 500_000_000;
const MIN_LIQUIDITY_USD = 10_000;

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

const FALLBACK_META_SLUGS = ["ai", "dog", "degen", "cat", "meme", "rwa", "defi", "game"];

type DexPair = {
  chainId?: string;
  dexId?: string;
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

type DexMetaListItem = { slug?: string; name?: string };

let memory: { at: number; rows: LowCapRow[] } | null = null;

async function dexFetch(path: string): Promise<unknown> {
  const res = await fetch(`${DEX_BASE}${path}`, {
    headers: { Accept: "application/json" },
    cache: "force-cache",
    next: { revalidate: DEXSCREENER_REVALIDATE_SECONDS },
  });
  if (!res.ok) throw new Error(`DexScreener ${path}: ${res.status}`);
  return res.json();
}

function narrativeBlob(metaSlug: string, name: string, symbol: string): string {
  return `${metaSlug} ${name} ${symbol}`.toLowerCase();
}

function inferNarrative(metaSlug: string, name: string, symbol: string): NarrativeDef {
  const blob = narrativeBlob(metaSlug, name, symbol);
  if (/\bai\b|agent|gpt|llm|virtual/.test(blob)) return NARRATIVES[0]!;
  if (/defi|yield|swap|lend|x402/.test(blob)) return NARRATIVES[1]!;
  if (/rwa|real.?world|treasury|tokenized/.test(blob)) return NARRATIVES[2]!;
  if (/game|nft|play/.test(blob)) return NARRATIVES[3]!;
  if (/depin|wireless|render|helix/.test(blob)) return NARRATIVES[5]!;
  if (/meme|dog|cat|pepe|doge|brainrot|trump|elon|tiktok/.test(blob)) return NARRATIVES[4]!;
  return NARRATIVES[4]!;
}

function displayNarrativeTitle(
  metaSlug: string,
  name: string,
  symbol: string,
  createdAt: number | null,
  narrative: NarrativeDef,
): string {
  const blob = narrativeBlob(metaSlug, name, symbol);
  const mapped =
    /\bai\b|agent|gpt|llm|virtual|defi|yield|swap|lend|x402|rwa|real.?world|treasury|tokenized|game|nft|play|depin|wireless|render|helix|meme|dog|cat|pepe|doge|brainrot|trump/.test(
      blob,
    );
  if (mapped) return narrative.title;
  if (createdAt != null && Date.now() - createdAt < 3 * 86_400_000) return "New";
  return "Low Cap";
}

function addedLabelFromCreated(createdAt: number | null | undefined): string {
  if (createdAt == null || !Number.isFinite(createdAt)) return "New";
  const days = Math.max(0, Math.floor((Date.now() - createdAt) / 86_400_000));
  if (days < 1) return "Today";
  if (days === 1) return "1d ago";
  if (days < 14) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

function isUsefulPair(pair: DexPair): boolean {
  const symbol = pair.baseToken?.symbol?.trim().toLowerCase() ?? "";
  if (!symbol || SKIP_SYMBOLS.has(symbol)) return false;
  const liq = pair.liquidity?.usd ?? 0;
  if (liq < MIN_LIQUIDITY_USD) return false;
  const cap = pair.marketCap ?? pair.fdv ?? null;
  if (cap != null && Number.isFinite(cap) && cap > LOW_MAX) return false;
  return true;
}

function pairToRow(pair: DexPair, metaSlug: string): LowCapRow | null {
  const base = pair.baseToken;
  if (!base?.address || !base.name || !base.symbol) return null;
  const chain = normalizeDexChainId(pair.chainId) ?? pair.chainId?.trim().toLowerCase() ?? "unknown";
  const change = pair.priceChange?.h24 ?? pair.priceChange?.h6 ?? pair.priceChange?.h1 ?? null;
  const narrative = inferNarrative(metaSlug, base.name, base.symbol);
  const created = pair.pairCreatedAt ?? null;
  const marketCap = pair.marketCap ?? pair.fdv ?? null;
  const projectLinks = parseDexPairInfoLinks(pair.info);
  return {
    id: `dex-${chain}-${base.address}`,
    name: base.name,
    symbol: base.symbol,
    image: pair.info?.imageUrl ?? "",
    marketCap: typeof marketCap === "number" && Number.isFinite(marketCap) ? marketCap : null,
    liquidity: pair.liquidity?.usd ?? null,
    chain,
    contractAddress: base.address,
    pairAddress: typeof pair.pairAddress === "string" ? pair.pairAddress : undefined,
    dexId: dexVenueId(typeof pair.dexId === "string" ? pair.dexId : undefined),
    dexLabel: dexVenueLabel(typeof pair.dexId === "string" ? pair.dexId : undefined),
    change7d: typeof change === "number" && Number.isFinite(change) ? change : null,
    volume: pair.volume?.h24 ?? null,
    narrativeSlug: narrative.slug,
    narrativeTitle: displayNarrativeTitle(metaSlug, base.name, base.symbol, created, narrative),
    narrativeColor: narrative.color,
    narrativeGlowClass: narrative.glowClass,
    status: rotationStatusFromChange(change, "24h"),
    addedLabel: addedLabelFromCreated(created),
    pairCreatedAt: created,
    sparkline: null,
    href: typeof pair.url === "string" && pair.url.startsWith("http") ? pair.url : undefined,
    projectLinks: projectLinks.length > 0 ? projectLinks : undefined,
  };
}

function mapMetaPairs(data: unknown, slug: string): LowCapRow[] {
  if (!data || typeof data !== "object") return [];
  const pairs = (data as { pairs?: unknown }).pairs;
  if (!Array.isArray(pairs)) return [];
  const rows: LowCapRow[] = [];
  for (const raw of pairs) {
    if (!raw || typeof raw !== "object") continue;
    const pair = raw as DexPair;
    if (!isUsefulPair(pair)) continue;
    const row = pairToRow(pair, slug);
    if (row) rows.push(row);
  }
  return rows;
}

async function loadMetaPayload(slug: string): Promise<unknown> {
  return dexFetch(`/metas/meta/v1/${encodeURIComponent(slug)}`);
}

function trendingSlugs(trendingRaw: unknown): string[] {
  const slugs: string[] = [];
  if (Array.isArray(trendingRaw)) {
    for (const item of trendingRaw as DexMetaListItem[]) {
      if (typeof item?.slug === "string" && item.slug && !slugs.includes(item.slug)) {
        slugs.push(item.slug);
      }
      if (slugs.length >= TRENDING_META_LIMIT) break;
    }
  }
  for (const fallback of FALLBACK_META_SLUGS) {
    if (slugs.length >= TRENDING_META_LIMIT) break;
    if (!slugs.includes(fallback)) slugs.push(fallback);
  }
  return slugs;
}

async function loadDexLowCapsUncached(): Promise<LowCapRow[]> {
  const trendingRaw = await dexFetch("/metas/trending/v1");
  const slugs = trendingSlugs(trendingRaw);

  const payloads = await Promise.all(
    slugs.map(async (slug) => {
      try {
        return { slug, data: await loadMetaPayload(slug) };
      } catch {
        return { slug, data: null };
      }
    }),
  );

  const byId = new Map<string, LowCapRow>();
  for (const { slug, data } of payloads) {
    if (!data) continue;
    for (const row of mapMetaPairs(data, slug)) {
      if (!byId.has(row.id)) byId.set(row.id, row);
    }
  }

  return [...byId.values()]
    .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0))
    .slice(0, DEXSCREENER_LIST_LIMIT);
}

const loadDexLowCapsCached = unstable_cache(
  loadDexLowCapsUncached,
  ["dexscreener-low-caps-v5"],
  { revalidate: DEXSCREENER_REVALIDATE_SECONDS },
);

/** Recent DexScreener low-cap pairs. Empty array on failure — caller keeps mocks. */
export async function getDexScreenerLowCaps(): Promise<LowCapRow[]> {
  if (memory && Date.now() - memory.at < DEXSCREENER_REVALIDATE_SECONDS * 1000) {
    return memory.rows;
  }
  try {
    const rows = await loadDexLowCapsCached();
    if (rows.length > 0) {
      memory = { at: Date.now(), rows };
      console.info("[dashboard] DexScreener low-caps", { count: rows.length });
      return rows;
    }
  } catch (err) {
    console.warn("[dashboard] DexScreener low-caps failed", err);
  }
  return memory?.rows ?? [];
}

export function peekDexLowCapsFetchedAt(): number | null {
  return memory?.at ?? null;
}
