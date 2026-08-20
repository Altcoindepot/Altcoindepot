import Link from "next/link";
import type { CSSProperties } from "react";
import type { NarrativeView } from "@/lib/dashboard-data";
import { statusBadgeClass, type RotationWindow } from "@/lib/narratives";
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

/** Desktop circular narrative rotation tracker. Hidden on small screens via parent layout. */
export function NarrativeRotationTracker({
  narratives,
  regimeLabel,
  cycleDay,
  window = "24h",
  className = "",
}: {
  narratives: NarrativeView[];
  regimeLabel: string;
  cycleDay: number;
  window?: RotationWindow;
  className?: string;
}) {
  const nodes = narratives.slice(0, 6);
  const size = 520;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 175;

  return (
    <section
      id="narrative-tracker"
      aria-labelledby="narrative-tracker-heading"
      className={`${ds.panelLg} relative hidden min-h-0 flex-col overflow-hidden md:flex ${className}`.trim()}
    >
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-white/8 pb-3">
        <div>
          <h2 id="narrative-tracker-heading" className="text-base font-semibold text-zinc-100">
            Narrative Tracker
          </h2>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            {WINDOW_LABEL[window]} window · Leading → Neutral → Fading
          </p>
        </div>
        <p className="text-[11px] tabular-nums text-teal-300/90">
          {regimeLabel}
          <span className="text-zinc-600"> · </span>
          Day {cycleDay}/28
        </p>
      </div>

      <div className="relative mx-auto mt-4 flex min-h-0 w-full flex-1 items-center justify-center px-3 pb-2">
        <div className="relative aspect-square w-full max-h-full max-w-[min(100%,30rem)]">
          <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full" aria-hidden>
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke="rgba(45,212,191,0.14)"
              strokeWidth="1.25"
              strokeDasharray="3 7"
            />
            <defs>
              <marker id="arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
                <path d="M0,0 L5,2.5 L0,5 Z" fill="rgba(161,161,170,0.4)" />
              </marker>
            </defs>
            {nodes.map((n, i) => {
              const target = nodes[(i + 1) % nodes.length]!;
              const a0 = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
              const a1 = ((i + 1) / nodes.length) * Math.PI * 2 - Math.PI / 2;
              const x0 = cx + Math.cos(a0) * radius;
              const y0 = cy + Math.sin(a0) * radius;
              const x1 = cx + Math.cos(a1) * radius;
              const y1 = cy + Math.sin(a1) * radius;
              const strongInflow = target.status === "LEADING";
              return (
                <line
                  key={`edge-${n.slug}-${target.slug}`}
                  x1={x0}
                  y1={y0}
                  x2={x1}
                  y2={y1}
                  className={
                    strongInflow
                      ? "narrative-flow-vector narrative-flow-vector--inflow"
                      : "narrative-flow-vector"
                  }
                  stroke={strongInflow ? target.color : "rgba(161,161,170,0.22)"}
                  strokeWidth={strongInflow ? 1.5 : 1}
                  strokeOpacity={strongInflow ? 0.9 : 0.65}
                  markerEnd="url(#arrow)"
                />
              );
            })}
          </svg>

          <div className="absolute left-1/2 top-1/2 z-10 flex h-[7.5rem] w-[7.5rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-teal-400/40 bg-[radial-gradient(circle_at_30%_20%,rgba(45,212,191,0.22),rgba(10,10,10,0.97))] px-2 text-center shadow-[0_0_28px_rgba(45,212,191,0.18)] sm:h-32 sm:w-32">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-teal-300/90">
              Regime
            </p>
            <p className="mt-1 text-sm font-bold leading-tight tracking-wide text-zinc-50 sm:text-base">
              {regimeLabel}
            </p>
            <p className="mt-1 text-[11px] font-medium tabular-nums text-zinc-400">
              Day {cycleDay}
              <span className="text-zinc-600"> / 28</span>
            </p>
          </div>

          {nodes.map((n, i) => {
            const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
            const x = 50 + Math.cos(angle) * 34;
            const y = 50 + Math.sin(angle) * 34;
            return (
              <Link
                key={n.slug}
                href={`/narrative/${n.slug}`}
                className="absolute z-20 flex w-[4.25rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-2xl border bg-[#0a0a0a]/95 px-1.5 py-1.5 text-center shadow-[0_0_14px_var(--node-glow)] transition-transform duration-200 hover:z-30 hover:scale-105 xl:w-[4.75rem]"
                style={
                  {
                    left: `${x}%`,
                    top: `${y}%`,
                    borderColor: `${n.color}55`,
                    "--node-glow": `${n.color}28`,
                  } as CSSProperties
                }
              >
                {n.status === "LEADING" ? (
                  <span
                    className="absolute right-1 top-1 z-10 flex size-1.5"
                    aria-hidden
                    title="Leading"
                  >
                    <span
                      className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                      style={{ backgroundColor: n.color }}
                    />
                    <span
                      className="relative inline-flex size-1.5 rounded-full ring-1 ring-[#0a0a0a]"
                      style={{ backgroundColor: n.color }}
                    />
                  </span>
                ) : null}
                <span
                  className="mb-1 h-2 w-2 rounded-full"
                  style={{ backgroundColor: n.color, boxShadow: `0 0 6px ${n.color}` }}
                  aria-hidden
                />
                <span className="line-clamp-2 text-[9px] font-semibold leading-tight text-zinc-100 xl:text-[10px]">
                  {n.title}
                </span>
                <span
                  className={`mt-0.5 font-mono text-[10px] font-bold tabular-nums ${
                    (n.change ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"
                  }`}
                >
                  {formatPct(n.change)}
                </span>
                <span
                  className={`mt-1 ds-badge !h-3.5 !px-1 !text-[7px] ${statusBadgeClass(n.status)}`}
                >
                  {n.status}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
