export const THEME_STORAGE_KEY = "altcoindepot-theme";

/** Resolved appearance applied to the document. */
export type Theme = "dark" | "light";

/** What the user chose — `system` follows OS preference. */
export type ThemePreference = Theme | "system";

export const DEFAULT_THEME_PREFERENCE: ThemePreference = "system";

export function isTheme(value: string | null | undefined): value is Theme {
  return value === "dark" || value === "light";
}

export function isThemePreference(value: string | null | undefined): value is ThemePreference {
  return value === "system" || isTheme(value);
}

export function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function resolveTheme(preference: ThemePreference): Theme {
  if (preference === "light" || preference === "dark") return preference;
  return getSystemTheme();
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
}

export function readStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemePreference(stored)) return stored;
  } catch {
    /* private browsing / blocked storage */
  }
  return DEFAULT_THEME_PREFERENCE;
}

/** @deprecated Use readStoredPreference + resolveTheme */
export function readStoredTheme(): Theme {
  return resolveTheme(readStoredPreference());
}

export function persistThemePreference(preference: ThemePreference) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    /* ignore */
  }
  const theme = resolveTheme(preference);
  applyTheme(theme);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("theme-change", { detail: { preference, theme } }),
    );
  }
}

/** Persist an explicit light/dark choice (legacy helper). */
export function persistTheme(theme: Theme) {
  persistThemePreference(theme);
}
