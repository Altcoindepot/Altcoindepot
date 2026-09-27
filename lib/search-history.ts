/**
 * Site search query history — localStorage only, no account.
 * Cap 5, newest first, skip duplicates and empty strings.
 */

const STORAGE_KEY = "altcoin-depot-search-history";
export const SEARCH_HISTORY_LIMIT = 5;

function normalize(q: string): string {
  return q.trim();
}

export function readSearchHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: string[] = [];
    const seen = new Set<string>();
    for (const item of parsed) {
      if (typeof item !== "string") continue;
      const q = normalize(item);
      if (!q) continue;
      const key = q.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(q);
      if (out.length >= SEARCH_HISTORY_LIMIT) break;
    }
    return out;
  } catch {
    return [];
  }
}

/** Insert query at front; move duplicates up; drop empties; cap at 5. */
export function pushSearchHistory(query: string): string[] {
  const q = normalize(query);
  if (!q || typeof window === "undefined") return readSearchHistory();
  const key = q.toLowerCase();
  const prev = readSearchHistory().filter((item) => item.toLowerCase() !== key);
  const next = [q, ...prev].slice(0, SEARCH_HISTORY_LIMIT);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // quota / private mode — ignore
  }
  return next;
}

export function clearSearchHistory(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
