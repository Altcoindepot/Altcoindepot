import Link from "next/link";
import {
  chainMoverHref,
  type ChainMoverRow,
  type ChainMoversBoard,
  MOVER_CHAINS,
} from "@/lib/dex-chain-movers";
import { formatDexPct, formatDexPriceUsd } from "@/lib/dex-pair-fields";
import { ChainIcon } from "@/components/chain-icon";
import { TokenAvatar } from "@/components/token-avatar";

function VenueBadge({ venue }: { venue: ChainMoverRow["venue"] }) {
  if (venue === "cex") {
    return (
      <span className="shrink-0 rounded border border-amber-400/35 bg-amber-500/10 px-1 py-px text-[9px] font-bold uppercase tracking-wider text-amber-200/90">
        CEX
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded border border-teal-400/25 bg-teal-500/10 px-1 py-px text-[9px] font-bold uppercase tracking-wider text-teal-200/80">
      DEX
    </span>
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
      <div className="flex items-center justify-between border-b border-white/8 px-3 py-2.5">
        <h3
          className={`text-xs font-semibold uppercase tracking-wider ${
            variant === "gainers" ? "text-emerald-300/90" : "text-red-300/90"
          }`}
        >
          {title}
        </h3>
        <span className="text-[10px] tabular-nums text-zinc-600">{rows.length}/10</span>
      </div>
      {rows.length === 0 ? (
        <p className="px-3 py-6 text-center text-sm text-zinc-500">{emptyLabel}</p>
      ) : (
        <ul className="divide-y divide-white/5">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={chainMoverHref(row)}
                className="flex min-h-11 items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-white/[0.03] active:bg-white/[0.04]"
              >
                <TokenAvatar symbol={row.symbol} imageUrl={row.imageUrl} size={28} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate font-mono text-[13px] font-bold uppercase text-zinc-100">
                      {row.symbol}
                    </span>
                    <VenueBadge venue={row.venue} />
                  </span>
                  <span className="block truncate text-[11px] text-zinc-500">
                    {row.name}
                    {row.venue === "cex" ? " · 24H" : ""}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-0.5">
                  <span
                    className={`font-mono text-sm font-semibold tabular-nums ${
                      row.changePct >= 0 ? "text-emerald-300" : "text-red-300"
                    }`}
                  >
                    {formatDexPct(row.changePct)}
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
    </div>
  );
}

function ChainBoard({ board }: { board: ChainMoversBoard }) {
  const windowLabel = board.window === "1h" ? "1H" : "24H";
  const cexCount =
    board.gainers.filter((r) => r.venue === "cex").length +
    board.losers.filter((r) => r.venue === "cex").length;

  return (
    <section
      aria-labelledby={`movers-${board.chainId}-heading`}
      className="rounded-2xl border border-teal-400/20 bg-[#0a0a0a]/60 p-3 sm:p-4"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <ChainIcon chainId={board.chainId} size={22} />
          <h2
            id={`movers-${board.chainId}-heading`}
            className="truncate text-base font-semibold text-zinc-100 sm:text-lg"
          >
            {board.chainLabel}
          </h2>
          <span className="shrink-0 rounded border border-white/15 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            {windowLabel}
          </span>
        </div>
        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          Top 10 gainers &amp; losers · Dex first
          {cexCount > 0 ? ` · ${cexCount} CEX pad` : ""} · {windowLabel}
        </p>
      </div>

      <div className="flex flex-col gap-3 md:grid md:grid-cols-2">
        <MoverList
          title={`Top gainers (${windowLabel})`}
          rows={board.gainers}
          emptyLabel={`No ${windowLabel} gainers on ${board.chainLabel} right now`}
          variant="gainers"
        />
        <MoverList
          title={`Top losers (${windowLabel})`}
          rows={board.losers}
          emptyLabel={`No ${windowLabel} losers on ${board.chainLabel} right now`}
          variant="losers"
        />
      </div>
    </section>
  );
}

/** Full dedicated page body — one labeled chain section after another. */
export function ChainGainersLosers({
  boards,
  className = "",
}: {
  boards: ChainMoversBoard[];
  className?: string;
}) {
  if (boards.length === 0) {
    return (
      <p
        className={`rounded-xl border border-white/10 bg-[#0c0e14] px-4 py-8 text-sm text-zinc-500 ${className}`.trim()}
      >
        No mover data available right now. Check back shortly.
      </p>
    );
  }

  return (
    <div className={`flex flex-col gap-4 sm:gap-5 ${className}`.trim()}>
      {boards.map((board) => (
        <ChainBoard key={board.chainId} board={board} />
      ))}
    </div>
  );
}

/** Compact home teaser — links to the full Gainers & Losers page. */
export function ChainMoversTeaser({ className = "" }: { className?: string }) {
  return (
    <section
      aria-labelledby="movers-teaser-heading"
      className={`border-t border-white/10 pt-6 sm:pt-8 ${className}`.trim()}
    >
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-white/10 bg-[#0c0e14] px-4 py-4 sm:px-5">
        <div>
          <h2
            id="movers-teaser-heading"
            className="text-base font-bold tracking-tight text-zinc-50 sm:text-lg"
          >
            Top movers by chain
          </h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-zinc-500 sm:text-sm">
            Ethereum, Solana, Base &amp; Injective — top 10 gainers and losers per board (Dex
            first, CEX pad).
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="flex flex-wrap gap-2">
            {MOVER_CHAINS.map((c) => (
              <Link
                key={c.id}
                href={`/gainers-losers?chain=${c.id}`}
                className="inline-flex min-h-9 items-center rounded-full border border-teal-400/25 bg-white/[0.04] px-3 text-[11px] font-semibold text-zinc-200 hover:border-teal-400/45 hover:text-teal-100"
              >
                {c.id === "injective" ? "INJ" : c.label}
              </Link>
            ))}
          </div>
          <Link
            href="/gainers-losers"
            className="inline-flex min-h-11 items-center rounded-full bg-teal-500/15 px-4 text-sm font-semibold text-teal-200 transition-colors hover:bg-teal-500/25"
          >
            All boards →
          </Link>
        </div>
      </div>
    </section>
  );
}
