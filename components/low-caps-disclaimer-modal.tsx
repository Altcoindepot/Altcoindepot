"use client";

import { useEffect, useRef, useState } from "react";
import { ds } from "@/lib/ui-classes";

export const LOWCAPS_DISCLAIMER_STORAGE_KEY = "lowcaps-disclaimer-accepted";

export function LowCapsDisclaimerModal() {
  const [open, setOpen] = useState(false);
  const acceptRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(LOWCAPS_DISCLAIMER_STORAGE_KEY) === "1") return;
    } catch {
      /* private mode / blocked storage — still show the disclaimer */
    }
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    acceptRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function accept() {
    try {
      localStorage.setItem(LOWCAPS_DISCLAIMER_STORAGE_KEY, "1");
    } catch {
      /* ignore quota / private-mode write failures */
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lowcaps-disclaimer-title"
      aria-describedby="lowcaps-disclaimer-body"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/12 bg-[#0b0d11] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:p-6">
        <p className={`${ds.badgeWarn} mb-3`}>High risk</p>
        <h2 id="lowcaps-disclaimer-title" className="text-lg font-semibold text-zinc-50">
          High-risk tokens
        </h2>
        <div id="lowcaps-disclaimer-body" className="mt-3 space-y-3 text-sm leading-relaxed text-zinc-400">
          <p>
            New and low-cap DEX tokens are extremely volatile. Many are illiquid or fraudulent.
          </p>
          <p>
            This list is for information only and is not financial advice. Data is sourced from
            public DEX data (including DexScreener) and may be delayed or incomplete.
          </p>
          <p>Always do your own research. You are solely responsible for any decisions you make.</p>
        </div>
        <button
          ref={acceptRef}
          type="button"
          onClick={accept}
          className={`${ds.btnPrimary} mt-6 w-full min-h-12`}
        >
          I understand
        </button>
        <p className={`${ds.disclaimer} mt-3 text-center`}>
          Informational only · not financial advice
        </p>
      </div>
    </div>
  );
}
