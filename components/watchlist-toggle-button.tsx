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
      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1a173] ${
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
