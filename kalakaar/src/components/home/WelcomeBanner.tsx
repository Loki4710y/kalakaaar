"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { QuoteService, HeritageQuote } from '../../services/QuoteService';

export function WelcomeBanner() {
  const { user } = useAuth();
  const [quote, setQuote] = useState<HeritageQuote | null>(null);

  useEffect(() => {
    // Select a random quote on component mount / page refresh
    const selectedQuote = QuoteService.getRandomQuote();
    setQuote(selectedQuote);
  }, []);

  // Extract first name dynamically
  const getFirstName = () => {
    if (!user) return '';
    if (user.name) {
      const parts = user.name.trim().split(' ');
      if (parts[0]) return parts[0];
    }
    if (user.email) {
      const emailPrefix = user.email.split('@')[0];
      return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    }
    return 'Collector';
  };

  const firstName = getFirstName();

  return (
    <section className="w-full bg-transparent max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-10 pt-4 pb-2 animate-fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 md:gap-8 py-2">
        {/* Left Column: Welcome Greeting */}
        <div className="flex flex-col justify-center text-left max-w-xl shrink-0">
          <h2 className="font-serif text-base sm:text-lg md:text-xl font-medium text-[#6A1E35] tracking-wide flex items-center gap-2">
            <span className="text-[#6A1E35] select-none">✦</span>
            <span>{user ? `Welcome back, ${firstName}` : 'Welcome to Kalakaar'}</span>
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[#6F6257] font-normal mt-0.5 tracking-normal">
            {user ? 'Continue discovering authentic handmade art.' : "Experience India's Living Heritage."}
          </p>
        </div>

        {/* Right Column: Daily Heritage Quote */}
        {quote && (
          <div className="flex flex-col justify-center text-left md:text-right max-w-md">
            <blockquote className="font-serif italic text-xs sm:text-sm md:text-base text-[#6A1E35] opacity-95 leading-snug">
              &ldquo;{quote.quote_text}&rdquo;
            </blockquote>
            <cite className="not-italic font-sans text-[0.62rem] sm:text-[0.68rem] uppercase tracking-[0.18em] text-[#8C7466] font-medium mt-1 block">
              — {quote.author}
            </cite>
          </div>
        )}
      </div>
    </section>
  );
}
