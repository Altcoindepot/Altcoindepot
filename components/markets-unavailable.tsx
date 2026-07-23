"use client";

import Link from "next/link";

export function MarketsUnavailable({
  onRetryHref = "/",
}: {
  onRetryHref?: string;
}) {
  return (
    <section
      role="alert"
      aria-live="polite"
      className="border-b border-red-500/20 bg-[#0a0a0a] px-4 py-16 text-center sm:px-6"
    >
      <div className="mx-auto max-w-lg rounded-xl border border-red-500/30 bg-[#111111] p-8">
        <h2 className="text-lg font-semibold text-white">Market data is taking a break</h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          We couldn’t load live prices from CoinGecko. This is usually temporary (rate limits or a
          brief outage). Your watchlist and portfolio still work offline.
        </p>
        <div className="mt-6 flex flex-col items-stretch gap-2 sm:flex-row sm:justify-center">
          <Link
            href={onRetryHref}
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[#d1a173]/45 bg-[#d1a173]/15 px-5 text-sm font-semibold text-[#d7ad82]"
          >
            Reload markets
          </Link>
          <Link
            href="/watchlist"
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/15 px-5 text-sm font-medium text-zinc-300"
          >
            Open watchlist
          </Link>
        </div>
      </div>
    </section>
  );
}
