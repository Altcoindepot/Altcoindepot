import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact AltCoin Depot on X or via email.",
};

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Contact</h1>
        <p className="mt-5 text-sm leading-relaxed text-zinc-400 sm:text-base">
          Feedback, partnerships, or data issues — the fastest way to reach us is on X.
        </p>
        <ul className="mt-6 space-y-3 text-sm sm:text-base">
          <li>
            <a
              href="https://x.com/altcoindepot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center font-medium text-[#d7ad82] underline-offset-2 hover:underline"
            >
              @altcoindepot on X
            </a>
          </li>
          <li>
            <a
              href="mailto:hello@altcoindepot.com"
              className="inline-flex min-h-11 items-center font-medium text-[#d7ad82] underline-offset-2 hover:underline"
            >
              hello@altcoindepot.com
            </a>
          </li>
        </ul>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-11 items-center text-sm text-zinc-400 underline-offset-2 hover:underline"
        >
          ← Home
        </Link>
      </main>
    </>
  );
}
