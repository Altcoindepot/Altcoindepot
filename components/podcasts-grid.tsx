import Image from "next/image";
import type { PodcastWithEpisodes } from "@/lib/podcasts-page-data";

function normalizeYoutubeThumbUrl(url: string): string {
  try {
    const u = new URL(url);
    if (/^i\d*\.ytimg\.com$/i.test(u.hostname)) {
      u.hostname = "i.ytimg.com";
      return u.toString();
    }
  } catch {
    /* ignore */
  }
  return url;
}

function thumbForVideo(videoId: string, fallback?: string) {
  const raw =
    fallback?.startsWith("http") ? fallback : `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
  return normalizeYoutubeThumbUrl(raw);
}

function PlayGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M8 5v14l11-7L8 5z" />
    </svg>
  );
}

export function PodcastsGrid({ podcasts }: { podcasts: PodcastWithEpisodes[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {podcasts.map((podcast) => (
        <article
          key={podcast.slug}
          className="flex flex-col rounded-lg border border-white/10 bg-[#0f1420] p-4 shadow-[0_0_0_1px_rgba(0,255,159,0.04)] transition-colors hover:border-white/20 hover:bg-[#141b2a] sm:p-5"
        >
          <div className="border-b border-white/10 pb-3">
            <h2 className="text-lg font-bold tracking-tight text-white sm:text-xl">
              {podcast.title}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
              {podcast.tagline}
            </p>
          </div>

          <div className="mt-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              Latest on YouTube
            </p>
            {podcast.episodes.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">
                Recent episodes could not be loaded. Use the links below to open the show on
                YouTube, Spotify, or Amazon Music.
              </p>
            ) : (
              <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {podcast.episodes.map((ep) => (
                  <li key={ep.id} className="min-w-0">
                    <a
                      href={ep.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative block overflow-hidden rounded-md border border-white/10 bg-black/40 ring-[#a855f7] transition-[border-color,transform] hover:border-[#00ff9f]/40 hover:shadow-[0_0_20px_rgba(0,255,159,0.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a855f7] active:scale-[0.98]"
                      aria-label={`Play on YouTube: ${ep.title} (opens in a new tab)`}
                    >
                      <span className="relative block aspect-video w-full">
                        <Image
                          src={thumbForVideo(ep.id, ep.thumbnailUrl)}
                          alt=""
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 45vw, 120px"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-90 transition-opacity group-hover:bg-black/55">
                          <PlayGlyph className="size-9 text-white drop-shadow-md" />
                        </span>
                      </span>
                      <span className="line-clamp-3 px-2 py-2 text-xs font-medium leading-snug text-zinc-300">
                        {ep.title}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-auto border-t border-white/10 pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              Full catalog
            </p>
            <p className="mt-2 text-xs text-zinc-400">
              Hear every episode on{" "}
              <a
                href={podcast.youtubeCatalogUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00ff9f] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a855f7]"
              >
                YouTube
              </a>
              ,{" "}
              <a
                href={podcast.spotifyCatalogUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00ff9f] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a855f7]"
              >
                Spotify
              </a>
              , or{" "}
              <a
                href={podcast.amazonMusicCatalogUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00ff9f] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a855f7]"
              >
                Amazon Music
              </a>
              .
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
