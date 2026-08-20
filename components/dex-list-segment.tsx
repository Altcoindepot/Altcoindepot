"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function DexListSegment() {
  const pathname = usePathname() || "/";
  const launched = pathname.startsWith("/just-launched");
  const lowCaps = pathname.startsWith("/new-low-caps") || pathname === "/";

  return (
    <div
      role="tablist"
      aria-label="DEX lists"
      className="inline-flex rounded-lg border border-white/12 bg-[#0c0e14] p-0.5"
    >
      <Link
        href="/just-launched"
        role="tab"
        aria-selected={launched}
        className={`inline-flex min-h-11 items-center rounded-md px-3 text-xs font-semibold ${
          launched ? "bg-teal-500/20 text-teal-200" : "text-zinc-400 hover:text-zinc-200"
        }`}
      >
        Just Launched
      </Link>
      <Link
        href="/new-low-caps"
        role="tab"
        aria-selected={lowCaps && !launched}
        className={`inline-flex min-h-11 items-center rounded-md px-3 text-xs font-semibold ${
          lowCaps && !launched ? "bg-teal-500/20 text-teal-200" : "text-zinc-400 hover:text-zinc-200"
        }`}
      >
        New &amp; Low Caps
      </Link>
    </div>
  );
}
