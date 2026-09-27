import type { ReactNode } from "react";
import Link from "next/link";
import type { GeckoCoinStats } from "@/lib/gecko-coin-stats";
import { formatCompactUsd } from "@/lib/format-compact-usd";
import { ds } from "@/lib/ui-classes";

function formatSupply(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatAthAtl(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n >= 1000) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  if (n >= 1) return `$${n.toFixed(4)}`;
  if (n >= 0.0001) return `$${n.toFixed(6)}`;
  return `$${n.toExponential(2)}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "—";
  return new Date(t).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={ds.stat}>
      <p className={ds.label}>{label}</p>
      <div className="mt-1 font-mono text-sm tabular-nums text-zinc-100">{children}</div>
    </div>
  );
}

/**
 * Encyclopedia fundamentals from CoinGecko.
 * ATH/ATL only when cached Gecko stats exist; otherwise show "—" when
 * `alwaysShowAthAtl` is set (token landings). Never fetches live Gecko here.
 */
export function TokenGeckoStatsPanel({
  stats,
  alwaysShowAthAtl = false,
}: {
  stats: GeckoCoinStats | null;
  alwaysShowAthAtl?: boolean;
}) {
  if (!stats && !alwaysShowAthAtl) return null;

  const hasExtras =
    stats != null &&
    (stats.circulatingSupply != null ||
      stats.totalSupply != null ||
      stats.maxSupply != null ||
      stats.marketCapUsd != null ||
      stats.fdvUsd != null ||
      stats.categories.length > 0 ||
      Boolean(stats.homepage) ||
      Boolean(stats.geckoId));

  return (
    <section className={`${ds.panel} mt-6`} aria-labelledby="token-fundamentals-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="token-fundamentals-heading" className="text-sm font-semibold text-zinc-100">
          Fundamentals
        </h2>
        <p className="text-[10px] text-zinc-500">
          {stats
            ? "Fundamentals via CoinGecko · delayed up to 2h"
            : "ATH/ATL when CoinGecko is cached · otherwise —"}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="ATH">
          {formatAthAtl(stats?.athUsd ?? null)}
          {stats?.athDate ? (
            <span className="mt-0.5 block text-[10px] font-sans font-normal text-zinc-500">
              {formatDate(stats.athDate)}
            </span>
          ) : null}
        </Stat>
        <Stat label="ATL">
          {formatAthAtl(stats?.atlUsd ?? null)}
          {stats?.atlDate ? (
            <span className="mt-0.5 block text-[10px] font-sans font-normal text-zinc-500">
              {formatDate(stats.atlDate)}
            </span>
          ) : null}
        </Stat>
        {stats ? (
          <>
            <Stat label="Circulating">{formatSupply(stats.circulatingSupply)}</Stat>
            <Stat label="Total supply">{formatSupply(stats.totalSupply)}</Stat>
            <Stat label="Max supply">{formatSupply(stats.maxSupply)}</Stat>
            {stats.marketCapUsd != null ? (
              <Stat label="Market cap (Gecko)">{formatCompactUsd(stats.marketCapUsd)}</Stat>
            ) : null}
            {stats.fdvUsd != null ? (
              <Stat label="FDV (Gecko)">{formatCompactUsd(stats.fdvUsd)}</Stat>
            ) : null}
          </>
        ) : null}
      </div>

      {hasExtras && stats ? (
        <>
          {stats.categories.length > 0 ? (
            <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
              {stats.categories.slice(0, 4).join(" · ")}
            </p>
          ) : null}

          {stats.homepage ? (
            <a
              href={stats.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex text-[11px] font-medium text-teal-300/90 underline-offset-2 hover:underline"
            >
              Official site ↗
            </a>
          ) : null}

          {stats.geckoId ? (
            <Link
              href={`/coin/${encodeURIComponent(stats.geckoId)}`}
              className="mt-3 inline-flex text-[11px] font-medium text-teal-300/90 underline-offset-2 hover:underline"
            >
              Open coin page →
            </Link>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
