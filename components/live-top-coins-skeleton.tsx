export function LiveTopCoinsSkeleton() {
  return (
    <div className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-3 [scrollbar-width:thin] sm:mx-0 sm:gap-5 lg:grid lg:snap-none lg:grid-cols-5 lg:overflow-visible lg:px-0 lg:pb-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="w-[min(85vw,21rem)] shrink-0 snap-start rounded-xl border border-white/8 bg-[#111111]/80 p-6 lg:w-auto lg:shrink lg:p-7"
        >
          <div className="h-3 w-10 rounded bg-zinc-800/35" />
          <div className="mt-3 flex items-center gap-3">
            <div className="size-10 rounded-full bg-zinc-800/40" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 rounded-md bg-zinc-800/35" />
              <div className="h-3 w-12 rounded-md bg-zinc-800/25" />
            </div>
          </div>
          <div className="mt-5 flex items-end justify-between">
            <div className="h-7 w-28 rounded-md bg-zinc-800/40" />
            <div className="h-8 w-16 rounded-md bg-zinc-800/30" />
          </div>
          <div className="mt-4 h-16 w-full rounded-md bg-zinc-800/25" />
        </div>
      ))}
    </div>
  );
}
