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
  const radius = 188;

  return (
    <section
      id="narrative-tracker"
      aria-labelledby="narrative-tracker-heading"
      className={`${ds.panelLg} relative hidden min-h-0 flex-col overflow-visible md:flex ${className}`.trim()}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="narrative-tracker-heading" className="text-base font-semibold text-zinc-100">
          Narrative Rotation Tracker
          <span className="ml-2 text-xs font-medium text-teal-300/80">
            · {WINDOW_LABEL[window]}
          </span>
        </h2>
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">
          Leading → Neutral → Fading
        </p>
      </div>

      <div className="relative mx-auto mt-3 flex min-h-0 w-full flex-1 items-center justify-center overflow-visible px-2">
        <div className="relative aspect-square w-full max-h-full max-w-[min(100%,34rem)]">
          <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full" aria-hidden>
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke="rgba(45,212,191,0.18)"
              strokeWidth="1.5"
              strokeDasharray="4 6"
            />
            <defs>
              <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="rgba(161,161,170,0.45)" />
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
              /** Incoming edge into `target` — brighter when that node has strong inflow. */
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
                  stroke={strongInflow ? target.color : "rgba(161,161,170,0.28)"}
                  strokeWidth={strongInflow ? 1.75 : 1}
                  strokeOpacity={strongInflow ? 0.95 : 0.7}
                  markerEnd="url(#arrow)"
                  style={
                    strongInflow
                      ? ({
                          filter: `drop-shadow(0 0 4px ${target.color}88)`,
                        } as CSSProperties)
                      : undefined
                  }
                />
              );
            })}
          </svg>

          <div className="absolute left-1/2 top-1/2 z-10 flex h-[9.5rem] w-[9.5rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-2 border-teal-400/50 bg-[radial-gradient(circle_at_30%_20%,rgba(45,212,191,0.28),rgba(10,10,10,0.96))] px-3 text-center shadow-[0_0_44px_rgba(45,212,191,0.28)] sm:h-[10.5rem] sm:w-[10.5rem]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-teal-300">
              Regime
            </p>
            <p className="mt-1 text-lg font-extrabold leading-tight tracking-wide text-zinc-50 sm:text-xl">
              {regimeLabel}
            </p>
            <p className="mt-1.5 text-xs font-medium tabular-nums text-zinc-200">
              Day {cycleDay}
              <span className="text-zinc-500"> / 28</span>
            </p>
          </div>

          {nodes.map((n, i) => {
            const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
            const x = 50 + Math.cos(angle) * 36;
            const y = 50 + Math.sin(angle) * 36;
            return (
              <Link
                key={n.slug}
                href={`/narrative/${n.slug}`}
                className="absolute z-20 flex w-[4.75rem] -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center overflow-visible rounded-full border bg-[#0a0a0a]/95 px-1.5 py-2 text-center shadow-[0_0_18px_var(--node-glow)] transition-all duration-300 ease-in-out hover:z-30 hover:scale-105 hover:shadow-[0_0_28px_var(--node-glow-strong),0_0_48px_var(--node-glow)] xl:w-[5.25rem]"
                style={
                  {
                    left: `${x}%`,
                    top: `${y}%`,
                    borderColor: `${n.color}66`,
                    "--node-glow": `${n.color}33`,
                    "--node-glow-strong": `${n.color}99`,
                  } as CSSProperties
                }
              >
                {n.status === "LEADING" ? (
                  <span
                    className="absolute right-1.5 top-1.5 z-10 flex size-1.5"
                    aria-hidden
                    title="Active narrative"
                  >
                    <span
                      className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                      style={{ backgroundColor: n.color }}
                    />
                    <span
                      className="relative inline-flex size-1.5 rounded-full ring-1 ring-[#0a0a0a]"
                      style={{
                        backgroundColor: n.color,
                        boxShadow: `0 0 8px ${n.color}`,
                      }}
                    />
                  </span>
                ) : null}
                <span
                  className="mb-1 h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: n.color, boxShadow: `0 0 8px ${n.color}` }}
                  aria-hidden
                />
                <span className="text-[10px] font-semibold leading-tight text-zinc-100">
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
                  className={`mt-1 ds-badge !h-4 !px-1.5 !text-[8px] ${statusBadgeClass(n.status)}`}
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
