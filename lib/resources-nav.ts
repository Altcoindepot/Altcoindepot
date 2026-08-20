export const RESOURCES_NAV = [
  { href: "/ecosystem", label: "Ecosystem" },
  { href: "/podcasts", label: "Podcasts" },
  { href: "/tools", label: "Tools" },
] as const;

export function isResourcesPath(pathname: string): boolean {
  return RESOURCES_NAV.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
}
