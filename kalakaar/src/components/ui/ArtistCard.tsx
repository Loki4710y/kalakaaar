"use client";
import Link from "next/link";
import Image from "next/image";
import { MapPin, MessageCircle, Instagram, CheckCircle2, Sparkles } from "lucide-react";
import { MadhubaniPattern } from "../patterns/MadhubaniPattern";
import React from "react";
import { UserProfile } from "../../repositories/ProfileRepository";

export interface ArtistCardProps {
  artist?: UserProfile;
  id?: string;
  avatar_url?: string;
  avatarUrl?: string;
  cover_image_url?: string;
  featured_artwork_url?: string;
  full_name?: string;
  display_name?: string;
  name?: string;
  username?: string;
  city?: string;
  state?: string;
  location?: string;
  primary_art_style?: string;
  art_styles?: string[];
  custom_art_style?: string;
  styleBadge?: string;
  bio?: string;
  whatsapp_number?: string;
  instagram_url?: string;
  instagram_handle?: string;
  is_featured?: boolean;
  is_verified?: boolean;
  profile_views?: number;
  avgRating?: number;
  reviewCount?: number;
  artworkThumbnails?: string[];
}

export const ArtistCard = React.memo((props: ArtistCardProps) => {
  const { artist } = props;

  // Resolve fields with full fallback chain
  const avatar = artist?.avatar_url || props.avatar_url || props.avatarUrl || "/assets/defaults/avatar.svg";
  const cover = artist?.cover_image_url || artist?.featured_artwork_url || props.cover_image_url || props.featured_artwork_url;
  const fullName = artist?.full_name || artist?.display_name || props.full_name || props.display_name || props.name || artist?.username || props.username || "Master Artisan";
  const handle = artist?.username || props.username || artist?.id || props.id || "artist";

  // Location (City, State)
  const c = artist?.city || props.city;
  const s = artist?.state || props.state;
  const loc = artist?.location || props.location;
  let locationText = "India";
  if (c && s) {
    locationText = `${c}, ${s}`;
  } else if (c) {
    locationText = c;
  } else if (s) {
    locationText = s;
  } else if (loc) {
    locationText = loc;
  }

  // Primary Art Style
  const style = artist?.primary_art_style || props.primary_art_style || (artist?.art_styles && artist.art_styles[0]) || (props.art_styles && props.art_styles[0]) || artist?.custom_art_style || props.custom_art_style || props.styleBadge || "Traditional Art";

  // Bio
  const bioText = artist?.bio || props.bio || "Traditional master artisan preserving authentic folk art traditions.";

  // Badges
  const featured = artist?.is_featured ?? props.is_featured ?? false;
  const verified = artist?.is_verified ?? props.is_verified ?? false;

  // WhatsApp
  const rawWa = artist?.whatsapp_number || props.whatsapp_number;
  const getWaUrl = (num?: string) => {
    if (!num) return null;
    const clean = num.replace(/\D/g, '');
    if (!clean) return null;
    const full = clean.length === 10 ? `91${clean}` : clean;
    const msg = encodeURIComponent(`Hi ${fullName}, I saw your profile on Kalakaar and would like to inquire about your artworks.`);
    return `https://wa.me/${full}?text=${msg}`;
  };
  const whatsappUrl = getWaUrl(rawWa);

  // Instagram
  const rawInsta = artist?.instagram_url || props.instagram_url || artist?.instagram_handle || props.instagram_handle;
  const getInstaUrl = (input?: string) => {
    if (!input) return null;
    if (input.startsWith("http://") || input.startsWith("https://")) return input;
    const h = input.replace(/^@/, "").trim();
    if (!h) return null;
    return `https://instagram.com/${h}`;
  };
  const instaUrl = getInstaUrl(rawInsta);

  return (
    <div className="group bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] hover:border-[#6B1E2E] transition-all duration-300 hover:shadow-md flex flex-col justify-between overflow-hidden relative rounded-none h-full">
      
      {/* Top Cover Banner */}
      <div className="relative w-full h-[140px] bg-[#EDE4CE] overflow-hidden shrink-0">
        {cover ? (
          <Image
            src={cover}
            alt={`${fullName} cover`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-r from-[#EDE4CE] via-[#F5EFE0] to-[#E2D5B8]">
            <MadhubaniPattern opacity={0.12} stroke="#6B1E2E" />
          </div>
        )}

        {/* Verified Badge */}
        {verified && (
          <div className="absolute top-3 left-3 z-10 bg-[rgba(255,253,247,0.92)] backdrop-blur-xs text-[#1D9BF0] border border-[#1D9BF0]/30 px-2.5 py-0.5 text-[0.65rem] font-sans font-bold uppercase tracking-wider flex items-center gap-1 shadow-xs">
            <CheckCircle2 size={13} className="fill-[#1D9BF0] text-[#FFFDF7]" /> Verified
          </div>
        )}

        {/* Featured Badge */}
        {featured && (
          <div className="absolute top-3 right-3 z-10 bg-[#C8A84B] text-[#1a0a0f] font-sans text-[0.65rem] font-bold px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
            <Sparkles size={11} /> Featured
          </div>
        )}
      </div>

      {/* Main Body */}
      <div className="px-5 pb-5 flex flex-col items-center flex-1 relative">
        
        {/* Profile Photo */}
        <div className="w-[84px] h-[84px] rounded-full -mt-[42px] mb-3 relative z-10 border-[3px] border-[#FFFDF7] bg-[#E2D5B8] shadow-md overflow-hidden shrink-0">
          <Image
            src={avatar}
            alt={fullName}
            fill
            className="object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Artist Name */}
        <h3 className="font-serif text-[1.35rem] font-bold text-[#2C1810] text-center mb-1 group-hover:text-[#6B1E2E] transition-colors leading-snug flex items-center justify-center gap-1.5">
          {fullName}
        </h3>

        {/* Primary Art Style */}
        <div className="mb-2">
          <span className="inline-block bg-[rgba(107,30,46,0.08)] text-[#6B1E2E] border border-[rgba(107,30,46,0.18)] font-sans text-[0.65rem] uppercase tracking-widest px-2.5 py-0.5 font-bold">
            {style}
          </span>
        </div>

        {/* City, State */}
        <p className="font-sans text-[0.8rem] text-[#7A5C4E] text-center flex items-center justify-center gap-1 font-medium mb-3">
          <MapPin size={13} className="text-[#6B1E2E] shrink-0" />
          {locationText}
        </p>

        {/* Short Bio (Max 2 lines) */}
        <p className="font-sans text-[0.8rem] text-[#5C4033] text-center line-clamp-2 leading-relaxed mb-4 min-h-[2.4rem] px-1">
          {bioText}
        </p>

        {/* Bottom Actions */}
        <div className="w-full mt-auto pt-4 border-t border-[rgba(107,30,46,0.12)] flex items-center justify-center gap-2">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#25D366] text-white hover:bg-[#20bd5a] transition-colors font-sans text-[0.75rem] font-semibold rounded-none shadow-xs"
              title="Contact on WhatsApp"
            >
              <MessageCircle size={15} />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          )}

          {instaUrl && (
            <a
              href={instaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#E4405F]/10 text-[#C13584] border border-[#E4405F]/30 hover:bg-[#E4405F] hover:text-white transition-colors font-sans text-[0.75rem] font-semibold rounded-none"
              title="View Instagram Profile"
            >
              <Instagram size={15} />
              <span className="hidden sm:inline">Instagram</span>
            </a>
          )}

          <Link
            href={`/artists/${handle}`}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#6B1E2E] text-[#FFFDF7] hover:bg-[#8B2A3E] transition-colors font-sans text-[0.78rem] uppercase tracking-wider font-semibold text-center shadow-xs"
          >
            View Profile →
          </Link>
        </div>
      </div>
    </div>
  );
});

ArtistCard.displayName = "ArtistCard";


