/** Client-only recently viewed DEX tokens. No server sync. */

export const RECENTLY_VIEWED_KEY = "altcoin-depot-recently-viewed";
export const RECENTLY_VIEWED_LIMIT = 20;

export type RecentlyViewedToken = {
  chain: string;
  address: string;
  symbol: string;
  name?: string;
  dex?: string;
  ts: number;
};

function tokenKey(chain: string, address: string) {
  return `${chain.trim().toLowerCase()}:${address.trim().toLowerCase()}`;
}

export function readRecentlyViewed(): RecentlyViewedToken[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: RecentlyViewedToken[] = [];
    for (const row of parsed) {
      if (!row || typeof row !== "object") continue;
      const r = row as Partial<RecentlyViewedToken>;
      if (typeof r.chain !== "string" || typeof r.address !== "string") continue;
      if (typeof r.symbol !== "string") continue;
      out.push({
        chain: r.chain,
        address: r.address,
        symbol: r.symbol,
        name: typeof r.name === "string" ? r.name : undefined,
        dex: typeof r.dex === "string" ? r.dex : undefined,
        ts: typeof r.ts === "number" ? r.ts : Date.now(),
      });
    }
    return out.slice(0, RECENTLY_VIEWED_LIMIT);
  } catch {
    return [];
  }
}

export function writeRecentlyViewed(rows: RecentlyViewedToken[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(rows.slice(0, RECENTLY_VIEWED_LIMIT)));
  window.dispatchEvent(new Event("recently-viewed-change"));
}

export function recordRecentlyViewed(entry: Omit<RecentlyViewedToken, "ts"> & { ts?: number }) {
  const next: RecentlyViewedToken = { ...entry, ts: entry.ts ?? Date.now() };
  const key = tokenKey(next.chain, next.address);
  const rest = readRecentlyViewed().filter((row) => tokenKey(row.chain, row.address) !== key);
  writeRecentlyViewed([next, ...rest]);
}

export function clearRecentlyViewed() {
  writeRecentlyViewed([]);
}

export function viewedKeySet(history: RecentlyViewedToken[]): Set<string> {
  return new Set(history.map((row) => tokenKey(row.chain, row.address)));
}

export function becauseYouViewedLabel(history: RecentlyViewedToken[]): string | null {
  if (history.length === 0) return null;
  const chains = new Map<string, number>();
  const dexes = new Map<string, number>();
  for (const row of history.slice(0, 8)) {
    const chain = row.chain.trim().toLowerCase();
    if (chain) chains.set(chain, (chains.get(chain) ?? 0) + 1);
    const dex = (row.dex ?? "").trim();
    if (dex && dex !== "DEX") dexes.set(dex, (dexes.get(dex) ?? 0) + 1);
  }
  const topDex = [...dexes.entries()].sort((a, b) => b[1] - a[1])[0];
  const topChain = [...chains.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topDex && topDex[1] >= 2) return `Because you viewed ${topDex[0]} pairs`;
  if (topChain) {
    const label = topChain[0] === "solana" ? "SOL" : topChain[0] === "ethereum" ? "ETH" : topChain[0].toUpperCase();
    return `Because you viewed ${label} pairs`;
  }
  return "Because you viewed recent pairs";
}

export type RecommendableRow = {
  id: string;
  chain?: string;
  contractAddress?: string;
  dexLabel?: string;
};

export function recommendFromHistory<T extends RecommendableRow>(
  history: RecentlyViewedToken[],
  rows: T[],
  limit = 6,
): T[] {
  if (history.length === 0 || rows.length === 0) return [];
  const seen = viewedKeySet(history);
  const chainCounts = new Map<string, number>();
  const dexCounts = new Map<string, number>();
  for (const row of history.slice(0, 8)) {
    chainCounts.set(row.chain.toLowerCase(), (chainCounts.get(row.chain.toLowerCase()) ?? 0) + 1);
    if (row.dex) dexCounts.set(row.dex.toLowerCase(), (dexCounts.get(row.dex.toLowerCase()) ?? 0) + 1);
  }
  const topChain = [...chainCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const topDex = [...dexCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  const scored = rows
    .filter((row) => {
      const chain = (row.chain ?? "").toLowerCase();
      const addr = (row.contractAddress ?? "").toLowerCase();
      if (!chain || !addr) return false;
      return !seen.has(`${chain}:${addr}`);
    })
    .map((row) => {
      let score = 0;
      if (topChain && (row.chain ?? "").toLowerCase() === topChain) score += 2;
      if (topDex && (row.dexLabel ?? "").toLowerCase() === topDex) score += 3;
      return { row, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const out: T[] = [];
  const used = new Set<string>();
  for (const item of scored) {
    if (used.has(item.row.id)) continue;
    used.add(item.row.id);
    out.push(item.row);
    if (out.length >= limit) break;
  }
  return out;
}
