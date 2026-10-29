import { en, type Dict, type DictKey } from "./en";
import { hi } from "./hi";

export type Lang = "en" | "hi";
export type { DictKey };

export const LANG_STORAGE_KEY = "kalakaar_lang";

const dictionaries: Record<Lang, Dict> = { en, hi };

export function isLang(v: unknown): v is Lang {
  return v === "en" || v === "hi";
}

/** Looks a key up and fills {placeholders}. Falls back to English, then to the key itself. */
export function translate(lang: Lang, key: DictKey, vars?: Record<string, string | number>): string {
  let text = dictionaries[lang]?.[key] ?? en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) text = text.split(`{${k}}`).join(String(v));
  }
  return text;
}
