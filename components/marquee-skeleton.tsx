export function MarqueeSkeleton() {
  return (
    <div
      className="border-b border-white/10 bg-[#0d0d0d] py-3"
      aria-hidden
    >
      <div className="flex gap-8 overflow-hidden px-4 opacity-60">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex shrink-0 items-center gap-2"
          >
            <div className="size-5 rounded-full bg-zinc-800/35" />
            <div className="h-3 w-10 rounded-md bg-zinc-800/25" />
            <div className="h-3 w-16 rounded-md bg-zinc-800/20" />
          </div>
        ))}
      </div>
    </div>
  );
}
