import { cache } from "react";
import { createAnonClient } from "@/lib/supabase/anon";
import { ArtworkRepository, type Artwork } from "@/src/repositories/ArtworkRepository";
import { ProfileRepository } from "@/src/repositories/ProfileRepository";
import { StoryRepository } from "@/src/repositories/StoryRepository";
import { CollectionRepository } from "@/src/repositories/CollectionRepository";

/**
 * Server-side readers for PUBLIC data, used to render real HTML for search engines.
 * They use the anonymous client, so they only see what a logged-out visitor may see
 * (no contact details), which also makes the rendered pages safe to cache and share.
 * `cache()` means the page and its metadata share one database call per request.
 * Every function returns null instead of throwing, so a database hiccup never breaks the page:
 * the client view then loads the data itself, exactly as before.
 */
const repos = () => {
  const c = createAnonClient();
  return {
    artworks: new ArtworkRepository(c),
    profiles: new ProfileRepository(c),
    stories: new StoryRepository(c),
    collections: new CollectionRepository(c),
  };
};

/** The item definitely does not exist (or is not public): the page should answer with a real 404. */
export const NOT_FOUND = Symbol("not-found");

const safe = async <T,>(fn: () => Promise<{ success: boolean; data?: T | null; error?: string }>): Promise<T | null> => {
  try {
    const r = await fn();
    return r.success && r.data ? (r.data as T) : null;
  } catch {
    return null;
  }
};

/** Like `safe`, but tells "does not exist" (NOT_FOUND) apart from "database unreachable" (null). */
const find = async <T,>(fn: () => Promise<{ success: boolean; data?: T | null; error?: string }>): Promise<T | typeof NOT_FOUND | null> => {
  try {
    const r = await fn();
    if (r.success) return r.data ? (r.data as T) : NOT_FOUND;
    return /not found/i.test(r.error || "") ? NOT_FOUND : null;
  } catch {
    return null;
  }
};

export const getPublicArtwork = cache(async (id: string) => {
  const art = await find(() => repos().artworks.getArtwork(id));
  if (art === NOT_FOUND || art === null) return art;
  return art.status === "published" ? art : NOT_FOUND;
});

export const getPublicArtist = cache(async (id: string) => {
  const p: any = await find(() => repos().profiles.getProfile(id));
  if (p === NOT_FOUND || p === null) return p;
  return p.role === "artist" ? p : NOT_FOUND;
});

export const getPublicStory = cache(async (id: string) => {
  const s: any = await find(() => repos().stories.getStory(id));
  if (s === NOT_FOUND || s === null) return s;
  return s.status === "published" ? s : NOT_FOUND;
});

export const getPublicCollection = cache(async (id: string) => {
  const c: any = await find(() => repos().collections.getCollection(id));
  if (c === NOT_FOUND || c === null) return c;
  return c.status === "published" ? c : NOT_FOUND;
});

/** First page (12) of an artist's published artworks, with the total count. */
export const getPublicArtworksByArtist = cache(async (artistId: string) => {
  return safe(() => repos().artworks.getArtistArtworksPage(artistId, { page: 1, pageSize: 12 }));
});

export const getPublicRecentArtworks = cache(async (limit = 6): Promise<Artwork[]> => {
  return (await safe(() => repos().artworks.getRecentArtworks(limit))) || [];
});

export const getPublicFeaturedStories = cache(async (limit = 4) => {
  return ((await safe(() => repos().stories.getFeaturedStories(limit))) as any[] | null) || [];
});

export const getPublicHome = cache(async () => {
  const [collections, artworks, artists, stories] = await Promise.all([
    safe(() => repos().collections.getFeaturedCollections(6)),
    safe(() => repos().artworks.getFeaturedArtworks(8)),
    safe(() => repos().profiles.getFeaturedArtists(6)),
    safe(() => repos().stories.getFeaturedStories(3)),
  ]);
  return { collections: collections ?? [], artworks: artworks ?? [], artists: artists ?? [], stories: stories ?? [] } as {
    collections: any[]; artworks: any[]; artists: any[]; stories: any[];
  };
});

// ---------- Paged lists (server-side pagination) ----------
// Each page of results is cached for 60 seconds per unique set of filters, so thousands of visitors
// browsing the same page cost the database one query a minute. Errors are thrown inside the cache
// function on purpose: a failed lookup is never cached.
import { unstable_cache } from "next/cache";
import type { Paged } from "@/src/repositories/utils";
import type { UserProfile } from "@/src/repositories/ProfileRepository";

const paged = <P extends object, T>(name: string, run: (p: P) => Promise<{ success: boolean; data?: Paged<T>; error?: string }>) =>
  async (params: P): Promise<Paged<T> | null> => {
    try {
      return await unstable_cache(
        async () => {
          const r = await run(params);
          if (!r.success || !r.data) throw new Error(r.error || "list failed");
          return r.data;
        },
        [name, JSON.stringify(params)],
        { revalidate: 60, tags: [name] }
      )();
    } catch {
      return null;
    }
  };

export type ExploreParams = { page: number; category: string; sort: "featured" | "newest" | "price_asc" | "price_desc"; q: string };
export const getPublicExplorePage = paged<ExploreParams, Artwork>("explore-page", (p) =>
  repos().artworks.getExplorePage({
    page: p.page,
    pageSize: 12,
    category: p.category && p.category !== "ALL" ? p.category : undefined,
    search: p.q || undefined,
    sortBy: p.sort,
  })
);

export type ArtistsParams = { page: number; style: string; q: string };
export const getPublicArtistsPage = paged<ArtistsParams, UserProfile>("artists-page", (p) =>
  repos().profiles.searchArtistsPage({ page: p.page, pageSize: 12, style: p.style, query: p.q })
);

export type StoriesParams = { page: number; category: string; q: string };
export const getPublicStoriesPage = paged<StoriesParams, any>("stories-page", (p) =>
  repos().stories.searchStoriesPage({ page: p.page, pageSize: 9, category: p.category, search: p.q })
);

export type CollectionsParams = { page: number; q: string };
export const getPublicCollectionsPage = paged<CollectionsParams, any>("collections-page", (p) =>
  repos().collections.searchCollectionsPage({ page: p.page, pageSize: 9, search: p.q })
);

export const getPublicFeaturedCollections = cache(async (limit = 6) => {
  return ((await safe(() => repos().collections.getFeaturedCollections(limit))) as any[] | null) || [];
});
