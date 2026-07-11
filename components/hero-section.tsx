export function HeroSection() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden border-b border-[#f4ddc3]/15 bg-[#0e1118]/70 px-4 py-16 sm:px-6 sm:py-24"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.22]"
        aria-hidden
        style={{
          backgroundImage: `linear-gradient(rgba(240,206,171,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(185,129,82,0.05) 1px, transparent 1px)`,
          backgroundSize: "54px 54px",
        }}
      />
      <div
        className="pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full bg-[#c7925d]/20 blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 left-1/4 h-64 w-64 rounded-full bg-[#9f6f49]/16 blur-[90px]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl rounded-2xl px-4 py-8 glass-panel sm:px-8">
        <h1
          id="hero-heading"
          className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl md:text-5xl"
        >
          Your One-Stop{" "}
          <span className="text-brand-altcoindepot">Altcoin Depot</span>
        </h1>
        <p className="mt-4 text-lg text-zinc-400 sm:text-xl">
          Discover, track, and buy the best altcoins in 2026
        </p>
      </div>
    </section>
  );
}
