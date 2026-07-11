import Image from "next/image";
import Link from "next/link";
import type { TopCoinSearchEntry } from "@/lib/top-coins-index";

export function CoinSearchResultsList({
  query,
  coins,
  totalIndexed,
}: {
  query: string;
  coins: TopCoinSearchEntry[];
  totalIndexed: number;
}) {
  if (coins.length === 0) {
    return (
      <p className="mt-6 text-sm text-zinc-400">
        No match in the top {totalIndexed > 0 ? totalIndexed.toLocaleString() : "3,000"} coins for{" "}
        <span className="font-mono text-zinc-200">{query}</span>. Try the full name or ticker.
      </p>
    );
  }

  return (
    <ul className="mt-6 divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-[#111111]">
      {coins.map((coin) => (
        <li key={coin.id}>
          <Link
            href={`/coin/${encodeURIComponent(coin.id)}`}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#a855f7]"
          >
            {coin.image ? (
              <Image src={coin.image} alt="" width={32} height={32} className="rounded-full" />
            ) : (
              <span className="h-8 w-8 rounded-full bg-zinc-700" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-zinc-100">{coin.name}</p>
              <p className="font-mono text-xs uppercase text-zinc-500">{coin.symbol}</p>
            </div>
            <span className="shrink-0 font-mono text-xs text-zinc-600">Rank #{coin.rank}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
