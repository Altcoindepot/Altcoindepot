/**
 * Hybrid universe search: cached ~7k Gecko index + Dex for contracts/prices.
 * Majors alias map forces BTC/ETH/INJ/… to rank first with USDT preferred.
 * Never calls Gecko per keystroke; never uses Gecko as live ticker.
 */

import {
  getTopCoinsSearchIndex,
  searchTopCoinsIndex,
  pickBestTopCoinMatch,
  type TopCoinSearchEntry,
} from "@/lib/top-coins-index";
import { primaryPlatform } from "@/lib/top-coins-search-utils";
import {
  looksLikeContractQuery,
  searchDexPairs,
  truncateContract,
  type DexSearchHit,
} from "@/lib/dex-search";
import { getCoinDexLive, overlayDexPricesForPlatforms, type CoinDexLive } from "@/lib/coin-dex-live";
import { formatChainLabel } from "@/lib/format-chain";
import type { UniverseSearchHit } from "@/lib/universe-search-types";
import {
  majorFamilySymbols,
  resolveMajorAlias,
  type MajorAlias,
} from "@/lib/majors-alias-map";
import {
  dexScreenerEmbedUrl,
  geckoTerminalChartEmbedUrl,
} from "@/lib/dexscreener-token";

export type { UniverseSearchHit };

const STABLE_ORDER = ["USDT", "USDC", "USD1", "DAI", "FDUSD", "TUSD", "USDE", "BUSD", "USD"];

function quoteRank(q: string | null | undefined): number {
  const u = (q ?? "").toUpperCase();
  const i = STABLE_ORDER.indexOf(u);
  return i === -1 ? 99 : i;
}

function entryToHit(
  entry: TopCoinSearchEntry,
  opts: {
    priceUsd: number | null;
    pairLabel?: string | null;
    quoteSymbol?: string | null;
    chain?: string | null;
    address?: string | null;
    tier?: UniverseSearchHit["rankTier"];
  },
): UniverseSearchHit {
  const primary = primaryPlatform(entry);
  const chain = opts.chain ?? primary?.chain ?? null;
  const address = opts.address ?? primary?.address ?? null;
  const quote = (opts.quoteSymbol ?? "USDT").toUpperCase();
  const pairLabel =
    opts.pairLabel ?? `${entry.symbol.toUpperCase()}/${quote}`;
  return {
    id: entry.id,
    kind: "coin",
    symbol: entry.symbol,
    name: entry.name,
    chain,
    address,
    truncatedContract: address ? truncateContract(address) : null,
    chainLabel: chain ? formatChainLabel(chain) : null,
    priceUsd: opts.priceUsd,
    imageUrl: entry.image || null,
    href: `/coin/${encodeURIComponent(entry.id)}`,
    pairLabel,
    rankTier: opts.tier ?? "other",
  };
}

function dexHitToUniverse(hit: DexSearchHit, tier: UniverseSearchHit["rankTier"]): UniverseSearchHit {
  return {
    id: hit.id,
    kind: "token",
    symbol: hit.symbol,
    name: hit.name,
    chain: hit.chain,
    address: hit.address,
    truncatedContract: truncateContract(hit.address),
    chainLabel: formatChainLabel(hit.chain),
    priceUsd: hit.priceUsd,
    imageUrl: hit.imageUrl,
    href: hit.href,
    pairLabel: `${hit.symbol.toUpperCase()}/${hit.quoteSymbol || "USDT"}`,
    rankTier: tier,
  };
}

function synthesizeMajorEntry(major: MajorAlias, indexed: TopCoinSearchEntry | null): TopCoinSearchEntry {
  if (indexed) return indexed;
  return {
    id: major.id,
    name: major.names[0] ? major.names[0].replace(/\b\w/g, (c) => c.toUpperCase()) : major.symbol,
    symbol: major.symbol,
    image: "",
    rank: 1,
    current_price: null,
    price_change_percentage_24h: null,
    platforms: major.preferred
      ? [{ chain: major.preferred.chain, address: major.preferred.address, geckoPlatform: major.preferred.chain }]
      : [],
  };
}

async function resolveMajorDexLive(
  major: MajorAlias,
  entry: TopCoinSearchEntry,
): Promise<CoinDexLive | null> {
  const platforms = [
    ...(major.preferred
      ? [{ chain: major.preferred.chain, address: major.preferred.address, geckoPlatform: major.preferred.chain }]
      : []),
    ...(entry.platforms ?? []),
  ];
  if (platforms.length > 0) {
    const live = await getCoinDexLive(platforms);
    if (live) return live;
  }

  // Dex symbol search — keep only exact / family base symbols, prefer USDT
  const family = majorFamilySymbols(major);
  const dexHits = await searchDexPairs(major.symbol, 24);
  const exact = dexHits
    .filter((h) => family.has(h.symbol.toUpperCase()))
    .sort((a, b) => {
      const qa = quoteRank(a.quoteSymbol);
      const qb = quoteRank(b.quoteSymbol);
      if (qa !== qb) return qa - qb;
      return (b.liquidityUsd ?? 0) - (a.liquidityUsd ?? 0);
    });
  const best = exact[0];
  if (!best) return null;
  const dexChart = dexScreenerEmbedUrl(best.pairUrl, best.chain, best.pairAddress);
  const gtChart = geckoTerminalChartEmbedUrl(best.chain, best.pairAddress);
  return {
    chain: best.chain,
    address: best.address,
    priceUsd: best.priceUsd,
    change24h: best.change24h,
    volume24h: best.volume24h,
    liquidityUsd: best.liquidityUsd,
    quoteSymbol: best.quoteSymbol || "USDT",
    pairAddress: best.pairAddress,
    pairUrl: best.pairUrl,
    dexChartEmbedUrl: dexChart,
    geckoTerminalEmbedUrl: gtChart,
    chartEmbedUrl: dexChart ?? gtChart,
    tokenHref: best.href,
  };
}

function sortHits(hits: UniverseSearchHit[]): UniverseSearchHit[] {
  const tierOrder = { major_usdt: 0, major_other: 1, other: 2 } as const;
  return [...hits].sort((a, b) => {
    const ta = tierOrder[a.rankTier ?? "other"];
    const tb = tierOrder[b.rankTier ?? "other"];
    if (ta !== tb) return ta - tb;
    const qa = quoteRank(a.pairLabel?.split("/")[1]);
    const qb = quoteRank(b.pairLabel?.split("/")[1]);
    if (qa !== qb) return qa - qb;
    return 0;
  });
}

export async function searchUniverse(query: string, limit = 10): Promise<UniverseSearchHit[]> {
  const q = query.trim();
  if (!q) return [];
  const capped = Math.min(12, Math.max(1, Math.floor(limit)));

  // Contract → address path (no majors boost)
  if (looksLikeContractQuery(q)) {
    const index = await getTopCoinsSearchIndex();
    const indexed = pickBestTopCoinMatch(index, q);
    if (indexed && (indexed.platforms ?? []).some((p) => p.address.toLowerCase() === q.toLowerCase())) {
      const prices = await overlayDexPricesForPlatforms([
        { id: indexed.id, platforms: indexed.platforms ?? [] },
      ]);
      return [entryToHit(indexed, { priceUsd: prices.get(indexed.id) ?? null, tier: "other" })];
    }

    const dexHits = await searchDexPairs(q, capped);
    return dexHits.map((hit) => dexHitToUniverse(hit, "other"));
  }

  const major = resolveMajorAlias(q);
  const index = await getTopCoinsSearchIndex();

  if (major) {
    const indexed = index.find((e) => e.id === major.id) ?? null;
    const entry = synthesizeMajorEntry(major, indexed);
    const dexLive = await resolveMajorDexLive(major, entry);
    const quote = (dexLive?.quoteSymbol || "USDT").toUpperCase();
    const pairLabel = `${major.symbol}/${quote}`;
    const tier: UniverseSearchHit["rankTier"] =
      quoteRank(quote) <= 2 ? "major_usdt" : "major_other";

    const canonical = entryToHit(entry, {
      priceUsd: dexLive?.priceUsd ?? null,
      pairLabel,
      quoteSymbol: quote,
      chain: dexLive?.chain ?? major.preferred?.chain ?? null,
      address: dexLive?.address ?? major.preferred?.address ?? null,
      tier,
    });

    const family = majorFamilySymbols(major);
    const restEntries = searchTopCoinsIndex(index, q, capped + 8).filter((e) => e.id !== major.id);

    // Other pairs of the same major family from Dex (WBTC etc.)
    let familyDex: UniverseSearchHit[] = [];
    try {
      const dexHits = await searchDexPairs(major.symbol, 16);
      familyDex = dexHits
        .filter((h) => family.has(h.symbol.toUpperCase()))
        .filter((h) => h.address.toLowerCase() !== (canonical.address ?? "").toLowerCase())
        .slice(0, 3)
        .map((h) => dexHitToUniverse(h, "major_other"));
    } catch {
      familyDex = [];
    }

    const restPrices = await overlayDexPricesForPlatforms(
      restEntries.map((e) => ({ id: e.id, platforms: e.platforms ?? [] })),
    );
    const restHits = restEntries.map((e) =>
      entryToHit(e, { priceUsd: restPrices.get(e.id) ?? null, tier: "other" }),
    );

    const merged = sortHits([canonical, ...familyDex, ...restHits]);
    const seen = new Set<string>();
    const out: UniverseSearchHit[] = [];
    for (const hit of merged) {
      const key = hit.kind === "coin" ? `coin:${hit.id}` : `token:${hit.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(hit);
      if (out.length >= capped) break;
    }
    // Guarantee canonical is first
    const without = out.filter((h) => !(h.kind === "coin" && h.id === major.id));
    return [canonical, ...without].slice(0, capped);
  }

  // Non-major ticker/name
  const entries = searchTopCoinsIndex(index, q, capped);
  if (entries.length === 0) {
    const dexHits = await searchDexPairs(q, capped);
    return dexHits.map((hit) => dexHitToUniverse(hit, "other"));
  }

  const prices = await overlayDexPricesForPlatforms(
    entries.map((e) => ({ id: e.id, platforms: e.platforms ?? [] })),
  );

  return entries.map((e) =>
    entryToHit(e, { priceUsd: prices.get(e.id) ?? null, tier: "other" }),
  );
}
