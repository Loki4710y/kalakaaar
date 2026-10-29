import { ArtistProfile } from "@/src/views/ArtistProfile";
import { getPublicArtist, getPublicArtworksByArtist, NOT_FOUND } from "@/src/lib/publicData";
import { JsonLdScript } from "@/src/components/seo/JsonLdScript";
import { artistLd, breadcrumbLd } from "@/src/lib/jsonld";

/** Shared by /artist/[id] and /artists/[username]: server-rendered profile + structured data. */
export async function ArtistServerPage({ identifier }: { identifier: string }) {
  const found: any = await getPublicArtist(identifier);
  const artist = found === NOT_FOUND ? null : found;
  const isArtist = !!artist;
  const artworks = isArtist ? await getPublicArtworksByArtist(artist.id) : null;
  return (
    <>
      {isArtist && (
        <>
          <JsonLdScript data={artistLd(artist, artist.id)} />
          <JsonLdScript
            data={breadcrumbLd([
              { name: "Home", path: "/" },
              { name: "Artists", path: "/artists" },
              { name: artist.full_name || "Artist", path: `/artist/${artist.id}` },
            ])}
          />
        </>
      )}
      <ArtistProfile initialArtist={isArtist ? artist : null} initialArtworks={artworks} />
    </>
  );
}
