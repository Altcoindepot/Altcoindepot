"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { isResourcesPath, RESOURCES_NAV } from "@/lib/resources-nav";

/** Mobile / drawer: Resources accordion (Ecosystem / Tools). Podcasts is top-level, not nested. */
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
        className={`site-drawer-link flex min-h-11 w-full items-center justify-between rounded-lg px-3 text-sm font-medium ${
          active ? "site-drawer-link-active" : ""
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
        <div className="site-drawer-nest mt-0.5 ml-3 flex flex-col gap-0.5 border-l pl-2">
          {RESOURCES_NAV.map((item) => {
            const itemActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`site-drawer-link inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium ${
                  itemActive ? "site-drawer-link-active" : ""
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
