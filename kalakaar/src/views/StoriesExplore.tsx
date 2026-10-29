"use client";

import { EmptyState } from "../components/ui/EmptyState";
import { useLanguage } from "../contexts/LanguageContext";
import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pagination } from "../components/ui/Pagination";
import { buildHref } from "../lib/listParams";
import type { Paged } from "../repositories/utils";
import type { StoriesParams } from "../lib/publicData";
import Image from "next/image";
import Link from "next/link";
import { STORY_CATEGORIES, Story } from "../../services/StoryService";
import { getStoryAuthorName } from "../lib/storyUtils";
import { useAuth } from "../contexts/AuthContext";
import { MadhubaniPattern } from "../components/patterns/MadhubaniPattern";
import { CornerBracket } from "../components/ui/CornerBracket";
import { Search, Clock, Sparkles, PenTool, ArrowRight, Filter } from "lucide-react";

/**
 * Stories are paginated on the server: `initial` is one page (9 stories) plus the total count.
 * Search, category and page live in the URL (?q=&category=&page=).
 */
export function StoriesExplore({ initial, params }: { initial: Paged<Story> | null; params: StoriesParams }) {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(params.q);

  const hrefFor = (patch: Partial<StoriesParams>) => {
    const next = { ...params, page: 1, ...patch };
    return buildHref("/stories", { category: next.category && next.category !== "All" ? next.category : undefined, q: next.q || undefined, page: next.page });
  };
  const go = (patch: Partial<StoriesParams>) => startTransition(() => router.push(hrefFor(patch), { scroll: false }));

  useEffect(() => {
    if (searchInput.trim() === params.q) return;
    const t = setTimeout(() => go({ q: searchInput.trim() }), 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const stories = initial?.items ?? [];
  const selectedCategory = params.category || "All";
  const loading = false;
  const featuredStory = stories.length > 0 && params.page === 1 && selectedCategory === "All" && !params.q ? stories[0] : null;

  return (
    <div className="min-h-screen bg-[#F5EFE0] text-[#2C1810] flex flex-col justify-between">
      <main className="pt-8 pb-32">
        {/* HERO SECTION */}
        <section className="relative bg-[#FFFDF7] border-b border-[rgba(107,30,46,0.18)] py-16 px-4 sm:px-6 lg:px-8 text-center overflow-hidden">
          <MadhubaniPattern opacity={0.06} />
          <CornerBracket />

          <div className="max-w-3xl mx-auto relative z-10">
            <span className="font-sans text-[0.72rem] uppercase tracking-[0.2em] text-[#9C7A6A] block mb-3">
              — ARTISAN EDITORIALS & JOURNEYS —
            </span>
            <h1 className="font-serif text-[3.2rem] sm:text-[4rem] text-[#2C1810] font-normal leading-[1.15] mb-4">
              Stories from the Loom & Brush
            </h1>
            <p className="font-sans text-[1.05rem] text-[#7A5C4E] leading-relaxed mb-8 max-w-2xl mx-auto">
              Explore authentic articles written by master Indian artisans about their heritage techniques,
              spiritual inspiration, and creative process.
            </p>

            {/* Write Story CTA */}
            {user?.role === "artist" ? (
              <Link
                href="/stories/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#6B1E2E] text-[#FFFDF7] font-sans text-[0.8rem] uppercase tracking-wider font-semibold hover:bg-[#8B2A3E] transition-all shadow-sm"
              >
                <PenTool size={16} /> Write a Story
              </Link>
            ) : (
              <Link
                href="/auth?role=artist"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#EDE4CE] text-[#2C1810] font-sans text-[0.8rem] uppercase tracking-wider font-semibold border border-[rgba(107,30,46,0.18)] hover:bg-[#6B1E2E] hover:text-[#FFFDF7] transition-all"
              >
                <Sparkles size={16} /> Are you an Artisan? Share Your Story
              </Link>
            )}
          </div>
        </section>

        {/* SEARCH & CATEGORY FILTER BAR */}
        <section className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-10 -mt-6 relative z-20">
          <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-4 sm:p-6 shadow-md space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9C7A6A]" size={20} />
              <input
                type="text"
                value={searchInput}
                aria-label={t("stories.searchAria")}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t("stories.searchPlaceholder")}
                className="w-full bg-[#EDE4CE]/40 border border-[rgba(107,30,46,0.18)] pl-12 pr-4 py-3 font-sans text-[0.95rem] text-[#2C1810] focus:outline-none focus:border-[#6B1E2E] placeholder:text-[#9C7A6A]"
              />
            </div>

            {/* Category Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar">
              <span className="font-sans text-[0.7rem] uppercase tracking-wider text-[#9C7A6A] shrink-0 mr-1 flex items-center gap-1">
                <Filter size={12} /> Category:
              </span>

              <Link
                href={hrefFor({ category: "All" })}
                scroll={false}
                className={`px-3.5 py-1.5 font-sans text-[0.75rem] uppercase tracking-wider font-semibold shrink-0 transition-all ${
                  selectedCategory === "All"
                    ? "bg-[#6B1E2E] text-[#FFFDF7]"
                    : "bg-[#EDE4CE]/50 text-[#7A5C4E] hover:bg-[#EDE4CE] hover:text-[#2C1810]"
                }`}
              >
                All
              </Link>

              {STORY_CATEGORIES.map((cat) => (
                <Link
                  key={cat}
                  href={hrefFor({ category: cat })}
                  scroll={false}
                  className={`px-3.5 py-1.5 font-sans text-[0.75rem] uppercase tracking-wider font-semibold shrink-0 transition-all ${
                    selectedCategory === cat
                      ? "bg-[#6B1E2E] text-[#FFFDF7]"
                      : "bg-[#EDE4CE]/50 text-[#7A5C4E] hover:bg-[#EDE4CE] hover:text-[#2C1810]"
                  }`}
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURED STORY SPOTLIGHT */}
        {featuredStory && (
          <section className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-10 mt-12">
            <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-6 sm:p-10 relative shadow-sm overflow-hidden group">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 relative h-[280px] sm:h-[380px] overflow-hidden border border-[rgba(107,30,46,0.15)]">
                  <Image
                    src={featuredStory.cover_image_url || "/assets/defaults/artwork.svg"}
                    alt={featuredStory.title}
                    fill
 sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4 bg-[#6B1E2E] text-[#FFFDF7] px-3 py-1 font-sans text-[0.7rem] uppercase tracking-wider font-semibold">
                    Featured Story
                  </div>
                </div>

                <div className="lg:col-span-5 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-sans text-[0.75rem] uppercase tracking-wider text-[#6B1E2E] font-semibold">
                        {featuredStory.category}
                      </span>
                      <span className="text-[#9C7A6A]">•</span>
                      <span className="font-sans text-[0.75rem] text-[#7A5C4E] flex items-center gap-1">
                        <Clock size={13} /> {featuredStory.read_time}
                      </span>
                    </div>

                    <h2 className="font-serif text-[2rem] sm:text-[2.4rem] text-[#2C1810] leading-snug mb-4 group-hover:text-[#6B1E2E] transition-colors">
                      {featuredStory.title}
                    </h2>

                    {featuredStory.excerpt && (
                      <p className="font-sans text-[1rem] text-[#7A5C4E] leading-relaxed mb-6 line-clamp-3">
                        {featuredStory.excerpt}
                      </p>
                    )}
                  </div>

                  <div className="pt-6 border-t border-[rgba(107,30,46,0.12)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-[#EDE4CE] relative">
                        <Image
                          src={featuredStory.profiles?.avatar_url || "/assets/defaults/avatar.svg"}
                          alt="Artist"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-serif text-[0.95rem] text-[#2C1810]">
                          {getStoryAuthorName(featuredStory)}
                        </h4>
                        <p className="font-sans text-[0.7rem] text-[#7A5C4E]">
                          {getStoryAuthorName(featuredStory) === "Kalakaar Journal" ? "Editorial Desk" : (featuredStory.profiles?.city || "India")}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/stories/${featuredStory.id}`}
                      className="px-5 py-2.5 bg-[#6B1E2E] text-[#FFFDF7] font-sans text-[0.75rem] uppercase tracking-wider font-semibold flex items-center gap-2 hover:bg-[#8B2A3E] transition-colors"
                    >
                      Read Article <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* LATEST STORIES GRID */}
        <section className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-10 mt-16">
          <div className="flex justify-between items-end mb-8 border-b border-[rgba(107,30,46,0.15)] pb-4">
            <div>
              <span className="font-sans text-[0.72rem] uppercase tracking-[0.2em] text-[#9C7A6A] block mb-1">
                — CATALOGUE —
              </span>
              <h2 className="font-serif text-[2rem] text-[#2C1810]">
                {selectedCategory !== "All" ? `${selectedCategory} Stories` : "Latest Editorial Articles"}
              </h2>
            </div>
            <span className="font-sans text-[0.85rem] text-[#7A5C4E]">
              {initial?.total ?? 0} {(initial?.total ?? 0) === 1 ? "story" : "stories"} found
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-[#FFFDF7] border border-[#EDE4CE] h-[380px]" />
              ))}
            </div>
          ) : stories.length === 0 ? (
            <EmptyState
              type="no_stories"
              description={t("empty.storiesFiltered")}
              actionLabel={t("empty.resetFilters")}
              onAction={() => {
                setSearchInput("");
                startTransition(() => router.push("/stories", { scroll: false }));
              }}
            />
          ) : (
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 transition-opacity ${isPending ? "opacity-50" : ""}`}>
              {stories.map((story) => (
                <Link
                  key={story.id}
                  href={`/stories/${story.id}`}
                  className="group bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] hover:border-[#6B1E2E] transition-all duration-300 flex flex-col shadow-xs"
                >
                  <div className="relative h-[230px] bg-[#EDE4CE] overflow-hidden">
                    <Image
                      src={story.cover_image_url || "/assets/defaults/artwork.svg"}
                      alt={story.title}
                      fill
 sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-[#6B1E2E] text-[#FFFDF7] px-2.5 py-1 font-sans text-[0.65rem] uppercase tracking-wider font-semibold">
                      {story.category}
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-1 justify-between">
                    <div>
                      <h3 className="font-serif text-[1.3rem] text-[#2C1810] group-hover:text-[#6B1E2E] transition-colors leading-snug line-clamp-2 mb-3">
                        {story.title}
                      </h3>
                      {story.excerpt && (
                        <p className="font-sans text-[0.9rem] text-[#7A5C4E] line-clamp-3 mb-6 leading-relaxed">
                          {story.excerpt}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-[rgba(107,30,46,0.1)] flex items-center justify-between font-sans text-[0.78rem] text-[#7A5C4E]">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-[#EDE4CE] relative">
                          <Image
                            src={story.profiles?.avatar_url || "/assets/defaults/avatar.svg"}
                            alt="Avatar"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span className="font-serif text-[#2C1810]">
                          {getStoryAuthorName(story)}
                        </span>
                      </div>
                      <span className="flex items-center gap-1">
                        <Clock size={13} /> {story.read_time}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {!initial && (
            <p className="text-center font-sans text-[#7A5C4E] py-10">We could not load the stories right now. Please try again in a moment.</p>
          )}
          <Pagination page={initial?.page ?? 1} totalPages={initial?.totalPages ?? 1} hrefFor={(p) => hrefFor({ page: p })} />
        </section>
      </main>
    </div>
  );
}
