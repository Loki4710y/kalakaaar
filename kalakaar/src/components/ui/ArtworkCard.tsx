"use client";
import { notify } from "../../lib/notify";
import { whatsappLink } from "../../lib/contact";
import { trackContact } from "../../lib/trackContact";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useStore } from "../../contexts/StoreContext";
import { useAuth } from "../../contexts/AuthContext";
import { Heart, Star, Share2 } from "lucide-react";

export interface ArtworkCardProps {
  id: string;
  title: string;
  artistId?: string;
  artistName: string;
  artistWhatsapp?: string;
  price?: number;
  image_urls?: string[];
  style?: string;
  categories?: string[];
  isTrending?: boolean;
  isSold?: boolean;
  initialLikeCount?: number;
  like_count?: number;
}

export const ArtworkCard = React.memo(
  ({
    id,
    title,
    artistId,
    artistName,
    artistWhatsapp,
    image_urls,
    style,
    categories,
    isTrending,
    isSold,
    initialLikeCount: initialLikeCountProp,
    like_count,
  }: ArtworkCardProps) => {
    const initialLikeCount = initialLikeCountProp ?? like_count ?? 0;
    const { wishlist, toggleWishlist, likedArtworks, toggleLike } = useStore();
    const { user } = useAuth();
    const navigate = useRouter();

    const [likeCount, setLikeCount] = useState<number>(initialLikeCount);
    const [actionMessage, setActionMessage] = useState<string | null>(null);

    const isLiked = likedArtworks.includes(id);
    const isSaved = wishlist.includes(id);
    const finalImageUrl = image_urls?.[0];

    // The count arrives with the artwork row itself (like_count): no per-card request.
    useEffect(() => {
      setLikeCount(initialLikeCount);
    }, [initialLikeCount]);

    const showToast = (msg: string) => {
      setActionMessage(msg);
      setTimeout(() => setActionMessage(null), 3000);
    };

    const handleLikeClick = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!user) {
        showToast("Please log in to like artworks.");
        navigate.push("/auth?mode=signin");
        return;
      }

      // Check if user owns this artwork
      if (artistId && user.id === artistId) {
        showToast("You cannot like your own artwork.");
        return;
      }

      const result = await toggleLike(id);
      if (result.success) {
        if (typeof result.count === "number") {
          setLikeCount(result.count);
        } else {
          setLikeCount((prev) => (result.liked ? prev + 1 : Math.max(0, prev - 1)));
        }
        showToast(result.liked ? "Liked artwork!" : "Removed like.");
      } else if (result.error) {
        showToast(result.error);
      }
    };

    const handleSaveClick = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!user) {
        showToast("Please log in to save artworks.");
        navigate.push("/auth?mode=signin");
        return;
      }

      const result = await toggleWishlist(id);
      if (result.success) {
        showToast(result.saved ? "Saved to wishlist!" : "Removed from wishlist.");
      } else if (result.error) {
        showToast(result.error);
      }
    };

    const handleShareClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const url = typeof window !== "undefined" ? `${window.location.origin}/artwork/${id}` : "";
      if (navigator.clipboard && url) {
        navigator.clipboard.writeText(url);
        showToast("Link copied to clipboard!");
      } else {
        showToast("Artwork link ready to share!");
      }
    };

    const handleWhatsapp = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const url = whatsappLink(artistWhatsapp, `Hi, I am interested in "${title}" on Kalakaar.`);
      if (url) { trackContact(artistId, "whatsapp", id); window.open(url, "_blank", "noopener,noreferrer"); }
      else if (!user) notify.info("Log in to contact the artist.");
      else notify.info("This artist hasn't shared a WhatsApp number yet.");
    };

    const handleViewArtist = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (artistId) {
        navigate.push(`/artist/${artistId}`);
      }
    };

    return (
      <Link
        href={`/artwork/${id}`}
        className="group relative flex flex-col h-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.12)] rounded-none hover:border-[1.5px] hover:border-primary hover:-translate-y-[3px] transition-all duration-250 overflow-hidden"
      >
        {/* Banner Toast Notification */}
        {actionMessage && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-[#2C1810] text-[#FFFDF7] text-[0.7rem] px-3 py-1 font-sans shadow-md rounded-none whitespace-nowrap animate-fade-in pointer-events-none">
            {actionMessage}
          </div>
        )}

        <div className="relative h-[260px] w-full shrink-0 bg-[#EDE4CE] overflow-hidden flex items-center justify-center">
          {finalImageUrl ? (
            <Image
              src={finalImageUrl}
              alt={title}
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-[#EDE4CE] flex items-center justify-center">
              <span className="text-xs text-[#6B1E2E] opacity-50">No image</span>
            </div>
          )}

          {/* Categories overlay */}
          <div className="absolute top-2 left-2 flex flex-col gap-2 z-10">
            <div className="flex gap-1 flex-wrap">
              {(categories || (style ? [style] : []))?.slice(0, 2).map((cat: string) => (
                <span
                  key={cat}
                  className="text-[0.62rem] px-[0.6rem] py-[0.25rem] rounded-none bg-[rgba(107,30,46,0.85)] text-[#FFFDF7] uppercase tracking-[0.08em] font-sans font-medium w-fit"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>

          {/* Action Overlay Controls: Like, Save, Share */}
          <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10 items-end">
            {/* ⭐ Save (Wishlist) */}
            <button
              onClick={handleSaveClick}
              className="w-8 h-8 rounded-full bg-[rgba(255,253,247,0.9)] hover:bg-[#FFFDF7] flex items-center justify-center border border-[rgba(107,30,46,0.12)] shadow-sm transition-transform active:scale-95"
              title={isSaved ? "Remove from Wishlist (Saved)" : "Save to Wishlist"}
              aria-label="Save to Wishlist"
            >
              <Star
                size={15}
                className={isSaved ? "fill-[#E8C99A] text-[#6B1E2E]" : "text-[#7A5C4E]"}
              />
            </button>

            {/* ❤️ Like */}
            <button
              onClick={handleLikeClick}
              className="w-8 h-8 rounded-full bg-[rgba(255,253,247,0.9)] hover:bg-[#FFFDF7] flex items-center justify-center border border-[rgba(107,30,46,0.12)] shadow-sm transition-transform active:scale-95"
              title={isLiked ? "Unlike" : "Like"}
              aria-label="Like artwork"
            >
              <Heart
                size={15}
                className={isLiked ? "fill-[#6B1E2E] text-[#6B1E2E]" : "text-[#7A5C4E]"}
              />
            </button>

            {/* Share */}
            <button
              onClick={handleShareClick}
              className="w-8 h-8 rounded-full bg-[rgba(255,253,247,0.9)] hover:bg-[#FFFDF7] flex items-center justify-center border border-[rgba(107,30,46,0.12)] shadow-sm transition-transform active:scale-95"
              title="Share Artwork"
              aria-label="Share artwork"
            >
              <Share2 size={14} className="text-[#7A5C4E] hover:text-[#6B1E2E]" />
            </button>

            {isSold && (
              <div className="bg-[#6B1E2E] px-[0.6rem] py-[0.25rem] text-[0.62rem] text-[#FFFDF7] uppercase tracking-[0.08em] font-sans font-medium rounded-none w-fit shadow-sm mt-1">
                SOLD
              </div>
            )}
            {isTrending && !isSold && (
              <div className="bg-[rgba(107,30,46,0.85)] px-[0.6rem] py-[0.25rem] text-[0.62rem] text-[#FFFDF7] uppercase tracking-[0.08em] font-sans font-medium rounded-none w-fit shadow-sm mt-1">
                🔥 TRENDING
              </div>
            )}
          </div>
        </div>

        <div className="p-[1rem] flex flex-col flex-1 bg-[#FFFDF7]">
          <div className="flex justify-between items-center mb-[0.3rem]">
            <p
              className="font-sans text-[0.72rem] uppercase text-[#9C7A6A] tracking-[0.06em] flex items-center gap-1 hover:text-[#6B1E2E] transition-colors"
              onClick={handleViewArtist}
            >
              {artistName}
            </p>

            {/* Interaction Stats Indicator */}
            <div className="flex items-center gap-3 font-sans text-[0.72rem] text-[#9C7A6A]">
              <span className="flex items-center gap-1">
                <Heart size={12} className={isLiked ? "fill-[#6B1E2E] text-[#6B1E2E]" : "text-[#9C7A6A]"} />
                {likeCount}
              </span>
            </div>
          </div>

          <h3 className="font-serif text-[1.15rem] font-semibold text-[#2C1810] leading-snug mb-[1rem] flex-1">
            {title}
          </h3>

          {/* Quick Action bar: ❤️ Like | ⭐ Save | Share */}
          <div className="flex items-center justify-between border-t border-[rgba(107,30,46,0.08)] pt-2.5 mb-3 text-[0.75rem] text-[#7A5C4E] font-sans">
            <button
              type="button"
              onClick={handleLikeClick}
              className={`flex items-center gap-1.5 hover:text-[#6B1E2E] transition-colors ${
                isLiked ? "text-[#6B1E2E] font-medium" : ""
              }`}
            >
              <Heart size={14} className={isLiked ? "fill-[#6B1E2E] text-[#6B1E2E]" : ""} />
              <span>Like ({likeCount})</span>
            </button>

            <button
              type="button"
              onClick={handleSaveClick}
              className={`flex items-center gap-1.5 hover:text-[#6B1E2E] transition-colors ${
                isSaved ? "text-[#6B1E2E] font-medium" : ""
              }`}
            >
              <Star size={14} className={isSaved ? "fill-[#E8C99A] text-[#6B1E2E]" : ""} />
              <span>{isSaved ? "Saved" : "Save"}</span>
            </button>

            <button
              type="button"
              onClick={handleShareClick}
              className="flex items-center gap-1.5 hover:text-[#6B1E2E] transition-colors"
            >
              <Share2 size={14} />
              <span>Share</span>
            </button>
          </div>

          <div className="flex flex-col gap-2 mt-auto">
            <button
              onClick={handleWhatsapp}
              className="w-full bg-[#25D366] text-white hover:bg-[#128C7E] py-2 flex items-center justify-center gap-2 font-sans text-[0.8rem] rounded-md transition-colors"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
              Contact on WhatsApp
            </button>
          </div>
        </div>
      </Link>
    );
  }
);

ArtworkCard.displayName = "ArtworkCard";


ArtworkCard.displayName = "ArtworkCard";

