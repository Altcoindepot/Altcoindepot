export const WATCHLIST_STORAGE_KEY = "altcoindepot-watchlist";
export const WATCHLIST_CHANGE_EVENT = "watchlist-change";

export type WatchlistEntry = {
  id: string;
  name: string;
  symbol: string;
  image?: string;
  addedAt: string;
};

function safeParse(raw: string | null): WatchlistEntry[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data
      .filter(
        (item): item is WatchlistEntry =>
          !!item &&
          typeof item === "object" &&
          typeof (item as WatchlistEntry).id === "string" &&
          typeof (item as WatchlistEntry).name === "string" &&
          typeof (item as WatchlistEntry).symbol === "string",
      )
      .slice(0, 100);
  } catch {
    return [];
  }
}

export function readWatchlist(): WatchlistEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return safeParse(localStorage.getItem(WATCHLIST_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function writeWatchlist(entries: WatchlistEntry[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(entries.slice(0, 100)));
    window.dispatchEvent(new CustomEvent(WATCHLIST_CHANGE_EVENT));
  } catch {
    /* ignore quota / private mode */
  }
}

export function isOnWatchlist(id: string): boolean {
  return readWatchlist().some((e) => e.id === id);
}

export function removeWatchlistId(id: string) {
  writeWatchlist(readWatchlist().filter((e) => e.id !== id));
}

export function toggleWatchlist(entry: Omit<WatchlistEntry, "addedAt">): boolean {
  const current = readWatchlist();
  const exists = current.some((e) => e.id === entry.id);
  if (exists) {
    writeWatchlist(current.filter((e) => e.id !== entry.id));
    return false;
  }
  writeWatchlist([
    { ...entry, addedAt: new Date().toISOString() },
    ...current,
  ]);
  return true;
}
