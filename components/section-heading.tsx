/** Shared homepage section title with a subtle bronze accent bar. */
export function SectionHeading({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      id={id}
      className={`flex items-center gap-3 text-xl font-extrabold tracking-tight sm:text-2xl ${className}`}
    >
      <span
        className="hidden h-7 w-1 shrink-0 rounded-full bg-[#d1a173]/80 sm:block"
        aria-hidden
      />
      <span className="text-brand-altcoindepot">{children}</span>
    </h2>
  );
}
