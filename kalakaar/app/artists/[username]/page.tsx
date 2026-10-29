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
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const username = (await params).username;
  return buildMetadata("artist", username, `/artists/${username}`, {
    title: "Artist | Kalakaar",
    description: "Discover traditional Indian artists on Kalakaar.",
  });
}

export default async function Page({ params }: { params: Promise<{ username: string }> }) {
  const username = (await params).username;
  return <ArtistServerPage identifier={username} />;
}
