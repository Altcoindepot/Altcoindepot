"use client";

import { useWatchlist } from "@/components/use-watchlist";
import { showToast } from "@/components/toast-host";
import { ds } from "@/lib/ui-classes";

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
        showToast(
          nowOn
            ? `Added ${symbol.toUpperCase()} to watchlist`
            : `Removed ${symbol.toUpperCase()} from watchlist`,
        );
      }}
      className={onList ? ds.btnActive : ds.btnSecondary}
      aria-pressed={onList}
      aria-label={onList ? "Remove from watchlist" : "Add to watchlist"}
    >
      <span aria-hidden className="text-lg leading-none sm:text-base">
        {onList ? "★" : "☆"}
      </span>
      <span>{onList ? "On watchlist" : "Add to watchlist"}</span>
    </button>
  );
}
