import { describe, it, expect } from "vitest";
import { normalizeAnalytics, isAnalyticsEmpty, peakDay, barPercent } from "../src/lib/analytics";
import { computeOnboarding } from "../src/lib/onboarding";

describe("analytics helpers", () => {
  it("turns garbage into a safe, fully filled object", () => {
    const a = normalizeAnalytics(null);
    expect(a.totals).toEqual({ views: 0, likes: 0, saves: 0, followers: 0, contacts: 0 });
    expect(a.daily).toEqual([]);
    expect(a.channels).toEqual({ whatsapp: 0, instagram: 0, email: 0 });
    expect(isAnalyticsEmpty(a)).toBe(true);
  });

  it("cleans numbers, drops bad rows and non-https images", () => {
    const a = normalizeAnalytics({
      days: 7,
      totals: { views: "12", likes: -3, saves: NaN, followers: 2.9, contacts: 1 },
      daily: [{ day: "2026-10-01T00:00:00", views: 5 }, { nope: true }],
      top: [{ id: "x", title: "  ", image: "http://insecure/x.jpg", views: 3 }, { title: "no id" }],
      channels: { whatsapp: 4 },
    });
    expect(a.totals).toEqual({ views: 12, likes: 0, saves: 0, followers: 2, contacts: 1 });
    expect(a.daily).toHaveLength(1);
    expect(a.daily[0].day).toBe("2026-10-01");
    expect(a.top).toHaveLength(1);
    expect(a.top[0]).toMatchObject({ title: "Untitled", image: null, views: 3 });
    expect(a.channels.whatsapp).toBe(4);
    expect(isAnalyticsEmpty(a)).toBe(false);
  });

  it("finds the peak day and sizes bars", () => {
    const mk = (day: string, views: number) => ({ day, views, likes: 0, saves: 0, followers: 0, contacts: 0 });
    expect(peakDay([mk("a", 0), mk("b", 0)])).toBeNull();
    expect(peakDay([mk("a", 2), mk("b", 9), mk("c", 9)])?.day).toBe("b");
    expect(barPercent(0, 10)).toBe(0);
    expect(barPercent(1, 1000)).toBe(4);
    expect(barPercent(10, 10)).toBe(100);
  });
});

describe("onboarding checklist", () => {
  const base = { artworkCount: 0, shared: false };

  it("starts with nothing done", () => {
    const r = computeOnboarding(base);
    expect(r.done).toBe(0);
    expect(r.total).toBe(6);
    expect(r.complete).toBe(false);
  });

  it("does not count the placeholder avatar as a photo", () => {
    expect(computeOnboarding({ ...base, avatarUrl: "/assets/defaults/avatar.svg" }).steps[0].done).toBe(false);
    expect(computeOnboarding({ ...base, avatarUrl: "https://x.supabase.co/a.webp" }).steps[0].done).toBe(true);
  });

  it("needs a real bio, a style AND a location, and any one contact channel", () => {
    expect(computeOnboarding({ ...base, bio: "too short" }).steps[1].done).toBe(false);
    expect(computeOnboarding({ ...base, bio: "I paint Madhubani fish and peacocks in Mithila." }).steps[1].done).toBe(true);
    expect(computeOnboarding({ ...base, primaryArtStyle: "Warli" }).steps[2].done).toBe(false);
    expect(computeOnboarding({ ...base, primaryArtStyle: "Warli", location: "Pune" }).steps[2].done).toBe(true);
    expect(computeOnboarding({ ...base, instagram: "https://instagram.com/x" }).steps[3].done).toBe(true);
    expect(computeOnboarding({ ...base, whatsapp: "  " }).steps[3].done).toBe(false);
  });

  it("is complete only when all six are done", () => {
    const r = computeOnboarding({
      avatarUrl: "https://x/a.webp", bio: "x".repeat(25), location: "Delhi", primaryArtStyle: "Gond",
      whatsapp: "919876543210", artworkCount: 2, shared: true,
    });
    expect(r.done).toBe(6);
    expect(r.complete).toBe(true);
  });
});
