/** Nested under Resources — Podcasts is a top-level nav link, not here. */
export const RESOURCES_NAV = [
  { href: "/ecosystem", label: "Ecosystem" },
  { href: "/tools", label: "Tools" },
] as const;

export function isResourcesPath(pathname: string): boolean {
  return RESOURCES_NAV.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
}
