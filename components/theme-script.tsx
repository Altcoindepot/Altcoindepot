import { DEFAULT_THEME_PREFERENCE, THEME_STORAGE_KEY } from "@/lib/theme";

/** Runs before paint to avoid theme flash on load. Defaults to system preference. */
export function ThemeScript() {
  const script = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k);var pref=${JSON.stringify(DEFAULT_THEME_PREFERENCE)};if(t==="light"||t==="dark"||t==="system")pref=t;var theme="dark";if(pref==="light"||pref==="dark"){theme=pref;}else{try{theme=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}catch(e){theme="dark";}}document.documentElement.setAttribute("data-theme",theme);document.documentElement.style.colorScheme=theme;}catch(e){try{var sys=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";document.documentElement.setAttribute("data-theme",sys);document.documentElement.style.colorScheme=sys;}catch(e2){document.documentElement.setAttribute("data-theme","dark");document.documentElement.style.colorScheme="dark";}}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
