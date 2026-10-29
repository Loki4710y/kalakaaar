"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MailCheck, MailWarning } from "lucide-react";
import { MadhubaniPattern } from "../components/patterns/MadhubaniPattern";

/**
 * Landing page after the user clicks the verification link in their email.
 * - Success:  /auth/verified
 * - Failure:  /auth/verified?status=error   (or an error in the URL hash,
 *             which is how expired/invalid email links are reported)
 */
export function EmailVerified() {
  const searchParams = useSearchParams();
  const [hashError, setHashError] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace(/^#/, "");
    if (hash && new URLSearchParams(hash).has("error")) {
      setHashError(true);
    }
  }, []);

  const isError =
    hashError || searchParams.get("status") === "error" || searchParams.has("error");

  return (
    <main className="relative min-h-[calc(100vh-80px)] flex items-center justify-center p-6 bg-[#FDFBF7] overflow-hidden">
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none mix-blend-multiply flex items-center justify-center">
        <MadhubaniPattern stroke="#6B1E2E" />
      </div>

      <div className="relative z-10 w-full max-w-[480px] bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] shadow-2xl p-8 sm:p-12 text-center animate-in fade-in duration-500">
        <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-[#6B1E2E]/40"></div>
        <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-[#6B1E2E]/40"></div>
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-[#6B1E2E]/40"></div>
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-[#6B1E2E]/40"></div>

        <div className="mx-auto w-16 h-16 rounded-full bg-[rgba(107,30,46,0.08)] flex items-center justify-center text-[#6B1E2E] mb-6 border border-[rgba(107,30,46,0.15)]">
          {isError ? <MailWarning size={32} /> : <MailCheck size={32} />}
        </div>

        {isError ? (
          <div>
            <h1 className="font-serif text-[2.2rem] text-[#2C1810] leading-tight mb-3">
              Link Expired
            </h1>
            <p className="font-sans text-[0.95rem] text-[#7A5C4E] mb-8 leading-relaxed">
              This verification link is invalid or has expired. Please sign in to request a new one.
            </p>
            <Link
              href="/auth?mode=signin"
              className="w-full text-center py-3.5 bg-[#6B1E2E] text-white font-sans text-[0.8rem] uppercase tracking-[0.1em] font-semibold hover:bg-[#8A2B3E] transition-colors flex items-center justify-center gap-2"
            >
              Go to Sign In →
            </Link>
          </div>
        ) : (
          <div>
            <h1 className="font-serif text-[2.2rem] text-[#2C1810] leading-tight mb-3">
              Email Verified
            </h1>
            <p className="font-sans text-[0.95rem] text-[#7A5C4E] mb-8 leading-relaxed">
              Your email has been successfully verified. Welcome to Kalakaar, you can now continue to the platform.
            </p>
            <div className="space-y-3">
              <Link
                href="/auth?mode=signin"
                className="w-full text-center py-3.5 bg-[#6B1E2E] text-white font-sans text-[0.8rem] uppercase tracking-[0.1em] font-semibold hover:bg-[#8A2B3E] transition-colors flex items-center justify-center gap-2"
              >
                Sign In →
              </Link>
              <Link
                href="/"
                className="font-sans text-[0.85rem] text-[#7A5C4E] hover:text-[#6B1E2E] transition-colors flex items-center justify-center gap-2 pt-2"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
