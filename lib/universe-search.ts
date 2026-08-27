/**
 * Hybrid universe search: cached ~7k Gecko index + Dex for contracts/prices.
 * Never calls Gecko per keystroke.
 */

import {
  getTopCoinsSearchIndex,
  searchTopCoinsIndex,
  pickBestTopCoinMatch,
  type TopCoinSearchEntry,
} from "@/lib/top-coins-index";
import { primaryPlatform } from "@/lib/top-coins-search-utils";
import { looksLikeContractQuery, searchDexPairs, truncateContract } from "@/lib/dex-search";
import { overlayDexPricesForPlatforms } from "@/lib/coin-dex-live";
import { formatChainLabel } from "@/lib/format-chain";
import type { UniverseSearchHit } from "@/lib/universe-search-types";

export type { UniverseSearchHit };

function entryToHit(entry: TopCoinSearchEntry, priceUsd: number | null): UniverseSearchHit {
  const primary = primaryPlatform(entry);
  return {
    id: entry.id,
    kind: "coin",
    symbol: entry.symbol,
    name: entry.name,
    chain: primary?.chain ?? null,
    address: primary?.address ?? null,
    truncatedContract: primary ? truncateContract(primary.address) : null,
    chainLabel: primary ? formatChainLabel(primary.chain) : null,
    priceUsd,
    imageUrl: entry.image || null,
    href: `/coin/${encodeURIComponent(entry.id)}`,
  };
}

export async function searchUniverse(query: string, limit = 10): Promise<UniverseSearchHit[]> {
  const q = query.trim();
  if (!q) return [];
  const capped = Math.min(12, Math.max(1, Math.floor(limit)));

  // Contract → Dex token page (may also match index for gecko id, but route is /token)
  if (looksLikeContractQuery(q)) {
    const index = await getTopCoinsSearchIndex();
    const indexed = pickBestTopCoinMatch(index, q);
    // Prefer indexed coin page when contract maps to a known gecko coin
    if (indexed && (indexed.platforms ?? []).some((p) => p.address.toLowerCase() === q.toLowerCase())) {
      const prices = await overlayDexPricesForPlatforms([
        { id: indexed.id, platforms: indexed.platforms ?? [] },
      ]);
      return [entryToHit(indexed, prices.get(indexed.id) ?? null)];
    }

    const dexHits = await searchDexPairs(q, capped);
    return dexHits.map((hit) => ({
      id: hit.id,
      kind: "token" as const,
      symbol: hit.symbol,
      name: hit.name,
      chain: hit.chain,
      address: hit.address,
      truncatedContract: truncateContract(hit.address),
      chainLabel: formatChainLabel(hit.chain),
      priceUsd: hit.priceUsd,
      imageUrl: hit.imageUrl,
      href: hit.href,
    }));
  }

  // Ticker / name → cached ~7k index (no Gecko call)
  const index = await getTopCoinsSearchIndex();
  const entries = searchTopCoinsIndex(index, q, capped);
  if (entries.length === 0) {
    // Fallback: Dex symbol search for tokens outside the 7k list
    const dexHits = await searchDexPairs(q, capped);
    return dexHits.map((hit) => ({
      id: hit.id,
      kind: "token" as const,
      symbol: hit.symbol,
      name: hit.name,
      chain: hit.chain,
      address: hit.address,
      truncatedContract: truncateContract(hit.address),
      chainLabel: formatChainLabel(hit.chain),
      priceUsd: hit.priceUsd,
      imageUrl: hit.imageUrl,
      href: hit.href,
    }));
  }

  const prices = await overlayDexPricesForPlatforms(
    entries.map((e) => ({ id: e.id, platforms: e.platforms ?? [] })),
  );

  return entries.map((e) => entryToHit(e, prices.get(e.id) ?? null));
}
