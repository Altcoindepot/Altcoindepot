"use client";

import { useWatchlist } from "@/components/use-watchlist";
import { showToast } from "@/components/toast-host";

function StarIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3.5l2.74 5.55 6.12.89-4.43 4.32 1.05 6.1L12 17.77 6.52 20.36l1.05-6.1L3.14 9.94l6.12-.89L12 3.5z"
      />
    </svg>
  );
}

/** Compact outline/fill star for table rows — localStorage watchlist toggle. */
export function WatchlistStarButton({
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
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof window === "undefined") return;
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
      className={`inline-flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400 ${
        onList
          ? "border-teal-400/45 bg-teal-500/15 text-teal-200"
          : "border-white/10 bg-transparent text-zinc-500 hover:border-white/25 hover:text-zinc-200"
      }`}
      aria-pressed={onList}
      aria-label={onList ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
      title={onList ? "Remove from watchlist" : "Add to watchlist"}
    >
      <StarIcon filled={onList} className="size-4" />
    </button>
  );
}
