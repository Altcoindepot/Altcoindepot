/**
 * CoinGecko encyclopedia stats for `/token/[chain]/[address]` only.
 * Live price / chart stay on DexScreener — this module must never drive those.
 *
 * Credits: one contract lookup per cache miss; SUCCESS payloads cached 2h.
 * 429/empty are not stored as success; 429 may return lastGood only.
 */

import {
  coinGeckoFetch,
  getCoinGeckoApiKey,
  getCoinGeckoApiPlan,
  getCoinGeckoLiveSkipReason,
  logCoinGeckoSkip,
} from "@/lib/coingecko";
import {
  geckoPlatformIdForDexChain,
} from "@/lib/gecko-platform-map";

export { geckoPlatformIdForDexChain };

/** Success TTL — 2 hours. */
export const GECKO_STATS_TTL_MS = 2 * 60 * 60 * 1000;

export type GeckoCoinStats = {
  geckoId: string;
  name: string | null;
  symbol: string | null;
  athUsd: number | null;
  athDate: string | null;
  atlUsd: number | null;
  atlDate: string | null;
  circulatingSupply: number | null;
  totalSupply: number | null;
  maxSupply: number | null;
  marketCapUsd: number | null;
  fdvUsd: number | null;
  categories: string[];
  homepage: string | null;
  /** ISO time this payload was fetched / last confirmed good. */
  fetchedAt: string;
};

type CacheEntry = {
  stats: GeckoCoinStats;
  fetchedAtMs: number;
};

const successCache = new Map<string, CacheEntry>();
/** Survives TTL so a later 429 can still show fundamentals. */
const lastGoodByKey = new Map<string, GeckoCoinStats>();

function cacheKey(platform: string, address: string): string {
  const addr = address.startsWith("0x") ? address.toLowerCase() : address;
  return `${platform}:${addr}`;
}

function normalizeContractAddress(address: string): string {
  const v = address.trim();
  return v.startsWith("0x") ? v.toLowerCase() : v;
}

function numOrNull(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return v;
}

function strOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function parseContractCoin(data: unknown, fetchedAtMs: number): GeckoCoinStats | null {
  if (typeof data !== "object" || data === null) return null;
  const obj = data as Record<string, unknown>;
  const id = strOrNull(obj.id);
  if (!id) return null;

  const md =
    typeof obj.market_data === "object" && obj.market_data !== null
      ? (obj.market_data as Record<string, unknown>)
      : null;

  const ath =
    md && typeof md.ath === "object" && md.ath !== null
      ? numOrNull((md.ath as Record<string, unknown>).usd)
      : null;
  const athDate =
    md && typeof md.ath_date === "object" && md.ath_date !== null
      ? strOrNull((md.ath_date as Record<string, unknown>).usd)
      : null;
  const atl =
    md && typeof md.atl === "object" && md.atl !== null
      ? numOrNull((md.atl as Record<string, unknown>).usd)
      : null;
  const atlDate =
    md && typeof md.atl_date === "object" && md.atl_date !== null
      ? strOrNull((md.atl_date as Record<string, unknown>).usd)
      : null;

  const links =
    typeof obj.links === "object" && obj.links !== null
      ? (obj.links as Record<string, unknown>)
      : null;
  let homepage: string | null = null;
  if (links && Array.isArray(links.homepage)) {
    for (const h of links.homepage) {
      const s = strOrNull(h);
      if (s) {
        homepage = s;
        break;
      }
    }
  }

  const categories = Array.isArray(obj.categories)
    ? obj.categories
        .filter((c): c is string => typeof c === "string" && c.trim().length > 0)
        .map((c) => c.trim())
        .slice(0, 8)
    : [];

  const marketCapUsd =
    md && typeof md.market_cap === "object" && md.market_cap !== null
      ? numOrNull((md.market_cap as Record<string, unknown>).usd)
      : null;
  const fdvUsd =
    md && typeof md.fully_diluted_valuation === "object" && md.fully_diluted_valuation !== null
      ? numOrNull((md.fully_diluted_valuation as Record<string, unknown>).usd)
      : md
        ? numOrNull(md.fully_diluted_valuation)
        : null;

  return {
    geckoId: id,
    name: strOrNull(obj.name),
    symbol: strOrNull(obj.symbol),
    athUsd: ath,
    athDate,
    atlUsd: atl,
    atlDate,
    circulatingSupply: md ? numOrNull(md.circulating_supply) : null,
    totalSupply: md ? numOrNull(md.total_supply) : null,
    maxSupply: md ? numOrNull(md.max_supply) : null,
    marketCapUsd,
    fdvUsd,
    categories,
    homepage,
    fetchedAt: new Date(fetchedAtMs).toISOString(),
  };
}

function logStatsCall(fields: {
  hasApiKey: boolean;
  plan: string;
  geckoId: string | null;
  cacheHit: boolean;
  status: string;
  platform?: string;
  key?: string;
}) {
  console.info("[gecko-coin-stats]", {
    hasApiKey: fields.hasApiKey,
    plan: fields.plan,
    geckoId: fields.geckoId,
    cacheHit: fields.cacheHit,
    status: fields.status,
    platform: fields.platform ?? null,
    key: fields.key ?? null,
  });
}

/**
 * Optional CoinGecko fundamentals for a Dex token page.
 * Returns `null` when unmapped, skipped, miss, or 429 with no lastGood.
 */
export async function getGeckoCoinStats(input: {
  chain: string;
  address: string;
}): Promise<GeckoCoinStats | null> {
  const platform = geckoPlatformIdForDexChain(input.chain);
  const hasApiKey = Boolean(getCoinGeckoApiKey());
  const plan = getCoinGeckoApiPlan();

  if (!platform) {
    logStatsCall({
      hasApiKey,
      plan,
      geckoId: null,
      cacheHit: false,
      status: "no-platform",
    });
    return null;
  }

  const address = normalizeContractAddress(input.address);
  if (!address) {
    logStatsCall({
      hasApiKey,
      plan,
      geckoId: null,
      cacheHit: false,
      status: "bad-address",
      platform,
    });
    return null;
  }

  const key = cacheKey(platform, address);
  const now = Date.now();
  const hit = successCache.get(key);
  if (hit && now - hit.fetchedAtMs < GECKO_STATS_TTL_MS) {
    logStatsCall({
      hasApiKey,
      plan,
      geckoId: hit.stats.geckoId,
      cacheHit: true,
      status: "ok",
      platform,
      key,
    });
    return hit.stats;
  }

  const skip = getCoinGeckoLiveSkipReason();
  if (skip) {
    logCoinGeckoSkip(skip);
    const last = lastGoodByKey.get(key) ?? null;
    logStatsCall({
      hasApiKey,
      plan,
      geckoId: last?.geckoId ?? null,
      cacheHit: false,
      status: `skipped:${skip}`,
      platform,
      key,
    });
    return last;
  }

  const path =
    `/coins/${encodeURIComponent(platform)}/contract/${encodeURIComponent(address)}` +
    `?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;

  let res: Response;
  try {
    // Cache successful responses for 2h (Next Data Cache + in-memory).
    // 429/5xx are not treated as success by Next; we also never write them
    // into `successCache`.
    res = await coinGeckoFetch(path, {
      cache: "force-cache",
      next: { revalidate: Math.floor(GECKO_STATS_TTL_MS / 1000) },
    });
  } catch (err) {
    console.warn("[gecko-coin-stats] fetch threw", err);
    const last = lastGoodByKey.get(key) ?? null;
    logStatsCall({
      hasApiKey,
      plan,
      geckoId: last?.geckoId ?? null,
      cacheHit: false,
      status: "network-error",
      platform,
      key,
    });
    return last;
  }

  if (res.status === 429) {
    const last = lastGoodByKey.get(key) ?? null;
    logStatsCall({
      hasApiKey,
      plan,
      geckoId: last?.geckoId ?? null,
      cacheHit: false,
      status: "429",
      platform,
      key,
    });
    return last;
  }

  if (res.status === 404) {
    logStatsCall({
      hasApiKey,
      plan,
      geckoId: null,
      cacheHit: false,
      status: "404",
      platform,
      key,
    });
    return null;
  }

  if (!res.ok) {
    const last = lastGoodByKey.get(key) ?? null;
    logStatsCall({
      hasApiKey,
      plan,
      geckoId: last?.geckoId ?? null,
      cacheHit: false,
      status: `http-${res.status}`,
      platform,
      key,
    });
    return last;
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    logStatsCall({
      hasApiKey,
      plan,
      geckoId: null,
      cacheHit: false,
      status: "bad-json",
      platform,
      key,
    });
    return lastGoodByKey.get(key) ?? null;
  }

  const stats = parseContractCoin(data, now);
  if (!stats) {
    logStatsCall({
      hasApiKey,
      plan,
      geckoId: null,
      cacheHit: false,
      status: "empty",
      platform,
      key,
    });
    return null;
  }

  successCache.set(key, { stats, fetchedAtMs: now });
  lastGoodByKey.set(key, stats);
  // Also key by geckoId so majors can hit via id later if needed.
  lastGoodByKey.set(`id:${stats.geckoId}`, stats);

  logStatsCall({
    hasApiKey,
    plan,
    geckoId: stats.geckoId,
    cacheHit: false,
    status: "ok",
    platform,
    key,
  });

  return stats;
}
