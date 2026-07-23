"use client";

import { useEffect } from "react";
import { readAlerts, updateAlert } from "@/lib/alerts-storage";
import { readResponseJsonSafely } from "@/lib/read-response-json";

const POLL_MS = 45_000;

async function fetchPrices(ids: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (ids.length === 0) return map;
  try {
    const res = await fetch(`/api/coins?ids=${encodeURIComponent(ids.join(","))}`);
    const data = await readResponseJsonSafely(res);
    const coins = data && typeof data === "object" ? (data as { coins?: unknown }).coins : null;
    if (!Array.isArray(coins)) return map;
    for (const c of coins) {
      if (!c || typeof c !== "object") continue;
      const id = (c as { id?: unknown }).id;
      const price = (c as { current_price?: unknown }).current_price;
      if (typeof id === "string" && typeof price === "number" && Number.isFinite(price)) {
        map.set(id, price);
      }
    }
  } catch {
    /* ignore */
  }
  return map;
}

async function notify(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    try {
      await Notification.requestPermission();
    } catch {
      return;
    }
  }
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body });
  } catch {
    /* ignore */
  }
}

/** Background checker for local price alerts (browser notifications). */
export function PriceAlertWatcher() {
  useEffect(() => {
    let cancelled = false;

    async function tick() {
      if (cancelled || document.visibilityState === "hidden") return;
      const alerts = readAlerts().filter((a) => a.enabled && !a.triggeredAt);
      if (alerts.length === 0) return;
      const ids = [...new Set(alerts.map((a) => a.coinId))];
      const prices = await fetchPrices(ids);
      for (const alert of alerts) {
        const price = prices.get(alert.coinId);
        if (price == null) continue;
        const hit =
          alert.direction === "above" ? price >= alert.targetUsd : price <= alert.targetUsd;
        if (!hit) continue;
        updateAlert(alert.id, { triggeredAt: new Date().toISOString(), enabled: false });
        const sym = alert.symbol.toUpperCase();
        void notify(
          `${sym} price alert`,
          `${alert.name} is ${alert.direction} $${alert.targetUsd.toLocaleString()} (now $${price.toLocaleString()}).`,
        );
      }
    }

    void tick();
    const id = window.setInterval(() => {
      void tick();
    }, POLL_MS);

    function onVis() {
      if (document.visibilityState === "visible") void tick();
    }
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return null;
}
