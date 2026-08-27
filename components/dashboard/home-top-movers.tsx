import Link from "next/link";
import type { ChainMoverRow } from "@/lib/dex-chain-movers";
import { dexTokenPath } from "@/lib/dex-token-path";
import { MarketRow } from "@/components/market-row";
import { CoinSearchBar } from "@/components/coin-search-bar";

function rowHref(row: ChainMoverRow): string {
  return (
    dexTokenPath(row.chain, row.address) ??
    `/token/${encodeURIComponent(row.chain)}/${encodeURIComponent(row.address)}`
  );
}

/** First-fold Dex movers — compact so 5 rows fit a 390px screen with regime + search. */
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
      <div className="flex items-center justify-between gap-2 border-b border-teal-400/15 px-3 py-2 sm:px-4 sm:py-2.5">
        <h2
          id="home-top-movers-heading"
          className="text-[13px] font-bold tracking-tight text-zinc-50 sm:text-base"
        >
          Top movers
        </h2>
        <Link
          href="/gainers-losers"
          className="inline-flex min-h-9 shrink-0 items-center rounded-full px-2.5 text-[11px] font-semibold text-teal-300/90 active:bg-teal-500/10"
        >
          All →
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="px-3 py-4 text-center text-sm text-zinc-500 sm:px-4">
          Movers loading — open{" "}
          <Link href="/gainers-losers" className="text-teal-300 underline-offset-2 hover:underline">
            Gainers
          </Link>
          .
        </p>
      ) : (
        <ul className="divide-y divide-white/[0.06]">
          {rows.map((row) => (
            <li key={row.id}>
              <MarketRow
                href={rowHref(row)}
                symbol={row.symbol}
                name={row.name}
                imageUrl={row.imageUrl}
                chain={row.chain}
                priceUsd={row.priceUsd}
                changePct={row.changePct}
                changeWindow={row.window}
                compact
              />
            </li>
          ))}
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
