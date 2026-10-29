"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, ArrowRight } from "lucide-react";
import { Story } from "../../../services/StoryService";
import { getStoryAuthorName } from "../../lib/storyUtils";

export interface StoryCardProps {
  story: Story;
}

export const StoryCard = React.memo(({ story }: StoryCardProps) => {
  const coverImage = story.cover_image_url || "/assets/defaults/artwork.svg";
  const authorName = getStoryAuthorName(story);

  return (
    <Link
      href={`/stories/${story.id}`}
      className="group bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] hover:border-[#6B1E2E] transition-all duration-300 flex flex-col shadow-xs overflow-hidden"
    >
      <div className="relative h-44 w-full bg-[#EDE4CE] overflow-hidden">
        <Image
          src={coverImage}
          alt={story.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute top-2.5 left-2.5 bg-[#6B1E2E] text-white px-2 py-0.5 text-[0.65rem] uppercase font-sans tracking-wider font-semibold">
          {story.category}
        </div>
        {story.status === "draft" && (
          <div className="absolute top-2.5 right-2.5 bg-[#2C1810] text-[#FFFDF7] px-2 py-0.5 text-[0.65rem] uppercase font-sans tracking-wider font-semibold">
            Draft
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          <span className="font-sans text-[0.7rem] uppercase tracking-wider text-[#9C7A6A] font-medium block mb-1">
            By {authorName}
          </span>
          <h3 className="font-serif text-lg text-[#2C1810] font-semibold mb-2 group-hover:text-[#6B1E2E] transition-colors leading-snug line-clamp-2">
            {story.title}
          </h3>
          {story.excerpt && (
            <p className="font-sans text-xs text-[#7A5C4E] line-clamp-2 leading-relaxed mb-4">
              {story.excerpt}
            </p>
          )}
        </div>

        <div className="pt-3 border-t border-[rgba(107,30,46,0.1)] flex items-center justify-between font-sans text-xs text-[#7A5C4E]">
          <span className="flex items-center gap-1 text-[0.72rem]">
            <Clock size={12} /> {story.read_time}
          </span>
          <span className="text-[#6B1E2E] uppercase font-semibold text-[0.7rem] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Read <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </Link>
  );
});

StoryCard.displayName = "StoryCard";
