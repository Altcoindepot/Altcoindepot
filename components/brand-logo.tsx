import Link from "next/link";

export function BrandLogo({
  variant = "lockup",
  className = "",
}: {
  variant?: "lockup" | "mark";
  className?: string;
}) {
  if (variant === "mark") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/logo-mark.svg" alt="" width={32} height={32} className={`h-8 w-8 ${className}`.trim()} />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo.svg" alt="" width={215} height={32} className={`h-8 w-auto ${className}`.trim()} />
  );
}

export function BrandHomeLink({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="AltCoin Depot home"
      className={`inline-flex min-h-11 items-center rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400 ${className}`.trim()}
    >
      <span className="sm:hidden">
        <BrandLogo variant="mark" />
      </span>
      <span className="hidden sm:inline-flex">
        <BrandLogo variant="lockup" />
      </span>
    </Link>
  );
}
