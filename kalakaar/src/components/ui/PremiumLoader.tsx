"use client";

import React from 'react';
import { Palette } from 'lucide-react';

interface PremiumLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export function PremiumLoader({ message = 'Preparing your gallery...', fullScreen = false }: PremiumLoaderProps) {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
      {/* Animated Kalakaar Icon */}
      <div className="relative flex items-center justify-center">
        <div className="absolute w-16 h-16 rounded-full bg-[#D4AF37]/20 animate-ping duration-[3000ms]" />
        <div className="relative p-4 rounded-full bg-[#6B1E2E] text-white shadow-xl">
          <Palette size={28} className="animate-spin duration-[10000ms]" />
        </div>
      </div>

      {/* Title */}
      <div className="font-serif text-xl font-bold text-[#2C1810] tracking-wide">
        KALAKAAR
      </div>

      {/* Brush Stroke Loading Indicator */}
      <div className="w-48 h-1 bg-[#E5D3B3] rounded-full overflow-hidden relative">
        <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#6B1E2E] via-[#D4AF37] to-[#6B1E2E] w-1/2 rounded-full animate-[shimmer_1.5s_infinite]" />
      </div>

      {/* Message */}
      <p className="text-xs text-[#6B1E2E] font-medium tracking-wide animate-pulse">
        {message}
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FFFDF7] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}
