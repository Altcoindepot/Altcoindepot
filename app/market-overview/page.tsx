import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { DisclaimerNote } from "@/components/disclaimer-note";
import { MarketPulseCard } from "@/components/dashboard/market-pulse";
import {
  getMarketOverviewSnapshot,
  sectorHeatStyle,
} from "@/lib/market-overview-data";
import { formatCompactUsd } from "@/lib/format-compact-usd";
import { ds } from "@/lib/ui-classes";

const TITLE = "Market Overview · Heatmap, Sectors & New Movers | AltCoin Depot";
const DESCRIPTION =
  "Full market overview: total market cap, BTC/ETH dominance, sector heatmaps, which sectors are moving, and top new small-cap movers in the last 24 hours.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/market-overview" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://altcoindepot.com/market-overview",
    siteName: "AltCoin Depot",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const dynamic = "force-dynamic";

function formatPct(n: number | null) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function formatUsd(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n < 1 ? 6 : 2,
  }).format(n);
}

export default async function MarketOverviewPage() {
  const snap = await getMarketOverviewSnapshot();
  const leading = snap.sectors.filter((s) => (s.change24h ?? 0) > 0).slice(0, 4);
  const fading = [...snap.sectors]
    .filter((s) => (s.change24h ?? 0) < 0)
    .sort((a, b) => (a.change24h ?? 0) - (b.change24h ?? 0))
    .slice(0, 4);

  return (
    <>
      <SiteHeader />
      <main className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl space-y-8">
          <div>
            <nav className="text-xs text-zinc-500">
              <Link href="/" className="hover:text-zinc-300">
                Home
              </Link>
              <span className="mx-1.5 text-zinc-600">/</span>
              <span className="text-zinc-400">Market overview</span>
            </nav>
            <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">Market overview</h1>
            <p className={`mt-2 max-w-2xl ${ds.subtitle}`}>
              Pulse stats, a sector heatmap, which categories are moving, and the strongest 24h
              movers among smaller-cap names.
            </p>
            <DisclaimerNote className="mt-2">
              CoinGecko category averages · small-cap movers are a free-tier proxy for new activity ·
              informational only · not financial advice
            </DisclaimerNote>
            {snap.stale ? (
              <p className="mt-2 text-xs text-amber-200/80">
                Some category feeds were empty — showing best-effort snapshot.
              </p>
            ) : null}
          </div>

          <MarketPulseCard pulse={snap.pulse} showOverviewLink={false} />

          <section aria-labelledby="sector-heatmap-heading" className={ds.panelLg}>
            <h2 id="sector-heatmap-heading" className="text-base font-semibold text-zinc-100">
              Sector heatmap
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Average 24h % change across each CoinGecko sector (sample of top names).
            </p>
            <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {snap.sectors.map((s) => {
                const style = sectorHeatStyle(s.change24h);
                return (
                  <li key={s.slug}>
                    <Link
                      href={`/category/${encodeURIComponent(s.slug)}`}
                      className="flex min-h-[5.5rem] flex-col justify-between rounded-xl border border-white/10 p-3 transition-transform hover:-translate-y-0.5"
                      style={style}
                    >
                      <span className="text-sm font-semibold">{s.title}</span>
                      <span className="font-mono text-lg font-bold tabular-nums">
                        {formatPct(s.change24h)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-labelledby="sectors-moving-heading" className={ds.panelLg}>
            <h2 id="sectors-moving-heading" className="text-base font-semibold text-zinc-100">
              What sectors are moving
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Leaders and laggards over the last 24 hours.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className={ds.label}>Leading</p>
                <ul className="mt-2 space-y-2">
                  {leading.length === 0 ? (
                    <li className="text-sm text-zinc-500">No positive sectors right now.</li>
                  ) : (
                    leading.map((s, i) => (
                      <li key={s.slug}>
                        <Link
                          href={`/category/${encodeURIComponent(s.slug)}`}
                          className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-white/5"
                        >
                          <span className="text-sm text-zinc-200">
                            <span className="mr-2 font-mono text-xs text-zinc-500">{i + 1}</span>
                            {s.title}
                          </span>
                          <span className="font-mono text-sm font-semibold text-emerald-300">
                            {formatPct(s.change24h)}
                          </span>
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
              </div>
              <div>
                <p className={ds.label}>Fading</p>
                <ul className="mt-2 space-y-2">
                  {fading.length === 0 ? (
                    <li className="text-sm text-zinc-500">No negative sectors right now.</li>
                  ) : (
                    fading.map((s, i) => (
                      <li key={s.slug}>
                        <Link
                          href={`/category/${encodeURIComponent(s.slug)}`}
                          className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-white/5"
                        >
                          <span className="text-sm text-zinc-200">
                            <span className="mr-2 font-mono text-xs text-zinc-500">{i + 1}</span>
                            {s.title}
                          </span>
                          <span className="font-mono text-sm font-semibold text-red-300">
                            {formatPct(s.change24h)}
                          </span>
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
            <Link
              href="/sectors"
              className="mt-4 inline-flex text-xs font-medium text-teal-300/90 underline-offset-2 hover:underline"
            >
              Browse all sectors →
            </Link>
          </section>

          <section aria-labelledby="new-coins-heading" className={ds.panelLg}>
            <h2 id="new-coins-heading" className="text-base font-semibold text-zinc-100">
              New &amp; Small Cap Movers (24hrs)
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Highest absolute 24h moves among names under ~$150M market cap. Age uses CoinGecko
              genesis date when available, otherwise ATL date.
            </p>
            {snap.newCoins.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-500">No small-cap movers available right now.</p>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-[#111111] text-xs uppercase tracking-wide text-zinc-500">
                      <th className="px-3 py-3 font-medium sm:px-4">#</th>
                      <th className="px-3 py-3 font-medium sm:px-4">Coin</th>
                      <th className="px-3 py-3 text-right font-medium sm:px-4">Price</th>
                      <th className="px-3 py-3 text-right font-medium sm:px-4">24h %</th>
                      <th className="px-3 py-3 text-right font-medium sm:px-4">Age</th>
                      <th className="hidden px-3 py-3 text-right font-medium sm:table-cell sm:px-4">
                        Mcap
                      </th>
                      <th className="hidden px-3 py-3 text-right font-medium md:table-cell md:px-4">
                        Volume
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {snap.newCoins.map((coin, idx) => (
                      <tr
                        key={coin.id}
                        className="border-b border-white/5 transition-colors hover:bg-white/[0.03]"
                      >
                        <td className="px-3 py-2.5 font-mono text-xs text-zinc-500 sm:px-4">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2.5 sm:px-4">
                          <Link
                            href={`/coin/${encodeURIComponent(coin.id)}`}
                            className="flex items-center gap-2.5"
                          >
                            {coin.image ? (
                              <Image
                                src={coin.image}
                                alt=""
                                width={26}
                                height={26}
                                className="rounded-full"
                              />
                            ) : null}
                            <span>
                              <span className="block font-medium text-zinc-100">{coin.name}</span>
                              <span className="text-[11px] uppercase text-zinc-500">
                                {coin.symbol}
                              </span>
                            </span>
                          </Link>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-xs text-zinc-200 sm:px-4">
                          {formatUsd(coin.currentPrice)}
                        </td>
                        <td
                          className={`px-3 py-2.5 text-right font-mono text-xs sm:px-4 ${
                            (coin.change24h ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"
                          }`}
                        >
                          {formatPct(coin.change24h)}
                        </td>
                        <td
                          className="px-3 py-2.5 text-right font-mono text-xs text-zinc-300 sm:px-4"
                          title={coin.ageDate ?? undefined}
                        >
                          {coin.ageLabel ?? "—"}
                        </td>
                        <td className="hidden px-3 py-2.5 text-right font-mono text-xs text-zinc-400 sm:table-cell sm:px-4">
                          {formatCompactUsd(coin.marketCap)}
                        </td>
                        <td className="hidden px-3 py-2.5 text-right font-mono text-xs text-zinc-400 md:table-cell md:px-4">
                          {formatCompactUsd(coin.volume)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
