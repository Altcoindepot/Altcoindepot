import Link from "next/link";
import { chainMoverHref, type ChainMoverRow } from "@/lib/dex-chain-movers";
import { TokenAvatar } from "@/components/token-avatar";
import { CoinSearchBar } from "@/components/coin-search-bar";
import { formatDexPct } from "@/lib/dex-pair-fields";

/** First-fold Dex movers — ranked list beside What’s rotating on desktop. */
export function HomeTopMovers({
  rows,
  className = "",
}: {
  rows: ChainMoverRow[];
  className?: string;
}) {
  return (
    <section
      aria-labelledby="home-top-movers-heading"
      className={`ds-list-shell ${className}`.trim()}
    >
      <div className="flex items-center justify-between gap-1 border-b border-teal-400/15 px-2 py-2 sm:gap-2 sm:px-4 sm:py-3">
        <h2
          id="home-top-movers-heading"
          className="flex items-center gap-1 text-[11px] font-bold tracking-tight text-zinc-50 sm:gap-2 sm:text-base"
        >
          Top movers
          <svg
            className="hidden size-3.5 text-teal-300/80 sm:block"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M4 16.5 9 11l3.5 3.5L20 7" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 7h6v6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </h2>
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="hidden rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-zinc-400 sm:inline">
            24h
          </span>
          <Link
            href="/gainers-losers"
            className="inline-flex min-h-8 shrink-0 items-center rounded-full px-1.5 text-[10px] font-semibold text-teal-300/90 active:bg-teal-500/10 sm:min-h-9 sm:px-2.5 sm:text-[11px]"
          >
            All →
          </Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="px-2 py-3 text-center text-[11px] text-zinc-500 sm:px-4 sm:py-4 sm:text-sm">
          Movers loading — open{" "}
          <Link href="/gainers-losers" className="text-teal-300 underline-offset-2 hover:underline">
            Gainers
          </Link>
          .
        </p>
      ) : (
        <ul className="divide-y divide-white/[0.06]">
          {rows.map((row, index) => {
            const up = row.changePct >= 0;
            const pairHint = row.quoteSymbol
              ? `${row.symbol.toUpperCase()}/${row.quoteSymbol}`
              : row.symbol.toUpperCase();
            return (
              <li key={row.id}>
                <Link
                  href={chainMoverHref(row)}
                  className="flex min-h-10 items-center gap-1.5 px-2 py-1.5 transition-colors active:bg-white/[0.05] sm:min-h-12 sm:gap-2.5 sm:px-4 sm:py-2.5 sm:hover:bg-white/[0.035]"
                >
                  <span className="w-3 shrink-0 text-center font-mono text-[10px] tabular-nums text-zinc-600 sm:w-4 sm:text-[11px]">
                    {index + 1}
                  </span>
                  <span className="hidden sm:inline-flex">
                    <TokenAvatar symbol={row.symbol} imageUrl={row.imageUrl} size={28} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-semibold text-zinc-50 sm:text-[13px]">
                      {row.name}
                    </span>
                    <span className="mt-0.5 block truncate font-mono text-[9px] uppercase tracking-wide text-zinc-500 sm:text-[10px]">
                      {pairHint}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 font-mono text-[11px] font-bold tabular-nums sm:text-[13px] ${
                      up ? "text-teal-300" : "text-rose-300"
                    }`}
                  >
                    {formatDexPct(row.changePct)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Compact full-width search on the phone fold (desktop uses header search). */
export function HomeSearchStrip({ className = "" }: { className?: string }) {
  return (
    <section aria-label="Search ticker or contract" className={className}>
      <CoinSearchBar variant="wide" inputId="home-coin-search" showSubmitButton={false} />
    </section>
  );
}
