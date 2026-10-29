import React from "react";

/** Soft cream blocks that stand in for content while a page loads. Same colours as the site. */
const block = "bg-[#EDE4CE] animate-pulse";

/** Heading + a grid of cards: Explore, Artists, Stories, Collections and most other pages. */
export function ListSkeleton({ cards = 8 }: { cards?: number }) {
  return (
    <main className="min-h-screen bg-[#F5EFE0] pt-28 pb-24 px-4 sm:px-6 lg:px-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="max-w-7xl mx-auto" aria-hidden="true">
        <div className={`h-10 w-64 mb-3 ${block}`} />
        <div className={`h-4 w-96 max-w-full mb-10 ${block}`} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: cards }).map((_, i) => (
            <div key={i} className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.1)] p-3">
              <div className={`aspect-[4/5] mb-4 ${block}`} />
              <div className={`h-5 w-3/4 mb-2 ${block}`} />
              <div className={`h-4 w-1/2 ${block}`} />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

/** Big picture on the left, details on the right: artwork and story pages. */
export function DetailSkeleton() {
  return (
    <main className="min-h-screen bg-[#F5EFE0] pt-28 pb-24 px-4 sm:px-6 lg:px-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12" aria-hidden="true">
        <div className="lg:col-span-7">
          <div className={`h-[420px] sm:h-[520px] ${block}`} />
        </div>
        <div className="lg:col-span-5 space-y-4">
          <div className={`h-10 w-3/4 ${block}`} />
          <div className={`h-5 w-1/2 ${block}`} />
          <div className={`h-24 w-full ${block}`} />
          <div className={`h-12 w-full ${block}`} />
          <div className={`h-12 w-full ${block}`} />
        </div>
      </div>
    </main>
  );
}
