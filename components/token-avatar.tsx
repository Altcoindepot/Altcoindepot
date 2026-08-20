"use client";

import { useState } from "react";

/** Letter avatar when no token image URL is available. Never blocks render. */
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
  const sizeClass =
    size <= 20 ? "size-5" : size <= 24 ? "size-6" : size <= 28 ? "size-7" : "size-8";

  if (imageUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Dex CDN; avoid optimizer blocking
      <img
        src={imageUrl}
        alt=""
        width={size}
        height={size}
        className={`${sizeClass} shrink-0 rounded-full bg-zinc-800 object-cover ${className}`.trim()}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span
      className={`${sizeClass} inline-flex shrink-0 items-center justify-center rounded-full bg-teal-500/15 font-mono text-[10px] font-bold text-teal-200 ${className}`.trim()}
      aria-hidden
    >
      {letter}
    </span>
  );
}
