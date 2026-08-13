import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout, LegalSection } from "@/components/legal-page-layout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "AltCoin Depot privacy policy — decentralized frontend, no account data, watchlists stored in localStorage only.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      description="How AltCoin Depot handles privacy as a decentralized frontend media publisher."
    >
      <LegalSection title="Decentralized frontend application">
        <p>
          AltCoin Depot operates as a fully decentralized frontend application. We do not require
          account registrations, user logins, or passwords.
        </p>
      </LegalSection>

      <LegalSection title="No personal or payment data collection">
        <p>
          We collect zero personal data, email addresses, or financial payment coordinates. We do
          not process credit cards, debit cards, or other payment instruments, and we do not
          maintain a hosted user profile or billing account for general site access.
        </p>
      </LegalSection>

      <LegalSection title="Local browser storage">
        <p>
          All personalized configurations, favorites, and watchlists are stored exclusively inside
          your local browser storage (localStorage). Clearing your browser data will reset these
          preferences. This information remains on your device and is not uploaded to AltCoin Depot
          as a cloud account profile.
        </p>
      </LegalSection>

      <LegalSection title="Third-party market data">
        <p>
          When you browse the site, your browser may request public market metrics through our
          application from third-party providers. Those providers may process standard technical
          request metadata under their own privacy policies.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about this Privacy Policy may be directed through our{" "}
          <Link href="/contact" className="text-[#d7ad82] underline-offset-2 hover:underline">
            contact page
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
