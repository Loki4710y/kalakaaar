"use client";
import { EmptyState } from "../components/ui/EmptyState";
import { ContactGate } from "../components/ui/ContactGate";
import { ReportButton } from "../components/ui/ReportButton";
import { whatsappLink } from "../lib/contact";
import { trackContact } from "../lib/trackContact";
import { useParams } from "next/navigation";
import { MadhubaniPattern } from "../components/patterns/MadhubaniPattern";
import { CornerBracket } from "../components/ui/CornerBracket";
import { GoldButton } from "../components/ui/GoldButton";
import { ArtworkCard } from "../components/ui/ArtworkCard";
import Link from "next/link";
import { Star, Clock, PenTool, Edit3, Trash2, ArrowUpDown } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useAuth } from "../contexts/AuthContext";
import { useStore } from "../contexts/StoreContext";
import { ArtworkService, Artwork } from "../../services/ArtworkService";
import { CollectionService, Collection } from "../../services/CollectionService";
import { StoryService, Story } from "../../services/StoryService";
import { FollowService } from "../../services/FollowService";
import { ReviewService, Review } from "../../services/ReviewService";
import { ProfileService } from "../../services/ProfileService";
import { notify } from "../lib/notify";
import { useServerPages } from "../hooks/useServerPages";
import { LoadMoreButton } from "../components/ui/LoadMoreButton";
import type { Paged } from "../repositories/utils";

/** `initialArtist`/`initialArtworks` come from the server so crawlers receive the real profile content. */
export function ArtistProfile({ initialArtist = null, initialArtworks = null }: { initialArtist?: any; initialArtworks?: Paged<Artwork> | null }) {
  const [activeTab, setActiveTab] = useState("ALL WORKS");
  const TABS = ["ALL WORKS", "COLLECTIONS", "STORIES", "REVIEWS", "ABOUT"];
  const params = useParams() as { id?: string; username?: string };
  const artistIdentifier = params.username || params.id || "";
  const { user } = useAuth();
  const { isFollowingArtist, toggleFollow } = useStore();

  const [artist, setArtist] = useState<any>(initialArtist);
  const artistIdToUse = artist?.id || artistIdentifier;
  const artworkPages = useServerPages<Artwork>({ items: initialArtworks?.items ?? [], total: initialArtworks?.total ?? 0, page: 1 });
  const collectionPages = useServerPages<Collection>({ items: [], total: 0, page: 1 });
  const storyPages = useServerPages<Story>({ items: [], total: 0, page: 1 });
  const artworks = artworkPages.items;
  const collections = collectionPages.items;
  const stories = storyPages.items;
  const isOwnProfile = !!user && user.id === (artist?.id || artistIdentifier);
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [loading, setLoading] = useState(!initialArtist);

  // Review states
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [reviewSort, setReviewSort] = useState<'newest' | 'highest' | 'lowest'>('newest');
  
  // Review Form states
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [commentInput, setCommentInput] = useState<string>('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  const isFollowing = isFollowingArtist(artistIdToUse);

  const fetchReviews = useCallback(async () => {
    if (!artistIdToUse) return;
    const res = await ReviewService.getReviews(artistIdToUse, reviewSort);
    if (res.success && res.data) {
      setReviews(res.data);
    }
    const avg = await ReviewService.getAverageRating(artistIdToUse);
    setAverageRating(avg);
    const count = await ReviewService.getReviewCount(artistIdToUse);
    setReviewCount(count);
  }, [artistIdToUse, reviewSort]);

  useEffect(() => {
    async function loadArtistData() {
      if (!artistIdentifier) return;
      if (!initialArtist) setLoading(true); // with server data we refresh quietly

      // Attempt to load real profile by username or ID
      try {
        let profRes = await ProfileService.getPublicProfile(artistIdentifier);
        if (!profRes.data && params.id) {
          profRes = await ProfileService.getProfile(params.id);
        }
        if (profRes.data) {
          setArtist(profRes.data);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
      
      // First page of each list (12 artworks, 9 collections, 9 stories). More are loaded on request.
      const [artRes, colRes, storyRes] = await Promise.all([
        ArtworkService.getArtistArtworksPage(artistIdToUse, { page: 1, pageSize: 12 }),
        CollectionService.getArtistCollectionsPage(artistIdToUse, { page: 1, pageSize: 9 }),
        StoryService.getArtistStoriesPage(artistIdToUse, { includeDrafts: user?.id === artistIdToUse, page: 1, pageSize: 9 }),
      ]);
      if (artRes.success && artRes.data) artworkPages.replace(artRes.data.items, artRes.data.total);
      if (colRes.success && colRes.data) collectionPages.replace(colRes.data.items, colRes.data.total);
      if (storyRes.success && storyRes.data) storyPages.replace(storyRes.data.items, storyRes.data.total);

      const fCount = await FollowService.getFollowerCount(artistIdToUse);
      setFollowerCount(fCount);

      await fetchReviews();

      setLoading(false);
    }

    loadArtistData();
  }, [artistIdentifier, params.id, artistIdToUse, user, fetchReviews]);

  const handleFollowToggle = async () => {
    if (!user) {
      window.location.href = '/auth?mode=signin';
      return;
    }

    if (user.id === artistIdToUse) {
      notify.error("You cannot follow your own profile.");
      return;
    }

    const res = await toggleFollow(artistIdToUse);
    if (res.success && typeof res.count === 'number') {
      setFollowerCount(res.count);
    } else if (res.error) {
      notify.error(res.error);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);
    setReviewSuccess(null);

    if (!user) {
      setReviewError("Please sign in to submit a review.");
      return;
    }

    if (user.id === artistIdToUse) {
      setReviewError("You cannot review your own profile.");
      return;
    }

    if (ratingInput < 1 || ratingInput > 5) {
      setReviewError("Please select a rating between 1 and 5 stars.");
      return;
    }

    if (commentInput.length > 500) {
      setReviewError("Review text cannot exceed 500 characters.");
      return;
    }

    setReviewSubmitting(true);

    if (editingReviewId) {
      const res = await ReviewService.updateReview(
        editingReviewId,
        user.id,
        artistIdToUse,
        ratingInput,
        commentInput
      );
      if (res.success) {
        setReviewSuccess("Your review has been updated successfully!");
        setShowReviewForm(false);
        setEditingReviewId(null);
        setCommentInput("");
        await fetchReviews();
      } else {
        setReviewError(res.error || "Failed to update review.");
      }
    } else {
      const res = await ReviewService.createReview(
        artistIdToUse,
        user.id,
        user.name,
        user.avatar || null,
        ratingInput,
        commentInput
      );
      if (res.success) {
        setReviewSuccess("Thank you! Your review has been posted.");
        setShowReviewForm(false);
        setCommentInput("");
        await fetchReviews();
      } else {
        setReviewError(res.error || "Failed to post review.");
      }
    }

    setReviewSubmitting(false);
  };

  const handleEditReviewClick = (review: Review) => {
    setEditingReviewId(review.id);
    setRatingInput(review.rating);
    setCommentInput(review.comment || "");
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this review?")) return;

    const res = await ReviewService.deleteReview(reviewId, user.id, artistIdToUse);
    if (res.success) {
      setReviewSuccess("Review deleted.");
      await fetchReviews();
    } else {
      notify.error(res.error || "Could not delete review.");
    }
  };

  const userExistingReview = user ? reviews.find((r) => r.user_id === user.id) : null;
  const memberSince = `Member since Jan 2021`;

  const stats = {
    artworks: artworkPages.total,
    followers: followerCount,
    rating: averageRating,
    reviews: reviewCount,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5EFE0] pt-24 pb-32 px-4 flex justify-center">
        <div className="animate-pulse w-full max-w-4xl h-[400px] bg-[#EDE4CE]"></div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen pb-32 bg-[#F5EFE0] flex flex-col">
      
      {/* Profile Header */}
      <section className="relative w-full bg-[#F5EFE0] pt-10 border-b border-[#6B1E2E]/[0.072] pb-0">
        <div className="absolute top-0 left-0 w-full h-[320px] overflow-hidden pointer-events-none bg-[#FFFDF7]">
          <MadhubaniPattern opacity={0.10} />
          <div className="absolute inset-x-4 inset-y-4">
            <CornerBracket />
          </div>
          <div className="absolute bottom-4 left-4" style={{ transform: 'rotate(-90deg)' }}>
             <CornerBracket />
          </div>
          <div className="absolute bottom-4 right-4" style={{ transform: 'rotate(180deg)' }}>
             <CornerBracket />
          </div>
        </div>
        
        <div className="relative z-10 max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-10 mt-[150px] flex flex-col items-center pb-8 border-b border-[#6B1E2E]/[0.072]">
          
          <div className="relative w-[110px] h-[110px] rounded-full border-[3px] border-[#6B1E2E] p-0.5 bg-[#FFFDF7] mb-5 shrink-0 shadow-sm overflow-hidden">
            <Image src={artist.avatar_url || '/assets/defaults/avatar.svg'} alt={`${artist.full_name || "Artist"}${artist.primary_art_style ? ` – ${artist.primary_art_style} artist` : " – folk artist"}`} fill className="object-cover rounded-full" referrerPolicy="no-referrer" />
          </div>
          
          <h1 className="font-serif text-[3rem] font-semibold text-[#2C1810] leading-tight mb-2">
            {(artist.full_name || "Artist")}
          </h1>
          
          <p className="font-sans text-[0.9rem] text-[#7A5C4E] uppercase tracking-[0.1em] mb-3">
            {(artist.location ? `Artist · ${artist.location}` : "Artist")}
          </p>

          <div className="flex items-center gap-3 text-sm text-[#6B1E2E] mb-2">
            <span>👁 {artist.profile_views || 0} views</span>
            {reviewCount > 0 && (
              <span className="flex items-center gap-1 font-semibold">
                <Star size={14} className="fill-[#C8A84B] text-[#C8A84B]" />
                {averageRating} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            )}
          </div>

          {artist.is_featured && (
            <div className="flex items-center gap-1 px-3 py-1 bg-[#C8A84B] rounded-full w-fit mb-4">
              <span className="text-sm">⭐</span>
              <span className="text-xs font-bold text-[#1a0a0f]">Featured Artist</span>
            </div>
          )}

          <div className="flex flex-col items-center justify-center gap-4 mb-2 mt-4 max-w-sm mx-auto w-full">
             {user?.id !== artistIdToUse && (
               <GoldButton 
                 variant="outline" 
                 className={`flex items-center gap-2 text-[0.8rem] px-6 py-2.5 bg-[#FFFDF7] w-full justify-center ${isFollowing ? 'text-[#6B1E2E] border-[#6B1E2E] font-bold' : ''}`}
                 onClick={handleFollowToggle}
               >
                 {isFollowing ? "Following ✓" : "Follow Artist"}
               </GoldButton>
             )}
             
             {artist?.whatsapp_number && (
               <a
                 href={whatsappLink(artist.whatsapp_number, `🎨 *Kalakaar — Artwork Inquiry*\n\nHi ${artist.full_name}!\n\nI saw your portfolio on Kalakaar and I'm interested in ordering.`) || "#"}
                 target="_blank"
                 rel="noopener noreferrer"
                 onClick={() => trackContact(artist?.id, "whatsapp")}
                 className="w-full flex items-center justify-center gap-3 bg-[#25D366] text-white rounded-lg py-3.5 text-sm font-bold shadow-md hover:opacity-90 active:scale-95 transition-all duration-200"
               >
                 Order on WhatsApp
               </a>
             )}
             <ContactGate hasContact={!!artist?.whatsapp_number} loggedIn={!!user} redirectPath={`/artist/${artist?.id || params.id}`} />
             {artist?.id && <div className="flex justify-center"><ReportButton itemType="artist" itemId={artist.id} ownerId={artist.id} /></div>}
          </div>
        </div>
        
        {/* Stats Bar */}
        <div className="w-full bg-[#EDE4CE] border-b border-[rgba(107,30,46,0.18)] relative z-20">
           <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-center flex-wrap gap-x-8 gap-y-4 font-sans text-[0.85rem]">
              <div className="flex flex-col items-center">
                <span className="font-serif text-[1.4rem] text-[#2C1810] font-semibold">{stats.artworks}</span>
                <span className="text-[#7A5C4E] uppercase tracking-wider text-[0.65rem]">Artworks</span>
              </div>
              <span className="text-[#6B1E2E]/40">|</span>
              <div className="flex flex-col items-center">
                <span className="font-serif text-[1.4rem] text-[#2C1810] font-semibold">{stats.followers}</span>
                <span className="text-[#7A5C4E] uppercase tracking-wider text-[0.65rem]">Followers</span>
              </div>
              <span className="text-[#6B1E2E]/40">|</span>
              <div className="flex flex-col items-center">
                <span className="font-serif text-[1.4rem] text-[#2C1810] font-semibold flex items-center gap-1">
                  {stats.rating > 0 ? stats.rating : "N/A"}
                  <Star size={16} className="fill-[#C8A84B] text-[#C8A84B]" />
                </span>
                <span className="text-[#7A5C4E] uppercase tracking-wider text-[0.65rem]">{stats.reviews} Reviews</span>
              </div>
              <span className="text-[#6B1E2E]/40">|</span>
              <div className="flex flex-col items-center justify-center pt-1">
                <span className="text-[#7A5C4E] uppercase tracking-wider text-[0.75rem] font-medium">{memberSince}</span>
              </div>
           </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center pt-2 relative z-20">
          <div className="flex items-center gap-8 md:gap-12 overflow-x-auto no-scrollbar">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 pt-4 font-sans text-[0.8rem] uppercase tracking-[0.1em] whitespace-nowrap transition-colors duration-250 relative ${
                  activeTab === tab ? "text-[#6B1E2E] font-medium" : "text-[#7A5C4E] hover:text-[#6B1E2E]"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#6B1E2E]"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="flex-1 max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-10 mt-12 w-full">
        <div className="flex flex-col lg:flex-row gap-10 items-start relative">
          
          {/* Main Portfolio Area */}
          <div className="flex-1 w-full min-w-0">
             
             {activeTab === "ALL WORKS" && (
                <div className="animate-in fade-in duration-300">
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-8">
                      {artworks.length === 0 ? (
                        <div className="col-span-full"><EmptyState type="no_artworks" /></div>
                      ) : (
                        artworks.map((art) => (
                           <ArtworkCard
                             key={art.id}
                             id={art.id}
                             like_count={art.like_count}
                             artistId={artist?.id}
                             title={art.title}
                             artistName={artist?.full_name}
                             price={art.price}
                             image_urls={art.image_urls}
                             style={art.category}
                             categories={[art.category]}
                             isSold={art.status === 'archived'}
                           />
                        ))
                      )}
                   </div>
                   <LoadMoreButton
                     shown={artworks.length}
                     total={artworkPages.total}
                     loading={artworkPages.loadingMore}
                     failed={artworkPages.failed}
                     onClick={() => artworkPages.loadMore(async (page) => {
                       const r = await ArtworkService.getArtistArtworksPage(artistIdToUse, { page, pageSize: 12 });
                       return r.success && r.data ? r.data : null;
                     })}
                   />
                </div>
             )}

             {activeTab === "COLLECTIONS" && (
                <div className="animate-in fade-in duration-300">
                   {collections.length === 0 ? (
                      <EmptyState type="no_collections" />
                   ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                         {collections.map((col) => {
                            const cover = col.cover_image_url || "/assets/defaults/collection.svg";
                            const count = col.artworks?.length || 0;
                            return (
                               <Link
                                  key={col.id}
                                  href={`/collections/${col.id}`}
                                  className="group bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] hover:border-[#6B1E2E] transition-all duration-300 flex flex-col shadow-sm"
                               >
                                  <div className="relative h-48 w-full bg-[#EDE4CE] overflow-hidden">
                                     <Image
                                        src={cover}
                                        alt={col.title}
                                        fill
 sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className="object-cover group-hover:scale-105 transition-all duration-500"
                                        referrerPolicy="no-referrer"
                                     />
                                     <div className="absolute top-2 right-2 bg-[#6B1E2E] text-white px-2 py-0.5 text-[0.65rem] uppercase font-sans tracking-wider font-semibold">
                                        {count} {count === 1 ? 'Artwork' : 'Artworks'}
                                     </div>
                                  </div>
                                  <div className="p-5 flex flex-col flex-1 justify-between">
                                     <div>
                                        <h3 className="font-serif text-lg text-[#2C1810] font-semibold mb-1 group-hover:text-[#6B1E2E] transition-colors">
                                           {col.title}
                                        </h3>
                                        {col.description && (
                                           <p className="font-sans text-xs text-[#7A5C4E] line-clamp-2 leading-relaxed">
                                              {col.description}
                                           </p>
                                        )}
                                     </div>
                                     <div className="mt-4 pt-3 border-t border-[#6B1E2E]/[0.072] flex justify-between items-center text-xs font-sans text-[#6B1E2E] uppercase tracking-wider font-semibold">
                                        <span>View Collection</span>
                                        <span>→</span>
                                     </div>
                                  </div>
                               </Link>
                            );
                         })}
                      </div>
                   )}
                   <LoadMoreButton
                     shown={collections.length}
                     total={collectionPages.total}
                     loading={collectionPages.loadingMore}
                     failed={collectionPages.failed}
                     onClick={() => collectionPages.loadMore(async (page) => {
                       const r = await CollectionService.getArtistCollectionsPage(artistIdToUse, { page, pageSize: 9 });
                       return r.success && r.data ? r.data : null;
                     })}
                   />
                </div>
             )}

             {activeTab === "STORIES" && (
                <div className="animate-in fade-in duration-300">
                   <div className="flex justify-between items-center mb-6">
                      <div>
                         <h2 className="font-serif text-[1.8rem] text-[#2C1810]">Artisan Stories</h2>
                         <p className="font-sans text-xs text-[#7A5C4E]">Articles, journey notes, and technique guides published by {artist?.full_name}</p>
                      </div>
                      {(user?.id === artist?.id || user?.role === 'artist') && (
                         <Link
                            href="/stories/new"
                            className="px-4 py-2 bg-[#6B1E2E] text-[#FFFDF7] font-sans text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5 hover:bg-[#8B2A3E] transition-colors"
                         >
                            <PenTool size={14} /> Write Story
                         </Link>
                      )}
                   </div>

                   {stories.length === 0 ? (
                      <EmptyState type="no_stories" />
                   ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                         {stories.map((s) => (
                            <Link
                               key={s.id}
                               href={`/stories/${s.id}`}
                               className="group bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] hover:border-[#6B1E2E] transition-all duration-300 flex flex-col shadow-xs overflow-hidden"
                            >
                               <div className="relative h-44 w-full bg-[#EDE4CE] overflow-hidden">
                                  <Image
                                     src={s.cover_image_url || "/assets/defaults/artwork.svg"}
                                     alt={s.title}
                                     fill
 sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                     className="object-cover group-hover:scale-105 transition-all duration-500"
                                  />
                                  <div className="absolute top-2.5 left-2.5 bg-[#6B1E2E] text-white px-2 py-0.5 text-[0.65rem] uppercase font-sans tracking-wider font-semibold">
                                     {s.category}
                                  </div>
                                  {s.status === 'draft' && (
                                     <div className="absolute top-2.5 right-2.5 bg-[#2C1810] text-[#FFFDF7] px-2 py-0.5 text-[0.65rem] uppercase font-sans tracking-wider font-semibold">
                                        Draft
                                     </div>
                                  )}
                               </div>

                               <div className="p-5 flex flex-col flex-1 justify-between">
                                  <div>
                                     <h3 className="font-serif text-lg text-[#2C1810] font-semibold mb-2 group-hover:text-[#6B1E2E] transition-colors leading-snug line-clamp-2">
                                        {s.title}
                                     </h3>
                                     {s.excerpt && (
                                        <p className="font-sans text-xs text-[#7A5C4E] line-clamp-2 leading-relaxed mb-4">
                                           {s.excerpt}
                                        </p>
                                     )}
                                  </div>

                                  <div className="pt-3 border-t border-[rgba(107,30,46,0.1)] flex items-center justify-between font-sans text-xs text-[#7A5C4E]">
                                     <span className="flex items-center gap-1">
                                        <Clock size={12} /> {s.read_time}
                                     </span>
                                     <span className="text-[#6B1E2E] uppercase font-semibold text-[0.7rem] group-hover:translate-x-1 transition-transform">
                                        Read Article →
                                     </span>
                                  </div>
                               </div>
                            </Link>
                         ))}
                      </div>
                   )}
                   <LoadMoreButton
                     shown={stories.length}
                     total={storyPages.total}
                     loading={storyPages.loadingMore}
                     failed={storyPages.failed}
                     onClick={() => storyPages.loadMore(async (page) => {
                       const r = await StoryService.getArtistStoriesPage(artistIdToUse, { includeDrafts: isOwnProfile, page, pageSize: 9 });
                       return r.success && r.data ? r.data : null;
                     })}
                   />
                </div>
             )}

             {/* REVIEWS TAB */}
             {activeTab === "REVIEWS" && (
                <div className="animate-in fade-in duration-300">
                  <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-6 md:p-8 mb-8 shadow-xs">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#6B1E2E]/10">
                      <div>
                        <h2 className="font-serif text-[2rem] text-[#2C1810] font-semibold">
                          Art Collector Reviews
                        </h2>
                        <p className="font-sans text-xs text-[#7A5C4E] mt-1">
                          Feedback from art enthusiasts and collectors
                        </p>
                      </div>

                      {/* Summary Rating */}
                      <div className="flex items-center gap-4 bg-[#EDE4CE]/50 p-4 rounded-none border border-[#6B1E2E]/10">
                        <div className="text-center">
                          <span className="font-serif text-3xl font-bold text-[#2C1810] block leading-none">
                            {averageRating > 0 ? averageRating : "N/A"}
                          </span>
                          <span className="font-sans text-[0.65rem] text-[#7A5C4E] uppercase tracking-wider block mt-1">
                            out of 5
                          </span>
                        </div>
                        <div className="h-8 w-px bg-[#6B1E2E]/20" />
                        <div>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={18}
                                className={
                                  star <= Math.round(averageRating)
                                    ? "fill-[#C8A84B] text-[#C8A84B]"
                                    : "text-[#D3C5B4]"
                                }
                              />
                            ))}
                          </div>
                          <p className="font-sans text-xs text-[#7A5C4E] mt-1 font-medium">
                            Based on {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                      {/* Sort Selector */}
                      <div className="flex items-center gap-2">
                        <span className="font-sans text-xs text-[#7A5C4E] uppercase tracking-wider flex items-center gap-1">
                          <ArrowUpDown size={14} /> Sort:
                        </span>
                        <select
                          value={reviewSort}
                          onChange={(e) => setReviewSort(e.target.value as any)}
                          className="bg-[#FDFBF7] border border-[#6B1E2E]/30 text-xs text-[#2C1810] px-3 py-1.5 font-sans focus:outline-none focus:border-[#6B1E2E]"
                        >
                          <option value="newest">Newest First</option>
                          <option value="highest">Highest Rating</option>
                          <option value="lowest">Lowest Rating</option>
                        </select>
                      </div>

                      {/* Write Review Button */}
                      {user && user.id !== artistIdToUse && (
                        <div>
                          {userExistingReview ? (
                            <button
                              onClick={() => handleEditReviewClick(userExistingReview)}
                              className="px-4 py-2 bg-[#FFFDF7] border border-[#6B1E2E] text-[#6B1E2E] font-sans text-xs uppercase tracking-wider font-semibold hover:bg-[#6B1E2E] hover:text-white transition-colors flex items-center gap-1.5"
                            >
                              <Edit3 size={14} /> Edit Your Review
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setShowReviewForm(!showReviewForm);
                                setEditingReviewId(null);
                                setRatingInput(5);
                                setCommentInput("");
                              }}
                              className="px-5 py-2.5 bg-[#6B1E2E] text-[#FFFDF7] font-sans text-xs uppercase tracking-wider font-semibold hover:bg-[#8B2A3E] transition-colors shadow-xs flex items-center gap-2"
                            >
                              <Star size={14} className="fill-current" /> Write a Review
                            </button>
                          )}
                        </div>
                      )}

                      {!user && (
                        <p className="font-sans text-xs text-[#7A5C4E]">
                          <Link href="/auth?mode=signin" className="text-[#6B1E2E] font-semibold underline">
                            Sign in
                          </Link>{" "}
                          to post a review for this artist.
                        </p>
                      )}
                    </div>

                    {/* Toast / Messages */}
                    {reviewSuccess && (
                      <div className="mt-4 p-3 bg-[#25D366]/10 border border-[#25D366]/30 text-[#1E7238] font-sans text-xs font-medium">
                        {reviewSuccess}
                      </div>
                    )}

                    {reviewError && (
                      <div className="mt-4 p-3 bg-[#D32F2F]/10 border border-[#D32F2F]/30 text-[#D32F2F] font-sans text-xs font-medium">
                        {reviewError}
                      </div>
                    )}

                    {/* Write / Edit Review Form */}
                    {showReviewForm && (
                      <form
                        onSubmit={handleReviewSubmit}
                        className="mt-6 p-5 bg-[#FDFBF7] border border-[#6B1E2E]/30 animate-in fade-in duration-200"
                      >
                        <h3 className="font-serif text-lg font-semibold text-[#2C1810] mb-3">
                          {editingReviewId ? "Edit Your Review" : "Write a Review"}
                        </h3>

                        {/* Rating Selector */}
                        <div className="mb-4">
                          <label className="block font-sans text-xs uppercase tracking-wider text-[#7A5C4E] mb-2 font-medium">
                            Rating:
                          </label>
                          <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRatingInput(star)}
                                className="p-1 hover:scale-110 transition-transform focus:outline-none"
                              >
                                <Star
                                  size={24}
                                  className={
                                    star <= ratingInput
                                      ? "fill-[#C8A84B] text-[#C8A84B]"
                                      : "text-[#D3C5B4]"
                                  }
                                />
                              </button>
                            ))}
                            <span className="font-sans text-xs text-[#2C1810] ml-2 font-semibold">
                              {ratingInput} / 5 Stars
                            </span>
                          </div>
                        </div>

                        {/* Comment textarea */}
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-1">
                            <label className="block font-sans text-xs uppercase tracking-wider text-[#7A5C4E] font-medium">
                              Your Experience / Feedback:
                            </label>
                            <span className="font-sans text-[0.7rem] text-[#9C7A6A]">
                              {commentInput.length}/500 chars
                            </span>
                          </div>
                          <textarea
                            rows={4}
                            maxLength={500}
                            value={commentInput}
                            onChange={(e) => setCommentInput(e.target.value)}
                            placeholder="Share your thoughts about the artist's craftsmanship, artwork quality, communication, packaging..."
                            className="w-full bg-[#FFFDF7] border border-[#6B1E2E]/30 p-3 font-sans text-sm text-[#2C1810] focus:outline-none focus:border-[#6B1E2E]"
                          />
                        </div>

                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setShowReviewForm(false)}
                            className="px-4 py-2 border border-[#7A5C4E]/40 text-[#7A5C4E] font-sans text-xs uppercase tracking-wider font-semibold hover:bg-[#EDE4CE] transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={reviewSubmitting}
                            className="px-6 py-2 bg-[#6B1E2E] text-white font-sans text-xs uppercase tracking-wider font-semibold hover:bg-[#8B2A3E] transition-colors disabled:opacity-50"
                          >
                            {reviewSubmitting ? "Submitting..." : editingReviewId ? "Update Review" : "Post Review"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Reviews List */}
                  {reviews.length === 0 ? (
                    <div className="py-12 text-center text-[#7A5C4E] border border-[rgba(107,30,46,0.18)] bg-[#FFFDF7] p-8">
                      <Star className="mx-auto text-[#C8A84B] mb-3" size={32} />
                      <p className="font-serif text-xl text-[#2C1810] mb-2">No reviews yet.</p>
                      <p className="font-sans text-xs text-[#7A5C4E]">
                        Be the first art lover to share feedback for {artist?.full_name}!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((rev) => (
                        <div
                          key={rev.id}
                          className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-6 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-start"
                        >
                          <div className="flex gap-4 items-start flex-1">
                            <div className="w-10 h-10 rounded-full bg-[#6B1E2E]/10 border border-[#6B1E2E]/30 flex items-center justify-center font-serif text-[#6B1E2E] font-bold shrink-0">
                              {(rev.user_name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-3">
                                <h4 className="font-sans text-sm font-bold text-[#2C1810]">
                                  {rev.user_name}
                                </h4>
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                      key={s}
                                      size={13}
                                      className={
                                        s <= rev.rating
                                          ? "fill-[#C8A84B] text-[#C8A84B]"
                                          : "text-[#D3C5B4]"
                                      }
                                    />
                                  ))}
                                </div>
                              </div>

                              <p className="font-sans text-xs text-[#9C7A6A] mt-0.5 uppercase tracking-wider">
                                {new Date(rev.created_at).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </p>

                              {rev.comment && (
                                <p className="font-sans text-sm text-[#7A5C4E] mt-3 leading-relaxed">
                                  &quot;{rev.comment}&quot;
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Owner controls */}
                          {user && user.id === rev.user_id && (
                            <div className="flex items-center gap-2 self-end md:self-start">
                              <button
                                onClick={() => handleEditReviewClick(rev)}
                                className="p-1.5 text-[#7A5C4E] hover:text-[#6B1E2E] transition-colors"
                                title="Edit Review"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteReview(rev.id)}
                                className="p-1.5 text-[#7A5C4E] hover:text-[#D32F2F] transition-colors"
                                title="Delete Review"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
             )}

             {activeTab === "ABOUT" && (
                <div className="animate-in fade-in duration-300">
                   <div className="bg-[#FFFDF7] p-8 border border-[#6B1E2E]/[0.054]">
                     <h2 className="font-serif text-[1.8rem] text-[#2C1810] mb-4">Biography</h2>
                     <p className="font-sans text-[#7A5C4E] leading-relaxed">{artist?.bio}</p>
                   </div>
                </div>
             )}

          </div>
        </div>
      </div>
    </main>
  );
}
