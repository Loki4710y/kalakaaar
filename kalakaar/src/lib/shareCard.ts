/**
 * Helpers for the branded share card images (/api/share-card/...).
 * Kept free of React and Node APIs so they can be unit tested.
 */

export type CardKind = "artwork" | "artist";
export type CardSize = "og" | "post" | "story";
export type CardLang = "en" | "hi";

export const CARD_SIZES: Record<CardSize, { width: number; height: number }> = {
  og: { width: 1200, height: 630 }, // link previews (WhatsApp, Facebook, X)
  post: { width: 1080, height: 1350 }, // Instagram post, 4:5
  story: { width: 1080, height: 1920 }, // WhatsApp status, Instagram story, 9:16
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isCardKind = (v: string): v is CardKind => v === "artwork" || v === "artist";
export const isCardId = (v: string): boolean => UUID.test(v);

export function parseSize(v: string | null): CardSize {
  return v === "post" || v === "story" ? v : "og";
}

export function parseLang(v: string | null): CardLang {
  return v === "hi" ? "hi" : "en";
}

/** Shortens text to fit on the card without cutting a word in half where possible. */
export function clipText(text: string | null | undefined, max: number): string {
  const t = (text || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

/**
 * The card server downloads an image, so it must only ever fetch from our own storage
 * (or Google profile photos). This stops the endpoint being used to reach other servers.
 */
export function isAllowedImageUrl(raw: string | null | undefined, supabaseUrl: string | undefined, isProduction: boolean): boolean {
  if (!raw || !supabaseUrl) return false;
  try {
    const u = new URL(raw);
    const home = new URL(supabaseUrl);
    if (u.username || u.password) return false;
    if (u.host === "lh3.googleusercontent.com") return u.protocol === "https:";
    if (u.host !== home.host) return false;
    if (u.protocol === "https:") return true;
    // Plain http is only for a local test backend, never in production.
    return !isProduction && u.protocol === "http:" && /^(localhost|127\.0\.0\.1)$/.test(u.hostname);
  } catch {
    return false;
  }
}

/** Short, stable fingerprint of a string (e.g. a photo URL). Used to give a card a new address when its photo changes. */
export function versionOf(text: string | null | undefined): string {
  let h = 5381;
  for (const ch of text || "") h = ((h * 33) ^ ch.charCodeAt(0)) >>> 0;
  return h.toString(36);
}

/**
 * The URL of a card image for a page. `version` changes the address (not the picture), so a card that
 * was cached with an old profile photo is replaced the moment the photo changes.
 */
export function shareCardPath(kind: CardKind, id: string, size: CardSize = "og", lang: CardLang = "en", version?: string): string {
  const q = new URLSearchParams();
  if (version) q.set("v", version);
  if (size !== "og") q.set("size", size);
  if (lang !== "en") q.set("lang", lang);
  const qs = q.toString();
  return `/api/share-card/${kind}/${id}${qs ? `?${qs}` : ""}`;
}
