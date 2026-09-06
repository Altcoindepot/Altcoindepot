import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { PodcastsGrid } from "@/components/podcasts-grid";
import { CRYPTO_PODCASTS } from "@/lib/crypto-podcasts";
import { loadPodcastsWithEpisodes } from "@/lib/podcasts-page-data";

/** Latest-episode cards refresh on a daily cadence. */
export const revalidate = 86_400;

const SHOW_LIST =
  "Bankless, Coffee with Captain, Coin Stories, The Milk Road Show, The Pomp Podcast, Unchained, What Bitcoin Did, and The Wolf of All Streets";

export const metadata: Metadata = {
  title: {
    absolute:
      "Crypto Podcasts – Bankless, Unchained, Pomp, Milk Road, Coin Stories & more | AltCoin Depot",
  },
  description: `Crypto podcasts on AltCoin Depot: ${SHOW_LIST}. Each card lists the five most recent uploads from the show's official YouTube channel — with YouTube, Spotify, and Amazon Music catalog links.`,
  alternates: { canonical: "/podcasts" },
  robots: { index: true, follow: true },
};

export default async function PodcastsPage() {
  const podcasts = await loadPodcastsWithEpisodes();
  // Guarantee all eight shows render even if a feed fails for one entry.
  const bySlug = new Map(podcasts.map((p) => [p.slug, p]));
  const allEight = CRYPTO_PODCASTS.map(
    (show) => bySlug.get(show.slug) ?? { ...show, episodes: [] },
  );

  return (
    <>
      <SiteHeader />
      <main className="page-shell mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-14">
        <h1 className="text-brand-altcoindepot text-xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
          Crypto Podcasts
        </h1>
        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-zinc-400 sm:mt-3 sm:text-base">
          Curated shows focused on crypto and markets. Each card lists the five most recent uploads
          from the show&apos;s official YouTube channel (tap a thumbnail to watch). For the full
          back catalog, use YouTube, Spotify, or Amazon Music — links are at the bottom of each
          card. Shows are listed in alphabetical order.
        </p>

        <div className="mt-6 sm:mt-10">
          <PodcastsGrid podcasts={allEight} />
        </div>
      </main>
    </>
  );
}
