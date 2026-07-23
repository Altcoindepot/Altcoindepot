"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CategoryHomeColumn, CoinMarket, MarketsBundle } from "@/lib/coingecko";
import { readResponseJsonSafely } from "@/lib/read-response-json";

/**
 * CoinGecko free tier is limited, so we keep polling conservative.
 */
const POLL_MS = 60_000;

type MarketsContextValue = {
  topMarkets: CoinMarket[];
  ecosystemMarkets: CoinMarket[];
  categoryHomeColumns: CategoryHomeColumn[];
  getCoin: (id: string) => CoinMarket | undefined;
  stale: boolean;
  refreshError: string | null;
  refreshing: boolean;
  refresh: () => Promise<void>;
};

const MarketsContext = createContext<MarketsContextValue | null>(null);

function buildLookup(top: CoinMarket[], eco: CoinMarket[]): Map<string, CoinMarket> {
  const m = new Map<string, CoinMarket>();
  for (const c of eco) m.set(c.id, c);
  for (const c of top) m.set(c.id, c);
  return m;
}

export function MarketsProvider({
  initialBundle,
  children,
}: {
  initialBundle: MarketsBundle;
  children: ReactNode;
}) {
  const [bundle, setBundle] = useState(initialBundle);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/markets");
      if (!res.ok) {
        setRefreshError(
          res.status === 429
            ? "Market updates are rate-limited. Showing the last good snapshot."
            : "Couldn’t refresh live prices. Showing the last good snapshot.",
        );
        return;
      }
      const data = await readResponseJsonSafely(res);
      if (
        data &&
        typeof data === "object" &&
        "topMarkets" in data &&
        "ecosystemMarkets" in data
      ) {
        const parsed = data as MarketsBundle;
        const { topMarkets, ecosystemMarkets } = parsed;
        const categoryHomeColumns = Array.isArray(parsed.categoryHomeColumns)
          ? parsed.categoryHomeColumns
          : [];
        if (Array.isArray(topMarkets) && Array.isArray(ecosystemMarkets)) {
          setBundle({
            topMarkets,
            ecosystemMarkets,
            categoryHomeColumns,
            stale: Boolean(parsed.stale),
          });
          setRefreshError(null);
          return;
        }
      }
      setRefreshError("Market data looked incomplete. Keeping the previous prices on screen.");
    } catch {
      setRefreshError("Network issue while updating markets. Your last prices are still shown.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      void refresh().catch(() => {});
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void refresh().catch(() => {});
    }, 800);
    return () => window.clearTimeout(t);
  }, [refresh]);

  useEffect(() => {
    function onVis() {
      if (document.visibilityState === "visible") void refresh().catch(() => {});
    }
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refresh]);

  useEffect(() => {
    function onFocus() {
      void refresh().catch(() => {});
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  const value = useMemo((): MarketsContextValue => {
    const map = buildLookup(bundle.topMarkets, bundle.ecosystemMarkets);
    return {
      topMarkets: bundle.topMarkets,
      ecosystemMarkets: bundle.ecosystemMarkets,
      categoryHomeColumns: bundle.categoryHomeColumns ?? [],
      getCoin: (id: string) => map.get(id),
      stale: bundle.stale,
      refreshError,
      refreshing,
      refresh,
    };
  }, [
    bundle.topMarkets,
    bundle.ecosystemMarkets,
    bundle.categoryHomeColumns,
    bundle.stale,
    refreshError,
    refreshing,
    refresh,
  ]);

  return (
    <MarketsContext.Provider value={value}>{children}</MarketsContext.Provider>
  );
}

export function useMarkets(): MarketsContextValue {
  const ctx = useContext(MarketsContext);
  if (ctx == null) {
    throw new Error("useMarkets must be used within MarketsProvider");
  }
  return ctx;
}
