"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ds } from "@/lib/ui-classes";

/** Per-embed deadline — then fall through Dex → GeckoTerminal → unavailable. */
const CHART_TIMEOUT_MS = 4500;

function ChartFallback({ pairUrl }: { pairUrl: string | null }) {
  return (
    <div className="px-4 py-10 text-center sm:px-5">
      <p className="text-sm font-medium text-zinc-200">Chart unavailable</p>
      <p className="mt-1 text-xs text-zinc-500">Live chart could not load for this pair.</p>
      {pairUrl ? (
        <a
          href={pairUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${ds.btnSecondary} mt-4`}
        >
          View on DexScreener
        </a>
      ) : null}
    </div>
  );
}

/**
 * Live chart path only: DexScreener pair embed → GeckoTerminal pool embed.
 * Same pair as the page price. Never CoinGecko / TradingView charts.
 */
export function DexScreenerChart({
  dexEmbedUrl,
  geckoTerminalEmbedUrl,
  pairUrl,
  title,
  /** @deprecated use dexEmbedUrl + geckoTerminalEmbedUrl */
  embedUrl,
}: {
  dexEmbedUrl?: string | null;
  geckoTerminalEmbedUrl?: string | null;
  embedUrl?: string | null;
  pairUrl: string | null;
  title: string;
}) {
  const sources = useMemo(() => {
    const primary = dexEmbedUrl ?? embedUrl ?? null;
    const fallback =
      geckoTerminalEmbedUrl && geckoTerminalEmbedUrl !== primary
        ? geckoTerminalEmbedUrl
        : null;
    return [primary, fallback].filter((u): u is string => Boolean(u));
  }, [dexEmbedUrl, geckoTerminalEmbedUrl, embedUrl]);

  const sourcesKey = sources.join("|");
  const [sourceIndex, setSourceIndex] = useState(0);
  const [phase, setPhase] = useState<"loading" | "ready" | "unavailable">(
    sources.length > 0 ? "loading" : "unavailable",
  );
  const loadedRef = useRef(false);
  const activeUrl = sources[sourceIndex] ?? null;

  useEffect(() => {
    setSourceIndex(0);
    setPhase(sources.length > 0 ? "loading" : "unavailable");
    loadedRef.current = false;
  }, [sourcesKey, sources.length]);

  useEffect(() => {
    if (!activeUrl) {
      setPhase("unavailable");
      return;
    }
    loadedRef.current = false;
    setPhase("loading");

    const timer = setTimeout(() => {
      if (loadedRef.current) return;
      if (sourceIndex + 1 < sources.length) {
        setSourceIndex((i) => i + 1);
      } else {
        setPhase("unavailable");
      }
    }, CHART_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [activeUrl, sourceIndex, sources.length]);

  if (phase === "unavailable" || !activeUrl) {
    return <ChartFallback pairUrl={pairUrl} />;
  }

  return (
    <div className="relative h-[28rem] w-full bg-[#0c0e14] sm:h-[32rem]">
      {phase === "loading" ? (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#0c0e14]"
          aria-live="polite"
        >
          <p className="text-sm text-zinc-400">Loading chart…</p>
        </div>
      ) : null}
      <iframe
        key={activeUrl}
        title={title}
        src={activeUrl}
        className="h-full w-full border-0 bg-[#0c0e14]"
        referrerPolicy="no-referrer-when-downgrade"
        allow="clipboard-write"
        onLoad={() => {
          loadedRef.current = true;
          setPhase((prev) => (prev === "unavailable" ? prev : "ready"));
        }}
        onError={() => {
          if (sourceIndex + 1 < sources.length) {
            setSourceIndex((i) => i + 1);
          } else {
            setPhase("unavailable");
          }
        }}
      />
    </div>
  );
}
