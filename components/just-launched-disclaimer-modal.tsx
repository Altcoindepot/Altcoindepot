"use client";

import { RiskDisclaimerModal } from "@/components/risk-disclaimer-modal";
import {
  DATA_RESPONSIBILITY_DISCLAIMER,
  LEGACY_JUST_LAUNCHED_DISCLAIMER_KEY,
  SHARED_DEX_RISK_DISCLAIMER_KEY,
} from "@/lib/data-responsibility";

export function JustLaunchedDisclaimerModal() {
  return (
    <RiskDisclaimerModal
      storageKey={SHARED_DEX_RISK_DISCLAIMER_KEY}
      legacyKeys={[LEGACY_JUST_LAUNCHED_DISCLAIMER_KEY]}
      badge="Extremely high risk"
      title="Just launched pairs"
    >
      <p>
        Pairs on this page may be minutes old. Many new DEX tokens are scams or rugs, and
        liquidity can disappear without warning.
      </p>
      <p>{DATA_RESPONSIBILITY_DISCLAIMER}</p>
      <p>You are solely responsible for any decisions you make. Always do your own research.</p>
    </RiskDisclaimerModal>
  );
}
