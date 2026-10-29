"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Layers, ArrowRight } from "lucide-react";
import { Collection } from "../../../services/CollectionService";

export interface CollectionCardProps {
  collection: Collection;
  highlightQuery?: string;
}

export const CollectionCard = React.memo(({ collection }: CollectionCardProps) => {
  const coverImage = collection.cover_image_url || "/assets/defaults/collection.svg";
  const artworkCount = collection.artworks?.length || 0;
  const artistName = collection.profiles?.full_name || collection.profiles?.username || "Master Artisan";

  return (
    <Link
      href={`/collections/${collection.id}`}
      className="group bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] hover:border-[#6B1E2E] transition-all duration-300 flex flex-col shadow-xs overflow-hidden relative"
    >
      <div className="relative h-48 w-full bg-[#EDE4CE] overflow-hidden">
        <Image
          src={coverImage}
          alt={collection.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute top-2.5 right-2.5 bg-[#6B1E2E] text-white px-2 py-0.5 text-[0.65rem] uppercase font-sans tracking-wider font-semibold flex items-center gap-1 shadow-xs">
          <Layers size={11} />
          {artworkCount} {artworkCount === 1 ? "Artwork" : "Artworks"}
        </div>
        {collection.is_featured && (
          <div className="absolute top-2.5 left-2.5 bg-[#C8A84B] text-[#1a0a0f] px-2 py-0.5 text-[0.65rem] uppercase font-sans tracking-wider font-bold shadow-xs">
            ⭐ Featured
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          <span className="font-sans text-[0.7rem] uppercase tracking-wider text-[#9C7A6A] font-medium block mb-1">
            Curated by {artistName}
          </span>
          <h3 className="font-serif text-lg text-[#2C1810] font-semibold mb-2 group-hover:text-[#6B1E2E] transition-colors leading-snug line-clamp-1">
            {collection.title}
          </h3>
          {collection.description && (
            <p className="font-sans text-xs text-[#7A5C4E] line-clamp-2 leading-relaxed">
              {collection.description}
            </p>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-[rgba(107,30,46,0.1)] flex justify-between items-center text-xs font-sans text-[#6B1E2E] uppercase tracking-wider font-semibold">
          <span>Explore Collection</span>
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
});

CollectionCard.displayName = "CollectionCard";
