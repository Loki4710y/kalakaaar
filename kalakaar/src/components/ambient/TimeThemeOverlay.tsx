"use client";

import React from 'react';
import { useAmbient } from '../../contexts/AmbientContext';

export function TimeThemeOverlay() {
  const { autoTheme, timeTheme } = useAmbient();

  if (!autoTheme) return null;

  switch (timeTheme) {
    case 'morning':
      return (
        <div className="fixed inset-0 pointer-events-none z-[1] bg-gradient-to-b from-[#FFFDF0]/15 via-transparent to-transparent transition-opacity duration-1000" />
      );
    case 'evening':
      return (
        <div className="fixed inset-0 pointer-events-none z-[1] bg-gradient-to-b from-[#F5E6D3]/20 via-transparent to-[#2C1810]/5 transition-opacity duration-1000" />
      );
    case 'night':
      return (
        <div className="fixed inset-0 pointer-events-none z-[1] bg-[#1A0F0A]/5 mix-blend-multiply transition-opacity duration-1000" />
      );
    case 'afternoon':
    default:
      return null;
  }
}
