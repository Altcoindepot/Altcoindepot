import Link from "next/link";
import type { NarrativeView } from "@/lib/dashboard-data";
import type { RotationWindow } from "@/lib/narratives";
import { rotationSignalLabel, statusBadgeClass } from "@/lib/narratives";
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

/** Mobile: compact chips. Desktop sidebar: denser list. Orbit is never the mobile hero. */
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

  if (mobile) {
    return (
      <section
        aria-labelledby="top-rotations-mobile-heading"
        className={`${className}`.trim()}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2
            id="top-rotations-mobile-heading"
            className="text-[13px] font-semibold text-zinc-100"
          >
            Top Rotations ({WINDOW_LABEL[window]})
          </h2>
        </div>
        <ul className="flex flex-col gap-1.5">
          {narratives.map((n) => {
            const leading = n.status === "LEADING";
            const fading = n.status === "FADING";
            return (
              <li key={n.slug}>
                <Link
                  href={`/narrative/${n.slug}`}
                  className={`flex min-h-11 items-center gap-2.5 rounded-xl border px-3 py-2 active:bg-white/[0.04] ${
                    leading
                      ? "border-emerald-400/45 bg-emerald-500/10"
                      : fading
                        ? "border-rose-400/35 bg-rose-500/[0.07] opacity-90"
                        : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: n.color,
                      boxShadow: leading ? `0 0 10px ${n.color}` : undefined,
                    }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-zinc-100">
                    {n.title}
                  </span>
                  <span
                    className={`shrink-0 rounded border px-1.5 py-px text-[9px] font-bold uppercase tracking-wider ${statusBadgeClass(n.status)}`}
                  >
                    {rotationSignalLabel(n.status)}
                  </span>
                  <span
                    className={`shrink-0 font-mono text-[12px] font-bold tabular-nums ${
                      (n.change ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"
                    }`}
                  >
                    {formatPct(n.change)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="top-rotations-heading"
      className={`${ds.panel} flex min-h-0 flex-col ${className}`.trim()}
    >
      <h2 id="top-rotations-heading" className="text-sm font-semibold text-zinc-100 sm:text-base">
        Top Rotations ({WINDOW_LABEL[window]})
      </h2>
      <ul className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto">
        {narratives.map((n) => {
          const width = Math.round((Math.abs(n.change ?? 0) / maxAbs) * 100);
          const leading = n.status === "LEADING";
          const fading = n.status === "FADING";
          return (
            <li key={n.slug}>
              <Link
                href={`/narrative/${n.slug}`}
                className={`block rounded-lg border border-transparent p-1.5 transition-colors hover:bg-white/[0.03] ${
                  leading
                    ? "border-emerald-400/25 bg-emerald-500/[0.07]"
                    : fading
                      ? "border-rose-400/20 bg-rose-500/[0.05] opacity-85"
                      : ""
                }`}
              >
                <div className="flex w-full items-start gap-2.5">
                  <span
                    className={`mt-0.5 h-8 w-8 shrink-0 rounded-lg border ${
                      leading ? "ring-2 ring-emerald-400/50" : fading ? "grayscale-[0.35]" : ""
                    }`}
                    style={{
                      backgroundColor: `${n.color}22`,
                      borderColor: `${n.color}55`,
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
                        className={`rounded border px-1.5 py-px text-[9px] font-bold uppercase tracking-wider ${statusBadgeClass(n.status)}`}
                      >
                        {rotationSignalLabel(n.status)}
                      </span>
                      <p className="truncate text-[10px] text-zinc-500">{n.subtitle}</p>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${width}%`,
                          backgroundColor: n.color,
                          opacity: fading ? 0.55 : 1,
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
