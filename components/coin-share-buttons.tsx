"use client";

import { useState } from "react";
import { showToast } from "@/components/toast-host";

export function CoinShareButtons({
  name,
  symbol,
  coinId,
}: {
  name: string;
  symbol: string;
  coinId: string;
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
      <button
        type="button"
        onClick={shareOnX}
        className="inline-flex min-h-11 items-center rounded-lg border border-white/15 px-3.5 py-2.5 text-sm text-zinc-300 transition-colors hover:border-zinc-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1a173] sm:min-h-0 sm:px-3 sm:py-1.5 sm:text-xs"
      >
        Share on X
      </button>
      <button
        type="button"
        onClick={() => void copyLink()}
        className="inline-flex min-h-11 items-center rounded-lg border border-white/15 px-3.5 py-2.5 text-sm text-zinc-300 transition-colors hover:border-[#d1a173]/40 hover:text-[#d7ad82] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1a173] sm:min-h-0 sm:px-3 sm:py-1.5 sm:text-xs"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
