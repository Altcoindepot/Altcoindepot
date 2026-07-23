"use client";

import { useCallback, useEffect, useState } from "react";
import {
  isOnWatchlist,
  readWatchlist,
  toggleWatchlist,
  WATCHLIST_CHANGE_EVENT,
  type WatchlistEntry,
} from "@/lib/watchlist-storage";

export function useWatchlist() {
  const [entries, setEntries] = useState<WatchlistEntry[]>([]);
  const [mounted, setMounted] = useState(false);

  const refresh = useCallback(() => {
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
      const nowOn = toggleWatchlist(entry);
      refresh();
      return nowOn;
    },
    [refresh],
  );

  const has = useCallback((id: string) => isOnWatchlist(id), [entries]);

  return { entries, mounted, toggle, has, refresh };
}
