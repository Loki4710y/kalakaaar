import { Suspense } from "react";
import type { Metadata } from "next";
import { EmailVerified } from "@/src/views/EmailVerified";

export const metadata: Metadata = {
  title: "Email Verified | Kalakaar",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-8">
          <p className="font-serif text-lg text-[#2C1810]">Loading...</p>
        </div>
      }
    >
      <EmailVerified />
    </Suspense>
  );
}
