import type { DashboardSnapshot } from "@/lib/dashboard-data";
import { StickyRegimeBar } from "@/components/dashboard/sticky-regime-bar";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { NarrativeRotationSection } from "@/components/dashboard/narrative-rotation-section";
import { NewLowCapsTable } from "@/components/dashboard/new-low-caps-table";
import { DisclaimerNote } from "@/components/disclaimer-note";

export function DashboardHome({ snapshot }: { snapshot: DashboardSnapshot }) {
  return (
    <div className="w-full">
      <StickyRegimeBar
        regimeLabel={snapshot.regimeLabel}
        cycleDay={snapshot.cycleDay}
        cycleProgressPct={snapshot.cycleProgressPct}
      />

      <div className="mx-auto max-w-[90rem] px-4 py-6 sm:px-6 sm:py-8">
        <DashboardHero
          regimeLabel={snapshot.regimeLabel}
          summary={snapshot.regimeSummary}
        />

        <NarrativeRotationSection
          narratives={snapshot.narratives}
          regimeLabel={snapshot.regimeLabel}
          pulse={snapshot.pulse}
          trendingAssets={snapshot.trendingAssets}
          lowCapsSlot={<NewLowCapsTable rows={snapshot.lowCaps} />}
        />

        <DisclaimerNote className="mt-6">
          Narrative baskets are CoinGecko category averages · switch 24H / 7D / 1M on the tracker ·
          informational only · not financial advice · refreshed about hourly
        </DisclaimerNote>
        {snapshot.stale ? (
          <p className="mt-2 text-xs text-amber-200/80">
            Some category feeds were empty — showing best-effort snapshot.
          </p>
        ) : null}
      </div>
    </div>
  );
}
