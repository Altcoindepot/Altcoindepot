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
      className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] right-3 z-[90] inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-teal-400/40 bg-[var(--glass-fallback)]/92 text-sm font-semibold text-teal-300 shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur-md transition-colors hover:border-teal-400/55 hover:bg-[#0a1218] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400/70 lg:bottom-6 lg:right-6"
      aria-label="Back to top"
    >
      ↑
    </button>
  );
}
