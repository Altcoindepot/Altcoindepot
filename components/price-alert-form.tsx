"use client";

import { useState, type FormEvent } from "react";
import { addAlert } from "@/lib/alerts-storage";

export function PriceAlertForm({
  coinId,
  name,
  symbol,
  image,
  currentPrice,
}: {
  coinId: string;
  name: string;
  symbol: string;
  image?: string;
  currentPrice?: number | null;
}) {
  const [target, setTarget] = useState(
    currentPrice != null && Number.isFinite(currentPrice) ? String(currentPrice) : "",
  );
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const targetUsd = Number(target);
    if (!Number.isFinite(targetUsd) || targetUsd <= 0) {
      setStatus("Enter a valid USD target.");
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "default") {
          await Notification.requestPermission();
        }
      }
      addAlert({
        coinId,
        name,
        symbol,
        image,
        targetUsd,
        direction,
      });
      const granted =
        typeof Notification !== "undefined" && Notification.permission === "granted";
      setStatus(
        granted
          ? "Alert saved. Keep this site open (or pinned) to receive browser notifications."
          : "Alert saved. Allow notifications in your browser to get pinged when it hits.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-2 rounded-lg border border-white/10 bg-[#111111] p-3 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <div className="min-w-[7rem]">
        <label htmlFor={`alert-dir-${coinId}`} className="text-[10px] uppercase tracking-wide text-zinc-500">
          When price goes
        </label>
        <select
          id={`alert-dir-${coinId}`}
          value={direction}
          onChange={(e) => setDirection(e.target.value as "above" | "below")}
        className="mt-1 w-full rounded-md border border-white/15 bg-[#0a0a0a] px-3 py-2.5 text-sm text-zinc-100 sm:py-1.5 sm:text-xs"
        >
          <option value="above">Above</option>
          <option value="below">Below</option>
        </select>
      </div>
      <div className="min-w-[8rem] flex-1">
        <label htmlFor={`alert-usd-${coinId}`} className="text-[10px] uppercase tracking-wide text-zinc-500">
          Target USD
        </label>
        <input
          id={`alert-usd-${coinId}`}
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="mt-1 w-full rounded-md border border-white/15 bg-[#0a0a0a] px-3 py-2.5 font-mono text-sm text-zinc-100 sm:py-1.5 sm:text-xs"
          placeholder="0.00"
        />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#d1a173]/45 bg-[#d1a173]/10 px-4 py-2.5 text-sm font-semibold text-[#d7ad82] transition-colors hover:border-[#d1a173]/70 disabled:opacity-60 sm:min-h-0 sm:px-3 sm:py-1.5 sm:text-xs"
      >
        {busy ? "Saving…" : "Set price alert"}
      </button>
      {status ? <p className="basis-full text-[11px] text-zinc-400">{status}</p> : null}
    </form>
  );
}
