import React from "react";
import { Metadata } from "next";
import { JsonLd } from "@/src/components/seo/JsonLd";

export const metadata: Metadata = {
  title: { absolute: "About Kalakaar: A Home for Indian Folk Artists" },
  description: "Kalakaar helps traditional Indian folk artists showcase original paintings and connect directly with art lovers, with no middlemen and no platform fees.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Kalakaar: A Home for Indian Folk Artists",
    description: "Kalakaar helps traditional Indian folk artists showcase original paintings and connect directly with art lovers, with no middlemen and no platform fees.",
    url: "/about",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <JsonLd type="Organization" />
      <main className="pt-24 pb-32 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <h1 className="font-serif text-3xl sm:text-4xl text-[#2C1810] mb-8 pb-6 border-b border-[rgba(107,30,46,0.18)] font-bold">
          About Kalakaar
        </h1>

        <div className="prose prose-lg prose-p:text-[#7A5C4E] prose-headings:text-[#2C1810] prose-headings:font-serif max-w-none">
          <p className="font-sans text-base sm:text-lg leading-relaxed mb-8 text-[#2C1810] font-medium">
            Kalakaar is India&apos;s Living Heritage Platform dedicated to Indian folk artisans, providing a direct bridge to showcase genuine handcrafted paintings and connect transparently with art patrons—with zero middlemen fees.
          </p>

          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2C1810] mt-12 mb-4">Empowering Traditional Artisans</h2>
          <p className="font-sans text-sm sm:text-base leading-relaxed mb-4 text-[#7A5C4E]">
            We believe traditional painters should retain 100% of their earnings. Kalakaar enables folk artists to build digital portfolios, list original artworks, and receive commission inquiries directly. No platform fees, no hidden markups.
          </p>

          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2C1810] mt-12 mb-4">For Patrons & Collectors</h2>
          <p className="font-sans text-sm sm:text-base leading-relaxed mb-4 text-[#7A5C4E]">
            Discover authentic, handmade paintings from independent creators. Connect with artisans directly to discuss provenance, inquire about custom folk commissions, and preserve India&apos;s rich cultural heritage.
          </p>
        </div>
      </main>
    </div>
  );
}
