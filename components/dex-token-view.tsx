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
import type { DexTokenPageData } from "@/lib/dexscreener-token";
import { geckoTerminalChartEmbedUrl } from "@/lib/dexscreener-token";
import type { DexTrade } from "@/lib/geckoterminal-trades";
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

export function DexTokenView({ token, trades = [] }: { token: DexTokenPageData; trades?: DexTrade[] }) {
  const chainLabel = formatChainLabel(token.chain);
  const symbol = token.symbol.toUpperCase();
  const embed = geckoTerminalChartEmbedUrl(token.chain, token.pairAddress);
  const changePositive = (token.change24h ?? 0) >= 0;

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

      <div className="mt-4 flex flex-wrap items-start gap-4">
        {token.image ? (
          <Image
            src={token.image}
            alt=""
            width={56}
            height={56}
            className="rounded-full"
          />
        ) : (
          <span className="size-14 rounded-full bg-zinc-800" />
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
            {token.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm uppercase text-zinc-400">{symbol}</span>
            <span className={`${ds.badgeInfo}`}>{chainLabel}</span>
            <DexVenueBadge dexId={token.dexId} dexLabel={token.dexLabel} />
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl font-semibold tabular-nums text-zinc-50">
            {formatUsdPrice(token.priceUsd)}
          </p>
          <p
            className={`mt-1 font-mono text-sm font-semibold tabular-nums ${
              changePositive ? "text-emerald-300" : "text-red-300"
            }`}
          >
            {formatPct(token.change24h)} <span className="text-[10px] uppercase text-zinc-500">24h</span>
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Volume">{formatCompactUsd(token.volume)}</Stat>
        <Stat label="Liquidity">{formatCompactUsd(token.liquidity)}</Stat>
        <Stat label="Market cap">{formatCompactUsd(token.marketCap)}</Stat>
        <Stat label="Pair age">{token.pairAgeLabel}</Stat>
      </div>

      {token.projectLinks && token.projectLinks.length > 0 ? (
        <div className={`${ds.panel} mt-6`}>
          <DexProjectLinks links={token.projectLinks} />
        </div>
      ) : null}

      <div className={`${ds.panel} mt-6`}>
        <p className={ds.label}>Contract</p>
        <div className="mt-2">
          <CopyAddressButton address={token.address} />
        </div>
      </div>

      <section className={`${ds.panelLg} mt-6 !p-0 overflow-hidden`} aria-labelledby="dex-chart-heading">
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
          embedUrl={embed}
          pairUrl={token.pairUrl}
          title={`${token.name} chart`}
        />
      </section>

      <DexRecentTrades trades={trades} pairUrl={token.pairUrl} />

      <p className="mt-6 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-100/90">
        High-risk DEX token. New and low-cap pairs can be illiquid or fraudulent. This page is
        informational only and is not financial advice. Data may be delayed or incomplete.
      </p>
      <DisclaimerNote className="mt-2">Informational only · not financial advice</DisclaimerNote>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/new-low-caps" className={ds.btnPrimary}>
          ← New &amp; Low Caps
        </Link>
        {token.pairUrl ? (
          <a
            href={token.pairUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={ds.btnSecondary}
          >
            View on DexScreener
          </a>
        ) : null}
      </div>
    </div>
  );
}
