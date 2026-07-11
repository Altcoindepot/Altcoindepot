export function LiveTopCoinsSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="min-w-[200px] shrink-0 rounded-xl border border-white/10 bg-[#111111]/80 p-4 sm:min-w-0"
        >
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-zinc-800/40" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 rounded-md bg-zinc-800/35" />
              <div className="h-3 w-16 rounded-md bg-zinc-800/25" />
            </div>
          </div>
          <div className="mt-4 h-6 w-28 rounded-md bg-zinc-800/30" />
          <div className="mt-2 h-3 w-20 rounded-md bg-zinc-800/20" />
        </div>
      ))}
    </div>
  );
}
