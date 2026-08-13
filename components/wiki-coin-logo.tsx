"use client";

import { useState } from "react";
import Image from "next/image";
import { wikiDisplayName, wikiLogoUrl } from "@/lib/ecosystem-wiki";

export function WikiCoinLogo({
  id,
  size = 40,
  className = "",
}: {
  id: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = wikiLogoUrl(id);
  const letter = wikiDisplayName(id).charAt(0).toUpperCase();

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
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 rounded-full bg-[#0c0e14] ring-1 ring-white/15 ${className}`.trim()}
      onError={() => setFailed(true)}
    />
  );
}
