import { buildMetadata } from "@/src/lib/seoData";
import { ArtworkDetails } from "@/src/views/ArtworkDetails";
import { Metadata } from "next";
import { getPublicArtwork, getPublicRecentArtworks, NOT_FOUND } from "@/src/lib/publicData";
import { JsonLdScript } from "@/src/components/seo/JsonLdScript";
import { artworkLd, breadcrumbLd } from "@/src/lib/jsonld";

// Cached by the CDN and refreshed at most every 5 minutes: shared links cost almost nothing.
export const revalidate = 300;

// Empty list = build nothing up front, but build each page on its first visit and then cache it.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const id = (await params).id;
  return buildMetadata("artwork", id, `/artwork/${id}`, {
    title: "Artwork | Kalakaar",
    description: "Original handmade Indian folk art on Kalakaar.",
  });
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const found = await getPublicArtwork(id);
  // Drafts/archived items are invisible to the anonymous reader, so they cannot be told apart from missing ones:
  // render nothing server-side (the owner still sees them through the client view) and mark the page noindex.
  const art = found === NOT_FOUND ? null : found;
  // A real, published artwork gets a proper server-rendered page. An unknown id is a true 404 for crawlers.
  // If the database is briefly unreachable `art` is null too, so we fall back to the client view instead of a 404.
  const related = art ? await getPublicRecentArtworks(4) : [];
  return (
    <>
      {art && (
        <>
          <JsonLdScript data={artworkLd(art, art.profiles?.full_name)} />
          <JsonLdScript
            data={breadcrumbLd([
              { name: "Home", path: "/" },
              { name: "Explore", path: "/explore" },
              { name: art.title, path: `/artwork/${art.id}` },
            ])}
          />
        </>
      )}
      <ArtworkDetails initialArt={art} initialRecommended={related} />
    </>
  );
}
