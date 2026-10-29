import { buildMetadata } from "@/src/lib/seoData";
import { CollectionDetails } from "@/src/views/CollectionDetails";
import { Suspense } from "react";
import { Metadata } from "next";
import { ArtworkGridSkeleton } from "@/src/components/ui/Skeletons";
import { getPublicCollection, NOT_FOUND } from "@/src/lib/publicData";
import { JsonLdScript } from "@/src/components/seo/JsonLdScript";
import { collectionLd, breadcrumbLd } from "@/src/lib/jsonld";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const id = (await params).id;
  return buildMetadata("collection", id, `/collections/${id}`, {
    title: "Collection | Kalakaar",
    description: "Curated Indian folk art collections.",
  });
}

export const revalidate = 300;

// Empty list = build nothing up front, but build each page on its first visit and then cache it.
export function generateStaticParams() {
  return [];
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const found: any = await getPublicCollection(id);
  // Drafts/archived items are invisible to the anonymous reader, so they cannot be told apart from missing ones:
  // render nothing server-side (the owner still sees them through the client view) and mark the page noindex.
  const collection = found === NOT_FOUND ? null : found;
  return (
    <>
      {collection && (
        <>
          <JsonLdScript data={collectionLd(collection, collection.artworks || [])} />
          <JsonLdScript
            data={breadcrumbLd([
              { name: "Home", path: "/" },
              { name: "Collections", path: "/collections" },
              { name: collection.title, path: `/collections/${collection.id}` },
            ])}
          />
        </>
      )}
      <Suspense
        fallback={
          <div className="max-w-7xl mx-auto p-6 sm:p-8">
            <ArtworkGridSkeleton count={6} />
          </div>
        }
      >
        <CollectionDetails initialCollection={collection} />
      </Suspense>
    </>
  );
}
