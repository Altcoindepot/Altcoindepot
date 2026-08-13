"use client";

import { useState } from "react";
import { wikiDisplayName, wikiLogoUrl } from "@/lib/ecosystem-wiki";

/**
 * Coin logo for Ecosystem Research.
 * Uses a plain <img> (not next/image) so CoinGecko CDN loads in the browser —
 * Next's image optimizer often gets 403 from coingecko.com and falls back to letters.
 */
export function WikiCoinLogo({
  id,
  src: srcProp,
  size = 40,
  className = "",
}: {
  id: string;
  /** Live CoinGecko markets image URL when available. */
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = (srcProp && srcProp.trim()) || wikiLogoUrl(id);
  const letter = wikiDisplayName(id).charAt(0).toUpperCase();
  const name = wikiDisplayName(id);

  if (!src || failed) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[#d1a173]/20 font-bold text-[#d7ad82] ring-1 ring-[#d1a173]/35 ${className}`.trim()}
        style={{ width: size, height: size, fontSize: Math.max(11, size * 0.42) }}
        aria-hidden
      >
        {letter}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- CoinGecko CDN blocks Next image optimizer
    <img
      src={src}
      alt={`${name} logo`}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className={`shrink-0 rounded-full bg-[#0c0e14] object-cover ring-1 ring-white/15 ${className}`.trim()}
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
}
