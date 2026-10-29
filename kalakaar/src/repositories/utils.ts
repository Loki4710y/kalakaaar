import type { SupabaseClient } from '@supabase/supabase-js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID_RE.test(v);

/**
 * Makes user text safe to embed inside a PostgREST filter string (.or(...), ilike).
 * Removes the characters that have a meaning in that mini-language.
 */
export function sanitizeSearch(input: string): string {
  return (input || '').replace(/[%,()*\\:"'`;]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}

export function clampLimit(limit: number | undefined, fallback = 24, max = 100): number {
  const n = Number.isFinite(limit as number) ? Math.floor(limit as number) : fallback;
  return Math.min(Math.max(n, 1), max);
}

/** "My Artwork!" -> "my-artwork-k3j9x2" (always valid for the slug CHECK constraint). */
export function slugify(title: string): string {
  const base = (title || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 8);
  return base ? `${base}-${suffix}` : `item-${suffix}`;
}

/** Only keep http(s) URLs (stops javascript: / data: URLs being stored). */
export function cleanUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  return /^https?:\/\//i.test(v) ? v.slice(0, 500) : null;
}

export interface ArtistContactInfo {
  whatsapp_number?: string | null;
  instagram_handle?: string | null;
  contact_email?: string | null;
}

/**
 * Contact details are visible to signed-in users only (database rule). This copies the
 * artist's chosen-to-show channels onto profile-like objects so components can read
 * `whatsapp_number` / `instagram_handle` / `contact_email`. Signed-out visitors get nothing.
 */
export async function attachContacts(client: SupabaseClient, profiles: any[]): Promise<void> {
  try {
    const targets = profiles.filter((p) => p && isUuid(p.id));
    if (targets.length === 0) return;
    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session) return;

    const ids = Array.from(new Set(targets.map((p) => p.id)));
    const { data, error } = await client
      .from('artist_contacts_public')
      .select('artist_id, whatsapp_number, instagram_handle, contact_email')
      .in('artist_id', ids);
    if (error || !data) return;

    const byId = new Map<string, ArtistContactInfo>(data.map((r: any) => [r.artist_id, r]));
    for (const p of targets) {
      const c = byId.get(p.id);
      if (!c) continue;
      p.whatsapp_number = c.whatsapp_number ?? undefined;
      p.instagram_handle = c.instagram_handle ?? undefined;
      p.contact_email = c.contact_email ?? undefined;
      if (c.instagram_handle) p.instagram_url = `https://instagram.com/${c.instagram_handle}`;
    }
  } catch {
    // contacts are optional decoration; never break a page because of them
  }
}

/** Count a view at most once per browser per 12 hours (the database function itself cannot tell visitors apart). */
export function shouldCountView(kind: string, id: string): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const key = `kalakaar:viewed:${kind}:${id}`;
    const last = Number(window.localStorage.getItem(key) || 0);
    if (Date.now() - last < 12 * 60 * 60 * 1000) return false;
    window.localStorage.setItem(key, String(Date.now()));
    return true;
  } catch {
    return true;
  }
}

/** Keeps only images we can safely render: https URLs or bundled /assets/ files. */
export function cleanImageUrls(urls: unknown, max = 10): string[] {
  if (!Array.isArray(urls)) return [];
  return urls
    .filter((u): u is string => typeof u === 'string' && (/^https:\/\//i.test(u) || u.startsWith('/assets/')))
    .map((u) => u.slice(0, 500))
    .slice(0, max);
}

/**
 * Spellings of a category that should match (exact, Title Case, lower, UPPER).
 * Lets the database use a plain index instead of a slow case-insensitive scan.
 */
export function categoryVariants(raw: string): string[] {
  const c = sanitizeSearch(raw).trim();
  if (!c) return [];
  const title = c.toLowerCase().replace(/(^|[\s-])([a-z])/g, (_m, a, b) => a + b.toUpperCase());
  return Array.from(new Set([c, title, c.toLowerCase(), c.toUpperCase()]));
}


export interface PageRange { page: number; size: number; from: number; to: number }

/** Turns a 1-based page number into a database row range. Page size is clamped; page is at least 1. */
export function pageRange(page?: number, pageSize = 12, maxSize = 60): PageRange {
  const size = clampLimit(pageSize, 12, maxSize);
  const p = Math.max(1, Math.min(10000, Number.isFinite(page as number) ? Math.floor(page as number) : 1));
  return { page: p, size, from: (p - 1) * size, to: (p - 1) * size + size - 1 };
}

export interface Paged<T> { items: T[]; total: number; page: number; pageSize: number; totalPages: number }

export function makePaged<T>(items: T[], total: number, r: PageRange): Paged<T> {
  return { items, total, page: r.page, pageSize: r.size, totalPages: Math.max(1, Math.ceil(total / r.size)) };
}

/** PostgREST answers "range not satisfiable" when the page is past the end; that just means an empty page. */
export const isRangeError = (e: any) => e?.code === 'PGRST103' || /range not satisfiable/i.test(e?.message || '');
