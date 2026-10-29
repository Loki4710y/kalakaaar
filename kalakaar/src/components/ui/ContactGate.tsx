import React from "react";
import Link from "next/link";

interface ContactGateProps {
  hasContact: boolean;
  loggedIn: boolean;
  redirectPath: string;
  className?: string;
}

/** Explains why there is no contact button: visitor is logged out, or the artist shared nothing. */
export function ContactGate({ hasContact, loggedIn, redirectPath, className = "" }: ContactGateProps) {
  if (hasContact) return null;

  if (!loggedIn) {
    return (
      <Link
        href={`/auth?mode=signin&redirect=${encodeURIComponent(redirectPath)}`}
        className={`w-full flex items-center justify-center gap-2 border border-[#6B1E2E] text-[#6B1E2E] hover:bg-[#6B1E2E] hover:text-[#FFFDF7] py-3.5 text-sm font-semibold transition-colors ${className}`}
      >
        Log in to contact this artist
      </Link>
    );
  }

  return (
    <p className={`font-sans text-[0.85rem] text-[#9C7A6A] text-center ${className}`}>
      This artist hasn&apos;t shared a contact method yet.
    </p>
  );
}
