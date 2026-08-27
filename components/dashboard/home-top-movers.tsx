import Link from "next/link";
import type { ChainMoverRow } from "@/lib/dex-chain-movers";
import { formatDexPct, formatDexPriceUsd } from "@/lib/dex-pair-fields";
import { dexTokenPath } from "@/lib/dex-token-path";
import { ChainIcon } from "@/components/chain-icon";
import { TokenAvatar } from "@/components/token-avatar";

function rowHref(row: ChainMoverRow): string {
  return (
    dexTokenPath(row.chain, row.address) ??
    `/token/${encodeURIComponent(row.chain)}/${encodeURIComponent(row.address)}`
  );
}

/**
 * First-fold tappable movers — 5 rows, Dex data only (no CoinGecko).
 */
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
      className={`ds-panel !p-0 overflow-hidden ${className}`.trim()}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5 sm:px-4">
        <div>
          <h2
            id="home-top-movers-heading"
            className="text-sm font-bold tracking-tight text-zinc-50 sm:text-base"
          >
            Top movers
          </h2>
          <p className="mt-0.5 text-[10px] text-zinc-500 sm:text-[11px]">
            Dex pairs · tap for live page
          </p>
        </div>
        <Link
          href="/gainers-losers"
          className="shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold text-teal-300/90 underline-offset-2 hover:bg-teal-500/10 hover:underline"
        >
          All →
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="px-3 py-5 text-center text-sm text-zinc-500 sm:px-4">
          Movers loading shortly — open{" "}
          <Link href="/gainers-losers" className="text-teal-300 underline-offset-2 hover:underline">
            Gainers &amp; Losers
          </Link>
          .
        </p>
      ) : (
        <ul className="divide-y divide-white/5">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={rowHref(row)}
                className="flex min-h-12 items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-white/[0.03] active:bg-white/[0.04] sm:px-4"
              >
                <TokenAvatar symbol={row.symbol} imageUrl={row.imageUrl} size={30} />
                <span className="min-w-0 flex-1">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate font-mono text-[13px] font-bold uppercase text-zinc-50">
                      {row.symbol}
                    </span>
                    <ChainIcon chainId={row.chain} size={14} />
                  </span>
                  <span className="block truncate text-[10px] text-zinc-500">{row.name}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-0.5">
                  <span
                    className={`font-mono text-sm font-semibold tabular-nums ${
                      row.changePct >= 0 ? "text-emerald-300" : "text-red-300"
                    }`}
                  >
                    {formatDexPct(row.changePct)}
                    <span className="ml-1 text-[9px] font-medium uppercase text-zinc-600">
                      {row.window}
                    </span>
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-zinc-500">
                    {formatDexPriceUsd(row.priceUsd)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function HomeQuickLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap gap-2.5 ${className}`.trim()}>
      <Link
        href="/dex-scanner"
        className="inline-flex min-h-10 items-center rounded-full border border-teal-400/35 bg-teal-500/15 px-4 text-xs font-semibold text-teal-200 shadow-[0_6px_18px_rgba(0,0,0,0.35),0_0_14px_rgba(45,212,191,0.1)]"
      >
        Scanner
      </Link>
      <Link
        href="/new-low-caps"
        className="inline-flex min-h-10 items-center rounded-full border border-teal-400/20 bg-white/[0.05] px-4 text-xs font-semibold text-zinc-200 shadow-[0_6px_16px_rgba(0,0,0,0.3)]"
      >
        Low Caps
      </Link>
      <Link
        href="/gainers-losers"
        className="inline-flex min-h-10 items-center rounded-full border border-teal-400/20 bg-white/[0.05] px-4 text-xs font-semibold text-zinc-200 shadow-[0_6px_16px_rgba(0,0,0,0.3)]"
      >
        Gainers
      </Link>
    </div>
  );
}
