import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { PodcastsGrid } from "@/components/podcasts-grid";
import { loadPodcastsWithEpisodes } from "@/lib/podcasts-page-data";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const podcasts = await loadPodcastsWithEpisodes();
  const hasEpisodes = podcasts.some((p) => p.episodes.length > 0);
  return {
    title: { absolute: "Crypto Podcasts | AltCoin Depot" },
    description:
      "Crypto podcasts — Bankless, The Milk Road Show, The Pomp Podcast, and The Wolf of All Streets. Latest episodes with play links.",
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
          Curated crypto shows. Tap an episode to play on YouTube · full catalogs on Spotify / Amazon
          Music.
        </p>

        {!hasEpisodes ? (
          <p className="mt-8 rounded-xl border border-white/10 bg-[#0c0e14] px-4 py-8 text-center text-sm text-zinc-500">
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
