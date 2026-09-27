import Link from "next/link";
import type { SiteNewsItem } from "@/lib/site-news";
import { ds } from "@/lib/ui-classes";

/** 0–3 RSS headlines that mention this ticker. Hide when empty. */
export function TokenNewsStrip({
  symbol,
  items,
}: {
  symbol: string;
  items: SiteNewsItem[];
}) {
  if (items.length === 0) return null;

  return (
    <section className={`${ds.panel} mt-6`} aria-labelledby="token-news-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="token-news-heading" className="text-sm font-semibold text-zinc-100">
          Headlines mentioning {symbol.toUpperCase()}
        </h2>
        <Link
          href="/news"
          className="text-[11px] font-medium text-teal-300/90 underline-offset-2 hover:underline"
        >
          All news →
        </Link>
      </div>
      <ul className="mt-3 space-y-2">
        {items.slice(0, 3).map((item) => (
          <li key={item.id}>
            <Link
              href={`/news/read?u=${encodeURIComponent(item.href)}`}
              className="block text-sm leading-snug text-zinc-200 underline-offset-2 hover:text-teal-200 hover:underline"
            >
              {item.title}
            </Link>
            {item.source ? (
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-500">
                {item.source}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
