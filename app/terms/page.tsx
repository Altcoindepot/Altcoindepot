import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout, LegalSection } from "@/components/legal-page-layout";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "AltCoin Depot terms of service — educational use only, display interface for public market metrics, user assumes market risk.",
};

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      description="Standard terms governing use of AltCoin Depot as an informational market data display."
    >
      <LegalSection title="Acceptance and educational use">
        <p>
          By accessing AltCoin Depot, you agree to use our data models strictly for educational and
          informational purposes. If you do not agree to these Terms of Service, discontinue use of
          the site.
        </p>
      </LegalSection>

      <LegalSection title="Display interface only">
        <p>
          The site operates entirely as a display interface for public market metrics. We do not
          execute trades, manage funds, or offer personalized asset advice. Nothing on AltCoin Depot
          constitutes investment, financial, legal, or tax advice.
        </p>
      </LegalSection>

      <LegalSection title="Cached and delayed third-party indexes">
        <p>
          We reserve the right to cache, filter, and display third-party analytical indexes on a
          delayed schedule. Users assume all market risks associated with their trading executions.
          Past performance of any displayed metric or narrative model does not guarantee future
          results.
        </p>
      </LegalSection>

      <LegalSection title="Limitation of liability">
        <p>
          To the fullest extent permitted by law, AltCoin Depot and its operators shall not be
          liable for trading losses, deficits, or other damages arising from reliance on displayed
          data, models, or content. See our{" "}
          <Link href="/disclaimer" className="text-[#d7ad82] underline-offset-2 hover:underline">
            disclaimer
          </Link>{" "}
          for additional risk disclosures.
        </p>
      </LegalSection>

      <LegalSection title="Changes and contact">
        <p>
          We may update these Terms by posting a revised version on this page. Continued use after
          changes constitutes acceptance. Questions may be sent via our{" "}
          <Link href="/contact" className="text-[#d7ad82] underline-offset-2 hover:underline">
            contact page
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
