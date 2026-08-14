"use client";

import { useEffect, useRef, useState } from "react";
import { ds } from "@/lib/ui-classes";

/** Hard deadline so a chart iframe can never spin forever. */
const CHART_TIMEOUT_MS = 4000;

function ChartFallback({ pairUrl }: { pairUrl: string | null }) {
  return (
    <div className="px-4 py-10 text-center sm:px-5">
      <p className="text-sm font-medium text-zinc-200">Chart unavailable</p>
      <p className="mt-1 text-xs text-zinc-500">
        The chart embed did not load in time.
      </p>
      {pairUrl ? (
        <a
          href={pairUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${ds.btnSecondary} mt-4`}
        >
          Open on DexScreener
        </a>
      ) : null}
    </div>
  );
}

/**
 * Token-page chart with a hard timeout.
 *
 * Prefers a GeckoTerminal pool embed (more reliable than DexScreener’s
 * “Loading pair…” hang). Local “Loading chart…” covers the iframe until
 * `onLoad` or the deadline. On timeout / error → “Chart unavailable” +
 * Open on DexScreener. Never leaves an infinite spinner.
 */
export function DexScreenerChart({
  embedUrl,
  pairUrl,
  title,
}: {
  embedUrl: string | null;
  pairUrl: string | null;
  title: string;
}) {
  const [phase, setPhase] = useState<"loading" | "ready" | "unavailable">(
    embedUrl ? "loading" : "unavailable",
  );
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!embedUrl) {
      setPhase("unavailable");
      return;
    }

    loadedRef.current = false;
    setPhase("loading");

    const timer = setTimeout(() => {
      if (!loadedRef.current) setPhase("unavailable");
    }, CHART_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [embedUrl]);

  if (phase === "unavailable" || !embedUrl) {
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
        key={embedUrl}
        title={title}
        src={embedUrl}
        className="h-full w-full border-0 bg-[#0c0e14]"
        referrerPolicy="no-referrer-when-downgrade"
        allow="clipboard-write"
        onLoad={() => {
          loadedRef.current = true;
          setPhase((prev) => (prev === "unavailable" ? prev : "ready"));
        }}
        onError={() => setPhase("unavailable")}
      />
    </div>
  );
}
