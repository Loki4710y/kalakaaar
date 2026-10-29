"use client";
import React from "react";
import Link from "next/link";
import { MadhubaniPattern } from "../patterns/MadhubaniPattern";
import { ShieldAlert, ArrowLeft, Sparkles, Home } from "lucide-react";

interface AccessDeniedProps {
  title?: string;
  message?: string;
  requiredRole?: string;
}

export function AccessDenied({
  title = "Access Restricted",
  message = "You do not have permission to access this area. The Artist Portal and Studio tools are reserved for registered artists and administrators.",
  requiredRole = "Artist or Admin"
}: AccessDeniedProps) {
  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center p-6 bg-[#FDFBF7] overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none mix-blend-multiply flex items-center justify-center">
        <MadhubaniPattern stroke="#6B1E2E" />
      </div>

      <div className="relative z-10 w-full max-w-[520px] bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] shadow-2xl p-8 sm:p-12 text-center animate-in fade-in duration-500">
        {/* Corner Brackets */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-[#6B1E2E]/40"></div>
        <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-[#6B1E2E]/40"></div>
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-[#6B1E2E]/40"></div>
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-[#6B1E2E]/40"></div>

        <div className="mx-auto w-16 h-16 rounded-full bg-[rgba(107,30,46,0.08)] flex items-center justify-center text-[#6B1E2E] mb-6 border border-[rgba(107,30,46,0.15)]">
          <ShieldAlert size={32} />
        </div>

        <p className="font-sans text-[0.7rem] uppercase tracking-[0.2em] text-[#9C7A6A] mb-2 font-medium">
          — REQUIRES {requiredRole.toUpperCase()} ROLE —
        </p>

        <h1 className="font-serif text-[2.2rem] text-[#2C1810] leading-tight mb-4">
          {title}
        </h1>

        <p className="font-sans text-[0.95rem] text-[#7A5C4E] max-w-[380px] mx-auto leading-relaxed mb-8">
          {message}
        </p>

        <div className="w-full h-px border-t border-[rgba(107,30,46,0.18)] mb-8"></div>

        <div className="flex flex-col gap-3">
          {requiredRole.toLowerCase().includes("artist") && (
            <Link
              href="/welcome/setup"
              className="w-full text-center py-3.5 bg-[#6B1E2E] text-white font-sans text-[0.8rem] uppercase tracking-[0.1em] font-semibold hover:bg-[#8A2B3E] transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles size={16} /> Upgrade to Artist Profile
            </Link>
          )}
          <Link
            href="/explore"
            className="w-full text-center py-3.5 border border-[rgba(107,30,46,0.3)] text-[#2C1810] font-sans text-[0.8rem] uppercase tracking-[0.1em] font-semibold hover:bg-[#EDE4CE]/50 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} /> Return to Explore
          </Link>
        </div>

        <Link href="/" className="inline-flex items-center gap-2 mt-8 font-sans text-[0.85rem] text-[#7A5C4E] hover:text-[#6B1E2E] transition-colors hover:underline underline-offset-4 decoration-[rgba(107,30,46,0.5)]">
          <Home size={14} /> Back to Home
        </Link>
      </div>
    </div>
  );
}
