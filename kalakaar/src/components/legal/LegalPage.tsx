import React from "react";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#FDFBF7] pt-24 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-serif text-3xl sm:text-4xl text-[#2C1810] mb-2 font-bold">{title}</h1>
        <p className="font-sans text-xs uppercase tracking-wider text-[#9C7A6A] mb-8 pb-6 border-b border-[rgba(107,30,46,0.18)]">
          Last updated: {updated}
        </p>
        <div className="font-sans text-[0.95rem] leading-relaxed text-[#7A5C4E] space-y-4 [&_h2]:font-serif [&_h2]:text-xl [&_h2]:text-[#2C1810] [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_a]:text-[#6B1E2E] [&_a]:underline">
          {children}
        </div>
      </div>
    </main>
  );
}
