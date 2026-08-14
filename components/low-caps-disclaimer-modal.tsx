"use client";

import { RiskDisclaimerModal } from "@/components/risk-disclaimer-modal";

export const LOWCAPS_DISCLAIMER_STORAGE_KEY = "lowcaps-disclaimer-accepted";

export function LowCapsDisclaimerModal() {
  return (
    <RiskDisclaimerModal
      storageKey={LOWCAPS_DISCLAIMER_STORAGE_KEY}
      badge="High risk"
      title="High-risk tokens"
    >
      <p>New and low-cap DEX tokens are extremely volatile. Many are illiquid or fraudulent.</p>
      <p>
        This list is for information only and is not financial advice. Data is sourced from
        public DEX data (including DexScreener) and may be delayed or incomplete.
      </p>
      <p>Always do your own research. You are solely responsible for any decisions you make.</p>
    </RiskDisclaimerModal>
  );
}
