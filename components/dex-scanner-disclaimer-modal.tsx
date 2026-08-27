"use client";

import { RiskDisclaimerModal } from "@/components/risk-disclaimer-modal";
import {
  DATA_RESPONSIBILITY_DISCLAIMER,
  SHARED_DEX_RISK_DISCLAIMER_KEY,
} from "@/lib/data-responsibility";

export function DexScannerDisclaimerModal() {
  return (
    <RiskDisclaimerModal
      storageKey={SHARED_DEX_RISK_DISCLAIMER_KEY}
      badge="High risk"
      title="DEX Scanner risk"
    >
      <p>
        Advanced filters can surface illiquid, newly created, or fraudulent pairs. Low thresholds
        increase that risk.
      </p>
      <p>{DATA_RESPONSIBILITY_DISCLAIMER}</p>
      <p>You are solely responsible for any decisions you make.</p>
    </RiskDisclaimerModal>
  );
}
