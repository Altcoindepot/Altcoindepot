import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { getSiteNewsCached, SITE_NEWS_PAGE_LIMIT } from "@/lib/site-news";
import { formatTimeAgo } from "@/lib/format-date";

export const metadata: Metadata = {
  title: { absolute: "Crypto News – Latest Headlines | AltCoin Depot" },
  description:
    "Newest crypto headlines from CoinDesk, The Block, Decrypt, Blockworks, The Defiant, Cointelegraph, The Daily Hodl, Bitcoin Magazine, and DL News. Sorted by publish time. Informational only — not financial advice.",
  alternates: { canonical: "/news" },
  robots: { index: true, follow: true },
};

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const news = await getSiteNewsCached(SITE_NEWS_PAGE_LIMIT).catch(() => ({
    items: [],
    sourcesSucceeded: [] as string[],
    sourcesLabel: "Headlines from major crypto outlets",
    stale: true,
    cachedAt: null as string | null,
  }));

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="page-shell border-b border-white/10 px-3 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">
            <Link href="/" className="hover:text-teal-200">
              Home
            </Link>
            <span className="mx-2 text-zinc-700">/</span>
            News
          </p>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
            Crypto news
          </h1>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500 sm:text-sm">
            {news.sourcesLabel} · newest first · {news.items.length} headlines
          </p>
          {news.stale ? (
            <p className="mt-2 text-[11px] text-amber-200/90">
              Feed delayed — showing last good snapshot.
            </p>
          ) : null}

          <ul className="mt-5 flex flex-col gap-2 sm:mt-6 sm:gap-2.5">
            {news.items.length > 0 ? (
              news.items.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-panel block rounded-xl px-3.5 py-3 transition-colors hover:border-teal-400/25 hover:bg-white/[0.04] active:bg-white/[0.04]"
                  >
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="inline-flex rounded border border-teal-400/20 bg-teal-500/10 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider text-teal-200/90">
                        {item.source}
                      </span>
                      <span className="text-[10px] tabular-nums text-zinc-500">
                        {formatTimeAgo(item.publishedAt)}
                      </span>
                    </span>
                    <span className="mt-1.5 block text-[13px] font-semibold leading-snug text-zinc-100 sm:text-sm">
                      {item.title}
                    </span>
                  </a>
                </li>
              ))
            ) : (
              <li className="glass-panel rounded-xl px-4 py-6 text-sm text-zinc-500">
                No headlines available right now.
              </li>
            )}
          </ul>

          <p className="mt-6 text-[11px] text-zinc-600">
            Publisher RSS/Atom · ~15–30 min refresh · sorted by publish time · not financial advice
          </p>
        </div>
      </main>
    </>
  );
}
