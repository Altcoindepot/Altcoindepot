import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getCexTrendingBoards } from "@/lib/cex-trending";
import { MiniCoinChart } from "@/components/mini-coin-chart";

export const metadata: Metadata = {
  title: "CEX Trending",
  description:
    "Top 24h movers across major CEX venues with 1m, 15m, and 1h momentum checks.",
};

export const revalidate = 60;

const EXCHANGE_BRAND: Record<
  string,
  { logoUrl: string; panelClass: string; badgeClass: string; glowClass: string }
> = {
  binance: {
    logoUrl: "https://www.google.com/s2/favicons?sz=64&domain=binance.com",
    panelClass: "border-[#f0b90b]/40 bg-[rgba(46,38,15,0.45)]",
    badgeClass: "text-[#f0b90b]",
    glowClass: "hover:border-[#f0b90b]/55 hover:shadow-[0_0_22px_rgba(240,185,11,0.22)]",
  },
  bybit: {
    logoUrl: "https://www.google.com/s2/favicons?sz=64&domain=bybit.com",
    panelClass: "border-[#f5be4f]/40 bg-[rgba(49,38,18,0.45)]",
    badgeClass: "text-[#f5be4f]",
    glowClass: "hover:border-[#f5be4f]/55 hover:shadow-[0_0_22px_rgba(245,190,79,0.22)]",
  },
  kucoin: {
    logoUrl: "https://www.google.com/s2/favicons?sz=64&domain=kucoin.com",
    panelClass: "border-[#14c8a8]/40 bg-[rgba(14,45,40,0.45)]",
    badgeClass: "text-[#63e9d5]",
    glowClass: "hover:border-[#14c8a8]/55 hover:shadow-[0_0_22px_rgba(20,200,168,0.22)]",
  },
  okx: {
    logoUrl: "https://www.google.com/s2/favicons?sz=64&domain=okx.com",
    panelClass: "border-zinc-400/40 bg-[rgba(28,30,36,0.45)]",
    badgeClass: "text-zinc-200",
    glowClass: "hover:border-zinc-300/55 hover:shadow-[0_0_22px_rgba(200,200,200,0.18)]",
  },
  kraken: {
    logoUrl: "https://www.google.com/s2/favicons?sz=64&domain=kraken.com",
    panelClass: "border-[#7161ff]/40 bg-[rgba(36,29,66,0.45)]",
    badgeClass: "text-[#b9afff]",
    glowClass: "hover:border-[#7161ff]/55 hover:shadow-[0_0_22px_rgba(113,97,255,0.22)]",
  },
  mexc: {
    logoUrl: "https://www.google.com/s2/favicons?sz=64&domain=mexc.com",
    panelClass: "border-[#2ad3b0]/40 bg-[rgba(12,44,38,0.45)]",
    badgeClass: "text-[#7cf0d7]",
    glowClass: "hover:border-[#2ad3b0]/55 hover:shadow-[0_0_22px_rgba(42,211,176,0.22)]",
  },
};

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n < 1 ? 6 : 4,
  }).format(n);
}

function formatCompactUsd(n: number | null) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(n);
}

function formatPct(n: number | null) {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function pctTone(n: number | null) {
  if (n == null || Number.isNaN(n)) return "text-zinc-500";
  return n >= 0 ? "text-emerald-300" : "text-red-300";
}

function pctPill(n: number | null) {
  if (n == null || Number.isNaN(n)) {
    return "inline-block rounded bg-zinc-800/60 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-500 ring-1 ring-zinc-600/40";
  }
  return n >= 0
    ? "inline-block rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-500/35"
    : "inline-block rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-red-300 ring-1 ring-red-500/35";
}

function pairForExchange(exchangeId: string, symbol: string): string {
  if (exchangeId === "okx") return symbol.replace("/", "-");
  if (exchangeId === "kucoin") return symbol.replace("/", "-");
  if (exchangeId === "kraken") return symbol.replace("/", "");
  return symbol.replace("/", "");
}

function tradingHref(exchangeId: string, symbol: string): string {
  const pair = pairForExchange(exchangeId, symbol);
  switch (exchangeId) {
    case "binance":
      return `https://www.binance.com/en/trade/${encodeURIComponent(pair)}`;
    case "bybit":
      return `https://www.bybit.com/trade/spot/${encodeURIComponent(pair)}`;
    case "kucoin":
      return `https://www.kucoin.com/trade/${encodeURIComponent(pair)}`;
    case "okx":
      return `https://www.okx.com/trade-spot/${encodeURIComponent(pair)}`;
    case "kraken":
      return `https://pro.kraken.com/app/trade/${encodeURIComponent(pair)}`;
    case "mexc":
      return `https://www.mexc.com/exchange/${encodeURIComponent(pair)}`;
    default:
      return "#";
  }
}

export default async function CexTrendingPage() {
  const boards = await getCexTrendingBoards();

  return (
    <>
      <SiteHeader />
      <main className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">CEX Trending</h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-400">
            Top 5 movers in the last 24h for each exchange, plus short-interval momentum checks (1m,
            15m, 1h) to help spot continuation vs cooldown.
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {boards.map((board) => {
              const brand = EXCHANGE_BRAND[board.id];
              return (
              <section
                key={board.id}
                className={`glass-panel rounded-xl border p-3 sm:p-4 ${brand?.panelClass ?? "border-white/20 bg-[rgba(20,22,30,0.45)]"}`}
              >
                <div className="flex items-center gap-3">
                  {brand?.logoUrl ? (
                    <img
                      src={brand.logoUrl}
                      alt={`${board.label} logo`}
                      width={24}
                      height={24}
                      className="size-6 rounded-full border border-white/15 bg-white/90 p-0.5 object-contain"
                      loading="lazy"
                    />
                  ) : null}
                  <h2 className={`text-lg font-semibold text-zinc-100 ${brand?.badgeClass ?? ""}`}>
                    {board.label}
                  </h2>
                </div>
                {board.error ? (
                  <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                    Could not load this exchange right now ({board.error}).
                  </p>
                ) : null}
                {!board.error && board.movers.length === 0 ? (
                  <p className="mt-3 rounded-lg border border-white/10 bg-[#111111] px-3 py-2 text-xs text-zinc-400">
                    No movers available at the moment.
                  </p>
                ) : null}
                {!board.error && board.movers.length > 0 ? (
                  <div className="mt-3 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                    {board.movers.map((row, index) => (
                      <a
                        key={row.symbol}
                        href={tradingHref(board.id, row.symbol)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${row.symbol} on ${board.label}`}
                        className={`glass-card rounded-md border-2 border-[#f4ddc3]/45 p-1.5 outline outline-1 outline-[#2a1e16]/60 transition-colors ${brand?.glowClass ?? "hover:border-white/35"}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`font-mono text-[10px] font-semibold ${brand?.badgeClass ?? "text-zinc-300"}`}>
                            #{index + 1}
                          </span>
                          <span className="font-mono text-[10px] text-zinc-300">{row.symbol}</span>
                        </div>
                        <div className="mt-1 grid grid-cols-2 gap-1 text-[10px]">
                          <div>
                            <p className="text-zinc-500">Price</p>
                            <p className="font-mono text-[10px] text-zinc-100">{formatPrice(row.last)}</p>
                          </div>
                          <div>
                            <p className="text-zinc-500">24h</p>
                            <p className={`font-mono text-[10px] ${pctTone(row.change24hPct)}`}>
                              {formatPct(row.change24hPct)}
                            </p>
                          </div>
                          <div>
                            <p className="text-zinc-500">24h Vol</p>
                            <p className="font-mono text-[10px] text-zinc-200">{formatCompactUsd(row.volume24h)}</p>
                          </div>
                          <div>
                            <p className="text-zinc-500">1h</p>
                            <span className={pctPill(row.change1hPct)}>{formatPct(row.change1hPct)}</span>
                          </div>
                        </div>
                        <MiniCoinChart
                          change24h={row.change24hPct}
                          change7d={row.change1hPct}
                          points={row.miniSeries}
                          className="mt-1 h-6 w-full rounded border border-white/10 bg-[#0a0a0a]"
                        />
                      </a>
                    ))}
                  </div>
                ) : null}
              </section>
            )})}
          </div>
        </div>
      </main>
    </>
  );
}
