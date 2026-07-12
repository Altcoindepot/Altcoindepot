import { DEFAULT_THEME, THEME_STORAGE_KEY } from "@/lib/theme";

/** Runs before paint to avoid theme flash on load. */
export function ThemeScript() {
  const script = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k);var theme=${JSON.stringify(DEFAULT_THEME)};if(t==="light"||t==="dark")theme=t;document.documentElement.setAttribute("data-theme",theme);document.documentElement.style.colorScheme=theme;}catch(e){document.documentElement.setAttribute("data-theme",${JSON.stringify(DEFAULT_THEME)});document.documentElement.style.colorScheme=${JSON.stringify(DEFAULT_THEME)};}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
