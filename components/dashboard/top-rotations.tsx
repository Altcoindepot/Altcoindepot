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

/** Top Rotations list — also used as the mobile replacement for the circular tracker. */
export function TopRotations({
  narratives,
  variant = "sidebar",
  window = "24h",
  className = "",
}: {
  narratives: NarrativeView[];
  variant?: "sidebar" | "mobile-primary";
  window?: RotationWindow;
  className?: string;
}) {
  const maxAbs = Math.max(...narratives.map((n) => Math.abs(n.change ?? 0)), 1);
  const mobile = variant === "mobile-primary";

  return (
    <section
      aria-labelledby={mobile ? "top-rotations-mobile-heading" : "top-rotations-heading"}
      className={`${ds.panel} flex min-h-0 flex-col ${className}`.trim()}
    >
      <h2
        id={mobile ? "top-rotations-mobile-heading" : "top-rotations-heading"}
        className="text-sm font-semibold text-zinc-100 sm:text-base"
      >
        Top Rotations ({WINDOW_LABEL[window]})
      </h2>
      {mobile ? (
        <p className="mt-1 text-xs text-zinc-500">
          Narrative leadership for this window — tap a card for the full sector.
        </p>
      ) : null}
      <ul
        className={
          mobile
            ? "mt-3 flex max-h-[22rem] min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain pr-0.5"
            : "mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto"
        }
      >
        {narratives.map((n) => {
          const width = Math.round((Math.abs(n.change ?? 0) / maxAbs) * 100);
          const leading = n.status === "LEADING";
          const fading = n.status === "FADING";
          return (
            <li key={n.slug}>
              <Link
                href={`/narrative/${n.slug}`}
                className={
                  mobile
                    ? `flex min-h-[44px] items-center gap-3 rounded-2xl border px-3 py-3 transition-colors ${
                        leading
                          ? "border-emerald-400/35 bg-emerald-500/10 shadow-[0_8px_24px_rgba(0,0,0,0.35)] hover:border-emerald-400/50"
                          : fading
                            ? "border-red-400/30 bg-red-500/[0.07] shadow-[0_8px_24px_rgba(0,0,0,0.35)] hover:border-red-400/45"
                            : "border-teal-400/20 bg-white/[0.04] shadow-[0_8px_24px_rgba(0,0,0,0.32)] hover:border-teal-400/35"
                      }`
                    : "block rounded-lg p-1 hover:bg-white/[0.03]"
                }
              >
                <div className="flex w-full items-start gap-2.5">
                  <span
                    className="mt-0.5 h-9 w-9 shrink-0 rounded-xl border"
                    style={{
                      backgroundColor: `${n.color}22`,
                      borderColor: `${n.color}55`,
                      boxShadow: `0 0 14px ${n.color}33`,
                    }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-zinc-100">{n.title}</p>
                      <p
                        className={`shrink-0 font-mono text-sm font-bold tabular-nums ${
                          (n.change ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"
                        }`}
                      >
                        {formatPct(n.change)}
                      </p>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded px-1 py-px text-[9px] font-bold uppercase tracking-wider ${
                          leading
                            ? "bg-emerald-500/20 text-emerald-200"
                            : fading
                              ? "bg-red-500/20 text-red-200"
                              : "bg-white/5 text-zinc-500"
                        }`}
                      >
                        {n.status}
                      </span>
                      <p className="truncate text-[10px] text-zinc-500">{n.subtitle}</p>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${width}%`,
                          backgroundColor: n.color,
                          boxShadow: `0 0 8px ${n.color}88`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
