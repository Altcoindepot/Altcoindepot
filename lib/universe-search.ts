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
import { resolveTokenImageUrl } from "@/lib/token-image";
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
import { dexTokenPath } from "@/lib/dex-token-path";

export type { UniverseSearchHit };

const STABLE_ORDER = ["USDT", "USDC", "USD1", "DAI", "FDUSD", "TUSD", "USDE", "BUSD", "USD"];

function quoteRank(q: string | null | undefined): number {
  const u = (q ?? "").toUpperCase();
  const i = STABLE_ORDER.indexOf(u);
  return i === -1 ? 99 : i;
}

/** Prefer on-site /token when we have chain + contract; /coin only as encyclopedia fallback. */
function tokenOrCoinHref(input: {
  geckoId?: string | null;
  chain?: string | null;
  address?: string | null;
}): string {
  const path = dexTokenPath(input.chain ?? undefined, input.address ?? undefined);
  if (path) return path;
  if (input.geckoId) return `/coin/${encodeURIComponent(input.geckoId)}`;
  return "/coin";
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
  const href = tokenOrCoinHref({ geckoId: entry.id, chain, address });
  const kind: UniverseSearchHit["kind"] = href.startsWith("/token/") ? "token" : "coin";
  return {
    id: entry.id,
    kind,
    symbol: entry.symbol,
    name: entry.name,
    chain,
    address,
    truncatedContract: address ? truncateContract(address) : null,
    chainLabel: chain ? formatChainLabel(chain) : null,
    priceUsd: opts.priceUsd,
    imageUrl: resolveTokenImageUrl({
      chain,
      address,
      geckoImageSmall: entry.image || null,
    }),
    href,
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

function nameAffinity(hitName: string, majorName: string): number {
  const n = hitName.toLowerCase().trim();
  const m = majorName.toLowerCase().trim();
  if (!n || !m) return 3;
  if (n === m) return 0;
  if (n.includes(m) || m.includes(n)) return 1;
  // Wrapped aliases
  if (n.includes(`wrapped ${m}`) || n.startsWith("w") && m && n.includes(m)) return 1;
  return 3;
}

function isExactMajorTicker(hitSymbol: string, major: MajorCatalogEntry): boolean {
  const family = majorFamilySymbols(major);
  return family.has(hitSymbol.trim().toUpperCase());
}

/** Credible major Dex hit — known contract or exact family ticker with name affinity. */
function isCredibleMajorDexHit(major: MajorCatalogEntry, hit: DexSearchHit): boolean {
  if (!isExactMajorTicker(hit.symbol, major)) return false;
  if (isKnownFamilyContract(major, hit.address)) return true;
  // Reject farm tokens that only share the ticker letters.
  return nameAffinity(hit.name, major.name) <= 1;
}

function dexHitToLive(hit: DexSearchHit): CoinDexLive {
  const dexChart = dexScreenerEmbedUrl(hit.pairUrl, hit.chain, hit.pairAddress);
  const gtChart = geckoTerminalChartEmbedUrl(hit.chain, hit.pairAddress);
  return {
    chain: hit.chain,
    address: hit.address,
    priceUsd: hit.priceUsd,
    change24h: hit.change24h,
    volume24h: hit.volume24h,
    liquidityUsd: hit.liquidityUsd,
    quoteSymbol: (hit.quoteSymbol || "USDT").toUpperCase(),
    pairAddress: hit.pairAddress,
    pairUrl: hit.pairUrl,
    dexChartEmbedUrl: dexChart,
    geckoTerminalEmbedUrl: gtChart,
    chartEmbedUrl: dexChart ?? gtChart,
    tokenHref: hit.href,
  };
}

/**
 * Pick the major's live Dex pair.
 * Order: known/preferred contract + USDT → preferred live → exact family + volume.
 * Never promotes USDC or farm tickers over an available USDT on the real asset.
 */
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

  // 1) Resolve preferred / platform contracts directly (contract lookup, not ticker search).
  let platformLive: CoinDexLive | null = null;
  if (platforms.length > 0) {
    try {
      platformLive = await getCoinDexLive(platforms);
    } catch {
      platformLive = null;
    }
  }

  // Preferred address via Dex contract search — guarantees real WBTC/WETH/WSOL/INJ pools.
  let preferredHits: DexSearchHit[] = [];
  if (major.preferred?.address) {
    try {
      preferredHits = await searchDexPairs(major.preferred.address, 16);
    } catch {
      preferredHits = [];
    }
  }
  const preferredUsdt = preferredHits.find(
    (h) =>
      isKnownFamilyContract(major, h.address) &&
      (h.quoteSymbol || "").toUpperCase() === "USDT",
  );
  if (preferredUsdt) return dexHitToLive(preferredUsdt);
  if (platformLive && platformLive.quoteSymbol.toUpperCase() === "USDT") {
    return platformLive;
  }

  // 2) Ticker Dex search — known contracts only for USDT (blocks farm "BTC"/"INJ").
  let dexHits: DexSearchHit[] = [];
  try {
    dexHits = await searchDexPairs(major.symbol, 32);
  } catch {
    dexHits = [];
  }

  const knownHits = dexHits
    .filter((h) => isKnownFamilyContract(major, h.address))
    .sort((a, b) => {
      const qa = quoteRank(a.quoteSymbol);
      const qb = quoteRank(b.quoteSymbol);
      if (qa !== qb) return qa - qb;
      return (b.volume24h ?? 0) - (a.volume24h ?? 0);
    });
  const knownUsdt = knownHits.find((h) => (h.quoteSymbol || "").toUpperCase() === "USDT");
  if (knownUsdt) return dexHitToLive(knownUsdt);

  // Credible USDT on another venue (e.g. BSC INJ/USDT) before falling back to preferred USDC.
  const credibleUsdt = dexHits
    .filter((h) => isCredibleMajorDexHit(major, h))
    .filter((h) => (h.quoteSymbol || "").toUpperCase() === "USDT")
    .sort((a, b) => {
      const nameA = nameAffinity(a.name, major.name);
      const nameB = nameAffinity(b.name, major.name);
      if (nameA !== nameB) return nameA - nameB;
      return (b.volume24h ?? 0) - (a.volume24h ?? 0);
    })[0];
  if (credibleUsdt && nameAffinity(credibleUsdt.name, major.name) <= 1) {
    return dexHitToLive(credibleUsdt);
  }

  // Preferred/platform any quote (USDC OK only when no USDT on the real asset).
  const preferredBest = preferredHits
    .filter((h) => isKnownFamilyContract(major, h.address))
    .sort((a, b) => {
      const qa = quoteRank(a.quoteSymbol);
      const qb = quoteRank(b.quoteSymbol);
      if (qa !== qb) return qa - qb;
      return (b.volume24h ?? 0) - (a.volume24h ?? 0);
    })[0];
  if (preferredBest) return dexHitToLive(preferredBest);
  if (knownHits[0]) return dexHitToLive(knownHits[0]);
  if (platformLive) return platformLive;

  // No preferred/known contract — credible name match (still USDT first).
  const credible = dexHits
    .filter((h) => isCredibleMajorDexHit(major, h))
    .sort((a, b) => {
      const nameA = nameAffinity(a.name, major.name);
      const nameB = nameAffinity(b.name, major.name);
      if (nameA !== nameB) return nameA - nameB;
      const qa = quoteRank(a.quoteSymbol);
      const qb = quoteRank(b.quoteSymbol);
      if (qa !== qb) return qa - qb;
      return (b.volume24h ?? 0) - (a.volume24h ?? 0);
    });
  const credUsdt = credible.find((h) => (h.quoteSymbol || "").toUpperCase() === "USDT");
  if (credUsdt) return dexHitToLive(credUsdt);
  if (credible[0]) return dexHitToLive(credible[0]);

  return null;
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

function sortMajorFamilyHits(hits: UniverseSearchHit[]): UniverseSearchHit[] {
  return [...hits].sort((a, b) => {
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
    // Only real USDT gets the major_usdt tier — never USDC.
    const tier: UniverseSearchHit["rankTier"] =
      quote === "USDT" ? "major_usdt" : "major_other";

    const canonical = entryToHit(entry, {
      priceUsd: dexLive?.priceUsd ?? null,
      pairLabel,
      quoteSymbol: quote,
      chain: dexLive?.chain ?? major.preferred?.chain ?? null,
      address: dexLive?.address ?? major.preferred?.address ?? null,
      tier,
    });
    // Prefer /token when we have a contract; keep gecko id for identity.
    if (major.geckoId) {
      canonical.id = major.geckoId;
    }
    if (!canonical.href.startsWith("/token/") && major.geckoId) {
      canonical.href = `/coin/${encodeURIComponent(major.geckoId)}`;
      canonical.kind = "coin";
    }

    const family = majorFamilySymbols(major);
    const restEntries = searchTopCoinsIndex(index, q, capped + 8, major).filter(
      (e) => e.id !== major.geckoId,
    );

    // Other pairs of the same asset (known wrapped contracts only) — USDC OK below USDT
    let familyDex: UniverseSearchHit[] = [];
    try {
      const dexHits = await searchDexPairs(major.symbol, 16);
      familyDex = sortMajorFamilyHits(
        dexHits
          .filter((h) => family.has(h.symbol.toUpperCase()))
          .filter((h) => isKnownFamilyContract(major, h.address))
          .filter((h) => h.address.toLowerCase() !== (canonical.address ?? "").toLowerCase())
          .filter((h) => isCredibleMajorDexHit(major, h))
          .slice(0, 4)
          .map((h) => {
            const hit = dexHitToUniverse(
              h,
              (h.quoteSymbol || "").toUpperCase() === "USDT" ? "major_usdt" : "major_other",
            );
            hit.pairLabel = `${major.symbol}/${(h.quoteSymbol || "USDT").toUpperCase()}`;
            return hit;
          }),
      );
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
      const key =
        hit.kind === "token" && hit.address
          ? `token:${(hit.chain ?? "").toLowerCase()}:${hit.address.toLowerCase()}`
          : `coin:${hit.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(hit);
      if (out.length >= capped) break;
    }
    // Guarantee canonical major is first
    const canonKey =
      canonical.kind === "token" && canonical.address
        ? `token:${(canonical.chain ?? "").toLowerCase()}:${canonical.address.toLowerCase()}`
        : `coin:${canonical.id}`;
    const without = out.filter((h) => {
      const key =
        h.kind === "token" && h.address
          ? `token:${(h.chain ?? "").toLowerCase()}:${h.address.toLowerCase()}`
          : `coin:${h.id}`;
      return key !== canonKey;
    });
    return [canonical, ...without].slice(0, capped);
  }

  // Non-major ticker/name — Dex first so ticker paste lands on /token
  const dexHits = await searchDexPairs(q, capped);
  if (dexHits.length > 0) {
    const entries = searchTopCoinsIndex(index, q, capped, null);
    const prices = await overlayDexPricesForPlatforms(
      entries.map((e) => ({ id: e.id, platforms: e.platforms ?? [] })),
    );
    const coinHits = entries.map((e) =>
      entryToHit(e, { priceUsd: prices.get(e.id) ?? null, tier: "other" }),
    );
    const merged = [...dexHits.map((h) => dexHitToUniverse(h, "other")), ...coinHits];
    const seen = new Set<string>();
    const out: UniverseSearchHit[] = [];
    for (const hit of merged) {
      const key =
        hit.kind === "token" && hit.address
          ? `token:${(hit.chain ?? "").toLowerCase()}:${hit.address.toLowerCase()}`
          : `coin:${hit.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(hit);
      if (out.length >= capped) break;
    }
    return out;
  }

  const entries = searchTopCoinsIndex(index, q, capped, null);
  if (entries.length === 0) return [];

  const prices = await overlayDexPricesForPlatforms(
    entries.map((e) => ({ id: e.id, platforms: e.platforms ?? [] })),
  );

  return entries.map((e) =>
    entryToHit(e, { priceUsd: prices.get(e.id) ?? null, tier: "other" }),
  );
}
