import Link from "next/link";
import type { NarrativeView } from "@/lib/dashboard-data";
import type { RotationWindow } from "@/lib/narratives";
import { ds } from "@/lib/ui-classes";

function formatPct(n: number | null) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

const WINDOW_LABEL: Record<RotationWindow, string> = {
  "24h": "24H",
  "7d": "7D",
  "30d": "1M",
};

export function NarrativeRanking({
  narratives,
  window = "24h",
  className = "",
}: {
  narratives: NarrativeView[];
  window?: RotationWindow;
  className?: string;
}) {
  return (
    <section
      aria-labelledby="narrative-ranking-heading"
      className={`${ds.panel} flex min-h-0 flex-col ${className}`.trim()}
    >
      <h2 id="narrative-ranking-heading" className="text-sm font-semibold text-zinc-100">
        Narrative Ranking
        <span className="ml-2 text-[10px] font-medium text-teal-300/80">{WINDOW_LABEL[window]}</span>
      </h2>
      <ol className="mt-3 min-h-0 flex-1 space-y-2.5 overflow-y-auto">
        {narratives.map((n, i) => (
          <li key={n.slug}>
            <Link
              href={`/narrative/${n.slug}`}
              className="flex items-center gap-2.5 rounded-lg px-1 py-1 transition-colors hover:bg-white/5"
            >
              <span className="w-4 font-mono text-xs text-zinc-500">{i + 1}</span>
              <span
                className="h-7 w-7 shrink-0 rounded-full border"
                style={{
                  backgroundColor: `${n.color}22`,
                  borderColor: `${n.color}66`,
                  boxShadow: `0 0 12px ${n.color}44`,
                }}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-zinc-100">{n.title}</span>
                <span className="block truncate text-[10px] text-zinc-500">{n.subtitle}</span>
              </span>
              <span
                className={`shrink-0 font-mono text-xs font-semibold tabular-nums ${
                  (n.change ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"
                }`}
              >
                {formatPct(n.change)}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
