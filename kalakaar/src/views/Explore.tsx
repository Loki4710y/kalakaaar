"use client";
import { useLanguage } from "../contexts/LanguageContext";
import { EmptyState } from "../components/ui/EmptyState";
import { MadhubaniPattern, MadhubaniDivider } from "../components/patterns/MadhubaniPattern";
import { ArtworkCard } from "../components/ui/ArtworkCard";
import { CornerBracket } from "../components/ui/CornerBracket";
import { Filter, ChevronDown } from "lucide-react";
import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pagination } from "../components/ui/Pagination";
import { buildHref } from "../lib/listParams";
import type { Artwork } from "../../services/ArtworkService";
import type { Paged } from "../repositories/utils";
import type { DictKey } from "../lib/i18n";
import type { ExploreParams } from "../lib/publicData";

const ART_CATEGORIES = [
  { name: "ALL", count: 0 },
  { name: "Madhubani", count: 0 },
  { name: "Warli", count: 0 },
  { name: "Pattachitra", count: 0 },
  { name: "Tanjore", count: 0 },
  { name: "Folk Art", count: 0 },
];

const SORTS: { value: ExploreParams["sort"]; key: DictKey }[] = [
  { value: "featured", key: "explore.sort.featured" },
  { value: "price_asc", key: "explore.sort.price_asc" },
  { value: "price_desc", key: "explore.sort.price_desc" },
  { value: "newest", key: "explore.sort.newest" },
];

/**
 * The gallery is paginated on the server: `initial` is exactly one page of results (12 artworks) plus the
 * total count, rendered into the HTML. Filters, search, sort and page live in the URL (?category=&q=&sort=&page=).
 */
export function Explore({ initial, params }: { initial: Paged<Artwork> | null; params: ExploreParams }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(params.q);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const hrefFor = (patch: Partial<ExploreParams>) => {
    const next = { ...params, page: 1, ...patch };
    return buildHref("/explore", {
      category: next.category && next.category !== "ALL" ? next.category : undefined,
      sort: next.sort !== "featured" ? next.sort : undefined,
      q: next.q || undefined,
      page: next.page,
    });
  };

  const go = (patch: Partial<ExploreParams>) => startTransition(() => router.push(hrefFor(patch), { scroll: false }));

  // Search as you type, but only after a short pause so we do not query on every keystroke.
  useEffect(() => {
    if (searchInput.trim() === params.q) return;
    const t = setTimeout(() => go({ q: searchInput.trim() }), 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const displayedArtworks = initial?.items ?? [];
  const activeFilter = params.category || "ALL";
  const error = initial ? null : "We could not load the gallery right now. Please try again in a moment.";

  return (
    <main className="relative min-h-screen pb-24 bg-[#F5EFE0]">
      
      {/* Page Header */}
      <section className="relative pt-24 pb-20 overflow-hidden bg-[#F5EFE0]">
        <MadhubaniPattern opacity={0.06} stroke="#6B1E2E" />
        <div className="relative z-10 px-5 sm:px-8 lg:px-10 mx-auto max-w-[1440px] flex flex-col items-center text-center">
          <CornerBracket />
          <p className="font-sans text-[0.7rem] uppercase tracking-[0.2em] text-[#9C7A6A] mb-4">
            {t("explore.kicker")}
          </p>
          <h1 className="font-serif text-[3.5rem] leading-[1.1] text-[#2C1810] mb-4 italic">
            {t("explore.title")}
          </h1>
          <p className="font-sans text-[1rem] text-[#7A5C4E]">
            {t("explore.subtitle")}
          </p>
        </div>
      </section>

      <MadhubaniDivider />

      {/* Filters Bar (Sticky) */}
      <div className="sticky top-20 z-40 bg-[#EDE4CE] border-b border-[rgba(107,30,46,0.18)]">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-10 h-16 flex items-center justify-between gap-4">
          
          <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-3">
            {ART_CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                href={hrefFor({ category: cat.name })}
                scroll={false}
                className={`shrink-0 font-sans text-[0.75rem] uppercase tracking-[0.1em] px-4 py-2 transition-colors duration-250 ${
                  activeFilter === cat.name
                    ? "bg-[#6B1E2E] text-white"
                    : "border border-[rgba(107,30,46,0.18)] text-[#7A5C4E] hover:border-[#6B1E2E]"
                }`}
              >
                {cat.name === "ALL" ? t("explore.all") : cat.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4 shrink-0 border-l border-[rgba(107,30,46,0.18)] pl-4">
            <div className="relative hidden sm:block">
              <select
                value={params.sort}
                aria-label={t("explore.sortAria")}
                onChange={e => go({ sort: e.target.value as ExploreParams["sort"] })}
                className="appearance-none rounded-none bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] font-sans text-[0.95rem] text-[#2C1810] pr-8 pl-4 py-[0.75rem] focus:outline-none focus:border-[#6B1E2E] cursor-pointer"
              >
                {SORTS.map(o => <option key={o.value} value={o.value}>{t(o.key)}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A5C4E] pointer-events-none" />
            </div>
            
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center gap-2 font-sans text-[0.8rem] uppercase tracking-[0.1em] text-[#2C1810] hover:text-[#6B1E2E] transition-colors duration-250"
            >
              <Filter size={16} />
              <span className="hidden sm:inline">{t("explore.filters")}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-10 py-10 flex gap-10">
        
        {/* Sidebar Filters */}
        {sidebarOpen && (
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="space-y-8 sticky top-44">
              
              <div>
                <h3 className="font-serif text-[1.2rem] text-[#2C1810] mb-4">{t("explore.searchTitle")}</h3>
                <input
                  type="text"
                  placeholder={t("explore.searchPlaceholder")}
                  value={searchInput}
                  aria-label={t("explore.searchAria")}
                  onChange={e => setSearchInput(e.target.value)}
                  className="w-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] px-3 py-2 text-sm text-[#2C1810] focus:outline-none focus:border-[#6B1E2E]"
                />
              </div>

              <div>
                <h3 className="font-serif text-[1.2rem] text-[#2C1810] mb-4">{t("explore.categories")}</h3>
                <div className="space-y-2 font-sans text-[0.85rem] text-[#7A5C4E]">
                  {["Madhubani", "Warli", "Pattachitra", "Tanjore", "Gond", "Folk Art", "Miniature"].map(c => (
                    <Link
                      key={c}
                      href={hrefFor({ category: activeFilter === c ? "ALL" : c })}
                      scroll={false}
                      className={`block w-full text-left px-2 py-1 transition-colors ${
                        activeFilter === c ? 'bg-[#6B1E2E] text-white' : 'hover:text-[#6B1E2E]'
                      }`}
                    >
                      {c}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[rgba(107,30,46,0.18)]">
                <button
                  onClick={() => { setSearchInput(""); startTransition(() => router.push("/explore", { scroll: false })); }}
                  className="w-full text-center font-sans text-[0.85rem] text-[#7A5C4E] hover:text-[#6B1E2E] transition-colors underline decoration-transparent hover:decoration-[#6B1E2E] underline-offset-4"
                >
                  Reset Filters
                </button>
              </div>

            </div>
          </aside>
        )}

        {/* Artwork Grid */}
        <div className="flex-1">
          {error && (
             <div className="bg-[#D32F2F]/10 border border-[#D32F2F]/30 p-6 mb-8 text-[#D32F2F] font-sans">
                <h3 className="font-bold mb-2">Error loading collection</h3>
                <p>{error}</p>
             </div>
          )}
          {isPending && <div className="sr-only" role="status">Loading…</div>}
          {error ? null : displayedArtworks.length === 0 ? (
             <EmptyState type={params.q || (params.category && params.category !== "ALL") ? "no_search_results" : "no_artworks"} searchQuery={params.q || undefined} />
          ) : (
            <>
              <p className="font-sans text-[0.8rem] text-[#7A5C4E] mb-6">
                {initial?.total ?? 0} {(initial?.total ?? 0) === 1 ? "artwork" : "artworks"}
                {params.category && params.category !== "ALL" ? ` in ${params.category}` : ""}
                {params.q ? ` matching “${params.q}”` : ""}
              </p>
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 transition-opacity ${isPending ? "opacity-50" : ""}`}>
                {displayedArtworks.map(art => (
                  <ArtworkCard
                    key={art.id}
                    id={art.id}
                    like_count={art.like_count}
                    artistId={art.artist_id}
                    title={art.title || 'Untitled'}
                    artistName={art.profiles?.full_name || 'Artisan'}
                    artistWhatsapp={art.profiles?.whatsapp_number}
                    price={art.price || 0}
                    image_urls={art.image_urls}
                    style={art.category}
                    categories={[art.category]}
                    isSold={art.status === 'archived'}
                  />
                ))}
              </div>

              <Pagination page={initial?.page ?? 1} totalPages={initial?.totalPages ?? 1} hrefFor={(p) => hrefFor({ page: p })} />
            </>
          )}
        </div>

      </div>
    </main>
  );
}
