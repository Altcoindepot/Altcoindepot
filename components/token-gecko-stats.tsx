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
 * Encyclopedia fundamentals from CoinGecko. Omit entirely when `stats` is null
 * so Dex-only tokens stay clean. Never replaces Dex live price/chart.
 */
export function TokenGeckoStatsPanel({ stats }: { stats: GeckoCoinStats | null }) {
  if (!stats) return null;

  const hasAny =
    stats.athUsd != null ||
    stats.atlUsd != null ||
    stats.circulatingSupply != null ||
    stats.totalSupply != null ||
    stats.maxSupply != null ||
    stats.marketCapUsd != null ||
    stats.fdvUsd != null;

  if (!hasAny) return null;

  return (
    <section className={`${ds.panel} mt-6`} aria-labelledby="token-fundamentals-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="token-fundamentals-heading" className="text-sm font-semibold text-zinc-100">
          Fundamentals
        </h2>
        <p className="text-[10px] text-zinc-500">
          Fundamentals via CoinGecko · delayed up to 2h
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="ATH">
          {formatAthAtl(stats.athUsd)}
          {stats.athDate ? (
            <span className="mt-0.5 block text-[10px] font-sans font-normal text-zinc-500">
              {formatDate(stats.athDate)}
            </span>
          ) : null}
        </Stat>
        <Stat label="ATL">
          {formatAthAtl(stats.atlUsd)}
          {stats.atlDate ? (
            <span className="mt-0.5 block text-[10px] font-sans font-normal text-zinc-500">
              {formatDate(stats.atlDate)}
            </span>
          ) : null}
        </Stat>
        <Stat label="Circulating">{formatSupply(stats.circulatingSupply)}</Stat>
        <Stat label="Total supply">{formatSupply(stats.totalSupply)}</Stat>
        <Stat label="Max supply">{formatSupply(stats.maxSupply)}</Stat>
        {stats.marketCapUsd != null ? (
          <Stat label="Market cap (Gecko)">{formatCompactUsd(stats.marketCapUsd)}</Stat>
        ) : null}
        {stats.fdvUsd != null ? (
          <Stat label="FDV (Gecko)">{formatCompactUsd(stats.fdvUsd)}</Stat>
        ) : null}
      </div>

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
    </section>
  );
}
