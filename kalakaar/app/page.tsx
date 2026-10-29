import { Home } from "@/src/views/Home";
import type { Metadata } from "next";
import { getPublicHome } from "@/src/lib/publicData";

// The home page is the only page that declares "/" as its canonical address.
export const metadata: Metadata = { alternates: { canonical: "/" } };

// Rendered with real content for search engines; the CDN refreshes it every 5 minutes.
export const revalidate = 300;

export default async function Page() {
  const initial = await getPublicHome();
  return <Home initial={initial} />;
}
