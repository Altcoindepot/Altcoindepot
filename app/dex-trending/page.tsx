import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDexTrendingBoards } from "@/lib/dex-trending";
import { MiniCoinChart } from "@/components/mini-coin-chart";

export const metadata: Metadata = {
  title: "DEX Trending",
  description:
    "Top 24h DEX movers by venue with 1h momentum and 24h volume context.",
};

export const revalidate = 60;

const DEX_BRAND: Record<string, { logoUrl: string; panelClass: string; badgeClass: string }> = {
  uniswap: {
    logoUrl: "https://www.google.com/s2/favicons?sz=64&domain=uniswap.org",
    panelClass: "border-[#ff007a]/40 bg-[rgba(61,17,45,0.45)]",
    badgeClass: "text-[#ff79b6]",
  },
  pancakeswap: {
    logoUrl: "https://www.google.com/s2/favicons?sz=64&domain=pancakeswap.finance",
    panelClass: "border-[#f5c26b]/40 bg-[rgba(63,43,22,0.45)]",
    badgeClass: "text-[#f5c26b]",
  },
  raydium: {
    logoUrl: "https://www.google.com/s2/favicons?sz=64&domain=raydium.io",
    panelClass: "border-[#8e5bff]/40 bg-[rgba(41,30,70,0.45)]",
    badgeClass: "text-[#c6a8ff]",
  },
  aerodrome: {
    logoUrl: "https://www.google.com/s2/favicons?sz=64&domain=aerodrome.finance",
    panelClass: "border-[#4fb3ff]/40 bg-[rgba(23,40,63,0.45)]",
    badgeClass: "text-[#8fd1ff]",
  },
  traderjoe: {
    logoUrl: "https://www.google.com/s2/favicons?sz=64&domain=traderjoexyz.com",
    panelClass: "border-[#ff6b4a]/40 bg-[rgba(64,28,23,0.45)]",
    badgeClass: "text-[#ff9b85]",
  },
  cowswap: {
    logoUrl: "https://www.google.com/s2/favicons?sz=64&domain=cow.fi",
    panelClass: "border-[#56cfe1]/40 bg-[rgba(20,52,58,0.45)]",
    badgeClass: "text-[#9eeaf5]",
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

export default async function DexTrendingPage() {
  const boards = await getDexTrendingBoards();

  return (
    <>
      <SiteHeader />
      <main className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">DEX Trending</h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-400">
            Top 5 movers in the last 24h for each DEX venue, with 1h continuation signal and 24h
            volume context.
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {boards.map((board) => {
              const brand = DEX_BRAND[board.id];
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
                      Could not load this DEX right now ({board.error}).
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
                          key={row.pair}
                          href={row.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Open ${row.pair} on ${board.label}`}
                          className="glass-card rounded-md border-2 border-[#f4ddc3]/45 p-2.5 outline outline-1 outline-[#2a1e16]/60 transition-colors hover:border-[#d1a173]/70 hover:bg-[rgba(48,35,26,0.25)]"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-mono text-sm font-bold tracking-wide text-zinc-100 break-all">
                                {row.pair}
                              </p>
                              <p className={`mt-0.5 text-[10px] font-semibold ${brand?.badgeClass ?? "text-zinc-400"}`}>
                                #{index + 1} · {board.label}
                              </p>
                            </div>
                            <span className={`shrink-0 font-mono text-xs font-semibold ${pctTone(row.change24hPct)}`}>
                              {formatPct(row.change24hPct)}
                            </span>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
                            <div>
                              <p className="text-zinc-500">Price</p>
                              <p className="font-mono text-xs text-zinc-100">{formatPrice(row.priceUsd)}</p>
                            </div>
                            <div>
                              <p className="text-zinc-500">24h</p>
                              <p className={`font-mono text-xs ${pctTone(row.change24hPct)}`}>
                                {formatPct(row.change24hPct)}
                              </p>
                            </div>
                            <div>
                              <p className="text-zinc-500">24h Vol</p>
                              <p className="font-mono text-xs text-zinc-200">{formatCompactUsd(row.volume24h)}</p>
                            </div>
                            <div>
                              <p className="text-zinc-500">1h</p>
                              <span className={pctPill(row.change1hPct)}>{formatPct(row.change1hPct)}</span>
                            </div>
                          </div>
                          <MiniCoinChart
                            change24h={row.change24hPct}
                            change7d={row.change1hPct}
                            className="mt-2 h-7 w-full rounded border border-white/10 bg-[#0a0a0a]"
                          />
                        </a>
                      ))}
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
