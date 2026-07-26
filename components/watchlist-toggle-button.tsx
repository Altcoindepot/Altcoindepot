"use client";

import { useWatchlist } from "@/components/use-watchlist";
import { showToast } from "@/components/toast-host";

export function WatchlistToggleButton({
  coinId,
  name,
  symbol,
  image,
}: {
  coinId: string;
  name: string;
  symbol: string;
  image?: string;
}) {
  const { mounted, has, toggle } = useWatchlist();
  const onList = mounted && has(coinId);

  return (
    <button
      type="button"
      onClick={() => {
        const nowOn = toggle({
          id: coinId,
          name,
          symbol,
          image,
        });
        showToast(nowOn ? `Added ${symbol.toUpperCase()} to watchlist` : `Removed ${symbol.toUpperCase()} from watchlist`);
      }}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg border px-3.5 py-2.5 text-sm font-semibold transition-[colors,transform,box-shadow] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1a173] active:scale-[0.98] sm:gap-2 sm:text-xs ${
        onList
          ? "border-[#d1a173]/55 bg-[#d1a173]/20 text-[#d7ad82] shadow-[0_0_18px_rgba(185,129,82,0.18)]"
          : "border-white/15 text-zinc-300 hover:border-[#d1a173]/45 hover:text-[#d7ad82]"
      }`}
      aria-pressed={onList}
      aria-label={onList ? "Remove from watchlist" : "Add to watchlist"}
    >
      <span aria-hidden className="text-xl leading-none sm:text-lg">
        {onList ? "★" : "☆"}
      </span>
      <span>{onList ? "On watchlist" : "Add to watchlist"}</span>
    </button>
  );
}
