import React from "react";
import { Metadata } from "next";
import { LegalPage } from "@/src/components/legal/LegalPage";
import { CONTACT_EMAIL, LEGAL } from "@/src/config/features";

export const metadata: Metadata = {
  title: { absolute: "Terms of Use | Kalakaar" },
  alternates: { canonical: "/terms" },
  description: "The rules for using Kalakaar as an artist or art lover.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" updated="October 2026">
      <p>These terms apply to your use of Kalakaar, operated by {LEGAL.operatorName}. By creating an account or using Kalakaar, you agree to these terms and to our <a href="/privacy">Privacy Policy</a>.</p>

      <h2>What Kalakaar is</h2>
      <p>Kalakaar is a showcase where artists present their work and art lovers discover it. Kalakaar is not a seller, agent or payment processor. Any enquiry, price discussion, payment, delivery or dispute is solely between the buyer and the artist.</p>

      <h2>Your account</h2>
      <ul>
        <li>Provide accurate information and keep your login secure.</li>
        <li>You are responsible for activity under your account.</li>
        <li>We may suspend accounts that break these terms or harm others.</li>
      </ul>

      <h2>Content you post</h2>
      <ul>
        <li>You must own, or have the right to share, everything you upload.</li>
        <li>You keep ownership of your work. You give Kalakaar permission to display it on the platform so the service can work.</li>
        <li>Do not post content that is illegal, hateful, misleading, adult, or infringes someone else&apos;s rights.</li>
        <li>Artworks must be described honestly, including medium, size and whether they are original or prints.</li>
      </ul>

      <h2>Contacting artists</h2>
      <p>Contact details are shared by artists for genuine art enquiries only. Do not use them for spam, harassment or marketing.</p>

      <h2>Dealing safely</h2>
      <p>Kalakaar does not verify every artwork or transaction. Take reasonable care before paying anyone, and prefer secure, traceable payment methods.</p>

      <h2>Intellectual property and takedown</h2>
      <p>If you believe content on Kalakaar infringes your copyright or other rights, email us with the link, proof of ownership and your contact details. We will review it and may remove the content. Repeat infringers may lose their accounts.</p>

      <h2>Removal of content and reporting</h2>
      <p>We may remove content or accounts that violate these terms, with or without notice. You can report content using the Report option on the site or by emailing us.</p>

      <h2>Ending your account</h2>
      <p>You may stop using Kalakaar and ask us to delete your account at any time. We may suspend or end access if you break these terms.</p>

      <h2>No guarantees</h2>
      <p>The service is provided &ldquo;as is&rdquo;. We try to keep it available and accurate but cannot promise it will always be error-free. To the extent permitted by law, Kalakaar is not liable for losses arising from dealings between users, or for indirect or consequential losses. Nothing in these terms limits rights you have under Indian consumer law that cannot be excluded.</p>

      <h2>Changes and governing law</h2>
      <p>We may update these terms and will change the date above. Continued use after a change means you accept the updated terms. These terms are governed by the laws of India, and the courts of {LEGAL.jurisdiction} have jurisdiction, subject to any rights you have by law.</p>

      <h2>Contact and grievances</h2>
      <p>{LEGAL.grievanceOfficer}, {LEGAL.operatorName}: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We aim to acknowledge complaints within 48 hours and resolve them within 15 days.</p>
    </LegalPage>
  );
}
