"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, X, Loader2, Clock, Trash2, ArrowRight, User, Image as ImageIcon, Layers, BookOpen, Sparkles } from "lucide-react";
import { SearchService, GlobalSearchResults } from "../../../services/SearchService";
import { getStoryAuthorName } from "../../lib/storyUtils";
import { useStore } from "../../contexts/StoreContext";
import { HighlightText } from "../ui/HighlightText";

interface NavSuggestionItem {
  id: string;
  type: "recent" | "artist" | "artwork" | "collection" | "story";
  title: string;
  subtitle?: string;
  image?: string;
  url: string;
}

export function GlobalSearchBar() {
  const router = useRouter();
  const { recentSearches, saveRecentSearch, removeRecentSearch, clearRecentSearches } = useStore();

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GlobalSearchResults | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Perform debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      const res = await SearchService.search(query);
      if (res.success && res.data) {
        setResults(res.data);
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Build flattened list of suggestions for keyboard navigation
  const buildFlattenedSuggestions = useCallback((): NavSuggestionItem[] => {
    const list: NavSuggestionItem[] = [];

    if (!query.trim()) {
      // Recent searches
      recentSearches.slice(0, 5).forEach((term) => {
        list.push({
          id: `recent-${term}`,
          type: "recent",
          title: term,
          url: `/search?q=${encodeURIComponent(term)}`,
        });
      });
      return list;
    }

    if (!results) return list;

    // Artists (up to 5)
    results.artists.slice(0, 5).forEach((a) => {
      list.push({
        id: `artist-${a.id}`,
        type: "artist",
        title: a.full_name,
        subtitle: `${a.art_style} • ${a.location}`,
        image: a.avatar_url || "/assets/defaults/avatar.svg",
        url: `/artist/${a.id}`,
      });
    });

    // Artworks (up to 5)
    results.artworks.slice(0, 5).forEach((art) => {
      list.push({
        id: `artwork-${art.id}`,
        type: "artwork",
        title: art.title,
        subtitle: `By ${art.profiles?.full_name || "Artisan"} • ${art.category}`,
        image: art.image_urls?.[0] || "/assets/defaults/artwork.svg",
        url: `/artwork/${art.id}`,
      });
    });

    // Collections (up to 5)
    results.collections.slice(0, 5).forEach((col) => {
      list.push({
        id: `collection-${col.id}`,
        type: "collection",
        title: col.title,
        subtitle: `${col.artworks?.length || 0} Artworks`,
        image: col.cover_image_url || "/assets/defaults/collection.svg",
        url: `/collections/${col.id}`,
      });
    });

    // Stories (up to 5)
    results.stories.slice(0, 5).forEach((st) => {
      list.push({
        id: `story-${st.id}`,
        type: "story",
        title: st.title,
        subtitle: `By ${getStoryAuthorName(st)} • ${st.category}`,
        image: st.cover_image_url || "/assets/defaults/artwork.svg",
        url: `/stories/${st.id}`,
      });
    });

    return list;
  }, [query, recentSearches, results]);

  const flattenedList = buildFlattenedSuggestions();

  const handleSelectQuery = (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    saveRecentSearch(trimmed);
    setIsOpen(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSelectItem = (item: NavSuggestionItem) => {
    if (item.type === "recent") {
      handleSelectQuery(item.title);
    } else {
      if (query.trim()) saveRecentSearch(query.trim());
      setIsOpen(false);
      router.push(item.url);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < flattenedList.length - 1 ? prev + 1 : 0));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flattenedList.length - 1));
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < flattenedList.length) {
        handleSelectItem(flattenedList[selectedIndex]);
      } else {
        handleSelectQuery(query);
      }
    }
  };

  return (
    <div className="relative w-full max-w-md mx-2 md:mx-6" ref={containerRef}>
      {/* Search Bar Input */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-[#7A5C4E] pointer-events-none flex items-center">
          {loading ? (
            <Loader2 size={16} className="animate-spin text-[#6B1E2E]" />
          ) : (
            <Search size={16} />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search artists, artworks, folk styles..."
          className="w-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.22)] focus:border-[#6B1E2E] focus:outline-none focus:ring-1 focus:ring-[#6B1E2E] pl-10 pr-9 py-2 text-xs font-sans text-[#2C1810] placeholder-[#9C7A6A] transition-all shadow-2xs rounded-none"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults(null);
              setSelectedIndex(-1);
              inputRef.current?.focus();
            }}
            className="absolute right-3 text-[#9C7A6A] hover:text-[#6B1E2E] p-0.5 transition-colors"
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Live Search Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-11 bg-[#FFFDF7] border border-[rgba(107,30,46,0.22)] shadow-xl z-50 rounded-none overflow-hidden max-h-[480px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
          {!query.trim() ? (
            /* Recent Searches & Popular Suggestions when query is empty */
            <div className="p-4 divide-y divide-[rgba(107,30,46,0.1)]">
              <div>
                <div className="flex justify-between items-center mb-2.5">
                  <span className="font-sans text-[0.68rem] uppercase tracking-wider text-[#9C7A6A] font-semibold flex items-center gap-1.5">
                    <Clock size={12} /> Recent Searches
                  </span>
                  {recentSearches.length > 0 && (
                    <button
                      onClick={clearRecentSearches}
                      className="font-sans text-[0.68rem] uppercase text-[#6B1E2E] hover:underline font-medium"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {recentSearches.length === 0 ? (
                  <p className="font-sans text-xs text-[#9C7A6A] italic py-1">
                    No recent searches yet. Try typing a traditional folk art style!
                  </p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {recentSearches.slice(0, 5).map((term, index) => {
                      const isSelected = selectedIndex === index;
                      return (
                        <div
                          key={`rec-${term}`}
                          onClick={() => handleSelectQuery(term)}
                          className={`flex items-center justify-between px-2.5 py-1.5 text-xs font-sans text-[#2C1810] hover:bg-[#F5EFE0] cursor-pointer transition-colors ${
                            isSelected ? "bg-[#EDE4CE] text-[#6B1E2E] font-medium" : ""
                          }`}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <Clock size={13} className="text-[#9C7A6A]" />
                            {term}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeRecentSearch(term);
                            }}
                            className="text-[#9C7A6A] hover:text-[#6B1E2E] p-1 transition-colors"
                            title="Remove from history"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Popular Categories / Quick Chips */}
              <div className="pt-3 mt-3">
                <span className="font-sans text-[0.68rem] uppercase tracking-wider text-[#9C7A6A] font-semibold flex items-center gap-1.5 mb-2.5">
                  <Sparkles size={12} /> Popular Traditional Styles
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {["Madhubani", "Pattachitra", "Warli", "Gond", "Kalighat", "Terracotta"].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleSelectQuery(chip)}
                      className="px-2.5 py-1 bg-[#EDE4CE]/60 hover:bg-[#6B1E2E] hover:text-white font-sans text-[0.72rem] text-[#2C1810] border border-[rgba(107,30,46,0.15)] transition-colors rounded-none"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Live Suggestions Results */
            <div className="divide-y divide-[rgba(107,30,46,0.12)]">
              {loading ? (
                <div className="p-8 text-center text-xs font-sans text-[#7A5C4E] flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin text-[#6B1E2E]" />
                  Searching Kalakaar repository...
                </div>
              ) : flattenedList.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="font-serif text-sm text-[#2C1810] mb-1">No matches found for &quot;{query}&quot;</p>
                  <p className="font-sans text-xs text-[#7A5C4E] mb-3">
                    Check your spelling or explore popular traditional art categories.
                  </p>
                  <button
                    onClick={() => handleSelectQuery(query)}
                    className="inline-flex items-center gap-1 font-sans text-xs font-semibold uppercase tracking-wider text-[#6B1E2E] hover:underline"
                  >
                    View All Results <ArrowRight size={13} />
                  </button>
                </div>
              ) : (
                <>
                  {/* Artists Section */}
                  {results && results.artists.length > 0 && (
                    <div className="p-2">
                      <div className="px-2.5 py-1 font-sans text-[0.65rem] uppercase tracking-wider text-[#9C7A6A] font-bold flex items-center gap-1.5">
                        <User size={12} /> Artists ({results.artists.length})
                      </div>
                      {results.artists.slice(0, 5).map((artist) => {
                        const itemIndex = flattenedList.findIndex((i) => i.id === `artist-${artist.id}`);
                        const isSelected = selectedIndex === itemIndex;
                        return (
                          <div
                            key={artist.id}
                            onClick={() => handleSelectItem(flattenedList[itemIndex])}
                            className={`flex items-center gap-3 px-2.5 py-2 hover:bg-[#F5EFE0] cursor-pointer transition-colors ${
                              isSelected ? "bg-[#EDE4CE]" : ""
                            }`}
                          >
                            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#6B1E2E]/30 shrink-0">
                              <Image
                                src={artist.avatar_url || "/assets/defaults/avatar.svg"}
                                alt={artist.full_name}
                                fill
                                className="object-cover"
                                referrerPolicy="no-referrer"
                                sizes="32px"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-serif text-xs font-semibold text-[#2C1810] truncate">
                                <HighlightText text={artist.full_name} query={query} />
                              </p>
                              <p className="font-sans text-[0.68rem] text-[#7A5C4E] truncate">
                                {artist.art_style} • {artist.location}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Artworks Section */}
                  {results && results.artworks.length > 0 && (
                    <div className="p-2">
                      <div className="px-2.5 py-1 font-sans text-[0.65rem] uppercase tracking-wider text-[#9C7A6A] font-bold flex items-center gap-1.5">
                        <ImageIcon size={12} /> Artworks ({results.artworks.length})
                      </div>
                      {results.artworks.slice(0, 5).map((art) => {
                        const itemIndex = flattenedList.findIndex((i) => i.id === `artwork-${art.id}`);
                        const isSelected = selectedIndex === itemIndex;
                        return (
                          <div
                            key={art.id}
                            onClick={() => handleSelectItem(flattenedList[itemIndex])}
                            className={`flex items-center gap-3 px-2.5 py-2 hover:bg-[#F5EFE0] cursor-pointer transition-colors ${
                              isSelected ? "bg-[#EDE4CE]" : ""
                            }`}
                          >
                            <div className="relative w-10 h-10 bg-[#EDE4CE] shrink-0 border border-[rgba(107,30,46,0.1)]">
                              <Image
                                src={art.image_urls?.[0] || "/assets/defaults/artwork.svg"}
                                alt={art.title}
                                fill
                                className="object-cover"
                                referrerPolicy="no-referrer"
                                sizes="40px"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-serif text-xs font-semibold text-[#2C1810] truncate">
                                <HighlightText text={art.title} query={query} />
                              </p>
                              <p className="font-sans text-[0.68rem] text-[#7A5C4E] truncate">
                                {art.category} {art.price ? `• ₹${art.price.toLocaleString("en-IN")}` : ""}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Collections Section */}
                  {results && results.collections.length > 0 && (
                    <div className="p-2">
                      <div className="px-2.5 py-1 font-sans text-[0.65rem] uppercase tracking-wider text-[#9C7A6A] font-bold flex items-center gap-1.5">
                        <Layers size={12} /> Collections ({results.collections.length})
                      </div>
                      {results.collections.slice(0, 5).map((col) => {
                        const itemIndex = flattenedList.findIndex((i) => i.id === `collection-${col.id}`);
                        const isSelected = selectedIndex === itemIndex;
                        return (
                          <div
                            key={col.id}
                            onClick={() => handleSelectItem(flattenedList[itemIndex])}
                            className={`flex items-center gap-3 px-2.5 py-2 hover:bg-[#F5EFE0] cursor-pointer transition-colors ${
                              isSelected ? "bg-[#EDE4CE]" : ""
                            }`}
                          >
                            <div className="relative w-9 h-9 bg-[#EDE4CE] shrink-0 border border-[rgba(107,30,46,0.1)]">
                              <Image
                                src={col.cover_image_url || "/assets/defaults/collection.svg"}
                                alt={col.title}
                                fill
                                className="object-cover"
                                referrerPolicy="no-referrer"
                                sizes="36px"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-serif text-xs font-semibold text-[#2C1810] truncate">
                                <HighlightText text={col.title} query={query} />
                              </p>
                              <p className="font-sans text-[0.68rem] text-[#7A5C4E] truncate">
                                {col.artworks?.length || 0} Artworks
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Stories Section */}
                  {results && results.stories.length > 0 && (
                    <div className="p-2">
                      <div className="px-2.5 py-1 font-sans text-[0.65rem] uppercase tracking-wider text-[#9C7A6A] font-bold flex items-center gap-1.5">
                        <BookOpen size={12} /> Stories ({results.stories.length})
                      </div>
                      {results.stories.slice(0, 5).map((story) => {
                        const itemIndex = flattenedList.findIndex((i) => i.id === `story-${story.id}`);
                        const isSelected = selectedIndex === itemIndex;
                        return (
                          <div
                            key={story.id}
                            onClick={() => handleSelectItem(flattenedList[itemIndex])}
                            className={`flex items-center gap-3 px-2.5 py-2 hover:bg-[#F5EFE0] cursor-pointer transition-colors ${
                              isSelected ? "bg-[#EDE4CE]" : ""
                            }`}
                          >
                            <div className="relative w-9 h-9 bg-[#EDE4CE] shrink-0 border border-[rgba(107,30,46,0.1)]">
                              <Image
                                src={story.cover_image_url || "/assets/defaults/artwork.svg"}
                                alt={story.title}
                                fill
                                className="object-cover"
                                referrerPolicy="no-referrer"
                                sizes="36px"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-serif text-xs font-semibold text-[#2C1810] truncate">
                                <HighlightText text={story.title} query={query} />
                              </p>
                              <p className="font-sans text-[0.68rem] text-[#7A5C4E] truncate">
                                {story.category} • {story.read_time}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* View All Search Results Banner */}
                  <div className="p-3 bg-[#EDE4CE]/50 border-t border-[rgba(107,30,46,0.15)] text-center">
                    <button
                      onClick={() => handleSelectQuery(query)}
                      className="inline-flex items-center justify-center gap-2 font-sans text-xs uppercase tracking-wider font-semibold text-[#6B1E2E] hover:underline w-full py-1"
                    >
                      See All Search Results ({results?.counts.all || 0}) <ArrowRight size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
