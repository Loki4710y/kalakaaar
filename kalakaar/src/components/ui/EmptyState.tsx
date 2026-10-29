"use client";

import React from "react";
import Link from "next/link";
import { Palette, Layers, BookOpen, Search, Heart, Bell, Sparkles, ImagePlus, Eye, Users, LucideIcon } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

export type EmptyStateType =
  | "no_artworks"
  | "no_collections"
  | "no_stories"
  | "no_search_results"
  | "empty_wishlist"
  | "no_notifications"
  | "my_artworks"
  | "no_views"
  | "no_artists";

interface EmptyStateProps {
  type: EmptyStateType;
  title?: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  onAction?: () => void;
  searchQuery?: string;
}

export function EmptyState({
  type,
  title,
  description,
  actionHref,
  actionLabel,
  onAction,
  searchQuery,
}: EmptyStateProps) {
  const { t } = useLanguage();

  const content: Record<EmptyStateType, { icon: LucideIcon; title: string; description: string; href: string; label: string }> = {
    no_artworks: { icon: Palette, title: t("empty.noArtworks.title"), description: t("empty.noArtworks.desc"), href: "/explore", label: t("empty.noArtworks.cta") },
    no_collections: { icon: Layers, title: t("empty.noCollections.title"), description: t("empty.noCollections.desc"), href: "/explore", label: t("empty.noCollections.cta") },
    no_stories: { icon: BookOpen, title: t("empty.noStories.title"), description: t("empty.noStories.desc"), href: "/stories", label: t("empty.noStories.cta") },
    no_search_results: {
      icon: Search,
      title: searchQuery ? t("empty.noSearch.titleQuery", { q: searchQuery }) : t("empty.noSearch.title"),
      description: t("empty.noSearch.desc"),
      href: "/explore",
      label: t("empty.noSearch.cta"),
    },
    empty_wishlist: { icon: Heart, title: t("empty.wishlist.title"), description: t("empty.wishlist.desc"), href: "/explore", label: t("empty.wishlist.cta") },
    no_notifications: { icon: Bell, title: t("empty.notifications.title"), description: t("empty.notifications.desc"), href: "/explore", label: t("empty.notifications.cta") },
    my_artworks: { icon: ImagePlus, title: t("empty.myArtworks.title"), description: t("empty.myArtworks.desc"), href: "/artist-portal/upload", label: t("empty.myArtworks.cta") },
    no_views: { icon: Eye, title: t("empty.noViews.title"), description: t("empty.noViews.desc"), href: "/profile", label: t("empty.noViews.cta") },
    no_artists: { icon: Users, title: t("empty.noArtists.title"), description: t("empty.noArtists.desc"), href: "/artists", label: t("empty.noArtists.cta") },
  };

  const c = content[type];
  const defaultIcon = c.icon;
  const defaultTitle = c.title;
  const defaultDescription = c.description;
  const defaultActionHref = c.href;
  const defaultActionLabel = c.label;

  const finalTitle = title || defaultTitle;
  const finalDescription = description || defaultDescription;
  const finalHref = actionHref || defaultActionHref;
  const finalLabel = actionLabel || defaultActionLabel;
  const Icon = defaultIcon;

  return (
    <div className="p-8 sm:p-12 text-center bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] relative shadow-2xs my-4 max-w-xl mx-auto">
      {/* Subtle traditional corner marks */}
      <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-[#6B1E2E]/40" />
      <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-[#6B1E2E]/40" />
      <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-[#6B1E2E]/40" />
      <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-[#6B1E2E]/40" />

      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#F5EFE0] text-[#6B1E2E] mb-4 border border-[rgba(107,30,46,0.15)]">
        <Icon size={28} />
      </div>

      <h3 className="font-serif text-xl font-bold text-[#2C1810] mb-2">
        {finalTitle}
      </h3>

      <p className="font-sans text-xs sm:text-sm text-[#7A5C4E] max-w-md mx-auto mb-6 leading-relaxed">
        {finalDescription}
      </p>

      {onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="px-6 py-3 bg-[#6B1E2E] hover:bg-[#802437] text-white font-sans text-xs uppercase tracking-wider font-semibold transition-colors inline-flex items-center gap-2 shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6B1E2E]"
        >
          <Sparkles size={14} /> {finalLabel}
        </button>
      ) : (
        <Link
          href={finalHref}
          className="px-6 py-3 bg-[#6B1E2E] hover:bg-[#802437] text-white font-sans text-xs uppercase tracking-wider font-semibold transition-colors inline-flex items-center gap-2 shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6B1E2E]"
        >
          <Sparkles size={14} /> {finalLabel}
        </Link>
      )}
    </div>
  );
}
