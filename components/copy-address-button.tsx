"use client";

import { useState } from "react";
import { showToast } from "@/components/toast-host";

export function truncateAddress(address: string): string {
  const value = address.trim();
  if (value.length <= 12) return value;
  if (value.startsWith("0x") && value.length >= 10) {
    return `${value.slice(0, 6)}…${value.slice(-4)}`;
  }
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12.5 9.5 17 19 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CopyAddressButton({
  address,
  className = "",
}: {
  address: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const truncated = truncateAddress(address);

  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      showToast("Address copied");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      showToast("Couldn’t copy address");
    }
  }

  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`.trim()}>
      <span className="font-mono text-[11px] tabular-nums text-zinc-400" title={address}>
        {truncated}
      </span>
      <button
        type="button"
        onClick={() => void copy()}
        aria-label={copied ? "Address copied" : `Copy contract address ${truncated}`}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400 md:size-8"
      >
        {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
      </button>
    </span>
  );
}
