"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { DictKey, LANG_STORAGE_KEY, Lang, isLang, translate } from "../lib/i18n";

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * English is always what the server renders, so pages stay fast, cacheable and indexable.
 * The saved choice is applied right after the page loads (this browser only, nothing is sent anywhere).
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
      if (isLang(saved)) setLangState(saved);
    } catch {
      /* storage blocked: stay on English */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleLang = useCallback(() => setLang(lang === "en" ? "hi" : "en"), [lang, setLang]);

  const value = useMemo<LanguageContextType>(
    () => ({ lang, setLang, toggleLang, t: (key, vars) => translate(lang, key, vars) }),
    [lang, setLang, toggleLang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  // Outside the provider (tests, isolated renders) behave as plain English instead of crashing.
  if (!ctx) {
    return { lang: "en", setLang: () => {}, toggleLang: () => {}, t: (key, vars) => translate("en", key, vars) };
  }
  return ctx;
}
