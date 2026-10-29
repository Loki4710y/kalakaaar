import React from "react";
import Image from "next/image";
import { BRANDING } from "@/src/config/assets";

interface BrushLotusIconProps {
  className?: string;
  width?: number;
  height?: number;
}

export function BrushLotusIcon({ className = "w-8 h-8", width = 36, height = 36 }: BrushLotusIconProps) {
  return (
    <Image
      src={BRANDING.navbarIcon}
      alt="Kalakaar Icon"
      width={width}
      height={height}
      className={`object-contain ${className}`}
      priority
    />
  );
}
