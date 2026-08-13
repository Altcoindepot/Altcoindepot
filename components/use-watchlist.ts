"use client";

import { useCallback, useEffect, useState } from "react";
import {
  readWatchlist,
  toggleWatchlist,
  WATCHLIST_CHANGE_EVENT,
  type WatchlistEntry,
} from "@/lib/watchlist-storage";

/**
 * Browser-only watchlist state backed by localStorage (`altcoin-depot-watchlist`).
 * `mounted` stays false until after hydration so SSR markup matches the first client paint.
 */
export function useWatchlist() {
  const [entries, setEntries] = useState<WatchlistEntry[]>([]);
  const [mounted, setMounted] = useState(false);

  const refresh = useCallback(() => {
    if (typeof window === "undefined") {
      setEntries([]);
      return;
    }
    setEntries(readWatchlist());
  }, []);

  useEffect(() => {
    refresh();
    setMounted(true);
    function onChange() {
      refresh();
    }
    window.addEventListener(WATCHLIST_CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(WATCHLIST_CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  const toggle = useCallback(
    (entry: Omit<WatchlistEntry, "addedAt">) => {
      if (typeof window === "undefined") return false;
      const nowOn = toggleWatchlist(entry);
      refresh();
      return nowOn;
    },
    [refresh],
  );

  const has = useCallback(
    (id: string) => (mounted ? entries.some((e) => e.id === id) : false),
    [entries, mounted],
  );

  return { entries, mounted, toggle, has, refresh };
}
