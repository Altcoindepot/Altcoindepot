"use client";

import { useEffect } from "react";
import { recordRecentlyViewed } from "@/lib/recently-viewed";

export function RecordTokenView({
  chain,
  address,
  symbol,
  name,
  dex,
}: {
  chain: string;
  address: string;
  symbol: string;
  name?: string;
  dex?: string;
}) {
  useEffect(() => {
    recordRecentlyViewed({ chain, address, symbol, name, dex });
  }, [chain, address, symbol, name, dex]);
  return null;
}
