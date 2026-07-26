"use client";

import { regimeToneClass, type MarketRegime } from "@/lib/market-regime";

export function MarketRegimeBadge({
  regime,
  summary,
}: {
  regime: MarketRegime;
  summary?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${regimeToneClass(regime)}`}
      >
        {regime}
      </span>
      {summary ? <p className="text-xs text-zinc-400">{summary}</p> : null}
    </div>
  );
}
