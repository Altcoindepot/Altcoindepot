"use client";

import { RiskDisclaimerModal } from "@/components/risk-disclaimer-modal";
import {
  DATA_RESPONSIBILITY_DISCLAIMER,
  LEGACY_LOWCAPS_DISCLAIMER_KEY,
  SHARED_DEX_RISK_DISCLAIMER_KEY,
} from "@/lib/data-responsibility";

export const LOWCAPS_DISCLAIMER_STORAGE_KEY = LEGACY_LOWCAPS_DISCLAIMER_KEY;

export function LowCapsDisclaimerModal() {
  return (
    <RiskDisclaimerModal
      storageKey={SHARED_DEX_RISK_DISCLAIMER_KEY}
      legacyKeys={[LEGACY_LOWCAPS_DISCLAIMER_KEY]}
      badge="High risk"
      title="High-risk tokens"
    >
      <p>New and low-cap DEX tokens are extremely volatile. Many are illiquid or fraudulent.</p>
      <p>{DATA_RESPONSIBILITY_DISCLAIMER}</p>
      <p>Always do your own research. You are solely responsible for any decisions you make.</p>
    </RiskDisclaimerModal>
  );
}
