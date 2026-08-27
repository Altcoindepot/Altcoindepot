/**
 * Hybrid universe search: cached ~7k Gecko index + Dex for contracts/prices.
 * Majors identity = Coinbase+Binance catalog (12h). Forces BTC/ETH/INJ first with USDT Dex.
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
  getMajorsCatalog,
  isKnownFamilyContract,
  majorFamilySymbols,
  resolveMajorSync,
  type MajorCatalogEntry,
} from "@/lib/majors-catalog";
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

/** Pair chip for majors — BTC/USDT (name shown beside Major badge in UI). */
function majorPairLabel(major: MajorCatalogEntry, quote: string): string {
  return `${major.symbol}/${quote.toUpperCase()}`;
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

function synthesizeMajorEntry(
  major: MajorCatalogEntry,
  indexed: TopCoinSearchEntry | null,
): TopCoinSearchEntry {
  if (indexed) {
    return {
      ...indexed,
      name: major.name || indexed.name,
      symbol: major.symbol,
    };
  }
  return {
    id: major.geckoId ?? major.symbol.toLowerCase(),
    name: major.name,
    symbol: major.symbol,
    image: "",
    rank: 1,
    current_price: null,
    price_change_percentage_24h: null,
    platforms: major.preferred
      ? [
          {
            chain: major.preferred.chain,
            address: major.preferred.address,
            geckoPlatform: major.preferred.chain,
          },
        ]
      : [],
  };
}

async function resolveMajorDexLive(
  major: MajorCatalogEntry,
  entry: TopCoinSearchEntry,
): Promise<CoinDexLive | null> {
  const platforms = [
    ...(major.preferred
      ? [
          {
            chain: major.preferred.chain,
            address: major.preferred.address,
            geckoPlatform: major.preferred.chain,
          },
        ]
      : []),
    ...(entry.platforms ?? []),
  ];
  if (platforms.length > 0) {
    const live = await getCoinDexLive(platforms);
    if (live) return live;
  }

  // Dex symbol search — family symbols only; known contracts + name affinity beat memes
  const family = majorFamilySymbols(major);
  const majorName = major.name.toLowerCase();
  const dexHits = await searchDexPairs(major.symbol, 24);
  const exact = dexHits
    .filter((h) => family.has(h.symbol.toUpperCase()))
    .sort((a, b) => {
      const knownA = isKnownFamilyContract(major, a.address) ? 0 : 1;
      const knownB = isKnownFamilyContract(major, b.address) ? 0 : 1;
      if (knownA !== knownB) return knownA - knownB;
      const nameA = (() => {
        const n = a.name.toLowerCase();
        if (n === majorName) return 0;
        if (n.includes(majorName) || majorName.includes(n)) return 1;
        return 2;
      })();
      const nameB = (() => {
        const n = b.name.toLowerCase();
        if (n === majorName) return 0;
        if (n.includes(majorName) || majorName.includes(n)) return 1;
        return 2;
      })();
      if (nameA !== nameB) return nameA - nameB;
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
    const qa = quoteRank(a.pairLabel?.split("/").pop());
    const qb = quoteRank(b.pairLabel?.split("/").pop());
    if (qa !== qb) return qa - qb;
    return 0;
  });
}

export async function searchUniverse(query: string, limit = 10): Promise<UniverseSearchHit[]> {
  const q = query.trim();
  if (!q) return [];
  const capped = Math.min(12, Math.max(1, Math.floor(limit)));

  // Warm majors catalog once per request (cached 12h — not per keystroke upstream).
  await getMajorsCatalog();

  // Contract → address path (no majors boost)
  if (looksLikeContractQuery(q)) {
    const index = await getTopCoinsSearchIndex();
    const indexed = pickBestTopCoinMatch(index, q, null);
    if (indexed && (indexed.platforms ?? []).some((p) => p.address.toLowerCase() === q.toLowerCase())) {
      const prices = await overlayDexPricesForPlatforms([
        { id: indexed.id, platforms: indexed.platforms ?? [] },
      ]);
      return [entryToHit(indexed, { priceUsd: prices.get(indexed.id) ?? null, tier: "other" })];
    }

    const dexHits = await searchDexPairs(q, capped);
    return dexHits.map((hit) => dexHitToUniverse(hit, "other"));
  }

  const major = resolveMajorSync(q);
  const index = await getTopCoinsSearchIndex();

  if (major) {
    const indexed =
      (major.geckoId ? index.find((e) => e.id === major.geckoId) : null) ?? null;
    const entry = synthesizeMajorEntry(major, indexed);
    const dexLive = await resolveMajorDexLive(major, entry);
    const quote = (dexLive?.quoteSymbol || "USDT").toUpperCase();
    const pairLabel = majorPairLabel(major, quote);
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
    // Keep href on /coin/[geckoId] when we have one
    if (major.geckoId) {
      canonical.id = major.geckoId;
      canonical.href = `/coin/${encodeURIComponent(major.geckoId)}`;
    }

    const family = majorFamilySymbols(major);
    const restEntries = searchTopCoinsIndex(index, q, capped + 8, major).filter(
      (e) => e.id !== major.geckoId,
    );

    // Other pairs of the same asset (known wrapped contracts only) — not random "BTC" memes
    let familyDex: UniverseSearchHit[] = [];
    try {
      const dexHits = await searchDexPairs(major.symbol, 16);
      familyDex = dexHits
        .filter((h) => family.has(h.symbol.toUpperCase()))
        .filter((h) => isKnownFamilyContract(major, h.address))
        .filter((h) => h.address.toLowerCase() !== (canonical.address ?? "").toLowerCase())
        .slice(0, 3)
        .map((h) => {
          const hit = dexHitToUniverse(h, "major_other");
          hit.pairLabel = `${h.symbol.toUpperCase()}/${h.quoteSymbol || "USDT"}`;
          return hit;
        });
    } catch {
      familyDex = [];
    }

    // Dex leftovers / copycats — AFTER major (tier other)
    let dexLeftovers: UniverseSearchHit[] = [];
    try {
      const dexHits = await searchDexPairs(q, 12);
      dexLeftovers = dexHits
        .filter((h) => h.address.toLowerCase() !== (canonical.address ?? "").toLowerCase())
        .filter((h) => !isKnownFamilyContract(major, h.address))
        .slice(0, 6)
        .map((h) => dexHitToUniverse(h, "other"));
    } catch {
      dexLeftovers = [];
    }

    const restPrices = await overlayDexPricesForPlatforms(
      restEntries.map((e) => ({ id: e.id, platforms: e.platforms ?? [] })),
    );
    const restHits = restEntries.map((e) =>
      entryToHit(e, { priceUsd: restPrices.get(e.id) ?? null, tier: "other" }),
    );

    const merged = sortHits([canonical, ...familyDex, ...restHits, ...dexLeftovers]);
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
    const without = out.filter(
      (h) => !(h.kind === "coin" && major.geckoId && h.id === major.geckoId),
    );
    return [canonical, ...without].slice(0, capped);
  }

  // Non-major ticker/name
  const entries = searchTopCoinsIndex(index, q, capped, null);
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
