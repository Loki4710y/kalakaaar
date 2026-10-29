"use client";
import { useLanguage } from "../../contexts/LanguageContext";

/** Small EN / हिं switch. Same look as the other navbar controls. */
export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, toggleLang, t } = useLanguage();
  return (
    <button
      type="button"
      onClick={toggleLang}
      aria-label={t("lang.switchTo")}
      title={t("lang.switchTo")}
      lang={lang === "en" ? "hi" : "en"}
      className={`shrink-0 px-2.5 py-1 border border-[rgba(107,30,46,0.3)] text-[#6B1E2E] font-sans text-[0.72rem] font-semibold tracking-wider hover:bg-[#6B1E2E] hover:text-[#FFFDF7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1E2E] transition-colors cursor-pointer ${className}`}
    >
      {t("lang.short")}
    </button>
  );
}
