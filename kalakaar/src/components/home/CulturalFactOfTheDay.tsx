"use client";

import React, { useEffect, useState } from 'react';
import { CulturalContentService, CulturalFact } from '../../services/CulturalContentService';
import { BookOpen, MapPin } from 'lucide-react';

export function CulturalFactOfTheDay() {
  const [fact, setFact] = useState<CulturalFact | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    CulturalContentService.getCulturalFactOfTheDay().then((data) => {
      if (isMounted) {
        setFact(data);
        setLoaded(true);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  if (!loaded || !fact || !fact.fact_title) {
    return null; // Gracefully hide if database empty
  }

  return (
    <section className="py-8 px-4 bg-[#FFFDF7] my-8 max-w-5xl mx-auto rounded-2xl border border-[#D4AF37]/40 shadow-xs">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="p-4 bg-[#6B1E2E] text-white rounded-2xl shrink-0">
          <BookOpen size={28} />
        </div>
        <div className="space-y-1.5 text-center md:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs font-semibold uppercase tracking-wider text-[#6B1E2E]">
            <span>Cultural Fact of the Day</span>
            {fact.origin_region && (
              <span className="flex items-center gap-1 text-[#8B4513] font-normal">
                <MapPin size={12} /> {fact.origin_region}
              </span>
            )}
          </div>
          <h3 className="font-serif text-lg font-bold text-[#2C1810]">
            {fact.fact_title}
          </h3>
          <p className="text-xs sm:text-sm text-[#2C1810]/80 leading-relaxed">
            {fact.fact_description}
          </p>
        </div>
      </div>
    </section>
  );
}
