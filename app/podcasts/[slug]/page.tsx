import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { PodcastShowPanel } from "@/components/podcasts-grid";
import {
  CRYPTO_PODCASTS,
  getPodcastBySlug,
  podcastPath,
  PODCAST_SLUG_ALIASES,
  resolvePodcastSlug,
} from "@/lib/crypto-podcasts";
import { loadPodcastWithEpisodes } from "@/lib/podcasts-page-data";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 86_400;

export function generateStaticParams() {
  return CRYPTO_PODCASTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: raw } = await params;
  const show = getPodcastBySlug(raw);
  if (!show) {
    return {
      title: { absolute: "Podcast not found | AltCoin Depot" },
      robots: { index: false, follow: true },
    };
  }

  const canonical = podcastPath(show.slug);
  const title = `${show.title} Podcast – Latest Episodes | AltCoin Depot`;
  const description = `${show.title} podcast on AltCoin Depot. ${show.tagline} Latest episodes with YouTube, Spotify, and Amazon Music links.`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: `https://altcoindepot.com${canonical}`,
      siteName: "AltCoin Depot",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function PodcastShowPage({ params }: Props) {
  const { slug: raw } = await params;
  const key = raw.trim().toLowerCase();
  const aliased = PODCAST_SLUG_ALIASES[key];
  if (aliased) {
    permanentRedirect(podcastPath(aliased));
  }

  const slug = resolvePodcastSlug(raw);
  if (!slug) notFound();

  // Non-canonical casing → canonical slug URL
  if (key !== slug) {
    permanentRedirect(podcastPath(slug));
  }

  const podcast = await loadPodcastWithEpisodes(slug);
  if (!podcast) notFound();

  return (
    <>
      <SiteHeader />
      <main className="page-shell mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-14">
        <p className="text-[11px] font-medium text-zinc-500">
          <Link href="/podcasts" className="text-teal-300/90 underline-offset-2 hover:underline">
            Crypto Podcasts
          </Link>
          <span className="text-zinc-600"> / </span>
          <span className="text-zinc-400">{podcast.title}</span>
        </p>
        <h1 className="text-brand-altcoindepot mt-3 text-xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
          {podcast.title} Podcast
        </h1>
        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-zinc-400 sm:mt-3 sm:text-base">
          {podcast.tagline}
        </p>
        <div className="mt-6 sm:mt-10">
          <PodcastShowPanel podcast={podcast} />
        </div>
      </main>
    </>
  );
}
