import Link from "next/link";
import type { ChainMoverRow, ChainMoversBoard } from "@/lib/dex-chain-movers";
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

function MoverList({
  title,
  rows,
  emptyLabel,
  variant,
}: {
  title: string;
  rows: ChainMoverRow[];
  emptyLabel: string;
  variant: "gainers" | "losers";
}) {
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-[#0c0e14]">
      <div className="flex items-center justify-between border-b border-white/8 px-3 py-2">
        <h3
          className={`text-xs font-semibold uppercase tracking-wider ${
            variant === "gainers" ? "text-emerald-300/90" : "text-red-300/90"
          }`}
        >
          {title}
        </h3>
        <span className="text-[10px] tabular-nums text-zinc-600">{rows.length}</span>
      </div>
      {rows.length === 0 ? (
        <p className="px-3 py-5 text-center text-xs text-zinc-500">{emptyLabel}</p>
      ) : (
        <ul className="divide-y divide-white/5">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={rowHref(row)}
                className="flex items-center gap-2.5 px-3 py-2 transition-colors hover:bg-white/[0.03] active:bg-white/[0.04]"
              >
                <TokenAvatar symbol={row.symbol} imageUrl={row.imageUrl} size={24} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-[12px] font-bold uppercase text-zinc-100">
                    {row.symbol}
                  </span>
                  <span className="block truncate text-[10px] text-zinc-500">{row.name}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-0.5">
                  <span
                    className={`font-mono text-xs font-semibold tabular-nums ${
                      row.changePct >= 0 ? "text-emerald-300" : "text-red-300"
                    }`}
                  >
                    {formatDexPct(row.changePct)}
                  </span>
                  <span className="font-mono text-[10px] tabular-nums text-zinc-500">
                    {formatDexPriceUsd(row.priceUsd)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ChainBoard({ board }: { board: ChainMoversBoard }) {
  const windowLabel = board.window === "1h" ? "1h" : "24h";
  return (
    <section
      aria-labelledby={`movers-${board.chainId}-heading`}
      className="rounded-2xl border border-white/10 bg-[#0a0a0a]/60 p-3 sm:p-4"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ChainIcon chainId={board.chainId} size={20} />
          <h2
            id={`movers-${board.chainId}-heading`}
            className="text-sm font-semibold text-zinc-100 sm:text-base"
          >
            {board.chainLabel}
          </h2>
        </div>
        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          Top 5 · {windowLabel} change
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <MoverList
          title={`Top gainers (${windowLabel})`}
          rows={board.gainers}
          emptyLabel="No gainers for this chain right now"
          variant="gainers"
        />
        <MoverList
          title={`Top losers (${windowLabel})`}
          rows={board.losers}
          emptyLabel="No losers for this chain right now"
          variant="losers"
        />
      </div>
    </section>
  );
}

/** Homepage: per-chain Top 5 gainers | losers (1h preferred, else labeled 24h). */
export function ChainGainersLosers({
  boards,
  className = "",
}: {
  boards: ChainMoversBoard[];
  className?: string;
}) {
  return (
    <section
      id="dex-scanner"
      aria-labelledby="chain-movers-heading"
      className={`scroll-mt-24 border-t border-white/10 pt-6 sm:pt-8 ${className}`.trim()}
    >
      <header className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id="chain-movers-heading"
            className="text-base font-bold tracking-tight text-zinc-50 sm:text-lg"
          >
            Top gainers &amp; losers by chain
          </h2>
          <p className="mt-0.5 max-w-2xl text-[11px] leading-snug text-zinc-500 sm:text-xs">
            DexScreener pairs · prefers 1h change when available · min $10k liquidity · not financial
            advice
          </p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
          <Link
            href="/just-launched"
            className="font-medium text-teal-300/90 underline-offset-2 hover:underline"
          >
            View Just Launched →
          </Link>
          <Link
            href="/new-low-caps"
            className="font-medium text-teal-300/90 underline-offset-2 hover:underline"
          >
            View New &amp; Low Caps →
          </Link>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {boards.map((board) => (
          <ChainBoard key={board.chainId} board={board} />
        ))}
      </div>
    </section>
  );
}
