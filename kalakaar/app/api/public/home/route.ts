import { NextResponse } from "next/server";
import { CollectionService } from "@/services/CollectionService";
import { ArtworkService } from "@/services/ArtworkService";
import { ProfileService } from "@/services/ProfileService";
import { StoryService } from "@/services/StoryService";
import { AdminService } from "@/services/AdminService";

/**
 * Home page data for LOGGED-OUT visitors (the bulk of launch-day traffic).
 * Every visitor sees the same thing, so the CDN keeps one copy for 60s
 * (and serves a slightly older copy while refreshing): thousands of visitors
 * cost the database about one round of queries per minute.
 * Public data only; no cookies are read, so the response is safe to share.
 */
export const dynamic = "force-dynamic";

const CACHE = "public, s-maxage=60, stale-while-revalidate=300";

export async function GET() {
  try {
    const [collections, artworks, artists, stories, aotm] = await Promise.all([
      CollectionService.getFeaturedCollections(6),
      ArtworkService.getFeaturedArtworks(8),
      ProfileService.getFeaturedArtists(6),
      StoryService.getFeaturedStories(3),
      AdminService.getArtistOfTheMonth(),
    ]);

    // If the database is unreachable, do NOT let the CDN cache an empty page.
    const anyOk = [collections, artworks, artists, stories].some((r: any) => r?.success || r?.data);
    if (!anyOk) {
      return NextResponse.json({ error: "temporarily unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json(
      {
        collections: collections.success ? collections.data ?? [] : [],
        artworks: artworks.success ? artworks.data ?? [] : [],
        artists: (artists as any).data ?? [],
        stories: stories.success ? stories.data ?? [] : [],
        artistOfTheMonth: aotm.success ? aotm.data ?? null : null,
      },
      { headers: { "Cache-Control": CACHE } }
    );
  } catch {
    return NextResponse.json({ error: "temporarily unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
