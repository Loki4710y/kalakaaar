"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Compass, Search, Home as HomeIcon, Palette, BookOpen, Layers } from "lucide-react";

export default function NotFound() {
  const [query, setQuery] = useState("");

  return (
    <div className="min-h-[85vh] bg-[#F5EFE0] flex flex-col items-center justify-center p-4 sm:p-8 font-sans selection:bg-[#6B1E2E] selection:text-white">
      <div className="max-w-2xl w-full bg-[#FFFDF7] border-2 border-[#6B1E2E] p-8 sm:p-12 shadow-2xl relative text-center overflow-hidden">
        {/* Corner Ornamental Motifs */}
        <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-[#6B1E2E]" />
        <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-[#6B1E2E]" />
        <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-[#6B1E2E]" />
        <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-[#6B1E2E]" />

        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#6B1E2E]/10 text-[#6B1E2E] mb-4">
          <Compass size={32} className="animate-spin-slow" />
        </div>

        <span className="font-sans text-xs font-bold uppercase tracking-widest text-[#DAA520] block mb-1">
          Error 404 • Path Uncharted
        </span>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#2C1810] mb-3">
          Artisan Lore Not Found
        </h1>

        <p className="font-sans text-sm text-[#7A5C4E] max-w-md mx-auto mb-6 leading-relaxed">
          The heritage painting, artisan profile, or folklore page you are looking for may have moved or is resting in our archival vaults.
        </p>

        {/* Search Bar */}
        <form
          action="/search"
          method="GET"
          className="max-w-md mx-auto mb-8 flex items-center bg-[#F5EFE0] border border-[rgba(107,30,46,0.25)] focus-within:border-[#6B1E2E] transition-colors shadow-xs"
        >
          <Search size={18} className="text-[#6B1E2E] ml-3 shrink-0" />
          <input
            type="text"
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Madhubani, Pattachitra, Warli..."
            className="w-full bg-transparent p-3 text-xs font-sans text-[#2C1810] focus:outline-none placeholder:text-[#7A5C4E]/60"
            aria-label="Search Kalakaar living heritage platform"
          />
          <button
            type="submit"
            className="bg-[#6B1E2E] text-white px-4 py-3 font-sans text-xs uppercase font-bold hover:bg-[#802437] transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        {/* Quick Links */}
        <div className="pt-6 border-t border-[rgba(107,30,46,0.15)]">
          <span className="font-sans text-xs font-bold uppercase text-[#2C1810] block mb-4">
            Explore Heritage Destinations:
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <Link
              href="/"
              className="p-3 bg-[#F5EFE0]/60 border border-[rgba(107,30,46,0.15)] hover:border-[#6B1E2E] hover:bg-[#F5EFE0] transition-all flex flex-col items-center text-center group"
            >
              <HomeIcon size={18} className="text-[#6B1E2E] mb-1 group-hover:scale-110 transition-transform" />
              <span className="font-serif text-xs font-bold text-[#2C1810]">Home</span>
            </Link>

            <Link
              href="/explore"
              className="p-3 bg-[#F5EFE0]/60 border border-[rgba(107,30,46,0.15)] hover:border-[#6B1E2E] hover:bg-[#F5EFE0] transition-all flex flex-col items-center text-center group"
            >
              <Palette size={18} className="text-[#6B1E2E] mb-1 group-hover:scale-110 transition-transform" />
              <span className="font-serif text-xs font-bold text-[#2C1810]">Gallery</span>
            </Link>

            <Link
              href="/artists"
              className="p-3 bg-[#F5EFE0]/60 border border-[rgba(107,30,46,0.15)] hover:border-[#6B1E2E] hover:bg-[#F5EFE0] transition-all flex flex-col items-center text-center group"
            >
              <Layers size={18} className="text-[#6B1E2E] mb-1 group-hover:scale-110 transition-transform" />
              <span className="font-serif text-xs font-bold text-[#2C1810]">Artisans</span>
            </Link>

            <Link
              href="/stories"
              className="p-3 bg-[#F5EFE0]/60 border border-[rgba(107,30,46,0.15)] hover:border-[#6B1E2E] hover:bg-[#F5EFE0] transition-all flex flex-col items-center text-center group"
            >
              <BookOpen size={18} className="text-[#6B1E2E] mb-1 group-hover:scale-110 transition-transform" />
              <span className="font-serif text-xs font-bold text-[#2C1810]">Folk Lore</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
