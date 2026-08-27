import { ds } from "@/lib/ui-classes";
import { InfoTooltip } from "@/components/info-tooltip";

/** Thin sticky regime line under the floating header capsule. */
export function StickyRegimeBar({
  regimeLabel,
  cycleDay,
  cycleProgressPct,
}: {
  regimeLabel: string;
  cycleDay: number;
  cycleProgressPct: number;
}) {
  return (
    <div className="sticky top-[4.35rem] z-40 px-3 pb-1 pt-1 sm:top-[4.85rem] sm:px-4">
      <div className="glass-card mx-auto flex max-w-[90rem] flex-wrap items-center gap-2 px-3 py-1.5 sm:gap-4 sm:px-4 sm:py-2">
        <span
          className={`${ds.badge} inline-flex items-center border-teal-400/45 bg-teal-500/10 text-[10px] font-semibold uppercase tracking-wide text-teal-200 sm:text-[11px]`}
        >
          <InfoTooltip
            label="About Market Regime"
            text="Tracks whether capital is flowing heavily into a single sector or rotating rapidly across multiple narratives."
          >
            <span>Market Regime: {regimeLabel}</span>
          </InfoTooltip>
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-xs sm:gap-3">
          <span className="inline-flex shrink-0 items-center whitespace-nowrap text-[9px] font-semibold uppercase tracking-wider text-zinc-500 sm:text-[10px]">
            <InfoTooltip
              label="About Cycle Progress"
              text="Measures how far along the current capital deployment phase is before a potential market correction."
            >
              <span>
                Cycle · Day {cycleDay}
              </span>
            </InfoTooltip>
          </span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-800/80 sm:h-1.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-300"
              style={{ width: `${Math.min(100, Math.max(0, cycleProgressPct))}%` }}
            />
          </div>
          <span className="font-mono text-[10px] tabular-nums text-teal-200/90">
            {cycleProgressPct}%
          </span>
        </div>
      </div>
    </div>
  );
}
