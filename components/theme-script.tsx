import { DEFAULT_THEME_PREFERENCE, THEME_COOKIE_KEY, THEME_STORAGE_KEY } from "@/lib/theme";

/** Runs before paint to avoid theme flash on load. Defaults to system preference. */
export function ThemeScript() {
  const script = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var ck=${JSON.stringify(THEME_COOKIE_KEY)};var pref=${JSON.stringify(DEFAULT_THEME_PREFERENCE)};try{var t=localStorage.getItem(k);if(t==="light"||t==="dark"||t==="system")pref=t;}catch(e0){}if(pref==="system"||!pref){try{var parts=document.cookie.split("; ");for(var i=0;i<parts.length;i++){if(parts[i].indexOf(ck+"=")===0){var cv=decodeURIComponent(parts[i].slice(ck.length+1));if(cv==="light"||cv==="dark"||cv==="system"){pref=cv;break;}}}}catch(e1){}}var theme="dark";if(pref==="light"||pref==="dark"){theme=pref;}else{try{theme=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}catch(e){theme="dark";}}document.documentElement.setAttribute("data-theme",theme);document.documentElement.style.colorScheme=theme;}catch(e){try{var sys=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";document.documentElement.setAttribute("data-theme",sys);document.documentElement.style.colorScheme=sys;}catch(e2){document.documentElement.setAttribute("data-theme","dark");document.documentElement.style.colorScheme="dark";}}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
