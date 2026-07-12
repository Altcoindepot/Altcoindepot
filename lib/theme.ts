export const THEME_STORAGE_KEY = "altcoindepot-theme";

export type Theme = "dark" | "light";

export const DEFAULT_THEME: Theme = "dark";

export function isTheme(value: string | null | undefined): value is Theme {
  return value === "dark" || value === "light";
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
}

export function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isTheme(stored)) return stored;
  } catch {
    /* private browsing / blocked storage */
  }
  return DEFAULT_THEME;
}

export function persistTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
  applyTheme(theme);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("theme-change", { detail: theme }));
  }
}
