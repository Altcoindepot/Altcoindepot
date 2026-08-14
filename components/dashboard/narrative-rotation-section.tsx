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
  cycleDay,
  trendingAssets,
  lowCapsSlot,
  watchlistOnly = false,
}: {
  narratives: NarrativeSnapshot[];
  regimeLabel: string;
  cycleDay: number;
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

      {/*
        Single tree so each section renders once.
        Mobile: card stack (tracker hidden). Tablet: stacked. Desktop: 2×2 grid.
      */}
      <div className="flex flex-col gap-4 lg:grid lg:h-[48rem] lg:grid-cols-[minmax(0,1.45fr)_minmax(16rem,0.9fr)] lg:grid-rows-6">
        <NarrativeRotationTracker
          narratives={trackerNodes}
          regimeLabel={regimeLabel}
          cycleDay={cycleDay}
          window={window}
          className="hidden min-h-[24rem] md:flex lg:col-start-1 lg:row-span-3 lg:row-start-1 lg:h-full lg:min-h-0"
        />
        <TopRotations
          narratives={top}
          variant="mobile-primary"
          window={window}
          className="md:hidden"
        />
        <TrendingAssetsToday
          rows={trendingAssets}
          watchlistOnly={watchlistOnly}
          className="lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:h-full lg:min-h-0"
        />
        <div className="lg:col-start-1 lg:row-span-3 lg:row-start-4 lg:h-full lg:min-h-0">
          {lowCapsSlot}
        </div>
        <TopRotations
          narratives={top}
          window={window}
          className="hidden md:flex lg:col-start-2 lg:row-span-3 lg:row-start-4 lg:h-full lg:min-h-0"
        />
      </div>
    </div>
  );
}
