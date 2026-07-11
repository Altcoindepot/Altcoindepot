import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { PodcastsGrid } from "@/components/podcasts-grid";
import { loadPodcastsWithEpisodes } from "@/lib/podcasts-page-data";

export const metadata: Metadata = {
  title: "Podcasts",
  description:
    "Crypto podcasts — Bankless, The Milk Road Show, The Pomp Podcast, and The Wolf of All Streets. Latest YouTube episodes with links to Spotify and Amazon Music.",
};

export const revalidate = 600;

export default async function PodcastsPage() {
  const podcasts = await loadPodcastsWithEpisodes();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl md:text-4xl">
          <span className="text-brand-altcoindepot">Crypto podcasts</span>
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          Curated shows focused on crypto and markets. Each card lists the five most recent uploads
          from the show&apos;s official YouTube channel (tap a thumbnail to watch). For the full
          back catalog, use YouTube, Spotify, or Amazon Music — links are at the bottom of each
          card. Shows are listed in alphabetical order.
        </p>

        <div className="mt-10">
          <PodcastsGrid podcasts={podcasts} />
        </div>
      </main>
    </>
  );
}
