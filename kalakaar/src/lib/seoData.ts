import { createAnonClient } from "@/lib/supabase/anon";
import type { Metadata } from "next";
import { SITE_URL } from "./site";
import { shareCardPath, versionOf } from "./shareCard";

const baseUrl = SITE_URL;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Kind = "artwork" | "story" | "collection" | "artist";

const TABLES: Record<Kind, { table: string; select: string }> = {
  artwork: { table: "artworks", select: "id, title, description, category, image_urls, cover_image_index, profiles:artist_id(display_name)" },
  story: { table: "stories", select: "id, title, excerpt, cover_image_url" },
  collection: { table: "collections", select: "id, title, description, cover_image_url" },
  artist: { table: "profiles", select: "id, display_name, bio, avatar_url, primary_art_style" },
};

function clip(text: string | null | undefined, max = 160): string {
  const t = (text || "").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

function httpsOnly(url?: string | null): string | undefined {
  return url && /^https:\/\//i.test(url) ? url : undefined;
}

/**
 * Builds real page metadata (title, description, share image) for a public item.
 * Falls back to the generic text when the item is private/missing or the database is unreachable.
 */
export async function buildMetadata(kind: Kind, idOrSlug: string, path: string, fallback: { title: string; description: string }): Promise<Metadata> {
  let title = fallback.title;
  let description = fallback.description;
  let image: string | undefined;
  let cardImage: string | undefined; // our branded Kalakaar card, shown first in link previews
  let canonicalPath = path;
  let found = false;

  try {
    const { table, select } = TABLES[kind];
    const supabase = createAnonClient();
    let q: any = supabase.from(table).select(select);
    if (UUID.test(idOrSlug)) q = q.eq("id", idOrSlug);
    else if (kind === "artist") q = q.eq("username", idOrSlug);
    else q = q.eq("slug", idOrSlug);
    const { data } = await q.maybeSingle();
    const row: any = data;
    if (row) {
      found = true;
      // One address per page: always the id-based URL (the one in the sitemap), even if reached by slug/username.
      const base = { artwork: "/artwork", story: "/stories", collection: "/collections", artist: "/artist" }[kind];
      if (row.id) canonicalPath = `${base}/${row.id}`;
      if (kind === "artwork") {
        const by = row.profiles?.display_name;
        title = `${row.title}${row.category ? ` – ${row.category} Painting` : ""}${by ? ` by ${by}` : ""} | Kalakaar`;
        description = clip(row.description) || `${row.title}: original handmade ${row.category || "Indian folk"} artwork${by ? ` by ${by}` : ""}. View details and contact the artist on Kalakaar.`;
        image = httpsOnly(row.image_urls?.[row.cover_image_index || 0] || row.image_urls?.[0]);
        cardImage = `${baseUrl}${shareCardPath("artwork", row.id, "og")}`;
      } else if (kind === "story") {
        title = `${row.title} | Kalakaar Stories`;
        description = clip(row.excerpt) || fallback.description;
        image = httpsOnly(row.cover_image_url);
      } else if (kind === "collection") {
        title = `${row.title} | Kalakaar Collections`;
        description = clip(row.description) || fallback.description;
        image = httpsOnly(row.cover_image_url);
      } else {
        title = `${row.display_name}${row.primary_art_style ? ` – ${row.primary_art_style} Artist` : " – Folk Artist"} | Kalakaar`;
        description = clip(row.bio) || fallback.description;
        image = httpsOnly(row.avatar_url);
        cardImage = `${baseUrl}${shareCardPath("artist", row.id, "og", "en", versionOf(row.avatar_url))}`;
      }
    }
  } catch {
    /* keep fallback */
  }

  const url = `${baseUrl}${canonicalPath}`;
  return {
    title: { absolute: title }, // already complete: do not add the site suffix twice
    description,
    // Missing/private/unpublished items must never be indexed.
    ...(found ? {} : { robots: { index: false, follow: false } }),
    alternates: { canonical: url },
    openGraph: {
      title, description, url, type: "website",
      ...(cardImage || image ? { images: [...(cardImage ? [{ url: cardImage, width: 1200, height: 630 }] : []), ...(image ? [{ url: image }] : [])] } : {}),
    },
    twitter: { card: cardImage || image ? "summary_large_image" : "summary", title, description, ...(cardImage || image ? { images: [cardImage || (image as string)] } : {}) },
  };
}
