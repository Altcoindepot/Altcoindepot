"use client";

import { useWatchlist } from "@/components/use-watchlist";

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
      onClick={() =>
        toggle({
          id: coinId,
          name,
          symbol,
          image,
        })
      }
      className={`inline-flex min-h-11 items-center rounded-lg border px-3.5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1a173] sm:min-h-0 sm:px-3 sm:py-1.5 sm:text-xs ${
        onList
          ? "border-[#d1a173]/50 bg-[#d1a173]/15 text-[#d7ad82]"
          : "border-white/15 text-zinc-300 hover:border-[#d1a173]/40 hover:text-[#d7ad82]"
      }`}
      aria-pressed={onList}
    >
      {onList ? "★ On watchlist" : "☆ Add to watchlist"}
    </button>
  );
}
