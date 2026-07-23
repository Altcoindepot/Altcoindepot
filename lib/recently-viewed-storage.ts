export const RECENTLY_VIEWED_STORAGE_KEY = "altcoindepot-recently-viewed";
export const RECENTLY_VIEWED_CHANGE_EVENT = "recently-viewed-change";

export type RecentlyViewedEntry = {
  id: string;
  name: string;
  symbol: string;
  image?: string;
  viewedAt: string;
};

const MAX_ENTRIES = 12;

function safeParse(raw: string | null): RecentlyViewedEntry[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data
      .filter(
        (item): item is RecentlyViewedEntry =>
          !!item &&
          typeof item === "object" &&
          typeof (item as RecentlyViewedEntry).id === "string" &&
          typeof (item as RecentlyViewedEntry).name === "string" &&
          typeof (item as RecentlyViewedEntry).symbol === "string",
      )
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

export function readRecentlyViewed(): RecentlyViewedEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return safeParse(localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function writeRecentlyViewed(entries: RecentlyViewedEntry[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      RECENTLY_VIEWED_STORAGE_KEY,
      JSON.stringify(entries.slice(0, MAX_ENTRIES)),
    );
    window.dispatchEvent(new CustomEvent(RECENTLY_VIEWED_CHANGE_EVENT));
  } catch {
    /* ignore quota / private mode */
  }
}

export function recordRecentlyViewed(
  entry: Omit<RecentlyViewedEntry, "viewedAt">,
) {
  const current = readRecentlyViewed().filter((e) => e.id !== entry.id);
  writeRecentlyViewed([
    { ...entry, viewedAt: new Date().toISOString() },
    ...current,
  ]);
}

export function clearRecentlyViewed() {
  writeRecentlyViewed([]);
}
