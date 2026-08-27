import type { CoinPlatformContract } from "@/lib/gecko-platform-map";
import { resolveMajorSync, type MajorCatalogEntry } from "@/lib/majors-catalog";

export type { CoinPlatformContract };

export type TopCoinSearchEntry = {
  id: string;
  name: string;
  symbol: string;
  image: string;
  rank: number;
  /** Not for live UI — Dex overlays price. */
  current_price: number | null;
  price_change_percentage_24h: number | null;
  price_change_percentage_7d?: number | null;
  market_cap?: number | null;
  total_volume?: number | null;
  platforms?: CoinPlatformContract[];
};

function rankBonus(rank: number): number {
  return Math.max(0, 400 - rank * 0.05);
}

function scoreEntry(
  entry: TopCoinSearchEntry,
  query: string,
  major: MajorCatalogEntry | null,
): number {
  const q = query.trim().toLowerCase();
  if (!q) return -1;

  const id = entry.id.toLowerCase();
  const sym = entry.symbol.toLowerCase();
  const name = entry.name.toLowerCase();

  // Canonical major always dominates — never lose to name-substring memes.
  if (major?.geckoId && entry.id === major.geckoId) {
    return 50_000 + rankBonus(entry.rank);
  }

  for (const p of entry.platforms ?? []) {
    const addr = p.address.toLowerCase();
    if (addr === q) return 1100 + rankBonus(entry.rank);
    if (q.length >= 8 && addr.includes(q)) return 500 + rankBonus(entry.rank);
  }

  if (id === q) return 1000 + rankBonus(entry.rank);
  if (sym === q) {
    if (major && entry.id !== major.geckoId) return 200 + rankBonus(entry.rank);
    return 900 + rankBonus(entry.rank);
  }
  if (name === q) {
    if (major && entry.id !== major.geckoId) return 180 + rankBonus(entry.rank);
    return 850 + rankBonus(entry.rank);
  }

  // When query is a known major ticker/name, demote fuzzy / substring noise hard.
  if (major) {
    if (sym.startsWith(q) || name.startsWith(q) || id.startsWith(q)) {
      return 120 + rankBonus(entry.rank);
    }
    if (name.includes(q) || sym.includes(q) || id.includes(q)) {
      return 40 + rankBonus(entry.rank);
    }
    return -1;
  }

  if (sym.startsWith(q)) return 700 + rankBonus(entry.rank);
  if (name.startsWith(q)) return 650 + rankBonus(entry.rank);
  if (id.startsWith(q)) return 600 + rankBonus(entry.rank);
  if (name.includes(q)) return 400 + rankBonus(entry.rank);
  if (sym.includes(q)) return 350 + rankBonus(entry.rank);
  if (id.includes(q)) return 300 + rankBonus(entry.rank);
  return -1;
}

export function searchTopCoinsIndex(
  entries: TopCoinSearchEntry[],
  query: string,
  limit = 12,
  majorHint?: MajorCatalogEntry | null,
): TopCoinSearchEntry[] {
  const q = query.trim();
  if (!q) return [];

  const major = majorHint === undefined ? resolveMajorSync(q) : majorHint;

  const scored = entries
    .map((entry) => ({ entry, score: scoreEntry(entry, q, major) }))
    .filter((row) => row.score >= 0)
    .sort((a, b) => b.score - a.score || a.entry.rank - b.entry.rank);

  const seen = new Set<string>();
  const results: TopCoinSearchEntry[] = [];
  for (const { entry } of scored) {
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);
    results.push(entry);
    if (results.length >= limit) break;
  }
  return results;
}

export function pickBestTopCoinMatch(
  entries: TopCoinSearchEntry[],
  query: string,
  majorHint?: MajorCatalogEntry | null,
): TopCoinSearchEntry | null {
  const major = majorHint === undefined ? resolveMajorSync(query) : majorHint;
  if (major?.geckoId) {
    const hit = entries.find((e) => e.id === major.geckoId);
    if (hit) return hit;
  }

  const hits = searchTopCoinsIndex(entries, query, 20, major);
  if (hits.length === 0) return null;

  const q = query.trim().toLowerCase();
  const exact = hits.find(
    (h) =>
      h.id.toLowerCase() === q ||
      h.symbol.toLowerCase() === q ||
      h.name.toLowerCase() === q ||
      (h.platforms ?? []).some((p) => p.address.toLowerCase() === q),
  );
  if (exact) return exact;
  if (hits.length === 1) return hits[0]!;
  return null;
}

export function primaryPlatform(entry: TopCoinSearchEntry): CoinPlatformContract | null {
  return entry.platforms?.[0] ?? null;
}
