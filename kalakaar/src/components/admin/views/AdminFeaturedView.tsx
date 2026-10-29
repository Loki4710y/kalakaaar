"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Sparkles, Users, Image as ImageIcon, Layers, BookOpen, ArrowUp, ArrowDown, X } from "lucide-react";
import {
  AdminService,
  AdminArtist,
  AdminArtwork,
  AdminCollection,
  AdminStory
} from "../../../../services/AdminService";
import { getStoryAuthorName } from "../../../lib/storyUtils";

export function AdminFeaturedView() {
  const [activeTab, setActiveTab] = useState<"artists" | "artworks" | "collections" | "stories">("artworks");
  const [loading, setLoading] = useState(true);

  const [featuredArtists, setFeaturedArtists] = useState<AdminArtist[]>([]);
  const [featuredArtworks, setFeaturedArtworks] = useState<AdminArtwork[]>([]);
  const [featuredCollections, setFeaturedCollections] = useState<AdminCollection[]>([]);
  const [featuredStories, setFeaturedStories] = useState<AdminStory[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const loadFeatured = async () => {
    setLoading(true);
    const res = await AdminService.getFeaturedContent();
    if (res.success && res.data) {
      setFeaturedArtists(res.data.artists);
      setFeaturedArtworks(res.data.artworks);
      setFeaturedCollections(res.data.collections);
      setFeaturedStories(res.data.stories);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadFeatured();
  }, []);

  const showFeedback = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  // Move items in list
  const moveItem = (list: any[], index: number, direction: "up" | "down", setter: React.Dispatch<React.SetStateAction<any[]>>) => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const copy = [...list];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setter(copy);
    showFeedback("Reordered featured sequence.");
  };

  // Remove from featured
  const unfeature = async (id: string, type: "artist" | "artwork" | "collection" | "story", title: string) => {
    if (type === "artist") {
      await AdminService.featureArtist(id, false);
      setFeaturedArtists((prev) => prev.filter((a) => a.id !== id));
    } else if (type === "artwork") {
      await AdminService.featureArtwork(id, false);
      setFeaturedArtworks((prev) => prev.filter((a) => a.id !== id));
    } else if (type === "collection") {
      await AdminService.featureCollection(id, false);
      setFeaturedCollections((prev) => prev.filter((c) => c.id !== id));
    } else if (type === "story") {
      await AdminService.featureStory(id, false);
      setFeaturedStories((prev) => prev.filter((s) => s.id !== id));
    }
    showFeedback(`Removed "${title}" from Featured.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(107,30,46,0.18)]">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#2C1810] flex items-center gap-2">
            <Sparkles className="text-[#6B1E2E]" size={24} /> Homepage Showcase & Featured Curation
          </h1>
          <p className="font-sans text-xs text-[#7A5C4E] mt-0.5">
            Arrange priority order and display sequences for featured artists, artworks, collections, and folk stories.
          </p>
        </div>

        {notice && (
          <div className="px-3 py-1.5 bg-[#6B1E2E] text-white font-sans text-xs font-semibold animate-in fade-in shadow-xs">
            {notice}
          </div>
        )}
      </div>

      {/* Curation Tabs */}
      <div className="flex border-b border-[rgba(107,30,46,0.18)] bg-[#FFFDF7]">
        <button
          onClick={() => setActiveTab("artworks")}
          className={`flex items-center gap-2 px-6 py-3 font-sans text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === "artworks"
              ? "border-[#6B1E2E] text-[#6B1E2E] bg-[#F5EFE0]"
              : "border-transparent text-[#7A5C4E] hover:text-[#2C1810]"
          }`}
        >
          <ImageIcon size={16} /> Featured Artworks ({featuredArtworks.length})
        </button>

        <button
          onClick={() => setActiveTab("artists")}
          className={`flex items-center gap-2 px-6 py-3 font-sans text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === "artists"
              ? "border-[#6B1E2E] text-[#6B1E2E] bg-[#F5EFE0]"
              : "border-transparent text-[#7A5C4E] hover:text-[#2C1810]"
          }`}
        >
          <Users size={16} /> Featured Artisans ({featuredArtists.length})
        </button>

        <button
          onClick={() => setActiveTab("collections")}
          className={`flex items-center gap-2 px-6 py-3 font-sans text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === "collections"
              ? "border-[#6B1E2E] text-[#6B1E2E] bg-[#F5EFE0]"
              : "border-transparent text-[#7A5C4E] hover:text-[#2C1810]"
          }`}
        >
          <Layers size={16} /> Featured Collections ({featuredCollections.length})
        </button>

        <button
          onClick={() => setActiveTab("stories")}
          className={`flex items-center gap-2 px-6 py-3 font-sans text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === "stories"
              ? "border-[#6B1E2E] text-[#6B1E2E] bg-[#F5EFE0]"
              : "border-transparent text-[#7A5C4E] hover:text-[#2C1810]"
          }`}
        >
          <BookOpen size={16} /> Featured Stories ({featuredStories.length})
        </button>
      </div>

      {/* Active Tab Panel */}
      <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-6 shadow-2xs">
        {loading ? (
          <div className="py-12 text-center font-serif text-sm text-[#2C1810]">
            Loading featured sequence...
          </div>
        ) : (
          <div className="space-y-4">
            {/* Featured Artworks Tab */}
            {activeTab === "artworks" && (
              featuredArtworks.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#7A5C4E]">
                  No featured artworks selected. Go to Artworks tab to feature items.
                </div>
              ) : (
                featuredArtworks.map((art, idx) => (
                  <div
                    key={art.id}
                    className="p-4 bg-[#F5EFE0]/60 border border-[rgba(107,30,46,0.15)] flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-6 font-serif text-lg font-bold text-[#6B1E2E]">
                        #{idx + 1}
                      </span>
                      <div className="relative w-12 h-12 bg-[#EDE4CE] border border-[rgba(107,30,46,0.15)] shrink-0">
                        <Image
                          src={art.thumbnail_url || "/assets/defaults/artwork.svg"}
                          alt={art.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div>
                        <h3 className="font-serif text-sm font-bold text-[#2C1810]">{art.title}</h3>
                        <p className="font-sans text-xs text-[#7A5C4E]">
                          {art.artist_name} • {art.category} • ₹{art.price.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => moveItem(featuredArtworks, idx, "up", setFeaturedArtworks)}
                        disabled={idx === 0}
                        className="p-1.5 bg-[#EDE4CE] hover:bg-[#2C1810] hover:text-white disabled:opacity-30 transition-colors"
                        title="Move Up"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        onClick={() => moveItem(featuredArtworks, idx, "down", setFeaturedArtworks)}
                        disabled={idx === featuredArtworks.length - 1}
                        className="p-1.5 bg-[#EDE4CE] hover:bg-[#2C1810] hover:text-white disabled:opacity-30 transition-colors"
                        title="Move Down"
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        onClick={() => unfeature(art.id, "artwork", art.title)}
                        className="p-1.5 bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                        title="Remove from Featured"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )
            )}

            {/* Featured Artists Tab */}
            {activeTab === "artists" && (
              featuredArtists.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#7A5C4E]">
                  No featured artisans selected.
                </div>
              ) : (
                featuredArtists.map((artist, idx) => (
                  <div
                    key={artist.id}
                    className="p-4 bg-[#F5EFE0]/60 border border-[rgba(107,30,46,0.15)] flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-6 font-serif text-lg font-bold text-[#6B1E2E]">
                        #{idx + 1}
                      </span>
                      <div className="relative w-12 h-12 rounded-full bg-[#EDE4CE] overflow-hidden shrink-0 border border-[#6B1E2E]/20">
                        <Image
                          src={artist.avatar_url || "/assets/defaults/avatar.svg"}
                          alt={artist.full_name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div>
                        <h3 className="font-serif text-sm font-bold text-[#2C1810]">{artist.full_name}</h3>
                        <p className="font-sans text-xs text-[#7A5C4E]">
                          @{artist.username} • {artist.art_style} • {artist.followers_count} Followers
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => moveItem(featuredArtists, idx, "up", setFeaturedArtists)}
                        disabled={idx === 0}
                        className="p-1.5 bg-[#EDE4CE] hover:bg-[#2C1810] hover:text-white disabled:opacity-30 transition-colors"
                        title="Move Up"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        onClick={() => moveItem(featuredArtists, idx, "down", setFeaturedArtists)}
                        disabled={idx === featuredArtists.length - 1}
                        className="p-1.5 bg-[#EDE4CE] hover:bg-[#2C1810] hover:text-white disabled:opacity-30 transition-colors"
                        title="Move Down"
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        onClick={() => unfeature(artist.id, "artist", artist.full_name)}
                        className="p-1.5 bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                        title="Remove from Featured"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )
            )}

            {/* Featured Collections Tab */}
            {activeTab === "collections" && (
              featuredCollections.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#7A5C4E]">
                  No featured collections selected.
                </div>
              ) : (
                featuredCollections.map((col, idx) => (
                  <div
                    key={col.id}
                    className="p-4 bg-[#F5EFE0]/60 border border-[rgba(107,30,46,0.15)] flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-6 font-serif text-lg font-bold text-[#6B1E2E]">
                        #{idx + 1}
                      </span>
                      <div className="relative w-12 h-12 bg-[#EDE4CE] overflow-hidden shrink-0 border border-[#6B1E2E]/20">
                        <Image
                          src={col.cover_url || "/assets/defaults/collection.svg"}
                          alt={col.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div>
                        <h3 className="font-serif text-sm font-bold text-[#2C1810]">{col.title}</h3>
                        <p className="font-sans text-xs text-[#7A5C4E]">
                          By {col.artist_name} • {col.artwork_count} Artworks
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => moveItem(featuredCollections, idx, "up", setFeaturedCollections)}
                        disabled={idx === 0}
                        className="p-1.5 bg-[#EDE4CE] hover:bg-[#2C1810] hover:text-white disabled:opacity-30 transition-colors"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        onClick={() => moveItem(featuredCollections, idx, "down", setFeaturedCollections)}
                        disabled={idx === featuredCollections.length - 1}
                        className="p-1.5 bg-[#EDE4CE] hover:bg-[#2C1810] hover:text-white disabled:opacity-30 transition-colors"
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        onClick={() => unfeature(col.id, "collection", col.title)}
                        className="p-1.5 bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )
            )}

            {/* Featured Stories Tab */}
            {activeTab === "stories" && (
              featuredStories.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#7A5C4E]">
                  No featured stories selected.
                </div>
              ) : (
                featuredStories.map((story, idx) => (
                  <div
                    key={story.id}
                    className="p-4 bg-[#F5EFE0]/60 border border-[rgba(107,30,46,0.15)] flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-6 font-serif text-lg font-bold text-[#6B1E2E]">
                        #{idx + 1}
                      </span>
                      <div className="relative w-12 h-12 bg-[#EDE4CE] overflow-hidden shrink-0 border border-[#6B1E2E]/20">
                        <Image
                          src={story.cover_url || "/assets/defaults/artwork.svg"}
                          alt={story.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div>
                        <h3 className="font-serif text-sm font-bold text-[#2C1810]">{story.title}</h3>
                        <p className="font-sans text-xs text-[#7A5C4E]">
                          By {getStoryAuthorName(story)} • {story.category} • {story.read_time}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => moveItem(featuredStories, idx, "up", setFeaturedStories)}
                        disabled={idx === 0}
                        className="p-1.5 bg-[#EDE4CE] hover:bg-[#2C1810] hover:text-white disabled:opacity-30 transition-colors"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        onClick={() => moveItem(featuredStories, idx, "down", setFeaturedStories)}
                        disabled={idx === featuredStories.length - 1}
                        className="p-1.5 bg-[#EDE4CE] hover:bg-[#2C1810] hover:text-white disabled:opacity-30 transition-colors"
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        onClick={() => unfeature(story.id, "story", story.title)}
                        className="p-1.5 bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
