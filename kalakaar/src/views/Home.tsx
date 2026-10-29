"use client";
import { useLanguage } from "../contexts/LanguageContext";
import { EmptyState } from "../components/ui/EmptyState";
import { MadhubaniPattern, MadhubaniDivider, CornerBrackets } from "../components/patterns/MadhubaniPattern";
import { GoldButton } from "../components/ui/GoldButton";
import { ArtworkCard } from "../components/ui/ArtworkCard";
import { ArtistCard } from "../components/ui/ArtistCard";
import Link from "next/link";
import Image from "next/image";
import { Search, PenTool, CheckCircle2, Lock, ArrowRight, Star } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useStore } from "../contexts/StoreContext";
import { useEffect, useState } from "react";
import { WelcomeBanner } from "../components/home/WelcomeBanner";
import { QuoteOfTheDay } from "../components/home/QuoteOfTheDay";
import { CulturalFactOfTheDay } from "../components/home/CulturalFactOfTheDay";
import { PremiumLoader } from "../components/ui/PremiumLoader";
import { CollectionService, Collection } from "../../services/CollectionService";
import { ArtworkService } from "../../services/ArtworkService";
import { ProfileService } from "../../services/ProfileService";
import { StoryService } from "../../services/StoryService";
import { AdminService } from "../../services/AdminService";

function SectionHeader({ label, title, subtext }: { label: string, title: string, subtext?: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="font-sans text-[0.72rem] uppercase tracking-[0.18em] text-[#9C7A6A] mb-[0.8rem]">
        — {label} —
      </span>
      <h2 className="font-serif text-[3rem] font-semibold text-[#2C1810] mb-[0.6rem]">{title}</h2>
      <div className="w-[40px] h-[2px] bg-[#6B1E2E] mx-auto mb-[1rem]" />
      {subtext && (
        <p className="font-sans text-[1rem] text-[#7A5C4E] max-w-[520px] mx-auto leading-[1.8]">
          {subtext}
        </p>
      )}
    </div>
  );
}

type HomeInitial = { collections?: any[]; artworks?: any[]; artists?: any[]; stories?: any[] };

/** `initial` is rendered on the server so search engines see real artworks, artists and stories with working links. */
export function Home({ initial }: { initial?: HomeInitial } = {}) {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const { recentlyViewed } = useStore();
  
  const [activeHighlightTab, setActiveHighlightTab] = useState("trending");

  const [highlights, setHighlights] = useState<{
    trending: any[];
    newArrivals: any[];
    wishlisted: any[];
    featured: any[];
  }>({
    trending: initial?.artworks ?? [],
    newArrivals: initial?.artworks ?? [],
    wishlisted: initial?.artworks ?? [],
    featured: initial?.artworks ?? []
  });
  
  const [stats, setStats] = useState({
    artists: initial?.artists?.length ?? 0,
    artworks: initial?.artworks?.length ?? 0,
    cities: 0
  });

  const [featuredArtists, setFeaturedArtists] = useState<any[]>(initial?.artists ?? []);
  const [artistOfTheMonth, setArtistOfTheMonth] = useState<any>(null);
  const [topCollections, setTopCollections] = useState<Collection[]>((initial?.collections ?? []).slice(0, 3));
  const [artistCollections, setArtistCollections] = useState<Collection[]>(initial?.collections ?? []);
  const [, setLatestStories] = useState<any[]>(initial?.stories ?? []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return; // wait to know if the visitor is logged in
    let cancelled = false;

    type HomeData = { collections?: any[]; artworks?: any[]; artists?: any[]; stories?: any[]; artistOfTheMonth?: any };

    const apply = (d: HomeData) => {
      if (cancelled) return;
      if (d.collections) {
        setTopCollections(d.collections.slice(0, 3));
        setArtistCollections(d.collections);
      }
      if (d.artworks) {
        const arts = d.artworks;
        setHighlights({ trending: arts, newArrivals: arts, wishlisted: arts, featured: arts });
        setStats(prev => ({ ...prev, artworks: arts.length }));
      }
      if (d.artists) {
        setFeaturedArtists(d.artists);
        setStats(prev => ({ ...prev, artists: d.artists!.length }));
      }
      if (d.stories) setLatestStories(d.stories);
      if (d.artistOfTheMonth) setArtistOfTheMonth(d.artistOfTheMonth);
    };

    // Logged-out visitors: one CDN-cached request shared by everyone.
    const loadShared = async (): Promise<boolean> => {
      try {
        const res = await fetch("/api/public/home");
        if (!res.ok) return false;
        apply(await res.json());
        return true;
      } catch {
        return false;
      }
    };

    // Logged-in visitors (and fallback): direct queries, so artist contact buttons work on cards.
    const loadDirect = async () => {
      const [collRes, artRes, artistRes, storyRes, aotmRes] = await Promise.all([
        CollectionService.getFeaturedCollections(6),
        ArtworkService.getFeaturedArtworks(8),
        ProfileService.getFeaturedArtists(6),
        StoryService.getFeaturedStories(3),
        AdminService.getArtistOfTheMonth(),
      ]);
      apply({
        collections: collRes.success ? collRes.data : undefined,
        artworks: artRes.success ? artRes.data : undefined,
        artists: artistRes.data,
        stories: storyRes.success ? storyRes.data : undefined,
        artistOfTheMonth: aotmRes.success ? aotmRes.data : undefined,
      });
    };

    (async () => {
      setLoading(true);
      try {
        if (user || !(await loadShared())) await loadDirect();
      } catch (err) {
        console.error("Error loading home page data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  const recentItems = [...highlights.trending, ...highlights.newArrivals, ...highlights.featured, ...highlights.wishlisted]
    .filter(a => recentlyViewed.includes(a.id))
    .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
    .slice(0, 4);

  const displayedArtworks = highlights[activeHighlightTab as keyof typeof highlights] || [];

  const getArtistsText = (n: number) => {
    if (n === 0) return "Be the first artist";
    if (n === 1) return "1 Artist";
    if (n >= 2 && n <= 10) return `${n} Artists & Growing`;
    if (n >= 11 && n <= 50) return `${n} Talented Artists`;
    if (n >= 51 && n <= 100) return `${n} Artists Strong`;
    return `${n}+ Artists Nationwide`;
  };

  const getArtworksText = (n: number) => {
    if (n === 0) return "No artworks yet";
    if (n === 1) return "1 Artwork Listed";
    if (n >= 2 && n <= 20) return `${n} Unique Artworks`;
    if (n >= 21 && n <= 100) return `${n} Handcrafted Artworks`;
    return `${n}+ Original Artworks`;
  };

  const getCitiesText = (n: number) => {
    if (n === 0) return "Across India";
    if (n === 1) return "From 1 City";
    if (n >= 2 && n <= 5) return `From ${n} Cities`;
    if (n >= 6 && n <= 15) return `Spanning ${n} Cities`;
    return `${n}+ Cities Nationwide`;
  };

    const heroTitle = { line1: "Discover the Soul of", line2: "Indian Art" };


  if (loading) {
     return <PremiumLoader message="Preparing your gallery..." fullScreen />;
  }

  return (
    <main className="relative min-h-screen">
      
      {/* Welcome Banner */}
      <WelcomeBanner />

      {/* Cultural Fact of the Day */}
      <CulturalFactOfTheDay />

      {/* Hero Section */}
      <section className="relative min-h-[88vh] flex items-center justify-center bg-[#F5EFE0] overflow-hidden">
        <MadhubaniPattern opacity={0.06} className="z-0" />
        <CornerBrackets />
        
        <div className="relative z-10 px-5 sm:px-8 lg:px-10 mx-auto max-w-[1440px] flex flex-col items-center text-center mt-12 mb-12">
            <p className="font-sans text-[0.72rem] uppercase tracking-[0.2em] text-[#9C7A6A] mb-[0.8rem]">
              {t("home.kicker")}
            </p>
            <h1 className="font-serif text-3xl sm:text-5xl md:text-[5.5rem] leading-[1.1] text-[#4A1b24] font-normal mb-[1.5rem]">
              <span className="block">{heroTitle.line1}</span>
              <span className="block italic">{heroTitle.line2}</span>
            </h1>
            <p className="font-sans text-[1rem] text-[#4A1b24] mb-[2.5rem] max-w-[620px] mx-auto leading-[2]">
              {t("home.heroLine1")}
              <br className="hidden md:block" />
              {t("home.heroLine2")}
              <br className="hidden md:block" />
              {t("home.heroLine3")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-[1rem] mb-[1.5rem]">
              <Link href={user ? "/explore" : "/auth?mode=signin&returnUrl=/explore"}>
                <GoldButton variant="primary">{user ? t("home.exploreCta") : t("home.loginCta")}</GoldButton>
              </Link>
              {!user && (
                <Link href="/auth?role=artist&mode=signup">
                  <GoldButton variant="outline">{t("home.joinArtistCaps")}</GoldButton>
                </Link>
              )}
            </div>
            {/* Dynamic Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-16 mt-16 pt-10 border-t border-[rgba(107,30,46,0.18)] max-w-4xl mx-auto">
               <div className="flex flex-col items-center">
                 <span className="font-serif text-[2.5rem] text-[#6B1E2E] leading-tight">{stats.artists}</span>
                 <span className="font-sans text-[0.75rem] uppercase tracking-widest text-[#7A5C4E] mt-1">{getArtistsText(stats.artists)}</span>
               </div>
               <div className="flex flex-col items-center">
                 <span className="font-serif text-[2.5rem] text-[#6B1E2E] leading-tight">{stats.artworks}</span>
                 <span className="font-sans text-[0.75rem] uppercase tracking-widest text-[#7A5C4E] mt-1">{getArtworksText(stats.artworks)}</span>
               </div>
               <div className="flex flex-col items-center">
                 <span className="font-serif text-[2.5rem] text-[#6B1E2E] leading-tight">{stats.cities}</span>
                 <span className="font-sans text-[0.75rem] uppercase tracking-widest text-[#7A5C4E] mt-1">{getCitiesText(stats.cities)}</span>
               </div>
            </div>
        </div>
      </section>

      <MadhubaniDivider />

      {/* Artist of the Month Spotlight */}
      {artistOfTheMonth && (
        <section className="py-20 px-5 sm:px-8 lg:px-10 mx-auto max-w-[1440px] bg-[#FFFDF7]">
          <div className="flex flex-col md:flex-row items-center gap-12 border border-[rgba(107,30,46,0.18)] p-8 md:p-12">
            <div className="w-full md:w-1/3 flex flex-col items-center text-center">
               <p className="font-sans text-[0.75rem] uppercase tracking-[0.2em] text-[#9C7A6A] mb-4">{t("home.artistOfMonth")}</p>
               <div className="w-48 h-48 relative rounded-full border-4 border-[#6B1E2E] overflow-hidden mb-6 p-1 bg-[#F5EFE0]">
                 <Image src={artistOfTheMonth.profiles?.avatar_url || '/assets/defaults/avatar.svg'} fill alt="Artist" className="object-cover rounded-full" />
               </div>
               <h3 className="font-serif text-[2.5rem] text-[#2C1810] leading-none mb-2">{artistOfTheMonth.profiles?.full_name}</h3>
               <p className="font-sans text-[0.85rem] text-[#7A5C4E] uppercase tracking-wider mb-6">{artistOfTheMonth.profiles?.city || 'India'}</p>
               <Link href={`/artist/${artistOfTheMonth.artist_id}`}>
                 <GoldButton variant="outline">{t("home.viewPortfolio")}</GoldButton>
               </Link>
            </div>
            <div className="w-full md:w-2/3 flex flex-col justify-center">
              <div className="relative">
                 <span className="absolute -top-6 -left-4 font-serif text-[6rem] text-[#6B1E2E] opacity-10 leading-none">&quot;</span>
                 <p className="font-serif text-[1.8rem] text-[#2C1810] leading-relaxed mb-8 relative z-10">
                   {artistOfTheMonth.quote || "Art is the journey of a free soul. It connects us to our roots while letting us explore the boundless sky."}
                 </p>
              </div>
              <div className="bg-[#F5EFE0] p-6 border-l-4 border-[#6B1E2E]">
                 <p className="font-sans text-[0.75rem] uppercase tracking-wider text-[#9C7A6A] mb-2">{t("home.curatorNote")}</p>
                 <p className="font-sans text-[0.95rem] text-[#4A1b24] leading-relaxed">
                   {artistOfTheMonth.curator_note || "Selected for their exceptional contribution to preserving traditional techniques while bringing a fresh, contemporary perspective to Indian heritage art."}
                 </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Put back Recently Viewed if there are items */}
      {user && recentItems.length > 0 && (
         <section className="py-16 px-5 sm:px-8 lg:px-10 mx-auto max-w-[1440px] bg-[#FFFDF7] border-b border-[rgba(107,30,46,0.18)]">
            <div className="flex items-center justify-between mb-8">
               <h2 className="font-serif text-[2rem] text-[#2C1810]">{t("home.pickUp")}</h2>
               <Link href="/explore" className="font-sans text-[0.75rem] uppercase tracking-[0.1em] text-[#6B1E2E] flex items-center group">
                 View All <ArrowRight size={14} className="ml-1 transform group-hover:translate-x-1 transition-transform" />
               </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
               {recentItems.map(art => (
                 <ArtworkCard key={art.id} artistId={art.artist_id || art.profiles?.id} artistWhatsapp={art.profiles?.whatsapp_number} artistName={art.profiles?.full_name || "Artisan"} {...art} />
               ))}
            </div>
         </section>
      )}

      {/* Highlights Gate */}
      <section className="py-24 px-5 sm:px-8 lg:px-10 mx-auto max-w-[1440px] relative z-10 w-full">
        <SectionHeader label={t("home.curatedLabel")} title={t("home.highlights")} />
        
        {/* Sub-tabs */}
        <div className="flex justify-center gap-6 mb-12 mt-8 flex-wrap">
           <button 
             onClick={() => setActiveHighlightTab("trending")}
             className={`font-sans text-[0.8rem] uppercase tracking-[0.15em] pb-1 border-b-[1.5px] transition-colors flex items-center gap-1 ${activeHighlightTab === "trending" ? "text-[#6B1E2E] border-[#6B1E2E]" : "text-[#7A5C4E] border-transparent hover:text-[#6B1E2E]"}`}
           >
             Trending This Week 🔥
           </button>
           <button 
             onClick={() => setActiveHighlightTab("newArrivals")}
             className={`font-sans text-[0.8rem] uppercase tracking-[0.15em] pb-1 border-b-[1.5px] transition-colors ${activeHighlightTab === "newArrivals" ? "text-[#6B1E2E] border-[#6B1E2E]" : "text-[#7A5C4E] border-transparent hover:text-[#6B1E2E]"}`}
           >
             New Arrivals
           </button>
           <button 
             onClick={() => setActiveHighlightTab("wishlisted")}
             className={`font-sans text-[0.8rem] uppercase tracking-[0.15em] pb-1 border-b-[1.5px] transition-colors ${activeHighlightTab === "wishlisted" ? "text-[#6B1E2E] border-[#6B1E2E]" : "text-[#7A5C4E] border-transparent hover:text-[#6B1E2E]"}`}
           >
             Most Wishlisted
           </button>
           <button 
             onClick={() => setActiveHighlightTab("featured")}
             className={`font-sans text-[0.8rem] uppercase tracking-[0.15em] pb-1 border-b-[1.5px] transition-colors ${activeHighlightTab === "featured" ? "text-[#6B1E2E] border-[#6B1E2E]" : "text-[#7A5C4E] border-transparent hover:text-[#6B1E2E]"}`}
           >
             Featured Artwork
           </button>
        </div>

        <div className="relative">
          {displayedArtworks.length === 0 ? (
            <EmptyState type="no_artworks" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayedArtworks.slice(0, user ? 8 : 4).map((art, idx) => (
                <div key={art.id} className={!user ? "blur-[8px] pointer-events-none opacity-60" : ""}>
                  <ArtworkCard artistId={art.artist_id || art.profiles?.id} artistWhatsapp={art.profiles?.whatsapp_number} artistName={art.profiles?.full_name || "Artisan"} {...art} />
                </div>
              ))}
            </div>
          )}
          
          {!user && displayedArtworks.length > 0 && (
            <div className="absolute top-1/2 left-0 right-0 bottom-0 bg-gradient-to-b from-transparent to-[rgba(245,239,224,0.97)] via-[rgba(245,239,224,0.85)] z-20 flex flex-col items-center justify-end pb-12">
               <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-8 max-w-md w-full flex flex-col items-center text-center transform translate-y-12">
                 <div className="mb-4">
                   <Lock className="text-[#6B1E2E]" size={24} />
                 </div>
                 <h3 className="font-serif text-[1.8rem] text-[#2C1810] mb-3">{t("home.loginToView")}</h3>
                 <p className="font-sans text-[0.9rem] text-[#7A5C4E] mb-6 leading-relaxed">
                   Join free to explore the full collection and connect with artists.
                 </p>
                 <div className="flex flex-col gap-3 w-full">
                    <Link href="/auth?mode=signup" className="w-full text-center py-3 bg-[#6B1E2E] text-[#FFFDF7] font-sans text-[0.8rem] uppercase tracking-[0.1em] hover:bg-[#8B2A3E] transition-colors">
                      Create Free Account
                    </Link>
                    <Link href="/auth?mode=signin" className="w-full text-center py-3 border border-[#6B1E2E] text-[#6B1E2E] font-sans text-[0.8rem] uppercase tracking-[0.1em] hover:bg-[#6B1E2E] hover:text-[#FFFDF7] transition-colors">
                      Sign In
                    </Link>
                 </div>
               </div>
            </div>
          )}
        </div>
      </section>

      <MadhubaniDivider />

      {user && (
        <>
          {/* Curated Collections Banner */}
          <section className="bg-[#2C1810] text-[#EDE4CE] py-20 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-[50px] overflow-hidden opacity-10">
               <MadhubaniPattern stroke="#EDE4CE" />
             </div>
             <div className="px-5 sm:px-8 lg:px-10 mx-auto max-w-[1440px] grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
                <div className="md:col-span-5 relative z-10">
                   <span className="font-sans text-[0.72rem] uppercase tracking-[0.18em] text-[#9C7A6A] mb-[0.8rem] block">— Curated For You —</span>
                   <h2 className="font-serif text-[3rem] font-semibold leading-[1.1] mb-[0.6rem] text-[#FFFDF7]">{t("home.themedCollections")}</h2>
                   <div className="w-[40px] h-[2px] bg-[#6B1E2E] mb-[1rem]" />
                   <p className="font-sans text-[1rem] leading-[1.8] mb-[2rem] text-[#7A5C4E]">
                      From deep explorations of single regions to stylistic pairings. Our curators bring together artworks that tell a larger story when displayed side-by-side.
                   </p>
                   <Link href="/collections">
                     <GoldButton variant="outline" className="border-[#6B1E2E] text-[#6B1E2E] hover:text-[#FFFDF7] bg-transparent">
                        Explore Collections
                     </GoldButton>
                   </Link>
                </div>
                <div className="md:col-span-7 relative">
                   {topCollections.length === 0 ? (
                     <EmptyState type="no_collections" />
                   ) : (
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {topCollections.map((col, i) => {
                          const cover = col.cover_image_url || (col as any).cover_url || "/assets/defaults/collection.svg";
                          return (
                            <Link key={col.id} href={`/collections/${col.id}`} className={`group relative h-[200px] overflow-hidden border border-[rgba(237,228,206,0.1)] rounded-none`}>
                               <Image src={cover} alt={col.title} fill className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" referrerPolicy="no-referrer" sizes="(max-width: 768px) 50vw, 33vw" />
                               <div className="absolute bottom-4 left-4 z-10">
                                  <h3 className="font-serif text-[1.4rem] text-[#FFFDF7]">{col.title}</h3>
                               </div>
                            </Link>
                          );
                        })}
                     </div>
                   )}
                </div>
             </div>
          </section>

          {/* Artist Collections Banner */}
          <section className="bg-[#FFFDF7] py-24 relative overflow-hidden text-[#2C1810]">
             <div className="px-5 sm:px-8 lg:px-10 mx-auto max-w-[1440px]">
                <SectionHeader label={t("home.byArtistsLabel")} title={t("home.artistCollections")} subtext={t("home.artistCollectionsSub")} />
                
                <div className="mt-16">
                   {artistCollections.length === 0 ? (
                     <EmptyState type="no_collections" />
                   ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {artistCollections.map((col, i) => (
                          <Link key={col.id} href={`/collections/${col.id}`} className="group block h-[350px] relative overflow-hidden border border-[rgba(107,30,46,0.18)] bg-[#EDE4CE]">
                             <Image src={col.cover_image_url || (col as any).cover_url || "/assets/defaults/collection.svg"} alt={col.title} fill className="object-cover opacity-90 group-hover:scale-105 transition-all duration-500" referrerPolicy="no-referrer" sizes="(max-width: 768px) 100vw, 33vw" />
                             <div className="absolute inset-0 bg-gradient-to-t from-[#2C1810] via-black/20 to-transparent opacity-80" />
                             <div className="absolute bottom-6 left-6 right-6 z-10 text-[#FFFDF7]">
                                <span className="font-sans text-[0.7rem] uppercase tracking-wider text-[#EDE4CE] mb-2 block font-medium group-hover:text-[#FFFDF7]">By {col.profiles?.full_name || 'Artist'}</span>
                                <h3 className="font-serif text-[1.8rem] leading-tight mb-1">{col.title}</h3>
                                <p className="font-sans text-[0.8rem] text-[#EDE4CE]">{col.artworks?.length || (col as any).artwork_count || 0} Artworks</p>
                             </div>
                          </Link>
                        ))}
                     </div>
                   )}
                </div>
             </div>
          </section>

          {/* Artist of the Month */}
          <section className="py-24 bg-[#FFFDF7] border-b border-[rgba(107,30,46,0.18)] flex flex-col items-center">
             <div className="px-5 sm:px-8 lg:px-10 mx-auto max-w-[1440px] w-full">
                {featuredArtists.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                   <div className="relative group">
                      <div className="relative h-[500px] w-full border border-[rgba(107,30,46,0.18)] overflow-hidden bg-[#EDE4CE]">
                         <Image src={featuredArtists[0]?.avatarUrl || "/assets/defaults/avatar.svg"} alt={featuredArtists[0]?.name || "Artist"} fill className="object-cover filter saturate-0 group-hover:saturate-100 transition-all duration-700" referrerPolicy="no-referrer" />
                      </div>
                      <div className="absolute -bottom-6 -right-6 md:-bottom-8 md:-right-8 bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-6 max-w-xs shadow-[0_4px_24px_rgba(107,30,46,0.10)] rounded-none">
                         <div className="flex gap-1 mb-2 text-[#6B1E2E]">
                            <Star size={16} className="fill-current" /><Star size={16} className="fill-current" /><Star size={16} className="fill-current" />
                         </div>
                         <p className="font-serif text-[1.2rem] text-[#2C1810] italic leading-tight">
                            &quot;Art is not just what we see. It is a way of keeping our ancestors alive in the modern world.&quot;
                         </p>
                      </div>
                   </div>
                   
                   <div>
                      <span className="font-sans text-[0.72rem] uppercase tracking-[0.18em] text-[#9C7A6A] mb-[0.8rem] block">— Artist of the Month —</span>
                      <h2 className="font-serif text-[3.5rem] text-[#2C1810] leading-[1] mb-[0.6rem] font-semibold">{featuredArtists[0]?.name || "Artist"}</h2>
                      <div className="w-[40px] h-[2px] bg-[#6B1E2E] mb-[1rem]" />
                      <p className="font-sans text-[0.8rem] uppercase tracking-[0.2em] text-[#7A5C4E] mb-8">{featuredArtists[0]?.city || "India"}</p>
                      
                      <p className="font-sans text-[1rem] text-[#7A5C4E] leading-[1.8] mb-10 max-w-[500px]">
                         Breathing life into traditions. This artist&apos;s mesmerizing use of natural dyes and intricate geometric linework caught the curator&apos;s eye this month.
                      </p>
                      
                      <Link href={`/artist/${featuredArtists[0]?.id || ''}`}>
                         <GoldButton variant="primary" className="flex justify-between">
                            View Portfolio <ArrowRight size={16} className="ml-2" />
                         </GoldButton>
                      </Link>
                   </div>
                </div>
                ) : (
                   <div className="text-center py-20 border rounded-none bg-[#FFFDF7] text-[#7A5C4E] font-sans p-8 max-w-2xl mx-auto">
                     {stats.artists < 50 ? (
                       <>
                         <h2 className="font-serif text-[2.5rem] text-[#2C1810] mb-4">{t("home.firstArtist")}</h2>
                         <p className="font-sans text-[1rem] text-[#7A5C4E] mb-8 leading-[1.8]">
                            We&apos;re looking for our first Artist of the Month. It could be you.
                         </p>
                       </>
                     ) : (
                       <>
                         <h2 className="font-serif text-[2.5rem] text-[#2C1810] mb-4">{t("home.joinCommunity")}</h2>
                         <p className="font-sans text-[1rem] text-[#7A5C4E] mb-8 leading-[1.8]">
                            We feature a new standout creator every month. Connect directly with art lovers and showcase your unique style.
                         </p>
                       </>
                     )}
                     <Link href="/auth?role=artist" className="inline-flex">
                       <GoldButton variant="primary">{t("home.joinAsArtist")}</GoldButton>
                     </Link>
                   </div>
                )}
             </div>
          </section>

          {/* Artists Spotlight Gate */}
          <section className="py-24 px-5 sm:px-8 lg:px-10 mx-auto max-w-[1440px] relative z-10">
            <SectionHeader 
              label="Meet the Creators" 
              title={t("home.featuredArtists")} 
              subtext="Discover the brilliant minds behind the canvas. Support independent Indian creators directly."
            />
            
            <div className="relative mt-12">
              {featuredArtists.length === 0 ? (
                <div className="text-center py-16 border rounded-none bg-[#FFFDF7] text-[#7A5C4E] font-sans p-8">
                   {stats.artists < 50 ? (
                     <>
                       <h2 className="font-serif text-[2.5rem] text-[#2C1810] mb-4">{t("home.firstArtist")}</h2>
                       <p className="text-lg mb-4">{t("home.foundingArtists")}</p>
                       <Link href="/auth?role=artist">
                          <GoldButton variant="outline">{t("home.joinAsAnArtist")}</GoldButton>
                       </Link>
                     </>
                   ) : (
                     <>
                       <h2 className="font-serif text-[2.5rem] text-[#2C1810] mb-4">{t("home.joinCommunity")}</h2>
                       <p className="text-lg mb-4">{t("home.connectShare")}</p>
                       <Link href="/auth?role=artist">
                          <GoldButton variant="outline">{t("home.joinAsAnArtist")}</GoldButton>
                       </Link>
                     </>
                   )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {featuredArtists.slice(0, user ? 6 : 3).map((artist, idx) => (
                     <div key={artist.id} className={!user && idx >= 3 ? "blur-[6px] pointer-events-none opacity-80" : ""}>
                       <ArtistCard {...artist} />
                     </div>
                  ))}
                </div>
              )}

              {!user && featuredArtists.length > 0 && (
                  <div className="absolute top-1/2 left-0 right-0 bottom-0 bg-gradient-to-b from-transparent to-[rgba(245,239,224,0.97)] via-[rgba(245,239,224,0.85)] z-20 flex flex-col items-center justify-end pb-8">
                    <GoldButton variant="primary" onClick={() => window.location.href = '/auth?mode=signup'} className="transform translate-y-6 flex items-center justify-center shadow-[0_4px_24px_rgba(107,30,46,0.10)]">
                      Unlock All Artists
                    </GoldButton>
                  </div>
              )}
            </div>
          </section>
          
          <MadhubaniDivider />

        </>
      )}

        <section className="bg-[#EDE4CE] py-24 relative z-10 w-full">
          <div className="px-5 sm:px-8 lg:px-10 mx-auto max-w-[1440px]">
            <SectionHeader label={t("home.processLabel")} title={t("home.howWorks")} />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-[2rem] relative rounded-none flex flex-col items-start transition-transform hover:-translate-y-2 duration-300">
                <span className="absolute top-4 right-6 font-serif text-[3.5rem] tracking-tight text-[rgba(107,30,46,0.08)] font-bold leading-none">1</span>
                <div className="w-[40px] h-[40px] flex items-center justify-center bg-[rgba(107,30,46,0.08)] mb-6 rounded-none">
                  <Search size={20} className="text-[#6B1E2E]" />
                </div>
                <h3 className="font-serif text-[1.5rem] font-semibold text-[#2C1810] mb-[0.6rem]">{t("home.step1.title")}</h3>
                <p className="text-[#7A5C4E] font-sans text-[1rem] leading-[1.8]">
                  {t("home.step1.desc")}
                </p>
              </div>
              
              <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-[2rem] relative rounded-none flex flex-col items-start transition-transform hover:-translate-y-2 duration-300">
                <span className="absolute top-4 right-6 font-serif text-[3.5rem] tracking-tight text-[rgba(107,30,46,0.08)] font-bold leading-none">2</span>
                <div className="w-[40px] h-[40px] flex items-center justify-center bg-[rgba(107,30,46,0.08)] mb-6 rounded-none">
                  <PenTool size={20} className="text-[#6B1E2E]" />
                </div>
                <h3 className="font-serif text-[1.5rem] font-semibold text-[#2C1810] mb-[0.6rem]">{t("home.step2.title")}</h3>
                <p className="text-[#7A5C4E] font-sans text-[1rem] leading-[1.8]">
                  {t("home.step2.desc")}
                </p>
              </div>

              <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-[2rem] relative rounded-none flex flex-col items-start transition-transform hover:-translate-y-2 duration-300">
                <span className="absolute top-4 right-6 font-serif text-[3.5rem] tracking-tight text-[rgba(107,30,46,0.08)] font-bold leading-none">3</span>
                <div className="w-[40px] h-[40px] flex items-center justify-center bg-[rgba(107,30,46,0.08)] mb-6 rounded-none">
                  <CheckCircle2 size={20} className="text-[#6B1E2E]" />
                </div>
                <h3 className="font-serif text-[1.5rem] font-semibold text-[#2C1810] mb-[0.6rem]">{t("home.step3.title")}</h3>
                <p className="text-[#7A5C4E] font-sans text-[1rem] leading-[1.8]">
                  {t("home.step3.desc")}
                </p>
              </div>
            </div>
          </div>
        </section>

      <QuoteOfTheDay />

      <MadhubaniDivider />

    </main>
  );
}



