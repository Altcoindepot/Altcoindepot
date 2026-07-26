"use client";

import { useEffect, useState } from "react";
import { QUIET_FILTER_STORAGE_KEY } from "@/lib/liquidity";

/** Optional quiet filter — hides extreme low-liquidity meme noise. */
export function QuietFilterToggle({
  onChange,
}: {
  onChange?: (enabled: boolean) => void;
}) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    try {
      setEnabled(localStorage.getItem(QUIET_FILTER_STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  function toggle() {
    setEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(QUIET_FILTER_STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      onChange?.(next);
      window.dispatchEvent(
        new CustomEvent("quiet-filter-change", { detail: { enabled: next } }),
      );
      return next;
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      className={`inline-flex min-h-9 items-center rounded-lg border px-3 text-xs font-semibold transition-colors ${
        enabled
          ? "border-[#d1a173]/45 bg-[#d1a173]/15 text-[#d7ad82]"
          : "border-white/15 text-zinc-400 hover:border-white/25 hover:text-zinc-200"
      }`}
      title="Hide extreme low-liquidity meme noise from this list"
    >
      {enabled ? "Quiet filter on" : "Quiet filter"}
    </button>
  );
}

export function useQuietFilter() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    try {
      setEnabled(localStorage.getItem(QUIET_FILTER_STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
    function onChange(e: Event) {
      const detail = (e as CustomEvent<{ enabled?: boolean }>).detail;
      if (typeof detail?.enabled === "boolean") setEnabled(detail.enabled);
    }
    window.addEventListener("quiet-filter-change", onChange);
    return () => window.removeEventListener("quiet-filter-change", onChange);
  }, []);

  return enabled;
}
