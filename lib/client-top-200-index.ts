import type { TopCoinSearchEntry } from "@/lib/top-coins-search-utils";
import { searchTopCoinsIndex } from "@/lib/top-coins-search-utils";

export const TOP_200_CLIENT_STORAGE_KEY = "altcoin-depot-top-200-index";

let memoryIndex: TopCoinSearchEntry[] | null = null;
let loadPromise: Promise<TopCoinSearchEntry[]> | null = null;

function parseStoredIndex(raw: string | null): TopCoinSearchEntry[] | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data) || data.length === 0) return null;
    const valid = data.filter(
      (row): row is TopCoinSearchEntry =>
        !!row &&
        typeof row === "object" &&
        typeof (row as TopCoinSearchEntry).id === "string" &&
        typeof (row as TopCoinSearchEntry).name === "string" &&
        typeof (row as TopCoinSearchEntry).symbol === "string",
    );
    return valid.length > 0 ? valid.slice(0, 200) : null;
  } catch {
    return null;
  }
}

/** Load the top-200 index once per session (memory + sessionStorage). */
export async function loadClientTop200Index(): Promise<TopCoinSearchEntry[]> {
  if (typeof window === "undefined") return [];

  if (memoryIndex && memoryIndex.length > 0) return memoryIndex;

  const fromSession = parseStoredIndex(sessionStorage.getItem(TOP_200_CLIENT_STORAGE_KEY));
  if (fromSession) {
    memoryIndex = fromSession;
    return fromSession;
  }

  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const res = await fetch("/api/top-200-coins", { cache: "force-cache" });
      if (!res.ok) return [];
      const data: unknown = await res.json();
      const coins =
        data && typeof data === "object" && Array.isArray((data as { coins?: unknown }).coins)
          ? ((data as { coins: TopCoinSearchEntry[] }).coins ?? [])
          : [];
      const trimmed = coins.slice(0, 200);
      if (trimmed.length > 0) {
        memoryIndex = trimmed;
        try {
          sessionStorage.setItem(TOP_200_CLIENT_STORAGE_KEY, JSON.stringify(trimmed));
        } catch {
          /* quota / private mode */
        }
      }
      return trimmed;
    } catch {
      return [];
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
}

/** Instant client-side filter — no per-keystroke API calls. */
export function filterClientTop200Index(
  index: TopCoinSearchEntry[],
  query: string,
  limit = 10,
): TopCoinSearchEntry[] {
  if (!index.length) return [];
  return searchTopCoinsIndex(index, query, limit);
}
