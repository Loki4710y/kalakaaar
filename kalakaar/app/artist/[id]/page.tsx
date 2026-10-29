import { buildMetadata } from "@/src/lib/seoData";
import { ArtistServerPage } from "@/src/components/seo/ArtistServerPage";
import { Metadata } from "next";

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
  return buildMetadata("artist", id, `/artist/${id}`, {
    title: "Artist | Kalakaar",
    description: "Discover traditional Indian artists on Kalakaar.",
  });
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  return <ArtistServerPage identifier={id} />;
}
