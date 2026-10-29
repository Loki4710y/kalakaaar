"use client";

import React, { useEffect, useState } from 'react';
import { CulturalContentService, DailyQuote } from '../../services/CulturalContentService';
import { Quote } from 'lucide-react';

export function QuoteOfTheDay() {
  const [dailyQuote, setDailyQuote] = useState<DailyQuote | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    CulturalContentService.getQuoteOfTheDay().then((data) => {
      if (isMounted) {
        setDailyQuote(data);
        setLoaded(true);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  if (!loaded || !dailyQuote || !dailyQuote.quote_text) {
    return null; // Gracefully hide if database empty
  }

  return (
    <section className="py-10 px-4 bg-[#F8F3EA]/80 border-y border-[#E5D3B3]">
      <div className="max-w-4xl mx-auto text-center space-y-3">
        <div className="inline-flex p-2 rounded-full bg-[#6B1E2E]/10 text-[#6B1E2E]">
          <Quote size={20} />
        </div>
        <blockquote className="font-serif italic text-lg sm:text-2xl text-[#2C1810] leading-relaxed">
          &ldquo;{dailyQuote.quote_text}&rdquo;
        </blockquote>
        {dailyQuote.author && (
          <p className="text-xs uppercase tracking-widest text-[#6B1E2E] font-semibold">
            — {dailyQuote.author}
          </p>
        )}
      </div>
    </section>
  );
}
