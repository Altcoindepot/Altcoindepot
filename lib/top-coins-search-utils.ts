import type { CoinPlatformContract } from "@/lib/gecko-platform-map";

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

function scoreEntry(entry: TopCoinSearchEntry, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return -1;

  const id = entry.id.toLowerCase();
  const sym = entry.symbol.toLowerCase();
  const name = entry.name.toLowerCase();

  for (const p of entry.platforms ?? []) {
    const addr = p.address.toLowerCase();
    if (addr === q) return 1100 + rankBonus(entry.rank);
    if (q.length >= 8 && addr.includes(q)) return 500 + rankBonus(entry.rank);
  }

  if (id === q) return 1000 + rankBonus(entry.rank);
  if (sym === q) return 900 + rankBonus(entry.rank);
  if (name === q) return 850 + rankBonus(entry.rank);
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
): TopCoinSearchEntry[] {
  const q = query.trim();
  if (!q) return [];

  const scored = entries
    .map((entry) => ({ entry, score: scoreEntry(entry, q) }))
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
): TopCoinSearchEntry | null {
  const hits = searchTopCoinsIndex(entries, query, 20);
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
