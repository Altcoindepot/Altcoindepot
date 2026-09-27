"use client";

import { useState } from "react";

/**
 * Circular token icon (24–32px). Dex/Gecko URL with letter fallback — never a broken img.
 */
export function TokenAvatar({
  symbol,
  imageUrl,
  size = 28,
  className = "",
}: {
  symbol: string;
  imageUrl?: string | null;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const letter = (symbol || "?").trim().charAt(0).toUpperCase() || "?";
  const px = Math.min(32, Math.max(24, Math.round(size)));
  const src = imageUrl?.trim() || "";
  const showImg = Boolean(src) && !failed;

  if (showImg) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Dex/Gecko CDN; avoid optimizer blocking
      <img
        src={src}
        alt=""
        width={px}
        height={px}
        loading="lazy"
        decoding="async"
        className={`shrink-0 rounded-full object-cover bg-[var(--card)] ${className}`.trim()}
        style={{ width: px, height: px }}
        onError={() => setFailed(true)}
      />
    );
  }

  const fontPx = px <= 24 ? 10 : px <= 28 ? 11 : 12;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-teal-400/35 bg-teal-500/15 font-mono font-bold ${className}`.trim()}
      style={{
        width: px,
        height: px,
        fontSize: fontPx,
        color: "var(--fg)",
        backgroundColor: "color-mix(in srgb, var(--bg) 55%, rgba(13, 148, 136, 0.22))",
      }}
      aria-hidden
    >
      {letter}
    </span>
  );
}
