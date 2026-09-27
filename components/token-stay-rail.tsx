import Link from "next/link";
import type { DexTokenOtherPair } from "@/lib/dexscreener-token";
import { formatCompactUsd } from "@/lib/format-compact-usd";
import { formatChainLabel } from "@/lib/format-chain";
import { ds } from "@/lib/ui-classes";

export type TokenStayMover = {
  symbol: string;
  name: string;
  href: string;
  changePct: number;
};

function formatPct(n: number) {
  if (!Number.isFinite(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

/**
 * Stay-on-site rail: Other pairs · Same chain movers · Scanner.
 * Always exposes at least three on-site destinations when movers exist;
 * Scanner + pairs explorer always available.
 */
export function TokenStayRail({
  chain,
  symbol,
  otherPairs,
  movers,
}: {
  chain: string;
  symbol: string;
  otherPairs: DexTokenOtherPair[];
  movers: TokenStayMover[];
}) {
  const chainLabel = formatChainLabel(chain);
  const pairsHref = `/pairs?chain=${encodeURIComponent(chain)}`;
  const scannerHref = `/dex-scanner?chain=${encodeURIComponent(chain)}`;

  return (
    <aside className={`${ds.panel} mt-6`} aria-labelledby="token-stay-heading">
      <h2 id="token-stay-heading" className="text-sm font-semibold text-zinc-100">
        Stay on AltCoin Depot
      </h2>

      <div className="mt-4 space-y-5">
        <section aria-labelledby="token-other-pairs-heading">
          <h3 id="token-other-pairs-heading" className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Other pairs
          </h3>
          {otherPairs.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {otherPairs.slice(0, 3).map((p) => (
                <li key={p.pairAddress}>
                  <Link
                    href={p.href}
                    className="flex items-baseline justify-between gap-2 text-sm text-zinc-200 underline-offset-2 hover:text-teal-200 hover:underline"
                  >
                    <span className="min-w-0 truncate font-medium">
                      {p.pairLabel}
                      <span className="ml-1.5 text-[10px] font-normal text-zinc-500">
                        {p.dexLabel}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[11px] tabular-nums text-zinc-500">
                      {formatCompactUsd(p.volume)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">No other liquid pairs right now.</p>
          )}
          <Link
            href={pairsHref}
            className="mt-2 inline-flex text-xs font-medium text-teal-300/90 underline-offset-2 hover:underline"
          >
            Browse {chainLabel} pairs →
          </Link>
        </section>

        <section aria-labelledby="token-chain-movers-heading">
          <h3 id="token-chain-movers-heading" className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Same chain movers
          </h3>
          {movers.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {movers.slice(0, 4).map((m) => (
                <li key={m.href}>
                  <Link
                    href={m.href}
                    className="flex items-baseline justify-between gap-2 text-sm text-zinc-200 underline-offset-2 hover:text-teal-200 hover:underline"
                  >
                    <span className="min-w-0 truncate font-medium">
                      {m.symbol}
                      <span className="ml-1.5 font-normal text-zinc-500">{m.name}</span>
                    </span>
                    <span
                      className={`shrink-0 font-mono text-[11px] tabular-nums ${
                        m.changePct >= 0 ? "text-emerald-300" : "text-red-300"
                      }`}
                    >
                      {formatPct(m.changePct)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">No movers on {chainLabel} right now.</p>
          )}
          <Link
            href={`/gainers-losers?chain=${encodeURIComponent(chain)}`}
            className="mt-2 inline-flex text-xs font-medium text-teal-300/90 underline-offset-2 hover:underline"
          >
            All {chainLabel} movers →
          </Link>
        </section>

        <section aria-labelledby="token-scanner-heading">
          <h3 id="token-scanner-heading" className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Scanner
          </h3>
          <p className="mt-2 text-sm text-zinc-400">
            Find more {symbol} neighbours and fresh pairs on {chainLabel}.
          </p>
          <Link
            href={scannerHref}
            className="mt-2 inline-flex text-xs font-medium text-teal-300/90 underline-offset-2 hover:underline"
          >
            Open Dex Scanner →
          </Link>
        </section>
      </div>
    </aside>
  );
}
