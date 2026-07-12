"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { PUBLIC_CATEGORIES } from "@/lib/coin-categories";
import { ThemeSelector } from "@/components/theme-selector";

const nav = [
  { href: "/", label: "Home" },
  { href: "/cex-trending", label: "CEX Trending" },
  { href: "/dex-trending", label: "DEX Trending" },
  { href: "/top-100-trending", label: "Top 100 Trending" },
  { href: "/top-200-trending", label: "Top 200 Trending" },
  { href: "/podcasts", label: "Podcasts" },
] as const;

export function HeaderNavMenu() {
  const [open, setOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const close = useCallback(() => {
    setOpen(false);
    setCategoriesOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    function onPointer(e: MouseEvent) {
      const t = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(t) &&
        btnRef.current &&
        !btnRef.current.contains(t)
      ) {
        close();
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open, close]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="true"
        onClick={() =>
          setOpen((o) => {
            const next = !o;
            if (!next) {
              setCategoriesOpen(false);
            }
            return next;
          })
        }
        className="flex items-center gap-2 rounded-lg border border-[#f4ddc3]/25 bg-[rgba(20,18,22,0.7)] px-3 py-2 text-sm font-medium text-zinc-200 shadow-[0_0_0_1px_rgba(185,129,82,0.2)] transition-[border-color,box-shadow] hover:border-[#d1a173]/55 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1a173]"
      >
        <span className="sr-only">Open navigation menu</span>
        <svg
          className="size-5 text-[#d1a173]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          {open ? (
            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
          ) : (
            <>
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </>
          )}
        </svg>
        <span className="hidden sm:inline">Menu</span>
      </button>

      {open ? (
        <div
          ref={panelRef}
          id={listId}
          className="absolute left-0 z-[60] mt-2 w-[min(100vw-2rem,18rem)] origin-top-left rounded-xl border border-[#f4ddc3]/20 bg-[rgba(11,12,16,0.9)] py-2 shadow-[0_0_40px_rgba(0,0,0,0.65),0_0_20px_rgba(185,129,82,0.12)] backdrop-blur-md"
        >
          <nav aria-label="Site pages">
            <ul className="flex flex-col gap-0.5 px-1">
              {nav.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={close}
                    className="text-metallic block rounded-lg px-3 py-2.5 text-base font-medium transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1a173]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
              <li className="mt-1 border-t border-[#f4ddc3]/15 pt-2">
                <button
                  type="button"
                  aria-expanded={categoriesOpen}
                  onClick={() => setCategoriesOpen((v) => !v)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-widest text-[#d7ad82] transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1a173]"
                >
                  <span>Categories</span>
                  <svg
                    className={`size-4 transition-transform ${categoriesOpen ? "rotate-90" : ""}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden
                  >
                    <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {categoriesOpen ? (
                  <ul className="mt-1 flex flex-col gap-0.5">
                    {PUBLIC_CATEGORIES.map((category) => (
                      <li key={category.slug}>
                      <Link
                        href={`/category/${encodeURIComponent(category.slug)}`}
                        onClick={close}
                        className="text-metallic block rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1a173]"
                      >
                        {category.title}
                      </Link>
                    </li>
                  ))}
                  </ul>
                ) : null}
              </li>
              <li>
                <ThemeSelector />
              </li>
            </ul>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
