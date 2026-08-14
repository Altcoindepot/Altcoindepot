"use client";

import { RiskDisclaimerModal } from "@/components/risk-disclaimer-modal";

export function JustLaunchedDisclaimerModal() {
  return (
    <RiskDisclaimerModal
      storageKey="just-launched-disclaimer-accepted"
      badge="Extremely high risk"
      title="Just launched pairs"
    >
      <p>
        Pairs on this page may be minutes old. Many new DEX tokens are scams or rugs, and
        liquidity can disappear without warning.
      </p>
      <p>
        This list is for information only and is not financial advice. Data is sourced from
        public DEX feeds (including DexScreener) and may be delayed or incomplete.
      </p>
      <p>You are solely responsible for any decisions you make. Always do your own research.</p>
    </RiskDisclaimerModal>
  );
}
