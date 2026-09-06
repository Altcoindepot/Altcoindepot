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

function formatEpisodeDate(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  return new Date(t).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function PlayGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7L8 5z" />
    </svg>
  );
}

export function PodcastsGrid({ podcasts }: { podcasts: PodcastWithEpisodes[] }) {
  return (
    <div className="grid gap-6 sm:gap-8">
      {podcasts.map((podcast) => (
        <article
          key={podcast.slug}
          className="flex flex-col rounded-2xl border border-white/10 bg-[#0c0e14]/90 p-4 shadow-[0_0_0_1px_rgba(0,255,159,0.04)] sm:rounded-lg sm:p-6"
        >
          <div className="border-b border-white/10 pb-3 sm:pb-4">
            <h2 className="text-lg font-bold tracking-tight text-white sm:text-2xl">
              {podcast.title}
            </h2>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-zinc-400 sm:mt-1.5 sm:text-base">
              {podcast.tagline}
            </p>
          </div>

          <div className="mt-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              Latest episodes
            </p>
            {podcast.episodes.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">
                Recent episodes could not be loaded. Use the links below for the full catalog.
              </p>
            ) : (
              <>
                {/* Mobile: stacked list title / date / play */}
                <ul className="mt-3 divide-y divide-white/8 sm:hidden">
                  {podcast.episodes.map((ep) => (
                    <li key={ep.id}>
                      <a
                        href={ep.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-h-12 items-center gap-3 py-3 active:bg-white/[0.03]"
                        aria-label={`Play on YouTube: ${ep.title}`}
                      >
                        <span className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-white/10">
                          <Image
                            src={thumbForVideo(ep.id, ep.thumbnailUrl)}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 text-sm font-medium leading-snug text-zinc-100">
                            {ep.title}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-zinc-500">
                            {formatEpisodeDate(ep.publishedAt)}
                          </span>
                        </span>
                        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-500/15 text-teal-200 ring-1 ring-teal-400/30">
                          <PlayGlyph className="size-4 translate-x-0.5" />
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>

                {/* Desktop: thumbnail grid */}
                <ul className="mt-4 hidden grid-cols-2 gap-4 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 sm:grid">
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
                            sizes="(max-width: 768px) 44vw, 220px"
                          />
                          <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/35">
                            <span className="flex size-11 items-center justify-center rounded-full bg-black/55 text-white shadow-lg ring-1 ring-white/25 backdrop-blur-[2px] transition-transform group-hover:scale-110 sm:size-12">
                              <PlayGlyph className="size-5 translate-x-0.5 sm:size-6" />
                            </span>
                          </span>
                        </span>
                        <span className="px-3 py-3 text-sm font-medium leading-snug text-zinc-100">
                          {ep.title}
                        </span>
                        <span className="px-3 pb-3 text-[11px] text-zinc-500">
                          {formatEpisodeDate(ep.publishedAt)}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="mt-auto border-t border-white/10 pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              Hear every episode on YouTube, Spotify, or Amazon Music.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <a
                href={podcast.youtubeCatalogUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center rounded-full border border-white/15 bg-white/[0.04] px-3 text-[11px] font-semibold text-zinc-200"
              >
                YouTube
              </a>
              <a
                href={podcast.spotifyCatalogUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center rounded-full border border-white/15 bg-white/[0.04] px-3 text-[11px] font-semibold text-zinc-200"
              >
                Spotify
              </a>
              <a
                href={podcast.amazonMusicCatalogUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center rounded-full border border-white/15 bg-white/[0.04] px-3 text-[11px] font-semibold text-zinc-200"
              >
                Amazon Music
              </a>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
