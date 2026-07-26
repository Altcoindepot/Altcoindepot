"use client";

import { useEffect, useState } from "react";

/** Sticky control for long market / coin pages. */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 720);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-4 z-[90] inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[#d1a173]/40 bg-[#141218]/92 text-sm font-semibold text-[#d7ad82] shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur-md transition-colors hover:border-[#d1a173]/70 hover:bg-[#1a1620] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1a173] sm:right-6"
      aria-label="Back to top"
    >
      ↑
    </button>
  );
}
