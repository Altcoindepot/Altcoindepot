"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  applyTheme,
  isThemePreference,
  readStoredPreference,
  resolveTheme,
  THEME_STORAGE_KEY,
} from "@/lib/theme";

/** Keeps `data-theme` on `<html>` in sync across navigations, tabs, and OS theme changes. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    applyTheme(resolveTheme(readStoredPreference()));
  }, [pathname]);

  useEffect(() => {
    function syncFromStorage() {
      applyTheme(resolveTheme(readStoredPreference()));
    }

    syncFromStorage();

    function onStorage(event: StorageEvent) {
      if (event.key === THEME_STORAGE_KEY && isThemePreference(event.newValue)) {
        applyTheme(resolveTheme(event.newValue));
      }
    }

    function onThemeChange() {
      syncFromStorage();
    }

    const mq = window.matchMedia("(prefers-color-scheme: light)");
    function onSystemChange() {
      if (readStoredPreference() === "system") {
        applyTheme(resolveTheme("system"));
      }
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener("theme-change", onThemeChange);
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onSystemChange);
    } else {
      mq.addListener(onSystemChange);
    }

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("theme-change", onThemeChange);
      if (typeof mq.removeEventListener === "function") {
        mq.removeEventListener("change", onSystemChange);
      } else {
        mq.removeListener(onSystemChange);
      }
    };
  }, []);

  return children;
}
