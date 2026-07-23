import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { coinGeckoFetch, type CoinMarket } from "@/lib/coingecko";
import { MiniCoinChart } from "@/components/mini-coin-chart";

export const metadata: Metadata = {
  title: "Top 200 Trending",
  description:
    "Heatmap-style view of top 200 crypto projects ranked by 24h movers on AltCoinDepot.",
};

const TOP_200_PATH =
  "/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=200&page=1&sparkline=true&price_change_percentage=24h";

function formatUsd(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n < 1 ? 4 : 2,
  }).format(n);
}

function formatPct(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function intensityClass(ch: number | null | undefined) {
  if (ch == null || Number.isNaN(ch)) return "border-white/10 bg-[#0f1116]";
  const abs = Math.abs(ch);
  if (ch >= 0) {
    if (abs >= 15) return "border-emerald-300/45 bg-emerald-400/20";
    if (abs >= 8) return "border-emerald-400/35 bg-emerald-400/15";
    if (abs >= 3) return "border-emerald-500/30 bg-emerald-500/10";
    return "border-emerald-600/25 bg-emerald-600/5";
  }
  if (abs >= 15) return "border-red-300/45 bg-red-400/20";
  if (abs >= 8) return "border-red-400/35 bg-red-400/15";
  if (abs >= 3) return "border-red-500/30 bg-red-500/10";
  return "border-red-600/25 bg-red-600/5";
}

export default async function Top200TrendingPage() {
  let coins: CoinMarket[] = [];
  let loadError = false;
  try {
    const res = await coinGeckoFetch(TOP_200_PATH, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);
    const data: unknown = await res.json();
    if (!Array.isArray(data)) throw new Error("Invalid response");
    coins = data as CoinMarket[];
  } catch {
    loadError = true;
  }

  const sorted = [...coins].sort(
    (a, b) => (b.price_change_percentage_24h ?? -999) - (a.price_change_percentage_24h ?? -999),
  );
  const topGainers = sorted.filter((c) => (c.price_change_percentage_24h ?? -1) >= 0).slice(0, 12);
  const topLosers = [...sorted]
    .reverse()
    .filter((c) => (c.price_change_percentage_24h ?? 1) < 0)
    .slice(0, 12);

  return (
    <>
      <SiteHeader />
      <main className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Top 200 Trending</h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-400">
            Heatmap-style movers board for the top 200 coins by market cap, ranked by 24h percentage
            change. Green tiles are up, red tiles are down.
          </p>

          {loadError ? (
            <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
              Could not load market movers right now. Please try again shortly.
            </div>
          ) : null}

          {!loadError ? (
            <>
              <section className="mt-6 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
                    Top 24h Gainers
                  </h2>
                  <div className="mt-3 space-y-2">
                    {topGainers.map((coin) => (
                      <Link
                        key={coin.id}
                        href={`/coin/${encodeURIComponent(coin.id)}`}
                        className="flex items-center justify-between rounded-lg border border-emerald-300/20 bg-black/25 px-3 py-2 text-xs hover:border-emerald-300/40"
                      >
                        <span className="truncate font-medium text-zinc-100">{coin.name}</span>
                        <span className="font-mono text-emerald-300">
                          {formatPct(coin.price_change_percentage_24h)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-red-400/25 bg-red-500/10 p-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-red-300">
                    Top 24h Losers
                  </h2>
                  <div className="mt-3 space-y-2">
                    {topLosers.map((coin) => (
                      <Link
                        key={coin.id}
                        href={`/coin/${encodeURIComponent(coin.id)}`}
                        className="flex items-center justify-between rounded-lg border border-red-300/20 bg-black/25 px-3 py-2 text-xs hover:border-red-300/40"
                      >
                        <span className="truncate font-medium text-zinc-100">{coin.name}</span>
                        <span className="font-mono text-red-300">
                          {formatPct(coin.price_change_percentage_24h)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>

              <section className="mt-6">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                  {sorted.map((coin) => (
                    <Link
                      key={coin.id}
                      href={`/coin/${encodeURIComponent(coin.id)}`}
                      className={`rounded-lg border p-2.5 transition-transform hover:-translate-y-px ${intensityClass(
                        coin.price_change_percentage_24h,
                      )}`}
                    >
                      <div className="flex items-center gap-2">
                        <Image
                          src={coin.image}
                          alt=""
                          width={20}
                          height={20}
                          sizes="20px"
                          className="rounded-full"
                        />
                        <span className="truncate text-xs font-semibold text-zinc-100">{coin.name}</span>
                      </div>
                      <p className="mt-1 text-[11px] uppercase text-zinc-400">{coin.symbol}</p>
                      <p className="mt-1 text-xs font-mono text-zinc-200">{formatUsd(coin.current_price)}</p>
                      <p
                        className={`mt-1 text-xs font-mono ${
                          (coin.price_change_percentage_24h ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"
                        }`}
                      >
                        {formatPct(coin.price_change_percentage_24h)}
                      </p>
                      <MiniCoinChart
                        change24h={coin.price_change_percentage_24h}
                        points={coin.sparkline_in_7d?.price}
                        className="mt-1.5 h-6 w-full rounded border border-white/10 bg-[#0a0a0a]"
                      />
                    </Link>
                  ))}
                </div>
              </section>
            </>
          ) : null}
        </div>
      </main>
    </>
  );
}
