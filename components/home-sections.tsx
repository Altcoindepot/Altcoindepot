import { HomeCategoryColumns } from "@/components/home-category-columns";

export function HomeSections() {
  return (
    <div className="border-t border-white/10 bg-[#0a0a0a]">
      <section
        aria-labelledby="trending-heading"
        className="mx-auto max-w-6xl px-4 py-14 sm:px-6"
      >
        <h2
          id="trending-heading"
          className="text-xl font-extrabold tracking-tight sm:text-2xl md:text-3xl"
        >
          <span className="text-brand-altcoindepot">Trending</span>
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          CoinGecko-style categories — up to fifteen coins per column (three per row). Each category
          title opens the full top-100 list sorted by 24h % change. Tap a coin for its page; prices
          follow the same feed as the tracker above.
        </p>
        <HomeCategoryColumns />
      </section>
    </div>
  );
}
