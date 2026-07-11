import { SiteHeader } from "@/components/site-header";

export default function CoinLoading() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-[60vh] border-t border-white/5 bg-[#0a0a0a] px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="h-4 w-32 rounded-md bg-zinc-800/40" />
          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="size-24 shrink-0 rounded-2xl bg-zinc-800/35 sm:size-28" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-24 rounded-md bg-zinc-800/30" />
              <div className="h-10 max-w-md rounded-md bg-zinc-800/40" />
              <div className="h-5 w-20 rounded-md bg-zinc-800/25" />
              <div className="flex gap-3 pt-2">
                <div className="h-10 w-36 rounded-lg bg-zinc-800/35" />
                <div className="h-10 w-28 rounded-lg bg-zinc-800/25" />
              </div>
            </div>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/10 bg-[#111111]/80 px-4 py-3"
              >
                <div className="h-3 w-20 rounded bg-zinc-800/40" />
                <div className="mt-2 h-5 w-28 rounded bg-zinc-800/30" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
