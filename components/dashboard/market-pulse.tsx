import Link from "next/link";
import type { MarketPulse } from "@/lib/dashboard-data";
import { formatCompactUsd } from "@/lib/format-compact-usd";
import { ds } from "@/lib/ui-classes";
import { PulseSparkline } from "@/components/dashboard/pulse-sparkline";

function formatPct(n: number | null) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

export function MarketPulseCard({
  pulse,
  className = "",
  showOverviewLink = true,
}: {
  pulse: MarketPulse;
  className?: string;
  showOverviewLink?: boolean;
}) {
  const rows = [
    {
      label: "Total Market Cap",
      value: formatCompactUsd(pulse.totalMarketCapUsd),
      pct: pulse.marketCapChange24h,
    },
    {
      label: "24h Volume",
      value: formatCompactUsd(pulse.totalVolumeUsd),
      pct: null as number | null,
    },
    {
      label: "BTC Dominance",
      value:
        pulse.btcDominance != null ? `${pulse.btcDominance.toFixed(2)}%` : "—",
      pct: pulse.btcDominanceChange,
    },
    {
      label: "ETH Dominance",
      value:
        pulse.ethDominance != null ? `${pulse.ethDominance.toFixed(2)}%` : "—",
      pct: pulse.ethDominanceChange,
    },
  ];

  return (
    <section
      id="market-pulse"
      aria-labelledby="market-pulse-heading"
      className={`${ds.panel} flex min-h-0 flex-col ${className}`.trim()}
    >
      <h2 id="market-pulse-heading" className="text-sm font-semibold text-zinc-100">
        Market Pulse
      </h2>
      <div className="mt-3 min-h-0 flex-1 grid grid-cols-2 content-start gap-2 overflow-y-auto">
        {rows.map((row) => {
          const positive = (row.pct ?? 0) >= 0;
          return (
            <article key={row.label} className={ds.stat}>
              <p className={ds.label}>{row.label}</p>
              <p className="mt-1 font-mono text-sm font-bold tabular-nums text-zinc-50">
                {row.value}
              </p>
              {row.pct != null ? (
                <p
                  className={`mt-0.5 font-mono text-[10px] tabular-nums ${
                    positive ? "text-emerald-300" : "text-red-300"
                  }`}
                >
                  {formatPct(row.pct)}
                </p>
              ) : (
                <p className="mt-0.5 text-[10px] text-zinc-600">24h</p>
              )}
              <PulseSparkline
                positive={row.pct == null ? true : positive}
                className="mt-1 h-4 w-full"
              />
            </article>
          );
        })}
      </div>
      {showOverviewLink ? (
        <Link
          href="/market-overview"
          className="mt-3 inline-flex shrink-0 text-xs font-medium text-teal-300/90 underline-offset-2 hover:underline"
        >
          View full market overview →
        </Link>
      ) : null}
    </section>
  );
}
