"use client";
import { EmptyState } from "../components/ui/EmptyState";
import { useLanguage } from "../contexts/LanguageContext";
import Link from "next/link";
import { MadhubaniPattern } from "../components/patterns/MadhubaniPattern";
import { CornerBracket } from "../components/ui/CornerBracket";
import { Search, MapPin, Lock } from "lucide-react";
import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pagination } from "../components/ui/Pagination";
import { buildHref } from "../lib/listParams";
import type { Paged } from "../repositories/utils";
import type { ArtistsParams } from "../lib/publicData";
import { useAuth } from "../contexts/AuthContext";
import { ArtistCard } from "../components/ui/ArtistCard";
import type { UserProfile } from "../../services/ProfileService";

const STYLE_FILTERS = ["ALL", "MADHUBANI", "WARLI", "TANJORE", "PATTACHITRA", "GOND ART", "FOLK ART"];

/**
 * The artist directory is paginated on the server: `initial` is one page (12 artists) plus the total count.
 * Search, style and page live in the URL (?q=&style=&page=).
 */
export function Artists({ initial, params }: { initial: Paged<UserProfile> | null; params: ArtistsParams }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(params.q);
  const { user } = useAuth();

  const hrefFor = (patch: Partial<ArtistsParams>) => {
    const next = { ...params, page: 1, ...patch };
    return buildHref("/artists", {
      style: next.style && next.style !== "ALL" ? next.style : undefined,
      q: next.q || undefined,
      page: next.page,
    });
  };
  const go = (patch: Partial<ArtistsParams>) => startTransition(() => router.push(hrefFor(patch), { scroll: false }));

  useEffect(() => {
    if (searchInput.trim() === params.q) return;
    const t = setTimeout(() => go({ q: searchInput.trim() }), 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const artists = initial?.items ?? [];
  const filteredArtists = artists;
  const totalCount = initial?.total ?? 0;
  const selectedStyle = params.style || "ALL";
  const loading = false;

  return (
    <main className="relative min-h-screen pb-32 bg-[#F5EFE0]">
      
      {/* Page Header */}
      <section className="relative w-full border-b border-[rgba(107,30,46,0.18)] bg-[#FFFDF7] pt-20 pb-16 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <MadhubaniPattern opacity={0.06} stroke="#6B1E2E" />
          <div className="absolute inset-x-8 inset-y-8">
             <CornerBracket />
          </div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <p className="font-sans text-[0.75rem] uppercase tracking-[0.2em] text-[#9C7A6A] mb-4">
             {t("artists.kicker")}
          </p>
          <h1 className="font-serif text-[3.2rem] md:text-[4rem] text-[#2C1810] leading-tight mb-4">
            {t("artists.title")}
          </h1>
          <p className="font-sans text-[1rem] text-[#7A5C4E] mb-8 max-w-[520px] mx-auto leading-relaxed">
            {t("artists.subtitle")}
          </p>
          <div className="flex items-center justify-center gap-6 font-sans text-[0.8rem] uppercase tracking-wider text-[#2C1810] flex-wrap">
             <div className="flex flex-col items-center"><span className="text-[1.2rem] font-serif text-[#6B1E2E]">{totalCount}</span> {t("artists.statArtisans")}</div>
             <span className="text-[rgba(107,30,46,0.18)] text-lg">|</span>
             <div className="flex flex-col items-center"><span className="text-[1.2rem] font-serif text-[#6B1E2E]">6</span> {t("artists.statStates")}</div>
             <span className="text-[rgba(107,30,46,0.18)] text-lg">|</span>
             <div className="flex flex-col items-center"><span className="text-[1.2rem] font-serif text-[#6B1E2E]">100%</span> {t("artists.statSupport")}</div>
          </div>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="sticky top-[80px] z-40 border-b border-[rgba(107,30,46,0.18)] bg-[rgba(255,253,247,0.95)] backdrop-blur-md shadow-xs">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-10 py-5">
           <div className="flex flex-col gap-5">
             <div className="relative w-full">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9C7A6A]" size={20} />
               <input 
                 type="text" 
                 value={searchInput}
                 aria-label={t("artists.searchAria")}
                 onChange={(e) => setSearchInput(e.target.value)}
                 placeholder={t("artists.searchPlaceholder")} 
                 className="w-full pl-12 pr-[1rem] py-[0.75rem] bg-[#F5EFE0] border border-[rgba(107,30,46,0.18)] focus:outline-none focus:border-[#6B1E2E] font-sans text-[0.95rem] transition-colors rounded-none placeholder:text-[#9C7A6A] text-[#2C1810]"
               />
             </div>
             
             <div className="flex items-center justify-between flex-wrap gap-4">
               <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar flex-1 whitespace-nowrap">
                 {STYLE_FILTERS.map(filter => (
                   <Link 
                     key={filter} 
                     href={hrefFor({ style: filter })}
                     scroll={false}
                     className={`font-sans text-[0.7rem] uppercase tracking-wider px-3.5 py-1.5 border transition-colors whitespace-nowrap ${
                       selectedStyle === filter
                         ? "bg-[#6B1E2E] text-white border-[#6B1E2E] font-semibold"
                         : "border-[rgba(107,30,46,0.18)] text-[#2C1810] hover:border-[#6B1E2E] hover:bg-[rgba(107,30,46,0.08)]"
                     }`}
                   >
                     {filter}
                   </Link>
                 ))}
               </div>
               
               <div className="flex items-center gap-4 shrink-0">
                 <div className="relative group">
                   <button className="flex items-center gap-2 font-sans text-[0.75rem] uppercase tracking-wider text-[#2C1810] border border-[rgba(107,30,46,0.18)] px-3 py-1.5 hover:border-[#6B1E2E] transition-colors">
                     <MapPin size={14} /> Location: All States
                   </button>
                 </div>
               </div>
             </div>
             
             <div className="font-sans text-[0.75rem] text-[#7A5C4E]">
               Showing {filteredArtists.length} of {totalCount} artist profiles
             </div>
           </div>
        </div>
      </section>

      {/* Artists Grid */}
      <section className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-10 py-12 relative">
         <div className="relative">
           {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
               {[1, 2, 3, 4, 5, 6].map((i) => (
                 <div key={i} className="flex flex-col border border-[rgba(107,30,46,0.18)] bg-[#FFFDF7] h-[380px]">
                   <div className="h-[140px] bg-[#EDE4CE]" />
                   <div className="p-6 flex flex-col items-center gap-3 flex-1">
                     <div className="w-20 h-20 rounded-full bg-[#EDE4CE] -mt-12" />
                     <div className="h-5 w-1/2 bg-[#EDE4CE]" />
                     <div className="h-4 w-1/3 bg-[#EDE4CE]" />
                     <div className="h-10 w-full bg-[#EDE4CE] mt-auto" />
                   </div>
                 </div>
               ))}
             </div>
           ) : filteredArtists.length === 0 ? (
             <EmptyState
               type="no_artists"
               actionLabel={t("empty.resetFilters")}
               onAction={() => { setSearchInput(""); startTransition(() => router.push("/artists", { scroll: false })); }}
             />
           ) : (
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch transition-opacity ${isPending ? "opacity-50" : ""}`}>
              {filteredArtists.map((artist, idx) => (
                <div key={artist.id || artist.username || idx} className="h-full">
                  <ArtistCard artist={artist} />
                </div>
              ))}
            </div>
           )}
           
           <Pagination page={initial?.page ?? 1} totalPages={initial?.totalPages ?? 1} hrefFor={(p) => hrefFor({ page: p })} />

           {!user && filteredArtists.length > 6 && (
              <div className="mt-16 bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-10 shadow-sm max-w-[480px] mx-auto text-center">
                <div className="w-14 h-14 bg-[rgba(107,30,46,0.08)] rounded-full border border-[rgba(107,30,46,0.18)] flex items-center justify-center mx-auto mb-4">
                  <Lock className="text-[#6B1E2E]" size={24} />
                </div>
                <h3 className="font-serif text-[1.8rem] text-[#2C1810] mb-2">{t("artists.directoryTitle")}</h3>
                <p className="font-sans text-[0.9rem] text-[#7A5C4E] mb-6 leading-relaxed">
                  {t("artists.directoryDesc")}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                   <Link href="/auth?mode=signup" className="py-2.5 px-6 bg-[#6B1E2E] text-white font-sans text-[0.8rem] uppercase tracking-wider font-semibold hover:bg-[#8B2A3E] transition-colors">
                     {t("artists.joinFree")}
                   </Link>
                   <Link href="/auth?mode=signin" className="py-2.5 px-6 border border-[rgba(107,30,46,0.18)] text-[#2C1810] font-sans text-[0.8rem] uppercase tracking-wider font-semibold hover:border-[#6B1E2E] hover:bg-[#EDE4CE] transition-colors">
                     {t("nav.signIn")}
                   </Link>
                </div>
              </div>
           )}
         </div>
      </section>

    </main>
  );
}

