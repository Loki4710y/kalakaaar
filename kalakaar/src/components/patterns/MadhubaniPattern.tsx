"use client";
import { cn } from "../../lib/utils";

interface MadhubaniPatternProps {
  className?: string;
  opacity?: number;
  stroke?: string;
}

export function MadhubaniPattern({ className, opacity = 0.06, stroke = "#6B1E2E" }: MadhubaniPatternProps) {
  return (
    <div className={cn("absolute inset-0 pointer-events-none z-0 overflow-hidden", className)} style={{ opacity }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="madhubani-tile" width="120" height="120" patternUnits="userSpaceOnUse" patternTransform="rotate(0)">
            {/* Geometric lotus */}
            <path d="M 60 20 L 70 40 L 90 50 L 70 60 L 60 80 L 50 60 L 30 50 L 50 40 Z" fill="none" stroke={stroke} strokeWidth="1.2" />
            <path d="M 60 30 L 65 45 L 80 50 L 65 55 L 60 70 L 55 55 L 40 50 L 55 45 Z" fill="none" stroke={stroke} strokeWidth="1.2" />
            
            {/* Peacock outline */}
            <path d="M 10 90 C 15 70, 30 75, 40 85 C 45 90, 40 100, 30 100 C 20 100, 5 110, 10 90 Z" fill="none" stroke={stroke} strokeWidth="1.2" />
            <path d="M 35 85 Q 45 75, 55 85 Q 50 95, 40 90" fill="none" stroke={stroke} strokeWidth="1.2" />

            {/* Fish motif */}
            <path d="M 90 90 C 110 80, 110 100, 90 90 Z" fill="none" stroke={stroke} strokeWidth="1.2" />
            <ellipse cx="80" cy="90" rx="10" ry="5" fill="none" stroke={stroke} strokeWidth="1.2" />

            {/* Mango/paisley shape */}
            <path d="M 20 20 C 30 10, 40 30, 25 40 C 10 30, 10 30, 20 20 Z" fill="none" stroke={stroke} strokeWidth="1.2" />

            {/* Dotted border */}
            <line x1="0" y1="120" x2="120" y2="120" stroke={stroke} strokeDasharray="1.5 3" strokeWidth="3" />
            <line x1="120" y1="0" x2="120" y2="120" stroke={stroke} strokeDasharray="1.5 3" strokeWidth="3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#madhubani-tile)" />
      </svg>
    </div>
  );
}

export function MadhubaniDivider({ className, opacity = 0.09 }: { className?: string; opacity?: number }) {
  return (
    <div className={cn("madhubani-divider h-[60px] w-full overflow-hidden pointer-events-none relative bg-cream", className)}>
      <MadhubaniPattern opacity={opacity} />
    </div>
  );
}

export function CornerBrackets({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-[1.5rem] pointer-events-none z-10", className)}>
      {/* Top Left */}
      <div className="absolute top-0 left-0 w-[28px] h-[28px] border-t-2 border-l-2 border-primary" />
      {/* Top Right */}
      <div className="absolute top-0 right-0 w-[28px] h-[28px] border-t-2 border-r-2 border-primary" />
      {/* Bottom Left */}
      <div className="absolute bottom-0 left-0 w-[28px] h-[28px] border-b-2 border-l-2 border-primary" />
      {/* Bottom Right */}
      <div className="absolute bottom-0 right-0 w-[28px] h-[28px] border-b-2 border-r-2 border-primary" />
    </div>
  );
}


