"use client";

import { MarketRegimeBadge } from "@/components/market-regime-badge";
import {
  computeMarketRegime,
  type MarketRegimeResult,
} from "@/lib/market-regime";

export function PersonalMarketBrief({
  fearGreed,
  fearGreedLabel,
  altSeasonIndex,
  btcChange24h,
  marketCapChange24h,
}: {
  fearGreed: number | null;
  fearGreedLabel: string;
  altSeasonIndex: number;
  btcChange24h: number | null;
  marketCapChange24h: number;
}) {
  const result: MarketRegimeResult = computeMarketRegime({
    fearGreed,
    altSeasonIndex,
    btcChange24h,
    marketCapChange24h,
  });

  return (
    <aside
      aria-label="Personal market brief"
      className="rounded-xl border border-[#f4ddc3]/15 bg-[rgba(18,16,20,0.85)] px-4 py-3 sm:px-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            Market brief
          </p>
          <div className="mt-1.5">
            <MarketRegimeBadge regime={result.regime} />
          </div>
          <p className="mt-2 text-sm leading-snug text-zinc-300">{result.summary}</p>
          <p className="mt-1.5 text-[11px] text-zinc-500">
            F&amp;G {fearGreedLabel}
            {fearGreed != null ? ` (${Math.round(fearGreed)})` : ""} · Alt breadth{" "}
            {altSeasonIndex.toFixed(0)} · Informational only, not financial advice
          </p>
        </div>
      </div>
    </aside>
  );
}
