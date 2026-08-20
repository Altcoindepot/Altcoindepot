"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { isResourcesPath, RESOURCES_NAV } from "@/lib/resources-nav";

/** Mobile / drawer: Resources accordion nesting Ecosystem, Podcasts, Tools. */
export function ResourcesNavAccordion({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() || "/";
  const active = isResourcesPath(pathname);
  const [open, setOpen] = useState(active);

  return (
    <div className="rounded-lg">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex min-h-11 w-full items-center justify-between rounded-lg px-3 text-sm font-medium ${
          active ? "bg-teal-500/15 text-teal-200" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
        }`}
      >
        <span>Resources</span>
        <svg
          className={`size-3.5 transition-transform ${open ? "rotate-90" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <div className="mt-0.5 flex flex-col gap-0.5 border-l border-white/10 pl-2 ml-3">
          {RESOURCES_NAV.map((item) => {
            const itemActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium ${
                  itemActive
                    ? "bg-teal-500/15 text-teal-200"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
