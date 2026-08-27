import Link from "next/link";
import { DATA_RESPONSIBILITY_DISCLAIMER } from "@/lib/data-responsibility";

/**
 * Persistent, always-visible risk copy for high-risk DEX desks.
 * Not gated by localStorage — modals may still exist separately.
 */
export function DexRiskFootnote({ className = "" }: { className?: string }) {
  return (
    <aside
      role="note"
      className={`rounded-xl border border-amber-400/25 bg-amber-500/[0.08] px-3.5 py-3 text-[11px] leading-relaxed text-amber-100/90 sm:px-4 sm:text-xs ${className}`.trim()}
    >
      <p>{DATA_RESPONSIBILITY_DISCLAIMER}</p>
      <p className="mt-1.5">
        <Link href="/disclaimer" className="font-semibold text-amber-50 underline-offset-2 hover:underline">
          Full disclaimer →
        </Link>
      </p>
    </aside>
  );
}
