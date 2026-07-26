"use client";

import { MarketRegimeBadge } from "@/components/market-regime-badge";
import { DisclaimerNote } from "@/components/disclaimer-note";
import {
  computeMarketRegime,
  type MarketRegimeResult,
} from "@/lib/market-regime";
import { ds } from "@/lib/ui-classes";

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
    <aside aria-label="Personal market brief" className={ds.panel}>
      <p className={ds.label}>Market brief</p>
      <div className="mt-2">
        <MarketRegimeBadge regime={result.regime} />
      </div>
      <p className="mt-2 text-sm leading-snug text-zinc-300">{result.summary}</p>
      <p className="mt-2 text-xs text-zinc-500">
        F&amp;G {fearGreedLabel}
        {fearGreed != null ? ` (${Math.round(fearGreed)})` : ""} · Alt breadth{" "}
        {altSeasonIndex.toFixed(0)}
      </p>
      <DisclaimerNote />
    </aside>
  );
}
