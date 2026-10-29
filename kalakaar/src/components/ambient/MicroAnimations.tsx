"use client";

import React, { useEffect, useState } from 'react';
import { useAmbient } from '../../contexts/AmbientContext';

export function MicroAnimations() {
  const { microAnimationsEnabled } = useAmbient();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  if (!microAnimationsEnabled || prefersReducedMotion) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden opacity-40">
      {/* Soft Ambient Light Rays */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-radial from-[#F5E6D3]/30 via-transparent to-transparent rounded-full blur-3xl animate-pulse duration-[10000ms]" />
      <div className="absolute top-1/3 -right-32 w-80 h-80 bg-gradient-radial from-[#6B1E2E]/10 via-transparent to-transparent rounded-full blur-3xl animate-pulse duration-[12000ms]" />

      {/* Subtle Floating Dust Particles */}
      <div className="absolute top-1/4 left-1/5 w-1.5 h-1.5 rounded-full bg-[#D4AF37]/40 blur-[0.5px] animate-bounce duration-[8000ms]" />
      <div className="absolute top-2/3 left-3/4 w-2 h-2 rounded-full bg-[#8B4513]/20 blur-[0.5px] animate-bounce duration-[11000ms]" />
      <div className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full bg-[#2C1810]/30 blur-[0.5px] animate-pulse duration-[6000ms]" />
    </div>
  );
}
