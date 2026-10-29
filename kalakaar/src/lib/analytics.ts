/**
 * Types and small pure helpers for the artist analytics screen.
 * The numbers come from the database function my_analytics(); everything here only
 * cleans them up (so a missing or odd value can never break the page) and picks the best day.
 */

export type AnalyticsChannel = "whatsapp" | "instagram" | "email";

export interface AnalyticsDay {
  day: string; // YYYY-MM-DD, Indian time
  views: number;
  likes: number;
  saves: number;
  followers: number;
  contacts: number;
}

export interface AnalyticsTotals {
  views: number;
  likes: number;
  saves: number;
  followers: number;
  contacts: number;
}

export interface AnalyticsTopArtwork {
  id: string;
  title: string;
  image: string | null;
  views: number;
  likes: number;
  saves: number;
}

export interface ArtistAnalytics {
  days: number;
  totals: AnalyticsTotals;
  daily: AnalyticsDay[];
  top: AnalyticsTopArtwork[];
  channels: Record<AnalyticsChannel, number>;
}

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
};

/** Turns the raw database answer into a fully-filled, safe object. */
export function normalizeAnalytics(raw: unknown): ArtistAnalytics {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, any>;
  const totals = (r.totals && typeof r.totals === "object" ? r.totals : {}) as Record<string, unknown>;
  const channels = (r.channels && typeof r.channels === "object" ? r.channels : {}) as Record<string, unknown>;

  const daily: AnalyticsDay[] = (Array.isArray(r.daily) ? r.daily : [])
    .filter((d: any) => d && typeof d.day === "string")
    .map((d: any) => ({
      day: String(d.day).slice(0, 10),
      views: num(d.views),
      likes: num(d.likes),
      saves: num(d.saves),
      followers: num(d.followers),
      contacts: num(d.contacts),
    }));

  const top: AnalyticsTopArtwork[] = (Array.isArray(r.top) ? r.top : [])
    .filter((t: any) => t && typeof t.id === "string")
    .map((t: any) => ({
      id: t.id,
      title: typeof t.title === "string" && t.title.trim() ? t.title : "Untitled",
      image: typeof t.image === "string" && /^https:\/\//i.test(t.image) ? t.image : null,
      views: num(t.views),
      likes: num(t.likes),
      saves: num(t.saves),
    }));

  return {
    days: num(r.days) || daily.length || 30,
    totals: {
      views: num(totals.views),
      likes: num(totals.likes),
      saves: num(totals.saves),
      followers: num(totals.followers),
      contacts: num(totals.contacts),
    },
    daily,
    top,
    channels: {
      whatsapp: num(channels.whatsapp),
      instagram: num(channels.instagram),
      email: num(channels.email),
    },
  };
}

/** True when there is nothing at all to show for the period. */
export function isAnalyticsEmpty(a: ArtistAnalytics): boolean {
  const t = a.totals;
  return t.views + t.likes + t.saves + t.followers + t.contacts === 0;
}

/** The day with the most views (first one wins a tie). Null when no day has any view. */
export function peakDay(daily: AnalyticsDay[]): AnalyticsDay | null {
  let best: AnalyticsDay | null = null;
  for (const d of daily) if (d.views > 0 && (!best || d.views > best.views)) best = d;
  return best;
}

/** Bar height in percent (0-100). A non-zero day always gets a visible sliver. */
export function barPercent(value: number, max: number): number {
  if (value <= 0 || max <= 0) return 0;
  return Math.max(4, Math.round((value / max) * 100));
}
