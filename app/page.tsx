import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { MarketsDataShell } from "@/components/markets-data-shell";
import { HomeMarketsFallback } from "@/components/home-markets-fallback";
import { SiteFooter } from "@/components/site-footer";
import { HomeNewsFeed } from "@/components/home-news-feed";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <div className="flex w-full flex-col gap-6 px-0 pb-10 lg:flex-row lg:items-start lg:gap-8 lg:pb-14">
        <aside className="order-2 w-full shrink-0 lg:sticky lg:top-[4.75rem] lg:order-1 lg:w-72 lg:self-start">
          <HomeNewsFeed />
        </aside>
        <div className="order-1 min-w-0 flex-1 lg:order-2">
          <main id="main-content">
            <Suspense fallback={<HomeMarketsFallback />}>
              <MarketsDataShell />
            </Suspense>
          </main>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
