"use client";

import { regimeToneClass, type MarketRegime } from "@/lib/market-regime";
import { ds } from "@/lib/ui-classes";

export function MarketRegimeBadge({
  regime,
  summary,
}: {
  regime: MarketRegime;
  summary?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`${ds.badge} uppercase ${regimeToneClass(regime)}`}>{regime}</span>
      {summary ? <p className="text-xs text-zinc-400">{summary}</p> : null}
    </div>
  );
}
