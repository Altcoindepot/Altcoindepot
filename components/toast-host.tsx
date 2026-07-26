"use client";

import { useEffect, useState } from "react";

export const TOAST_EVENT = "altcoindepot-toast";

type ToastDetail = { message: string };

export function showToast(message: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message } }));
}

/** Lightweight bottom toast — no third-party dependency. */
export function ToastHost() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let hideTimer = 0;
    function onToast(event: Event) {
      const detail = (event as CustomEvent<ToastDetail>).detail;
      if (!detail?.message) return;
      setMessage(detail.message);
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => setMessage(null), 2200);
    }
    window.addEventListener(TOAST_EVENT, onToast);
    return () => {
      window.removeEventListener(TOAST_EVENT, onToast);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex justify-center px-4"
    >
      <p className="rounded-xl border border-[#d1a173]/35 bg-[#141218]/95 px-4 py-2.5 text-sm font-medium text-[#f6f2eb] shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-md">
        {message}
      </p>
    </div>
  );
}
