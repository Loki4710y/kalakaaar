"use client";
import React, { useState, useEffect, useCallback, useRef, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search as SearchIcon, X, SlidersHorizontal, User, Image as ImageIcon, Layers, BookOpen, Clock, RefreshCw } from "lucide-react";
import { MadhubaniPattern, MadhubaniDivider } from "../components/patterns/MadhubaniPattern";
import { CornerBracket } from "../components/ui/CornerBracket";
import { GoldButton } from "../components/ui/GoldButton";
import { SearchService, GlobalSearchResults } from "../../services/SearchService";
import { ArtistCard } from "../components/ui/ArtistCard";
import { ArtworkCard } from "../components/ui/ArtworkCard";
import { CollectionCard } from "../components/ui/CollectionCard";
import { StoryCard } from "../components/ui/StoryCard";
import { SearchSkeleton } from "../components/ui/Skeletons";
import { EmptyState } from "../components/ui/EmptyState";
import { useStore } from "../contexts/StoreContext";
import { LoadMoreButton } from "../components/ui/LoadMoreButton";

type TabType = "all" | "artists" | "artworks" | "collections" | "stories";

export function Search() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const urlQuery = searchParams?.get("q") || "";
  const urlTab = (searchParams?.get("tab") as TabType) || "all";

  const { recentSearches, saveRecentSearch, removeRecentSearch, clearRecentSearches } = useStore();

  const [searchInput, setSearchInput] = useState(urlQuery);
  const [activeTab, setActiveTab] = useState<TabType>(urlTab);

  // Search results (first page of each type; "Show more" appends further pages from the database)
  const [results, setResults] = useState<GlobalSearchResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTab, setLoadingTab] = useState<string | null>(null);
  const [loadMoreFailed, setLoadMoreFailed] = useState(false);
  const pagesRef = useRef({ artists: 1, artworks: 1, collections: 1, stories: 1 });
  const requestId = useRef(0);

  // Wait for a pause in typing before querying the database
  const [debouncedInput, setDebouncedInput] = useState(urlQuery);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedInput(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Filters State
  const [artistStyle, setArtistStyle] = useState("all");
  const [artistLocation, setArtistLocation] = useState("all");
  const [artistFeaturedOnly, setArtistFeaturedOnly] = useState(false);

  const [artworkCategory, setArtworkCategory] = useState("all");
  const [artworkMedium, setArtworkMedium] = useState("all");
  const [artworkPriceType, setArtworkPriceType] = useState<"all" | "under_10k" | "10k_25k" | "over_25k">("all");
  const [artworkFeaturedOnly, setArtworkFeaturedOnly] = useState(false);
  const [artworkSort, setArtworkSort] = useState<"newest" | "most_liked" | "price_low" | "price_high">("newest");

  const [collectionArtist, setCollectionArtist] = useState("all");
  const [collectionSort, setCollectionSort] = useState<"newest" | "popular">("newest");
  const [collectionFeaturedOnly, setCollectionFeaturedOnly] = useState(false);

  const [storyCategory, setStoryCategory] = useState("all");
  const [storySort, setStorySort] = useState<"newest" | "popular">("newest");
  const [storyFeaturedOnly, setStoryFeaturedOnly] = useState(false);

  // Sync state with URL changes
  useEffect(() => {
    setSearchInput(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    if (urlTab) setActiveTab(urlTab);
  }, [urlTab]);

  const buildFilters = useCallback(() => ({
    artistStyle, artistLocation, artistFeaturedOnly,
    artworkCategory, artworkMedium, artworkPriceType, artworkFeaturedOnly, artworkSort,
    collectionArtist, collectionSort, collectionFeaturedOnly,
    storyCategory, storySort, storyFeaturedOnly,
  }), [
    artistStyle, artistLocation, artistFeaturedOnly,
    artworkCategory, artworkMedium, artworkPriceType, artworkFeaturedOnly, artworkSort,
    collectionArtist, collectionSort, collectionFeaturedOnly,
    storyCategory, storySort, storyFeaturedOnly,
  ]);

  // Execute Search whenever query or filters change
  const executeSearch = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setLoadMoreFailed(false);
    const res = await SearchService.search(debouncedInput, buildFilters());
    if (id !== requestId.current) return; // a newer search has started
    if (res.success && res.data) {
      pagesRef.current = { artists: 1, artworks: 1, collections: 1, stories: 1 };
      setResults(res.data);
    }
    setLoading(false);
  }, [debouncedInput, buildFilters]);

  const loadMoreTab = useCallback(async (tab: "artists" | "artworks" | "collections" | "stories") => {
    if (loadingTab) return;
    const f = buildFilters();
    const next = pagesRef.current[tab] + 1;
    const id = requestId.current;
    setLoadingTab(tab);
    setLoadMoreFailed(false);
    try {
      let res: any;
      if (tab === "artists") res = await SearchService.searchArtists(debouncedInput, { artStyle: f.artistStyle, location: f.artistLocation, featuredOnly: f.artistFeaturedOnly }, next);
      else if (tab === "artworks") res = await SearchService.searchArtworks(debouncedInput, { category: f.artworkCategory, medium: f.artworkMedium, priceType: f.artworkPriceType, featuredOnly: f.artworkFeaturedOnly, sort: f.artworkSort }, next);
      else if (tab === "collections") res = await SearchService.searchCollections(debouncedInput, { artist: f.collectionArtist, sort: f.collectionSort, featuredOnly: f.collectionFeaturedOnly }, next);
      else res = await SearchService.searchStories(debouncedInput, { category: f.storyCategory, sort: f.storySort, featuredOnly: f.storyFeaturedOnly }, next);
      if (id !== requestId.current) return;
      if (!res.success || !res.data) { setLoadMoreFailed(true); return; }
      pagesRef.current[tab] = next;
      setResults((prev) => {
        if (!prev) return prev;
        const seen = new Set((prev[tab] as any[]).map((x) => x.id));
        const merged = [...(prev[tab] as any[]), ...res.data.items.filter((x: any) => !seen.has(x.id))];
        return { ...prev, [tab]: merged } as GlobalSearchResults;
      });
    } catch {
      setLoadMoreFailed(true);
    } finally {
      setLoadingTab(null);
    }
  }, [loadingTab, buildFilters, debouncedInput]);

  useEffect(() => {
    executeSearch();
  }, [executeSearch]);

  const updateUrl = (newQuery: string, newTab: TabType) => {
    const params = new URLSearchParams();
    if (newQuery.trim()) params.set("q", newQuery.trim());
    if (newTab && newTab !== "all") params.set("tab", newTab);

    startTransition(() => {
      router.push(`/search?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      saveRecentSearch(searchInput.trim());
    }
    updateUrl(searchInput, activeTab);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    updateUrl(searchInput, tab);
  };

  const resetAllFilters = () => {
    setArtistStyle("all");
    setArtistLocation("all");
    setArtistFeaturedOnly(false);

    setArtworkCategory("all");
    setArtworkMedium("all");
    setArtworkPriceType("all");
    setArtworkFeaturedOnly(false);
    setArtworkSort("newest");

    setCollectionArtist("all");
    setCollectionSort("newest");
    setCollectionFeaturedOnly(false);

    setStoryCategory("all");
    setStorySort("newest");
    setStoryFeaturedOnly(false);
  };

  const counts = results?.counts || { all: 0, artists: 0, artworks: 0, collections: 0, stories: 0 };

  return (
    <main className="relative min-h-screen pb-28 bg-[#F5EFE0]">
      {/* Header Banner */}
      <section className="relative pt-20 pb-12 bg-[#FFFDF7] border-b border-[rgba(107,30,46,0.18)] overflow-hidden">
        <MadhubaniPattern opacity={0.05} stroke="#6B1E2E" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <CornerBracket />
          <p className="font-sans text-[0.7rem] uppercase tracking-[0.2em] text-[#9C7A6A] mb-3">
            — DISCOVER INDIAN ARTISTRY —
          </p>
          <h1 className="font-serif text-[2.8rem] md:text-[3.6rem] text-[#2C1810] leading-tight mb-6 italic">
            Global Art Search
          </h1>

          {/* Search Form Box */}
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto flex items-center gap-2 relative">
            <div className="relative flex-1">
              <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A5C4E]" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search artists, artworks, folk styles (e.g. Madhubani, Warli)..."
                className="w-full bg-[#FFFDF7] border-2 border-[rgba(107,30,46,0.25)] focus:border-[#6B1E2E] focus:outline-none pl-11 pr-10 py-3 text-sm font-sans text-[#2C1810] shadow-xs"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    updateUrl("", activeTab);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9C7A6A] hover:text-[#6B1E2E] p-1"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <GoldButton variant="primary" type="submit" className="px-6 py-3 font-semibold text-xs tracking-wider uppercase">
              Search
            </GoldButton>
          </form>

          {/* Result Summary */}
          <div className="mt-4 font-sans text-xs text-[#7A5C4E]">
            {urlQuery ? (
              <span>
                Found <strong className="text-[#6B1E2E] font-semibold">{counts.all}</strong> results for &quot;
                <span className="font-semibold">{urlQuery}</span>&quot;
              </span>
            ) : (
              <span>Explore all traditional Indian masterworks, artisan profiles, and cultural stories</span>
            )}
          </div>
        </div>
      </section>

      <MadhubaniDivider />

      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-10 pt-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[rgba(107,30,46,0.18)] overflow-x-auto pb-px mb-8 scrollbar-none">
          <button
            onClick={() => handleTabChange("all")}
            className={`px-4 py-3 font-sans text-xs uppercase tracking-wider font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "all"
                ? "border-[#6B1E2E] text-[#6B1E2E] bg-[#FFFDF7]/60"
                : "border-transparent text-[#7A5C4E] hover:text-[#2C1810]"
            }`}
          >
            All Results
            <span className={`px-2 py-0.5 text-[0.65rem] rounded-full font-bold ${activeTab === "all" ? "bg-[#6B1E2E] text-white" : "bg-[#EDE4CE] text-[#2C1810]"}`}>
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => handleTabChange("artists")}
            className={`px-4 py-3 font-sans text-xs uppercase tracking-wider font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "artists"
                ? "border-[#6B1E2E] text-[#6B1E2E] bg-[#FFFDF7]/60"
                : "border-transparent text-[#7A5C4E] hover:text-[#2C1810]"
            }`}
          >
            <User size={14} /> Artists
            <span className={`px-2 py-0.5 text-[0.65rem] rounded-full font-bold ${activeTab === "artists" ? "bg-[#6B1E2E] text-white" : "bg-[#EDE4CE] text-[#2C1810]"}`}>
              {counts.artists}
            </span>
          </button>

          <button
            onClick={() => handleTabChange("artworks")}
            className={`px-4 py-3 font-sans text-xs uppercase tracking-wider font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "artworks"
                ? "border-[#6B1E2E] text-[#6B1E2E] bg-[#FFFDF7]/60"
                : "border-transparent text-[#7A5C4E] hover:text-[#2C1810]"
            }`}
          >
            <ImageIcon size={14} /> Artworks
            <span className={`px-2 py-0.5 text-[0.65rem] rounded-full font-bold ${activeTab === "artworks" ? "bg-[#6B1E2E] text-white" : "bg-[#EDE4CE] text-[#2C1810]"}`}>
              {counts.artworks}
            </span>
          </button>

          <button
            onClick={() => handleTabChange("collections")}
            className={`px-4 py-3 font-sans text-xs uppercase tracking-wider font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "collections"
                ? "border-[#6B1E2E] text-[#6B1E2E] bg-[#FFFDF7]/60"
                : "border-transparent text-[#7A5C4E] hover:text-[#2C1810]"
            }`}
          >
            <Layers size={14} /> Collections
            <span className={`px-2 py-0.5 text-[0.65rem] rounded-full font-bold ${activeTab === "collections" ? "bg-[#6B1E2E] text-white" : "bg-[#EDE4CE] text-[#2C1810]"}`}>
              {counts.collections}
            </span>
          </button>

          <button
            onClick={() => handleTabChange("stories")}
            className={`px-4 py-3 font-sans text-xs uppercase tracking-wider font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "stories"
                ? "border-[#6B1E2E] text-[#6B1E2E] bg-[#FFFDF7]/60"
                : "border-transparent text-[#7A5C4E] hover:text-[#2C1810]"
            }`}
          >
            <BookOpen size={14} /> Stories
            <span className={`px-2 py-0.5 text-[0.65rem] rounded-full font-bold ${activeTab === "stories" ? "bg-[#6B1E2E] text-white" : "bg-[#EDE4CE] text-[#2C1810]"}`}>
              {counts.stories}
            </span>
          </button>
        </div>

        {/* Dynamic Context Filters Bar */}
        <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-4 mb-8 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-sans text-[#2C1810] uppercase tracking-wider font-bold">
            <SlidersHorizontal size={15} className="text-[#6B1E2E]" /> Filters:
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Tab Specific Filters */}
            {activeTab === "artists" && (
              <>
                <select
                  value={artistStyle}
                  onChange={(e) => setArtistStyle(e.target.value)}
                  className="bg-[#EDE4CE]/60 border border-[rgba(107,30,46,0.2)] text-xs font-sans text-[#2C1810] px-3 py-1.5 focus:outline-none focus:border-[#6B1E2E]"
                >
                  <option value="all">All Folk Styles</option>
                  <option value="Madhubani">Madhubani</option>
                  <option value="Pattachitra">Pattachitra</option>
                  <option value="Warli">Warli</option>
                  <option value="Gond">Gond</option>
                </select>

                <select
                  value={artistLocation}
                  onChange={(e) => setArtistLocation(e.target.value)}
                  className="bg-[#EDE4CE]/60 border border-[rgba(107,30,46,0.2)] text-xs font-sans text-[#2C1810] px-3 py-1.5 focus:outline-none focus:border-[#6B1E2E]"
                >
                  <option value="all">All Locations</option>
                  <option value="Bihar">Bihar</option>
                  <option value="Odisha">Odisha</option>
                  <option value="Maharashtra">Maharashtra</option>
                </select>

                <label className="flex items-center gap-1.5 text-xs font-sans text-[#2C1810] cursor-pointer font-medium select-none">
                  <input
                    type="checkbox"
                    checked={artistFeaturedOnly}
                    onChange={(e) => setArtistFeaturedOnly(e.target.checked)}
                    className="accent-[#6B1E2E]"
                  />
                  Featured Only
                </label>
              </>
            )}

            {activeTab === "artworks" && (
              <>
                <select
                  value={artworkCategory}
                  onChange={(e) => setArtworkCategory(e.target.value)}
                  className="bg-[#EDE4CE]/60 border border-[rgba(107,30,46,0.2)] text-xs font-sans text-[#2C1810] px-3 py-1.5 focus:outline-none focus:border-[#6B1E2E]"
                >
                  <option value="all">All Categories</option>
                  <option value="Folk Art">Folk Art</option>
                  <option value="Traditional Folk Art">Traditional Folk Art</option>
                  <option value="Paintings">Paintings</option>
                  <option value="Sculptures">Sculptures</option>
                </select>

                <select
                  value={artworkPriceType}
                  onChange={(e) => setArtworkPriceType(e.target.value as any)}
                  className="bg-[#EDE4CE]/60 border border-[rgba(107,30,46,0.2)] text-xs font-sans text-[#2C1810] px-3 py-1.5 focus:outline-none focus:border-[#6B1E2E]"
                >
                  <option value="all">All Price Ranges</option>
                  <option value="under_10k">Under ₹10,000</option>
                  <option value="10k_25k">₹10,000 - ₹25,000</option>
                  <option value="over_25k">Over ₹25,000</option>
                </select>

                <select
                  value={artworkSort}
                  onChange={(e) => setArtworkSort(e.target.value as any)}
                  className="bg-[#EDE4CE]/60 border border-[rgba(107,30,46,0.2)] text-xs font-sans text-[#2C1810] px-3 py-1.5 focus:outline-none focus:border-[#6B1E2E]"
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="most_liked">Sort: Most Liked</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>

                <label className="flex items-center gap-1.5 text-xs font-sans text-[#2C1810] cursor-pointer font-medium select-none">
                  <input
                    type="checkbox"
                    checked={artworkFeaturedOnly}
                    onChange={(e) => setArtworkFeaturedOnly(e.target.checked)}
                    className="accent-[#6B1E2E]"
                  />
                  Featured Only
                </label>
              </>
            )}

            {activeTab === "collections" && (
              <>
                <select
                  value={collectionSort}
                  onChange={(e) => setCollectionSort(e.target.value as any)}
                  className="bg-[#EDE4CE]/60 border border-[rgba(107,30,46,0.2)] text-xs font-sans text-[#2C1810] px-3 py-1.5 focus:outline-none focus:border-[#6B1E2E]"
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="popular">Sort: Most Popular</option>
                </select>

                <label className="flex items-center gap-1.5 text-xs font-sans text-[#2C1810] cursor-pointer font-medium select-none">
                  <input
                    type="checkbox"
                    checked={collectionFeaturedOnly}
                    onChange={(e) => setCollectionFeaturedOnly(e.target.checked)}
                    className="accent-[#6B1E2E]"
                  />
                  Featured Only
                </label>
              </>
            )}

            {activeTab === "stories" && (
              <>
                <select
                  value={storyCategory}
                  onChange={(e) => setStoryCategory(e.target.value)}
                  className="bg-[#EDE4CE]/60 border border-[rgba(107,30,46,0.2)] text-xs font-sans text-[#2C1810] px-3 py-1.5 focus:outline-none focus:border-[#6B1E2E]"
                >
                  <option value="all">All Story Categories</option>
                  <option value="Artist Journey">Artist Journey</option>
                  <option value="Techniques">Techniques</option>
                  <option value="Folk Traditions">Folk Traditions</option>
                </select>

                <select
                  value={storySort}
                  onChange={(e) => setStorySort(e.target.value as any)}
                  className="bg-[#EDE4CE]/60 border border-[rgba(107,30,46,0.2)] text-xs font-sans text-[#2C1810] px-3 py-1.5 focus:outline-none focus:border-[#6B1E2E]"
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="popular">Sort: Most Popular</option>
                </select>
              </>
            )}

            {/* Reset Filters */}
            <button
              onClick={resetAllFilters}
              className="text-xs font-sans uppercase font-semibold text-[#6B1E2E] hover:underline flex items-center gap-1 ml-2"
            >
              <RefreshCw size={12} /> Clear Filters
            </button>
          </div>
        </div>

        {/* Results Container */}
        {loading ? (
          <SearchSkeleton />
        ) : counts.all === 0 ? (
          /* Empty State */
          <div className="space-y-6">
            <EmptyState
              type="no_search_results"
              searchQuery={urlQuery}
              onAction={resetAllFilters}
              actionLabel="Reset Search & Filters"
            />

            {/* Popular Search Suggestions */}
            <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-6 max-w-xl mx-auto text-center shadow-xs">
              <span className="font-sans text-xs uppercase tracking-wider text-[#9C7A6A] font-bold block mb-3">
                Try searching for these popular folk art styles:
              </span>
              <div className="flex flex-wrap justify-center gap-2">
                {["Madhubani", "Pattachitra", "Warli", "Gond", "Kalamkari", "Terracotta"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSearchInput(tag);
                      updateUrl(tag, activeTab);
                    }}
                    className="px-3 py-1.5 bg-[#EDE4CE]/70 hover:bg-[#6B1E2E] hover:text-white font-sans text-xs text-[#2C1810] border border-[rgba(107,30,46,0.2)] transition-all cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Tab Results Grids */
          <div className="space-y-12">
            {/* ALL TAB: Grouped Highlights */}
            {activeTab === "all" && results && (
              <>
                {/* Artists Section */}
                {results.artists.length > 0 && (
                  <section>
                    <div className="flex justify-between items-center mb-6 pb-2 border-b border-[rgba(107,30,46,0.18)]">
                      <h2 className="font-serif text-2xl text-[#2C1810] font-semibold flex items-center gap-2">
                        <User className="text-[#6B1E2E]" size={22} /> Master Artists ({results.artists.length})
                      </h2>
                      <button
                        onClick={() => handleTabChange("artists")}
                        className="font-sans text-xs uppercase font-semibold text-[#6B1E2E] hover:underline"
                      >
                        View All Artists →
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {results.artists.slice(0, 3).map((artist) => (
                        <ArtistCard
                          key={artist.id}
                          id={artist.id}
                          name={artist.full_name}
                          city={artist.location}
                          avatarUrl={artist.avatar_url || "/assets/defaults/avatar.svg"}
                          styleBadge={artist.art_style}
                          is_featured={artist.is_featured}
                    is_verified={artist.is_verified}
                          profile_views={artist.profile_views}
                          avgRating={artist.avgRating}
                          reviewCount={artist.reviewCount}
                          artworkThumbnails={artist.artworkThumbnails}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Artworks Section */}
                {results.artworks.length > 0 && (
                  <section>
                    <div className="flex justify-between items-center mb-6 pb-2 border-b border-[rgba(107,30,46,0.18)]">
                      <h2 className="font-serif text-2xl text-[#2C1810] font-semibold flex items-center gap-2">
                        <ImageIcon className="text-[#6B1E2E]" size={22} /> Traditional Artworks ({results.artworks.length})
                      </h2>
                      <button
                        onClick={() => handleTabChange("artworks")}
                        className="font-sans text-xs uppercase font-semibold text-[#6B1E2E] hover:underline"
                      >
                        View All Artworks →
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                      {results.artworks.slice(0, 6).map((art) => (
                        <ArtworkCard
                          key={art.id}
                          id={art.id}
                          title={art.title}
                          artistId={art.artist_id}
                          artistName={art.profiles?.full_name || "Artisan"}
                          artistWhatsapp={art.profiles?.whatsapp_number}
                          price={art.price}
                          image_urls={art.image_urls}
                          style={art.medium}
                          categories={[art.category]}
                          isTrending={art.is_featured}
                          initialLikeCount={art.like_count}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Collections Section */}
                {results.collections.length > 0 && (
                  <section>
                    <div className="flex justify-between items-center mb-6 pb-2 border-b border-[rgba(107,30,46,0.18)]">
                      <h2 className="font-serif text-2xl text-[#2C1810] font-semibold flex items-center gap-2">
                        <Layers className="text-[#6B1E2E]" size={22} /> Curated Collections ({results.collections.length})
                      </h2>
                      <button
                        onClick={() => handleTabChange("collections")}
                        className="font-sans text-xs uppercase font-semibold text-[#6B1E2E] hover:underline"
                      >
                        View All Collections →
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {results.collections.slice(0, 3).map((col) => (
                        <CollectionCard key={col.id} collection={col} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Stories Section */}
                {results.stories.length > 0 && (
                  <section>
                    <div className="flex justify-between items-center mb-6 pb-2 border-b border-[rgba(107,30,46,0.18)]">
                      <h2 className="font-serif text-2xl text-[#2C1810] font-semibold flex items-center gap-2">
                        <BookOpen className="text-[#6B1E2E]" size={22} /> Folk Lore &amp; Stories ({results.stories.length})
                      </h2>
                      <button
                        onClick={() => handleTabChange("stories")}
                        className="font-sans text-xs uppercase font-semibold text-[#6B1E2E] hover:underline"
                      >
                        View All Stories →
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {results.stories.slice(0, 3).map((st) => (
                        <StoryCard key={st.id} story={st} />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

            {/* ARTISTS TAB */}
            {activeTab === "artists" && results && (
              <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {results.artists.map((artist) => (
                  <ArtistCard
                    key={artist.id}
                    id={artist.id}
                    name={artist.full_name}
                    city={artist.location}
                    avatarUrl={artist.avatar_url || "/assets/defaults/avatar.svg"}
                    styleBadge={artist.art_style}
                    is_featured={artist.is_featured}
                    is_verified={artist.is_verified}
                    profile_views={artist.profile_views}
                    avgRating={artist.avgRating}
                    reviewCount={artist.reviewCount}
                    artworkThumbnails={artist.artworkThumbnails}
                  />
                ))}
              </div>
                <LoadMoreButton shown={results.artists.length} total={counts.artists} loading={loadingTab === "artists"} failed={loadMoreFailed} onClick={() => loadMoreTab("artists")} />
              </div>
            )}

            {/* ARTWORKS TAB */}
            {activeTab === "artworks" && results && (
              <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {results.artworks.map((art) => (
                  <ArtworkCard
                    key={art.id}
                    id={art.id}
                    title={art.title}
                    artistId={art.artist_id}
                    artistName={art.profiles?.full_name || "Artisan"}
                    artistWhatsapp={art.profiles?.whatsapp_number}
                    price={art.price}
                    image_urls={art.image_urls}
                    style={art.medium}
                    categories={[art.category]}
                    isTrending={art.is_featured}
                    initialLikeCount={art.like_count}
                  />
                ))}
              </div>
                <LoadMoreButton shown={results.artworks.length} total={counts.artworks} loading={loadingTab === "artworks"} failed={loadMoreFailed} onClick={() => loadMoreTab("artworks")} />
              </div>
            )}

            {/* COLLECTIONS TAB */}
            {activeTab === "collections" && results && (
              <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {results.collections.map((col) => (
                  <CollectionCard key={col.id} collection={col} />
                ))}
              </div>
                <LoadMoreButton shown={results.collections.length} total={counts.collections} loading={loadingTab === "collections"} failed={loadMoreFailed} onClick={() => loadMoreTab("collections")} />
              </div>
            )}

            {/* STORIES TAB */}
            {activeTab === "stories" && results && (
              <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {results.stories.map((st) => (
                  <StoryCard key={st.id} story={st} />
                ))}
              </div>
                <LoadMoreButton shown={results.stories.length} total={counts.stories} loading={loadingTab === "stories"} failed={loadMoreFailed} onClick={() => loadMoreTab("stories")} />
              </div>
            )}
          </div>
        )}

        {/* Recent Search Management Footer Section */}
        {recentSearches.length > 0 && (
          <div className="mt-16 pt-8 border-t border-[rgba(107,30,46,0.18)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg text-[#2C1810] font-semibold flex items-center gap-2">
                <Clock size={16} className="text-[#6B1E2E]" /> Your Search History
              </h3>
              <button
                onClick={clearRecentSearches}
                className="font-sans text-xs uppercase font-semibold text-[#6B1E2E] hover:underline"
              >
                Clear History
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((term) => (
                <div
                  key={`history-${term}`}
                  className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.2)] px-3 py-1.5 text-xs font-sans text-[#2C1810] flex items-center gap-2 shadow-2xs"
                >
                  <button
                    onClick={() => {
                      setSearchInput(term);
                      updateUrl(term, activeTab);
                    }}
                    className="hover:text-[#6B1E2E] font-medium"
                  >
                    {term}
                  </button>
                  <button
                    onClick={() => removeRecentSearch(term)}
                    className="text-[#9C7A6A] hover:text-[#6B1E2E]"
                    title="Remove"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
