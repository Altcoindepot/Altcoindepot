import Link from "next/link";
import { HeaderNavMenu } from "@/components/header-nav-menu";
import { CoinSearchBar } from "@/components/coin-search-bar";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#f4ddc3]/20 bg-[#0b0d11]/78 backdrop-blur-xl">
      <div className="relative flex w-full items-center justify-center px-2 py-3.5 sm:px-3 sm:py-3">
        <div className="absolute left-2 top-1/2 z-10 -translate-y-1/2 sm:left-3">
          <HeaderNavMenu />
        </div>
        <div className="absolute right-2 top-1/2 z-10 flex -translate-y-1/2 items-center gap-2 sm:right-3">
          <CoinSearchBar inputId="header-coin-search" />
        </div>
        <Link
          href="/"
          className="header-home-link relative z-20 inline-flex max-w-[46%] rounded-sm px-2 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1a173] sm:max-w-none sm:px-4"
        >
          <span className="text-brand-altcoindepot text-xl font-extrabold tracking-tight sm:text-3xl md:text-4xl md:leading-tight">
            AltCoinDepot
          </span>
        </Link>
      </div>
    </header>
  );
}
