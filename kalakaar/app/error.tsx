"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home, WifiOff } from "lucide-react";
import Link from "next/link";
import { reportError, MONITORING_ENABLED } from "@/src/lib/monitoring";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { source: "app/error.tsx", digest: error.digest });
  }, [error]);

  const isNetworkError =
    error.message?.toLowerCase().includes("fetch") ||
    error.message?.toLowerCase().includes("network") ||
    (typeof navigator !== "undefined" && !navigator.onLine);

  return (
    <div className="min-h-[85vh] bg-[#F5EFE0] flex flex-col items-center justify-center p-4 sm:p-8 font-sans selection:bg-[#6B1E2E] selection:text-white">
      <div className="max-w-xl w-full bg-[#FFFDF7] border-2 border-[#6B1E2E] p-8 sm:p-10 shadow-2xl relative text-center">
        {/* Motif Corners */}
        <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-[#6B1E2E]" />
        <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-[#6B1E2E]" />
        <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-[#6B1E2E]" />
        <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-[#6B1E2E]" />

        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-[#6B1E2E] mb-4 shadow-inner">
          {isNetworkError ? <WifiOff size={28} /> : <AlertTriangle size={28} />}
        </div>

        <span className="font-sans text-xs font-bold uppercase tracking-widest text-[#6B1E2E] block mb-1">
          {isNetworkError ? "Connection Interrupted" : "Exhibition Display Exception"}
        </span>

        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2C1810] mb-3">
          {isNetworkError
            ? "Unable to Reach Kalakaar Servers"
            : "Something Went Unexpectedly Wrong"}
        </h1>

        <p className="font-sans text-xs sm:text-sm text-[#7A5C4E] mb-6 leading-relaxed max-w-md mx-auto">
          {isNetworkError
            ? "Please check your internet connection or network signal, then click retry to restore live artwork sync."
            : (MONITORING_ENABLED ? "We have been notified. " : "") + "You can retry loading this view or return to the main gallery."}
        </p>

        {error.digest && (
          <p className="font-mono text-[0.68rem] bg-[#F5EFE0] text-[#7A5C4E] px-3 py-1.5 rounded-xs border border-[rgba(107,30,46,0.15)] mb-6 inline-block">
            Error Ref: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-[rgba(107,30,46,0.15)]">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-6 py-3 bg-[#6B1E2E] hover:bg-[#802437] text-white font-sans text-xs uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6B1E2E]"
          >
            <RefreshCw size={16} /> Retry View
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 bg-[#EDE4CE] hover:bg-[#2C1810] hover:text-white text-[#2C1810] font-sans text-xs uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <Home size={16} /> Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
