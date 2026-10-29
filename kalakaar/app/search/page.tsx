import { Suspense } from "react";
import { Search } from "@/src/views/Search";
import { Metadata } from "next";
import { SearchSkeleton } from "@/src/components/ui/Skeletons";

export const metadata: Metadata = {
  title: "Search Folk Art & Artisans | Kalakaar",
  description: "Search authentic Indian folk art paintings, master artisans, curated collections, and cultural folklore stories.",
  robots: { index: false, follow: true }, // search result pages are thin and endless; real pages are indexed instead
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto p-6 sm:p-8">
          <SearchSkeleton />
        </div>
      }
    >
      <Search />
    </Suspense>
  );
}
