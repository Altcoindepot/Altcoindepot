import { ds } from "@/lib/ui-classes";
import { InfoTooltip } from "@/components/info-tooltip";

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
    <div className="sticky top-[7.25rem] z-40 border-b border-white/10 bg-[#0b0d11]/92 backdrop-blur-xl lg:top-[4.75rem]">
      <div className="mx-auto flex max-w-[90rem] flex-wrap items-center gap-3 px-4 py-2.5 sm:px-6 lg:gap-6">
        <span
          className={`${ds.badge} inline-flex items-center border-teal-400/45 bg-teal-500/10 font-semibold uppercase tracking-wide text-teal-200`}
        >
          <InfoTooltip
            label="About Market Regime"
            text="Tracks whether capital is flowing heavily into a single sector or rotating rapidly across multiple narratives."
          >
            <span>Market Regime: {regimeLabel}</span>
          </InfoTooltip>
        </span>
        <div className="flex min-w-[10rem] flex-1 items-center gap-3 sm:max-w-xs">
          <span className="inline-flex items-center whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            <InfoTooltip
              label="About Cycle Progress"
              text="Measures how far along the current capital deployment phase is before a potential market correction."
            >
              <span>
                Cycle Progress · Day {cycleDay}
              </span>
            </InfoTooltip>
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
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
