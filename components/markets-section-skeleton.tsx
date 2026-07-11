import { LiveTopCoinsSkeleton } from "@/components/live-top-coins-skeleton";

export function MarketsSectionSkeleton() {
  return (
    <>
      <section className="border-b border-white/10 bg-[#0a0a0a] px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="h-7 w-48 rounded-md bg-zinc-800/40" />
          <div className="mt-2 h-3.5 w-64 rounded-md bg-zinc-800/25" />
          <div className="mt-8">
            <LiveTopCoinsSkeleton />
          </div>
        </div>
      </section>
      <section className="bg-[#111111] px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="h-7 w-40 rounded-md bg-zinc-800/40" />
          <div className="mt-2 h-3.5 w-72 rounded-md bg-zinc-800/25" />
          <div className="mt-8 overflow-hidden rounded-xl border border-white/10">
            <div className="divide-y divide-white/[0.04]">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 sm:gap-4 sm:px-4 sm:py-3.5">
                  <div className="size-7 shrink-0 rounded-full bg-zinc-800/35 sm:size-8" />
                  <div className="flex flex-1 flex-wrap items-center gap-3 sm:gap-4">
                    <div className="h-3.5 w-28 rounded-md bg-zinc-800/30" />
                    <div className="h-3.5 w-20 rounded-md bg-zinc-800/20" />
                    <div className="h-3.5 w-16 rounded-md bg-zinc-800/15" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
