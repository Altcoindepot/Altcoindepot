"use client";

import { usePathname } from "next/navigation";
import { CoingeckoLogoAttribution } from "@/components/coingecko-logo-attribution";

/** Hide CoinGecko badge on DexScreener scanner surfaces. */
function isDexScannerPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname.startsWith("/new-low-caps") ||
    pathname.startsWith("/just-launched") ||
    pathname.startsWith("/token/")
  );
}

export function FooterDataAttribution({ className = "" }: { className?: string }) {
  const pathname = usePathname() || "/";
  if (isDexScannerPath(pathname)) {
    return (
      <p className={`text-xs text-zinc-600 ${className}`.trim()}>
        Pair stats from DexScreener · informational only · not financial advice.
      </p>
    );
  }
  return <CoingeckoLogoAttribution className={className} />;
}
