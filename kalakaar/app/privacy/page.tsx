import React from "react";
import { Metadata } from "next";
import { LegalPage } from "@/src/components/legal/LegalPage";
import { CONTACT_EMAIL, LEGAL } from "@/src/config/features";

export const metadata: Metadata = {
  title: { absolute: "Privacy Policy | Kalakaar" },
  alternates: { canonical: "/privacy" },
  description: "How Kalakaar collects, uses and protects your information.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="October 2026">
      <p>Kalakaar connects Indian folk artists with art lovers. This policy explains what information we collect, why, and the choices you have.</p>

      <h2>Information we collect</h2>
      <ul>
        <li><b>Account details:</b> your name, email address and password (stored securely by our authentication provider; we never see your password).</li>
        <li><b>Profile details:</b> bio, city, profile photo and, for artists, the contact details you choose to share (WhatsApp number, Instagram handle, contact email).</li>
        <li><b>Content you post:</b> artworks, images, stories and collections.</li>
        <li><b>Activity:</b> likes, saved artworks and followed artists, which are private to you, plus basic view counts on content.</li>
        <li><b>Contact taps:</b> when you tap an artist&apos;s WhatsApp, Instagram or email button, we record that the tap happened (which artist and which channel, linked to your account) so artists can see how many people showed interest. We do not see or store the messages you send.</li>
        <li><b>Reports:</b> if you report content, we store your report and its reason.</li>
        <li><b>Technical data:</b> basic error and usage information (such as browser type and error details) to keep the site working. If enabled, we use privacy-friendly analytics and an error-monitoring service for this.</li>
      </ul>

      <h2>How artist contact details are shown</h2>
      <p>Artists decide which contact channels (WhatsApp, Instagram, email) to show. These are visible only to people who are logged in to Kalakaar. Any conversation or purchase happens directly between you and the artist on those channels, outside Kalakaar.</p>

      <h2>How we use your information</h2>
      <ul>
        <li>To run your account and show your public profile and content.</li>
        <li>To send essential emails such as email verification and password reset.</li>
        <li>To keep the platform safe and fix problems.</li>
      </ul>
      <p>We do not sell your personal information.</p>

      <h2>Who processes your data</h2>
      <p>We use Supabase to provide sign-in, database and file storage, and our hosting provider to serve the website. They process data only to provide these services.</p>

      <h2>Cookies and local storage</h2>
      <p>We use cookies to keep you signed in and your browser&apos;s local storage for small conveniences, such as avoiding counting repeat views. We do not use advertising cookies.</p>

      <h2>Your consent and legal basis</h2>
      <p>We process your personal data with your consent, which you give when you create an account and accept this policy, and for limited legitimate uses such as keeping the platform secure. You can withdraw consent at any time by deleting your account, which does not affect earlier lawful processing.</p>

      <h2>Your rights</h2>
      <p>Under Indian law, including the Digital Personal Data Protection Act, 2023, you may:</p>
      <ul>
        <li>Ask what personal data we hold about you and how it is used.</li>
        <li>Correct or update your data (most of it you can edit yourself in your profile).</li>
        <li>Ask us to erase your data and delete your account.</li>
        <li>Raise a grievance with us, and, if unresolved, complain to the Data Protection Board of India.</li>
      </ul>
      <p>Email us from your registered address and we will respond within a reasonable time, and in any case within the period required by law.</p>

      <h2>Where your data is stored</h2>
      <p>Our service providers may store and process data on servers outside India. We choose providers that protect data with appropriate safeguards.</p>

      <h2>Your choices</h2>
      <ul>
        <li>You can edit your profile and delete your artworks, stories and collections at any time.</li>
        <li>You can ask us to delete your account and associated data by emailing us.</li>
        <li>You can choose which contact channels to show on your artist profile.</li>
      </ul>

      <h2>Retention and security</h2>
      <p>We keep your data while your account is active and delete or anonymise it within a reasonable period after you ask us to delete your account, unless the law requires us to keep it. If a data breach affects you, we will notify you and the authorities as the law requires. We protect it with access controls, encrypted connections and limits on who can read or change it. No online service is perfectly secure, so please use a strong, unique password.</p>

      <h2>Changes</h2>
      <p>We may update this policy and will change the date above when we do.</p>

      <h2>Contact and grievance officer</h2>
      <p>{LEGAL.grievanceOfficer}, {LEGAL.operatorName}. Questions, requests or complaints: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
    </LegalPage>
  );
}
