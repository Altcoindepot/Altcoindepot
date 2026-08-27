import Link from "next/link";
import { ChainIcon } from "@/components/chain-icon";
import { DexVenueBadge } from "@/components/dex-venue-badge";
import { TokenAvatar } from "@/components/token-avatar";
import { formatDexPct, formatDexPriceUsd } from "@/lib/dex-pair-fields";
import { truncateContract } from "@/lib/dex-search";

export type MarketRowProps = {
  href: string;
  symbol: string;
  name?: string | null;
  imageUrl?: string | null;
  chain?: string | null;
  dexId?: string | null;
  dexLabel?: string | null;
  priceUsd?: number | null;
  changePct?: number | null;
  changeWindow?: string | null;
  contract?: string | null;
  metaLine?: string | null;
  isMajor?: boolean;
  pairLabel?: string | null;
  className?: string;
  muted?: boolean;
  /** Home fold: hide contract/meta so 5 movers fit first screen. */
  compact?: boolean;
};

/**
 * Phone-first dense row DNA — min 44px tap target, no horizontal scroll.
 */
export function MarketRow({
  href,
  symbol,
  name,
  imageUrl,
  chain,
  dexId,
  dexLabel,
  priceUsd,
  changePct,
  changeWindow,
  contract,
  metaLine,
  isMajor = false,
  pairLabel,
  className = "",
  muted = false,
  compact = false,
}: MarketRowProps) {
  const up = (changePct ?? 0) >= 0;
  const hasChange = changePct != null && Number.isFinite(changePct);
  const ticker = (pairLabel || symbol).trim();
  const truncated = !compact && contract ? truncateContract(contract) : null;
  const avatarSize = isMajor ? 36 : compact ? 28 : 30;

  return (
    <Link
      href={href}
      className={`flex min-h-11 items-center gap-2.5 px-3 py-2.5 transition-colors active:bg-white/[0.05] sm:min-h-12 sm:px-4 sm:hover:bg-white/[0.035] ${
        muted ? "opacity-80" : ""
      } ${className}`.trim()}
    >
      <TokenAvatar symbol={symbol} imageUrl={imageUrl} size={avatarSize} />
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-1.5">
          <span
            className={`truncate font-mono text-[13px] font-bold uppercase tracking-tight ${
              isMajor ? "text-zinc-50" : "text-zinc-100"
            }`}
          >
            {ticker}
          </span>
          {isMajor ? (
            <span className="shrink-0 rounded border border-teal-400/45 bg-teal-500/15 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-teal-200">
              Major
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 flex min-w-0 items-center gap-1.5">
          {name ? (
            <span className="min-w-0 truncate text-[11px] text-zinc-500">{name}</span>
          ) : null}
          {chain ? <ChainIcon chainId={chain} size={12} /> : null}
          {!compact && (dexId || dexLabel) ? (
            <DexVenueBadge dexId={dexId} dexLabel={dexLabel} iconOnly size={12} />
          ) : null}
          {truncated ? (
            <span className="hidden truncate font-mono text-[10px] text-zinc-600 sm:inline">
              {truncated}
            </span>
          ) : null}
        </span>
        {!compact && metaLine ? (
          <span className="mt-0.5 block truncate font-mono text-[10px] tabular-nums text-zinc-600">
            {metaLine}
          </span>
        ) : null}
      </span>
      <span className="flex shrink-0 flex-col items-end gap-0.5">
        {hasChange ? (
          <span
            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[12px] font-bold tabular-nums ${
              up
                ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30"
                : "bg-red-500/15 text-red-300 ring-1 ring-red-400/30"
            }`}
          >
            {formatDexPct(changePct)}
            {changeWindow ? (
              <span className="text-[8px] font-medium uppercase text-zinc-500">{changeWindow}</span>
            ) : null}
          </span>
        ) : null}
        <span className="font-mono text-[12px] font-semibold tabular-nums text-zinc-200 sm:text-[13px]">
          {formatDexPriceUsd(priceUsd)}
        </span>
      </span>
    </Link>
  );
}
