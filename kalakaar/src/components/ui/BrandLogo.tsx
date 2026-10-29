import React from "react";
import Link from "next/link";
import Image from "next/image";
import { BRANDING } from "@/src/config/assets";

interface BrandLogoProps {
  variant?: "navbar" | "footer";
  className?: string;
  showTagline?: boolean;
}

export function BrandLogo({
  variant = "navbar",
  className = "",
  showTagline = true,
}: BrandLogoProps) {
  const isFooter = variant === "footer";

  return (
    <Link
      href="/"
      aria-label="Kalakaar Home"
      className={`group flex items-center shrink-0 focus-visible:outline-none focus-visible:ring-2 ${
        isFooter
          ? "focus-visible:ring-[#E8C99A] gap-3 sm:gap-3.5 lg:gap-4 w-[170px] sm:w-[190px] lg:w-[230px]"
          : "focus-visible:ring-[#6B1E2E] p-0.5 gap-3 sm:gap-3.5 lg:gap-4 w-[170px] sm:w-[205px] lg:w-[245px] xl:w-[275px]"
      } ${className}`}
    >
      {/* Icon */}
      <div
        className={`relative shrink-0 transition-transform duration-300 group-hover:scale-105 ${
          isFooter
            ? "w-[38px] h-[38px] sm:w-[42px] sm:h-[42px] lg:w-[46px] lg:h-[46px]"
            : "w-9 h-9 sm:w-10 sm:h-10 lg:w-[44px] lg:h-[44px] xl:w-[48px] xl:h-[48px]"
        }`}
      >
        <Image
          src={BRANDING.navbarIcon}
          alt="Kalakaar Icon"
          fill
          sizes="(max-width: 640px) 38px, (max-width: 1024px) 42px, 48px"
          priority={!isFooter}
          className="object-contain"
        />
      </div>

      {/* Wordmark & Tagline Container */}
      <div className="flex flex-col items-start justify-center shrink-0">
        <span
          className={`font-serif font-semibold tracking-tight leading-none transition-colors duration-200 ${
            isFooter
              ? "text-[1.75rem] sm:text-[1.95rem] lg:text-[2.25rem] text-[#E8C99A] group-hover:text-[#FFFDF7]"
              : "text-[1.75rem] sm:text-[2.1rem] lg:text-[2.35rem] xl:text-[2.5rem] text-primary"
          }`}
        >
          Kalakaar
        </span>

        {showTagline && (
          <span
            className={`font-sans tracking-[0.18em] uppercase font-medium mt-0.5 sm:mt-1 ${
              isFooter
                ? "text-[0.58rem] sm:text-[0.62rem] lg:text-[0.66rem] text-[#9C7A6A]"
                : "text-[0.58rem] sm:text-[0.62rem] lg:text-[0.66rem] xl:text-[0.7rem] text-text-hint"
            }`}
          >
            WHERE ART FINDS HOME
          </span>
        )}
      </div>
    </Link>
  );
}
