"use client";

import React, { useEffect } from "react";
import { reportError } from "@/src/lib/monitoring";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { source: "global-error", digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[#F5EFE0] font-sans antialiased min-h-screen flex items-center justify-center p-6 text-[#2C1810]">
        <div className="max-w-md w-full bg-[#FFFDF7] border-2 border-[#6B1E2E] p-8 shadow-2xl text-center">
          <h1 className="font-serif text-2xl font-bold text-[#6B1E2E] mb-2">
            System Error
          </h1>
          <p className="font-sans text-xs text-[#7A5C4E] mb-6">
            An unexpected error occurred in the Kalakaar core runtime environment.
          </p>
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-[#6B1E2E] text-white font-sans text-xs uppercase tracking-wider font-bold hover:bg-[#802437] transition-colors"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
