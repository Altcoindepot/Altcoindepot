import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { PodcastsGrid } from "@/components/podcasts-grid";
import { loadPodcastsWithEpisodes } from "@/lib/podcasts-page-data";

/** Latest-episode cards refresh on a daily cadence. */
export const revalidate = 86_400;

export async function generateMetadata(): Promise<Metadata> {
  const podcasts = await loadPodcastsWithEpisodes();
  const hasEpisodes = podcasts.some((p) => p.episodes.length > 0);
  return {
    title: { absolute: "Crypto Podcasts | AltCoin Depot" },
    description:
      "Crypto podcasts — Bankless, Coffee with Captain, Coin Stories, Milk Road, Pomp, Wolf of All Streets, Unchained, and What Bitcoin Did. Latest episodes with play links.",
    alternates: { canonical: "/podcasts" },
    robots: hasEpisodes
      ? { index: true, follow: true }
      : { index: false, follow: true },
  };
}

export default async function PodcastsPage() {
  const podcasts = await loadPodcastsWithEpisodes();
  const hasEpisodes = podcasts.some((p) => p.episodes.length > 0);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-14">
        <h1 className="text-brand-altcoindepot text-xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
          Crypto Podcasts
        </h1>
        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-zinc-400 sm:mt-3 sm:text-base">
          Curated shows focused on crypto and markets. Each card lists the five most recent uploads
          from the show&apos;s official YouTube channel (tap a thumbnail to watch). For the full
          back catalog, use YouTube, Spotify, or Amazon Music — links are at the bottom of each
          card. Shows are listed in alphabetical order.
        </p>

        {!hasEpisodes ? (
          <p className="mt-8 glass-panel rounded-xl px-4 py-8 text-center text-sm text-zinc-500">
            Episodes could not be loaded right now. Check back shortly, or open the shows on YouTube /
            Spotify from Resources.
          </p>
        ) : (
          <div className="mt-6 sm:mt-10">
            <PodcastsGrid podcasts={podcasts} />
          </div>
        )}
      </main>
    </>
  );
}
