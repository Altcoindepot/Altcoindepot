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
  const raw = fallback?.startsWith("http")
    ? fallback.replace(/\/(default|mqdefault|sddefault)\.jpg/i, "/hqdefault.jpg")
    : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
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
    <div className="grid gap-8">
      {podcasts.map((podcast) => (
        <article
          key={podcast.slug}
          className="flex flex-col rounded-lg border border-white/10 bg-[#0f1420] p-5 shadow-[0_0_0_1px_rgba(0,255,159,0.04)] transition-colors hover:border-white/20 hover:bg-[#141b2a] sm:p-6"
        >
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              {podcast.title}
            </h2>
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              {podcast.tagline}
            </p>
          </div>

          <div className="mt-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              Latest on YouTube
            </p>
            {podcast.episodes.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">
                Recent episodes could not be loaded. Use the links below to open the show on
                YouTube, Spotify, or Amazon Music.
              </p>
            ) : (
              <ul className="mt-4 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                {podcast.episodes.map((ep) => (
                  <li key={ep.id} className="min-w-0">
                    <a
                      href={ep.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col rounded-lg border border-white/10 bg-black/40 transition-[border-color,transform,box-shadow] hover:border-[#00ff9f]/45 hover:shadow-[0_0_24px_rgba(0,255,159,0.14)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a855f7] active:scale-[0.99]"
                      aria-label={`Play on YouTube: ${ep.title} (opens in a new tab)`}
                    >
                      <span className="relative block aspect-video w-full overflow-hidden rounded-t-lg">
                        <Image
                          src={thumbForVideo(ep.id, ep.thumbnailUrl)}
                          alt=""
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          sizes="(max-width: 480px) 92vw, (max-width: 768px) 44vw, (max-width: 1024px) 30vw, 220px"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/35">
                          <span className="flex size-11 items-center justify-center rounded-full bg-black/55 text-white shadow-lg ring-1 ring-white/25 backdrop-blur-[2px] transition-transform group-hover:scale-110 sm:size-12">
                            <PlayGlyph className="size-5 translate-x-0.5 sm:size-6" />
                          </span>
                        </span>
                      </span>
                      <span className="px-3 py-3 text-sm font-medium leading-snug text-zinc-100 sm:text-[15px] sm:leading-relaxed">
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
            <p className="mt-2 text-sm text-zinc-400">
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
