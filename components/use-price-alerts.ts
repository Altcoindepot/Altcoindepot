"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addAlert,
  ALERTS_CHANGE_EVENT,
  readAlerts,
  removeAlert,
  updateAlert,
  type PriceAlert,
} from "@/lib/alerts-storage";

export function usePriceAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [mounted, setMounted] = useState(false);

  const refresh = useCallback(() => {
    setAlerts(readAlerts());
  }, []);

  useEffect(() => {
    refresh();
    setMounted(true);
    function onChange() {
      refresh();
    }
    window.addEventListener(ALERTS_CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(ALERTS_CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  return {
    alerts,
    mounted,
    refresh,
    add: addAlert,
    remove: removeAlert,
    update: updateAlert,
  };
}
