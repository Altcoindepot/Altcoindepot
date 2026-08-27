import { ds } from "@/lib/ui-classes";
import { InfoTooltip } from "@/components/info-tooltip";

/** One-line sticky regime — phone fold budget, not three widgets. */
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
    <div className="sticky top-[3.65rem] z-40 px-3 pb-0 pt-0.5 sm:top-[4.85rem] sm:px-4 sm:pt-1">
      <div className="chrome-glass mx-auto flex max-w-[90rem] items-center gap-2 px-2.5 py-1 sm:gap-3 sm:px-4 sm:py-1.5">
        <InfoTooltip
          label="About Market Regime"
          text="Tracks whether capital is flowing heavily into a single sector or rotating rapidly across multiple narratives."
        >
          <span
            className={`${ds.badge} max-w-[42%] shrink truncate border-teal-400/45 bg-teal-500/10 text-[9px] font-semibold uppercase tracking-wide text-teal-200 sm:max-w-none sm:text-[10px]`}
          >
            {regimeLabel}
          </span>
        </InfoTooltip>
        <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
          <span className="sr-only">
            Cycle day {cycleDay}, {cycleProgressPct}%
          </span>
          <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-zinc-800/90">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-300"
              style={{ width: `${Math.min(100, Math.max(0, cycleProgressPct))}%` }}
            />
          </div>
          <span className="shrink-0 font-mono text-[10px] tabular-nums text-teal-200/90 sm:text-[11px]">
            {cycleProgressPct}%
          </span>
        </div>
      </div>
    </div>
  );
}
