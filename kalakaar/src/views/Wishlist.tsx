"use client";
import { useLanguage } from "../contexts/LanguageContext";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { useStore } from "../contexts/StoreContext";
import { WishlistService } from "../../services/WishlistService";
import { Artwork } from "../../services/ArtworkService";
import { ArtworkCard } from "../components/ui/ArtworkCard";
import { GoldButton } from "../components/ui/GoldButton";
import { HeartOff, Lock } from "lucide-react";

import { ArtworkGridSkeleton } from "../components/ui/Skeletons";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadMoreButton } from "../components/ui/LoadMoreButton";
import { useServerPages } from "../hooks/useServerPages";

const PAGE_SIZE = 12;

export function Wishlist() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toggleWishlist, refreshWishlist } = useStore();
  const { items, total, loadMore, replace, loadingMore, failed } = useServerPages<Artwork>({ items: [], total: 0, page: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadSavedArtworks() {
      if (!user) {
        replace([], 0);
        setLoading(false);
        return;
      }
      setLoading(true);
      const res = await WishlistService.getWishlistPage(user.id, 1, PAGE_SIZE);
      if (cancelled) return;
      if (res.success && res.data) replace(res.data.items, res.data.total, 1);
      else replace([], 0);
      setLoading(false);
    }
    loadSavedArtworks();
    return () => { cancelled = true; };
  }, [user, replace]);

  const loadMoreSaved = useCallback(() => {
    if (!user) return;
    loadMore(async (page) => {
      const res = await WishlistService.getWishlistPage(user.id, page, PAGE_SIZE);
      return res.success && res.data ? { items: res.data.items, total: res.data.total } : null;
    });
  }, [user, loadMore]);

  const handleRemove = async (artworkId: string) => {
    if (!user) return;
    await toggleWishlist(artworkId);
    replace(items.filter((art) => art.id !== artworkId), Math.max(0, total - 1), Math.floor((items.length - 1) / PAGE_SIZE));
    await refreshWishlist();
  };

  if (!user) {
    return (
      <main className="relative min-h-screen pb-32 bg-background flex flex-col items-center justify-center pt-24 px-4">
        <div className="max-w-md w-full border border-[rgba(107,30,46,0.18)] bg-surface p-8 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-[#EDE4CE] flex items-center justify-center text-[#6B1E2E] mb-4">
            <Lock size={24} />
          </div>
          <h2 className="font-serif text-[1.8rem] text-text-primary mb-2">{t("wishlist.title")}</h2>
          <p className="font-sans text-[0.9rem] text-text-muted mb-6 leading-relaxed">
            Your saved collection is private and visible only to you. Please log in to view or manage your saved artworks.
          </p>
          <Link href="/auth?mode=signin" className="w-full">
            <GoldButton variant="primary" className="w-full py-3">
              Log In to Access Wishlist
            </GoldButton>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen pb-32 bg-background">
      {/* Page Header */}
      <section className="relative w-full border-b border-primary-border/40 bg-surface pt-16 pb-12">
        <div className="relative z-10 max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-10 text-center pt-8">
          <p className="font-sans text-[0.75rem] uppercase tracking-[0.2em] text-text-hint mb-4">
            — MY PRIVATE COLLECTION —
          </p>
          <h1 className="font-serif text-[3rem] md:text-[3.5rem] text-text-primary leading-tight mb-4">
            Saved Artworks
          </h1>
          <p className="font-sans text-[0.95rem] text-text-muted">
            {total} {total === 1 ? "piece" : "pieces"} saved in your private wishlist
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-10 py-12">
        {loading ? (
          <ArtworkGridSkeleton count={6} />
        ) : items.length === 0 ? (
          <EmptyState
            type="empty_wishlist"
            actionHref="/explore"
            actionLabel="Explore Heritage Gallery"
          />
        ) : (
          <>
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-primary-border/30">
              <div className="font-sans text-[0.8rem] text-text-muted uppercase tracking-wider flex items-center gap-2">
                <span>{t("wishlist.private")}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {items.map((art) => (
                <div key={art.id} className="flex flex-col">
                  <ArtworkCard
                    id={art.id}
                    like_count={art.like_count}
                    artistId={art.artist_id || art.profiles?.id}
                    artistWhatsapp={art.profiles?.whatsapp_number}
                    title={art.title || "Untitled"}
                    artistName={art.profiles?.full_name || "Artisan"}
                    price={art.price}
                    image_urls={art.image_urls}
                    style={art.category}
                    categories={art.category ? [art.category] : []}
                  />
                  <div className="flex justify-between items-center mt-3 px-1">
                    <span className="font-sans text-[0.7rem] uppercase tracking-wider text-text-hint">
                      Private Saved
                    </span>
                    <button
                      onClick={() => handleRemove(art.id)}
                      className="font-sans text-[0.75rem] uppercase tracking-wider text-text-muted hover:text-[#D32F2F] transition-colors flex items-center gap-1"
                    >
                      <HeartOff size={12} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <LoadMoreButton shown={items.length} total={total} loading={loadingMore} failed={failed} onClick={loadMoreSaved} />
          </>
        )}
      </section>
    </main>
  );
}
