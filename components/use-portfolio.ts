"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PORTFOLIO_CHANGE_EVENT,
  readPortfolio,
  removeHolding,
  upsertHolding,
  type PortfolioHolding,
  writePortfolio,
} from "@/lib/portfolio-storage";

export function usePortfolio() {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [mounted, setMounted] = useState(false);

  const refresh = useCallback(() => {
    setHoldings(readPortfolio());
  }, []);

  useEffect(() => {
    refresh();
    setMounted(true);
    function onChange() {
      refresh();
    }
    window.addEventListener(PORTFOLIO_CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(PORTFOLIO_CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  return {
    holdings,
    mounted,
    refresh,
    upsert: upsertHolding,
    remove: removeHolding,
    write: writePortfolio,
  };
}
