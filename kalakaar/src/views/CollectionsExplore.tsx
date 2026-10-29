"use client";
import { EmptyState } from "../components/ui/EmptyState";
import { useLanguage } from "../contexts/LanguageContext";
import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pagination } from "../components/ui/Pagination";
import { buildHref } from "../lib/listParams";
import type { Paged } from "../repositories/utils";
import type { CollectionsParams } from "../lib/publicData";
import Link from "next/link";
import Image from "next/image";
import { MadhubaniPattern, MadhubaniDivider } from "../components/patterns/MadhubaniPattern";
import { CornerBracket } from "../components/ui/CornerBracket";
import { GoldButton } from "../components/ui/GoldButton";
import { Search, Layers, Plus } from "lucide-react";
import type { Collection } from "../../services/CollectionService";
import { useAuth } from "../contexts/AuthContext";

/**
 * Collections are paginated on the server: `initial` is one page (9 collections) plus the total count.
 * Search and page live in the URL (?q=&page=). `featured` is shown on the first page only.
 */
export function CollectionsExplore({ initial, featured, params }: { initial: Paged<Collection> | null; featured: Collection[]; params: CollectionsParams }) {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState(params.q);

  const hrefFor = (patch: Partial<CollectionsParams>) => {
    const next = { ...params, page: 1, ...patch };
    return buildHref("/collections", { q: next.q || undefined, page: next.page });
  };
  const go = (patch: Partial<CollectionsParams>) => startTransition(() => router.push(hrefFor(patch), { scroll: false }));

  useEffect(() => {
    if (searchQuery.trim() === params.q) return;
    const t = setTimeout(() => go({ q: searchQuery.trim() }), 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const collections = initial?.items ?? [];
  const featuredCollections = params.page === 1 ? featured : [];
  const loading = false;
  const error = initial ? null : "We could not load the collections right now. Please try again in a moment.";

  return (
    <main className="relative min-h-screen pb-24 bg-[#F5EFE0]">
      
      {/* Page Header */}
      <section className="relative pt-24 pb-20 overflow-hidden bg-[#F5EFE0]">
        <MadhubaniPattern opacity={0.06} stroke="#6B1E2E" />
        <div className="relative z-10 px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl flex flex-col items-center text-center">
          <CornerBracket />
          <p className="font-sans text-[0.7rem] uppercase tracking-[0.2em] text-[#9C7A6A] mb-4">
            — THEMED GALLERIES —
          </p>
          <h1 className="font-serif text-[3.5rem] leading-[1.1] text-[#2C1810] mb-4 italic">
            Curated Collections
          </h1>
          <p className="font-sans text-[1rem] text-[#7A5C4E] max-w-2xl">
            Explore thematic stories and handpicked series assembled by traditional Indian artisans and master curators.
          </p>

          {user && (
            <div className="mt-8">
              <Link href="/collections/new">
                <GoldButton variant="primary" className="flex items-center gap-2 px-6 py-3">
                  <Plus size={16} /> Create Collection
                </GoldButton>
              </Link>
            </div>
          )}
        </div>
      </section>

      <MadhubaniDivider />

      {/* Featured Collections Section */}
      {featuredCollections.length > 0 && !params.q && (
        <section className="py-16 bg-[#EDE4CE]/40 border-b border-[rgba(107,30,46,0.18)]">
          <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-10">
            <div className="flex flex-col items-center text-center mb-10">
              <span className="font-sans text-[0.72rem] uppercase tracking-[0.18em] text-[#9C7A6A] mb-2">
                — Handpicked —
              </span>
              <h2 className="font-serif text-[2.2rem] text-[#2C1810]">
                Featured Collections
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredCollections.map((col) => {
                const cover = col.cover_image_url || "/assets/defaults/collection.svg";
                const count = col.artworks?.length || 0;
                return (
                  <Link
                    key={col.id}
                    href={`/collections/${col.id}`}
                    className="group relative h-[340px] overflow-hidden border border-[rgba(107,30,46,0.18)] bg-[#FFFDF7] shadow-sm flex flex-col justify-end p-6"
                  >
                    <Image
                      src={cover}
                      alt={col.title}
                      fill
 sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover opacity-90 group-hover:scale-105 transition-all duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2C1810] via-[#2C1810]/40 to-transparent opacity-90" />
                    
                    <div className="relative z-10 text-[#FFFDF7]">
                      <span className="font-sans text-[0.7rem] uppercase tracking-wider text-[#EDE4CE] mb-1.5 block font-medium">
                        By {col.profiles?.full_name || 'Artisan'}
                      </span>
                      <h3 className="font-serif text-[1.7rem] leading-tight mb-2">
                        {col.title}
                      </h3>
                      <p className="font-sans text-[0.8rem] text-[#EDE4CE]/90 flex items-center gap-1">
                        <Layers size={14} /> {count} {count === 1 ? 'Artwork' : 'Artworks'}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Main Search & Grid Container */}
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-10 py-16">
        
        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-16">
          <div className="relative">
            <input
              type="text"
              placeholder={t("collections.searchPlaceholder")}
              value={searchQuery}
              aria-label={t("collections.searchAria")}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.25)] px-5 py-3.5 pl-12 font-sans text-[0.95rem] text-[#2C1810] focus:outline-none focus:border-[#6B1E2E] transition-colors"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A5C4E]" size={18} />
          </div>
        </div>

        {/* Collections Grid */}
        {error && (
          <div className="bg-red-100 border border-red-300 text-red-800 p-4 mb-8 font-sans text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-[#EDE4CE]"></div>
            ))}
          </div>
        ) : collections.length === 0 ? (
          <EmptyState
            type="no_collections"
            description={t("empty.collectionsFiltered")}
            {...(searchQuery ? { actionLabel: t("empty.clearSearch"), onAction: () => { setSearchQuery(""); startTransition(() => router.push("/collections", { scroll: false })); } } : {})}
          />
        ) : (
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 transition-opacity ${isPending ? "opacity-50" : ""}`}>
            {collections.map((col) => {
              const cover = col.cover_image_url || "/assets/defaults/collection.svg";
              const count = col.artworks?.length || 0;
              return (
                <Link
                  key={col.id}
                  href={`/collections/${col.id}`}
                  className="group bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] hover:border-[#6B1E2E] transition-all duration-300 flex flex-col shadow-sm"
                >
                  <div className="relative h-60 w-full bg-[#EDE4CE] overflow-hidden">
                    <Image
                      src={cover}
                      alt={col.title}
                      fill
 sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-all duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 right-3 bg-[#6B1E2E]/90 text-[#FFFDF7] px-2.5 py-1 text-[0.7rem] uppercase font-sans tracking-wider font-semibold">
                      {count} {count === 1 ? 'Artwork' : 'Artworks'}
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-1 justify-between">
                    <div>
                      <span className="font-sans text-[0.7rem] uppercase tracking-wider text-[#7A5C4E] mb-1 block">
                        By {col.profiles?.full_name || 'Artisan'}
                      </span>
                      <h3 className="font-serif text-[1.4rem] text-[#2C1810] font-semibold mb-2 group-hover:text-[#6B1E2E] transition-colors">
                        {col.title}
                      </h3>
                      {col.description && (
                        <p className="font-sans text-[0.85rem] text-[#7A5C4E] line-clamp-2 leading-relaxed mb-4">
                          {col.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-[#6B1E2E]/[0.072] flex justify-between items-center text-xs font-sans text-[#6B1E2E] uppercase tracking-wider font-semibold">
                      <span>{t("empty.exploreGallery")}</span>
                      <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <Pagination page={initial?.page ?? 1} totalPages={initial?.totalPages ?? 1} hrefFor={(p) => hrefFor({ page: p })} />

      </div>
    </main>
  );
}
