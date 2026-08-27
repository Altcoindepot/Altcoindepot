import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { CopyAddressButton } from "@/components/copy-address-button";
import { DisclaimerNote } from "@/components/disclaimer-note";
import { DexProjectLinks } from "@/components/dex-project-links";
import { DexRecentTrades } from "@/components/dex-recent-trades";
import { DexScreenerChart } from "@/components/dex-screener-chart";
import { DexVenueBadge } from "@/components/dex-venue-badge";
import { RecordTokenView } from "@/components/record-token-view";
import { TokenGeckoStatsPanel } from "@/components/token-gecko-stats";
import type { DexTokenPageData } from "@/lib/dexscreener-token";
import {
  dexScreenerEmbedUrl,
  geckoTerminalChartEmbedUrl,
} from "@/lib/dexscreener-token";
import type { GeckoCoinStats } from "@/lib/gecko-coin-stats";
import type { DexTrade } from "@/lib/geckoterminal-trades";
import { DATA_RESPONSIBILITY_DISCLAIMER } from "@/lib/data-responsibility";
import { formatChainLabel } from "@/lib/format-chain";
import { formatCompactUsd } from "@/lib/format-compact-usd";
import { ds } from "@/lib/ui-classes";

function formatPct(n: number | null) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function formatUsdPrice(n: number | null) {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n >= 1000) return `$${n.toFixed(2)}`;
  if (n >= 1) return `$${n.toFixed(4)}`;
  if (n >= 0.0001) return `$${n.toFixed(6)}`;
  return `$${n.toExponential(2)}`;
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={ds.stat}>
      <p className={ds.label}>{label}</p>
      <p className="mt-1 font-mono text-sm tabular-nums text-zinc-100">{children}</p>
    </div>
  );
}

/**
 * One token-page skeleton for every asset:
 * Dex price → Chart (Dex→GT) → Contract → Gecko stats or badge.
 */
export function DexTokenView({
  token,
  trades = [],
  geckoStats = null,
  pageH1,
}: {
  token: DexTokenPageData;
  trades?: DexTrade[];
  geckoStats?: GeckoCoinStats | null;
  pageH1?: string;
}) {
  const chainLabel = formatChainLabel(token.chain);
  const symbol = token.symbol.toUpperCase();
  const dexEmbed = dexScreenerEmbedUrl(token.pairUrl, token.chain, token.pairAddress);
  const gtEmbed = geckoTerminalChartEmbedUrl(token.chain, token.pairAddress);
  const changePositive = (token.change24h ?? 0) >= 0;
  const notOnGecko = !geckoStats;

  return (
    <div className="mx-auto max-w-4xl">
      <RecordTokenView
        chain={token.chain}
        address={token.address}
        symbol={symbol}
        name={token.name}
        dex={token.dexLabel}
      />
      <p className="text-xs uppercase tracking-widest text-zinc-500">
        <Link href="/" className="hover:text-teal-200">
          Home
        </Link>
        <span className="mx-2 text-zinc-700">/</span>
        <Link href="/new-low-caps" className="hover:text-teal-200">
          New &amp; Low Caps
        </Link>
        <span className="mx-2 text-zinc-700">/</span>
        {symbol}
      </p>

      {/* 1) Dex price header — same pair as chart */}
      <header className="chrome-glass mt-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-start gap-4">
          {token.image ? (
            <Image
              src={token.image}
              alt=""
              width={56}
              height={56}
              className="rounded-full ring-1 ring-teal-400/25"
            />
          ) : (
            <span className="flex size-14 items-center justify-center rounded-full bg-zinc-800 font-mono text-lg font-bold text-zinc-300 ring-1 ring-teal-400/20">
              {symbol.slice(0, 1)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
              {pageH1 ?? token.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm uppercase text-zinc-300">{symbol}</span>
              <span className={ds.badgeInfo}>{chainLabel}</span>
              <DexVenueBadge dexId={token.dexId} dexLabel={token.dexLabel} />
              {notOnGecko ? (
                <span className={ds.badgeWarn}>Not on CoinGecko yet</span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-zinc-500">{token.name}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Dex price
            </p>
            <p className="font-mono text-2xl font-semibold tabular-nums text-zinc-50">
              {formatUsdPrice(token.priceUsd)}
            </p>
            <p
              className={`mt-1 inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-sm font-semibold tabular-nums ${
                changePositive
                  ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25"
                  : "bg-red-500/15 text-red-300 ring-1 ring-red-400/25"
              }`}
            >
              {formatPct(token.change24h)}
              <span className="ml-1 text-[9px] uppercase text-zinc-500">24h</span>
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Volume">{formatCompactUsd(token.volume)}</Stat>
          <Stat label="Liquidity">{formatCompactUsd(token.liquidity)}</Stat>
          <Stat label="Market cap">{formatCompactUsd(token.marketCap)}</Stat>
          <Stat label="Pair age">{token.pairAgeLabel}</Stat>
        </div>
      </header>

      {/* 2) Chart: DexScreener → GeckoTerminal → unavailable */}
      <section className={`${ds.panelLg} mt-5 !p-0 overflow-hidden`} aria-labelledby="dex-chart-heading">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3 sm:px-5">
          <h2 id="dex-chart-heading" className="text-sm font-semibold text-zinc-100">
            Chart
          </h2>
          {token.pairUrl ? (
            <a
              href={token.pairUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-teal-300/90 underline-offset-2 hover:underline"
            >
              Open DexScreener ↗
            </a>
          ) : null}
        </div>
        <DexScreenerChart
          dexEmbedUrl={dexEmbed}
          geckoTerminalEmbedUrl={gtEmbed}
          pairUrl={token.pairUrl}
          title={`${token.name} chart`}
        />
      </section>

      {/* 3) Contract + disclaimer */}
      <div className={`${ds.panel} mt-5`}>
        <p className={ds.label}>Contract</p>
        <div className="mt-2">
          <CopyAddressButton address={token.address} />
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-amber-100/80">
          {DATA_RESPONSIBILITY_DISCLAIMER}{" "}
          <Link href="/disclaimer" className="font-semibold text-amber-50 underline-offset-2 hover:underline">
            Full disclaimer →
          </Link>
        </p>
      </div>

      {/* 4) Gecko static stats OR already badged above */}
      <TokenGeckoStatsPanel stats={geckoStats} />

      {token.projectLinks && token.projectLinks.length > 0 ? (
        <div className={`${ds.panel} mt-5`}>
          <DexProjectLinks links={token.projectLinks} />
        </div>
      ) : null}

      <DexRecentTrades trades={trades} pairUrl={token.pairUrl} />

      <p className="mt-6 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-100/90">
        Verify the contract and pair before any decision. DEX data can be wrong. Not financial advice.
      </p>

      <DisclaimerNote className="mt-4 text-[11px]" />
    </div>
  );
}
