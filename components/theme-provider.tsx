"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  applyTheme,
  isTheme,
  readStoredTheme,
  THEME_STORAGE_KEY,
} from "@/lib/theme";

/** Keeps `data-theme` on `<html>` in sync across client navigations and tabs. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    applyTheme(readStoredTheme());
  }, [pathname]);

  useEffect(() => {
    applyTheme(readStoredTheme());

    function onStorage(event: StorageEvent) {
      if (event.key === THEME_STORAGE_KEY && isTheme(event.newValue)) {
        applyTheme(event.newValue);
      }
    }

    function onThemeChange(event: Event) {
      const detail = (event as CustomEvent<string>).detail;
      if (isTheme(detail)) {
        applyTheme(detail);
      } else {
        applyTheme(readStoredTheme());
      }
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener("theme-change", onThemeChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("theme-change", onThemeChange);
    };
  }, []);

  return children;
}
