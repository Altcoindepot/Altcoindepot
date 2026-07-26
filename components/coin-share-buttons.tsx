"use client";

import { useState } from "react";
import { showToast } from "@/components/toast-host";
import { ds } from "@/lib/ui-classes";

export function CoinShareButtons({
  name,
  symbol,
  coinId,
  vsBtc7d,
}: {
  name: string;
  symbol: string;
  coinId: string;
  /** Relative 7d performance vs Bitcoin for shareable copy. */
  vsBtc7d?: number | null;
}) {
  const [copied, setCopied] = useState(false);
  const sym = symbol.trim().toUpperCase() || "COIN";
  const path = `/coin/${encodeURIComponent(coinId)}`;

  function pageUrl() {
    if (typeof window !== "undefined") {
      return `${window.location.origin}${path}`;
    }
    return `https://altcoindepot.com${path}`;
  }

  function shareText() {
    if (vsBtc7d != null && Number.isFinite(vsBtc7d) && coinId !== "bitcoin") {
      const sign = vsBtc7d >= 0 ? "+" : "";
      return `${name} (${sym}) is ${sign}${vsBtc7d.toFixed(1)}% vs BTC (7d) on AltCoin Depot`;
    }
    return `Check out ${name} (${sym}) price on AltCoin Depot`;
  }

  function shareOnX() {
    const href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText())}&url=${encodeURIComponent(pageUrl())}`;
    window.open(href, "_blank", "noopener,noreferrer");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl());
      setCopied(true);
      showToast("Link copied");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      showToast("Couldn’t copy link");
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={shareOnX} className={ds.btnSecondary}>
        Share on X
      </button>
      <button type="button" onClick={() => void copyLink()} className={ds.btnSecondary}>
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
