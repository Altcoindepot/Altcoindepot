"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { isResourcesPath, RESOURCES_NAV } from "@/lib/resources-nav";

/** Desktop header: single Resources item with dropdown (Ecosystem / Podcasts / Tools). */
export function ResourcesNavDropdown() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const active = isResourcesPath(pathname);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex min-h-11 items-center gap-1 rounded-lg px-3 text-sm font-medium ${
          active || open
            ? "bg-teal-500/15 text-teal-200"
            : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
        }`}
      >
        Resources
        <svg
          className={`size-3.5 opacity-70 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Resources"
          className="absolute left-0 top-full z-50 mt-1 min-w-[11rem] overflow-hidden rounded-xl border border-white/10 bg-[#0c0e14] py-1 shadow-xl shadow-black/40"
        >
          {RESOURCES_NAV.map((item) => {
            const itemActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={`block px-3 py-2.5 text-sm font-medium ${
                  itemActive
                    ? "bg-teal-500/15 text-teal-200"
                    : "text-zinc-300 hover:bg-white/5 hover:text-zinc-100"
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
