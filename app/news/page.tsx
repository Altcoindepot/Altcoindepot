import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { getSiteNewsCached } from "@/lib/site-news";
import { formatTimeAgo } from "@/lib/format-date";

export const metadata: Metadata = {
  title: { absolute: "Crypto news from CoinDesk, The Block, Decrypt | AltCoin Depot" },
  description:
    "Crypto news from CoinDesk, The Block, Decrypt, Blockworks, and The Defiant. Informational only — not financial advice.",
  alternates: { canonical: "/news" },
};

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const news = await getSiteNewsCached(40).catch(() => ({
    items: [],
    sourcesSucceeded: [] as string[],
    sourcesLabel: "Headlines from major crypto outlets",
    stale: true,
    cachedAt: null as string | null,
  }));

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="border-b border-white/10 bg-[#0a0a0a] px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            <Link href="/" className="hover:text-teal-200">
              Home
            </Link>
            <span className="mx-2 text-zinc-700">/</span>
            News
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
            Crypto news from CoinDesk, The Block, Decrypt
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">{news.sourcesLabel}</p>
          {news.stale ? (
            <p className="mt-2 text-[11px] text-amber-200/90">Feed delayed — showing last good snapshot.</p>
          ) : null}

          <ul className="mt-6 flex flex-col gap-2.5">
            {news.items.length > 0 ? (
              news.items.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg border border-white/10 bg-[#0c0e14] px-3.5 py-3 transition-colors hover:border-teal-400/25 hover:bg-[#10131a]"
                  >
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="inline-flex rounded border border-white/[0.08] px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider text-zinc-400">
                        {item.source}
                      </span>
                      <span className="text-[10px] tabular-nums text-zinc-500">
                        {formatTimeAgo(item.publishedAt)}
                      </span>
                    </span>
                    <span className="mt-1.5 block text-sm font-semibold leading-snug text-zinc-100">
                      {item.title}
                    </span>
                  </a>
                </li>
              ))
            ) : (
              <li className="rounded-lg border border-white/10 px-4 py-6 text-sm text-zinc-500">
                No headlines available right now.
              </li>
            )}
          </ul>

          <p className="mt-6 text-[11px] text-zinc-600">
            Official publisher RSS/Atom feeds · refreshed about every 5–10 minutes · not financial advice
          </p>
        </div>
      </main>
    </>
  );
}
