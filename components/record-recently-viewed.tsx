"use client";

import { useEffect } from "react";
import { recordRecentlyViewed } from "@/lib/recently-viewed-storage";

/** Records a coin visit in localStorage for the homepage Recently Viewed strip. */
export function RecordRecentlyViewed({
  coinId,
  name,
  symbol,
  image,
}: {
  coinId: string;
  name: string;
  symbol: string;
  image?: string;
}) {
  useEffect(() => {
    if (!coinId || !name || !symbol) return;
    recordRecentlyViewed({
      id: coinId,
      name,
      symbol,
      image,
    });
  }, [coinId, name, symbol, image]);

  return null;
}
