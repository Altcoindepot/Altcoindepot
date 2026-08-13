"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { NarrativeSnapshot, TrendingAssetRow } from "@/lib/dashboard-data";
import { rankNarrativesForWindow } from "@/lib/dashboard-data";
import {
  DEFAULT_ROTATION_WINDOW,
  ROTATION_WINDOWS,
  type RotationWindow,
} from "@/lib/narratives";
import { NarrativeRotationTracker } from "@/components/dashboard/narrative-rotation-tracker";
import { TrendingAssetsToday } from "@/components/dashboard/trending-assets-today";
import { TopRotations } from "@/components/dashboard/top-rotations";
import { ds } from "@/lib/ui-classes";

/** Shared 24H / 7D / 1M controls for tracker and top rotations. */
export function NarrativeRotationSection({
  narratives,
  regimeLabel,
  trendingAssets,
  lowCapsSlot,
  watchlistOnly = false,
}: {
  narratives: NarrativeSnapshot[];
  regimeLabel: string;
  trendingAssets: TrendingAssetRow[];
  lowCapsSlot: ReactNode;
  watchlistOnly?: boolean;
}) {
  const [window, setWindow] = useState<RotationWindow>(DEFAULT_ROTATION_WINDOW);

  const ranked = useMemo(
    () => rankNarrativesForWindow(narratives, window),
    [narratives, window],
  );
  const trackerNodes = useMemo(() => {
    const bySlug = new Map(ranked.map((n) => [n.slug, n]));
    return narratives
      .map((n) => bySlug.get(n.slug))
      .filter((n): n is NonNullable<typeof n> => n != null);
  }, [narratives, ranked]);
  const top = ranked.slice(0, 4);

  const windowToggle = (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <p className={ds.label}>Rotation window</p>
      <div
        role="tablist"
        aria-label="Narrative rotation timeframe"
        className="inline-flex rounded-lg border border-white/12 bg-[#0c0e14]/80 p-0.5"
      >
        {ROTATION_WINDOWS.map((w) => {
          const active = window === w.id;
          return (
            <button
              key={w.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setWindow(w.id)}
              className={`min-h-[44px] min-w-[44px] rounded-md px-3 py-3 text-xs font-semibold transition-colors md:min-h-9 md:py-2 ${
                active
                  ? "bg-teal-500/20 text-teal-200 shadow-[0_0_12px_rgba(45,212,191,0.2)]"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {w.shortLabel}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div>
      {windowToggle}

      {/* Desktop (lg+): two columns, each stacked pair spans 3 of 6 rows */}
      <div className="hidden h-[46rem] gap-4 lg:grid lg:grid-cols-[minmax(0,1.45fr)_minmax(17rem,0.9fr)] lg:grid-rows-6">
        <NarrativeRotationTracker
          narratives={trackerNodes}
          regimeLabel={regimeLabel}
          window={window}
          className="col-start-1 row-span-3 row-start-1 h-full min-h-0"
        />
        <TrendingAssetsToday
          rows={trendingAssets}
          watchlistOnly={watchlistOnly}
          className="col-start-2 row-span-3 row-start-1 h-full min-h-0"
        />
        <div className="col-start-1 row-span-3 row-start-4 h-full min-h-0">
          {lowCapsSlot}
        </div>
        <TopRotations
          narratives={top}
          window={window}
          className="col-start-2 row-span-3 row-start-4 h-full min-h-0"
        />
      </div>

      {/* Tablet (md–lg): node diagram on top, then stacked panels */}
      <div className="hidden space-y-4 md:block lg:hidden">
        <NarrativeRotationTracker
          narratives={trackerNodes}
          regimeLabel={regimeLabel}
          window={window}
        />
        <TrendingAssetsToday rows={trendingAssets} watchlistOnly={watchlistOnly} />
        {lowCapsSlot}
        <TopRotations narratives={top} window={window} />
      </div>

      {/* Mobile (< md): hide node diagram; Top Rotations cards replace it */}
      <div className="space-y-4 md:hidden">
        <TopRotations narratives={top} variant="mobile-primary" window={window} />
        <TrendingAssetsToday rows={trendingAssets} watchlistOnly={watchlistOnly} />
        {lowCapsSlot}
      </div>
    </div>
  );
}
