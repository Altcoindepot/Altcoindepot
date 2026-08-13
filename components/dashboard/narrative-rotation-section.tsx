"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { MarketPulse, NarrativeSnapshot } from "@/lib/dashboard-data";
import { rankNarrativesForWindow } from "@/lib/dashboard-data";
import {
  DEFAULT_ROTATION_WINDOW,
  ROTATION_WINDOWS,
  type RotationWindow,
} from "@/lib/narratives";
import { NarrativeRotationTracker } from "@/components/dashboard/narrative-rotation-tracker";
import { NarrativeRanking } from "@/components/dashboard/narrative-ranking";
import { TopRotations } from "@/components/dashboard/top-rotations";
import { MarketPulseCard } from "@/components/dashboard/market-pulse";
import { ds } from "@/lib/ui-classes";

/** Shared 24H / 7D / 1M controls for tracker, ranking, and top rotations. */
export function NarrativeRotationSection({
  narratives,
  regimeLabel,
  pulse,
  lowCapsSlot,
}: {
  narratives: NarrativeSnapshot[];
  regimeLabel: string;
  pulse: MarketPulse;
  lowCapsSlot: ReactNode;
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
              className={`min-h-9 rounded-md px-3 text-xs font-semibold transition-colors sm:min-h-8 ${
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

      {/* Desktop: one 6-row grid — left pair each spans 3, right trio each spans 2 */}
      <div className="hidden h-[46rem] gap-4 lg:grid lg:grid-cols-[minmax(0,1.45fr)_minmax(17rem,0.9fr)] lg:grid-rows-6">
        <NarrativeRotationTracker
          narratives={trackerNodes}
          regimeLabel={regimeLabel}
          window={window}
          className="col-start-1 row-span-3 row-start-1 h-full min-h-0"
        />
        <NarrativeRanking
          narratives={ranked}
          window={window}
          className="col-start-2 row-span-2 row-start-1 h-full min-h-0"
        />
        <MarketPulseCard
          pulse={pulse}
          className="col-start-2 row-span-2 row-start-3 h-full min-h-0"
        />
        <div className="col-start-1 row-span-3 row-start-4 h-full min-h-0">
          {lowCapsSlot}
        </div>
        <TopRotations
          narratives={top}
          window={window}
          className="col-start-2 row-span-2 row-start-5 h-full min-h-0"
        />
      </div>

      {/* Mobile / tablet stack */}
      <div className="space-y-4 lg:hidden">
        <TopRotations narratives={top} variant="mobile-primary" window={window} />
        <NarrativeRanking narratives={ranked} window={window} />
        <MarketPulseCard pulse={pulse} />
        {lowCapsSlot}
      </div>
    </div>
  );
}
