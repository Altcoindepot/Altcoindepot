import { ds } from "@/lib/ui-classes";

export function DashboardHero({
  regimeLabel,
  summary,
}: {
  regimeLabel: string;
  summary: string;
}) {
  return (
    <header className="mb-6 sm:mb-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-50 sm:text-4xl md:text-5xl">
        See what&apos;s actually moving
      </h1>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={`${ds.badge} border-teal-400/45 bg-teal-500/10 uppercase tracking-wide text-teal-200`}
        >
          Market Regime: {regimeLabel}
        </span>
      </div>
      <p className={`${ds.subtitle} max-w-2xl`}>
        {summary ||
          "Track narrative rotations, spot regime shifts, and move ahead of the crowd."}
      </p>
    </header>
  );
}
