import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { MarketsDataShell } from "@/components/markets-data-shell";
import { HomeMarketsFallback } from "@/components/home-markets-fallback";
import { HomeNewsFeed } from "@/components/home-news-feed";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <div className="flex w-full flex-col gap-8 px-0 pb-12 lg:flex-row lg:items-start lg:gap-10 lg:pb-16">
        <aside className="order-2 w-full shrink-0 px-4 lg:sticky lg:top-[4.75rem] lg:order-1 lg:w-80 lg:self-start lg:px-0 lg:pl-6">
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
    </>
  );
}
