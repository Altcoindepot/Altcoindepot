import { ds } from "@/lib/ui-classes";
import { InfoTooltip } from "@/components/info-tooltip";
import { CompareAssetsButton } from "@/components/dashboard/asset-compare-modal";

export function DashboardHero({
  regimeLabel,
  summary,
}: {
  regimeLabel: string;
  summary: string;
}) {
  return (
    <header className="mb-6 sm:mb-8">
      <h1 className="text-brand-altcoindepot max-w-[22ch] text-balance text-3xl font-extrabold tracking-tight sm:max-w-[28ch] sm:text-4xl md:max-w-3xl md:text-5xl">
        See what&apos;s actually moving, before the rest of the market does.
      </h1>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={`${ds.badge} inline-flex items-center border-teal-400/45 bg-teal-500/10 uppercase tracking-wide text-teal-200`}
        >
          <InfoTooltip
            label="About Market Regime"
            text="Tracks whether capital is flowing heavily into a single sector or rotating rapidly across multiple narratives."
          >
            <span>Market Regime: {regimeLabel}</span>
          </InfoTooltip>
        </span>
        <CompareAssetsButton />
      </div>
      <p className={`${ds.subtitle} max-w-2xl`}>
        {summary ||
          "Track narrative rotations, spot regime shifts, and move ahead of the crowd."}
      </p>
    </header>
  );
}
