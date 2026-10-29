"use client";
import { MadhubaniPattern } from "../patterns/MadhubaniPattern";
import Link from "next/link";
import { Instagram, Twitter, Facebook, Linkedin } from "lucide-react";
import { BrandLogo } from "../ui/BrandLogo";
import { useLanguage } from "../../contexts/LanguageContext";

export function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="bg-[#2C1810] text-[#EDE4CE] relative pt-[80px]">
      {/* Top Madhubani Pattern accent */}
      <div className="absolute top-0 left-0 w-full h-[80px] overflow-hidden pointer-events-none">
        <MadhubaniPattern opacity={0.15} stroke="#6B1E2E" />
      </div>

      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10 pt-6 pb-8">
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 pb-14 text-center md:text-left">
          
          {/* Column 1: Brand & Bio */}
          <div className="flex flex-col items-center md:items-start">
            <BrandLogo variant="footer" className="mb-1" />
            <p className="font-sans text-[0.82rem] text-[#A68A78] leading-relaxed max-w-xs mt-3 mb-6 font-normal">
              {t("footer.tagline")}
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-5 text-[#9C7A6A]">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="hover:text-[#E8C99A] hover:-translate-y-0.5 transition-all duration-200"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X (Twitter)"
                className="hover:text-[#E8C99A] hover:-translate-y-0.5 transition-all duration-200"
              >
                <Twitter size={18} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="hover:text-[#E8C99A] hover:-translate-y-0.5 transition-all duration-200"
              >
                <Facebook size={18} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="hover:text-[#E8C99A] hover:-translate-y-0.5 transition-all duration-200"
              >
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          {/* Column 2: Discover */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="font-sans text-[0.72rem] uppercase tracking-[0.18em] text-[#9C7A6A] font-semibold mb-4">
              {t("footer.discover")}
            </h3>
            <ul className="font-sans text-[0.84rem] text-[#B5998A] flex flex-col gap-2.5">
              <li>
                <Link href="/explore" className="hover:text-[#E8C99A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C99A] transition-colors duration-200">
                  {t("nav.explore")}
                </Link>
              </li>
              <li>
                <Link href="/collections" className="hover:text-[#E8C99A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C99A] transition-colors duration-200">
                  {t("footer.collections")}
                </Link>
              </li>
              <li>
                <Link href="/stories" className="hover:text-[#E8C99A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C99A] transition-colors duration-200">
                  {t("nav.stories")}
                </Link>
              </li>
              <li>
                <Link href="/explore" className="hover:text-[#E8C99A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C99A] transition-colors duration-200">
                  {t("footer.categories")}
                </Link>
              </li>
              <li>
                <Link href="/artists" className="hover:text-[#E8C99A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C99A] transition-colors duration-200">
                  {t("footer.featuredArtists")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: For Artists */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="font-sans text-[0.72rem] uppercase tracking-[0.18em] text-[#9C7A6A] font-semibold mb-4">
              {t("footer.forArtists")}
            </h3>
            <ul className="font-sans text-[0.84rem] text-[#B5998A] flex flex-col gap-2.5">
              <li>
                <Link href="/artist-portal" className="hover:text-[#E8C99A] transition-colors duration-200">
                  {t("nav.artistPortal")}
                </Link>
              </li>
              <li>
                <Link href="/artist-portal" className="hover:text-[#E8C99A] transition-colors duration-200">
                  {t("footer.becomeArtist")}
                </Link>
              </li>
              <li>
                <Link href="/artist-portal" className="hover:text-[#E8C99A] transition-colors duration-200">
                  {t("nav.uploadArtwork")}
                </Link>
              </li>
              <li>
                <Link href="/artist-portal" className="hover:text-[#E8C99A] transition-colors duration-200">
                  {t("footer.createCollection")}
                </Link>
              </li>
              <li>
                <Link href="/stories/new" className="hover:text-[#E8C99A] transition-colors duration-200">
                  {t("footer.writeStories")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Company */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="font-sans text-[0.72rem] uppercase tracking-[0.18em] text-[#9C7A6A] font-semibold mb-4">
              {t("footer.company")}
            </h3>
            <ul className="font-sans text-[0.84rem] text-[#B5998A] flex flex-col gap-2.5">
              <li>
                <Link href="/about" className="hover:text-[#E8C99A] transition-colors duration-200">
                  {t("footer.about")}
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#E8C99A] transition-colors duration-200">
                  {t("footer.contact")}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#E8C99A] transition-colors duration-200">
                  {t("footer.privacy")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#E8C99A] transition-colors duration-200">
                  {t("footer.terms")}
                </Link>
              </li>
              <li>
                <Link href="/community" className="hover:text-[#E8C99A] transition-colors duration-200">
                  {t("footer.guidelines")}
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[rgba(255,255,255,0.08)] pt-6 pb-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-center text-[#8C7466] font-sans text-[0.75rem]">
          <span>© 2026 Kalakaar</span>
          <span>{t("footer.madeWith")}</span>
          <span>{t("footer.version")}</span>
        </div>
      </div>
    </footer>
  );
}


