"use client";
import { sanitizeHtml } from "../lib/sanitize";
import { ReportButton } from "../components/ui/ReportButton";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { StoryService, Story } from "../../services/StoryService";
import { getStoryAuthorName } from "../lib/storyUtils";
import { useAuth } from "../contexts/AuthContext";
import ShareButtons from "../components/ShareButtons";
import { MadhubaniPattern, MadhubaniDivider } from "../components/patterns/MadhubaniPattern";
import { CornerBracket } from "../components/ui/CornerBracket";
import { Clock, Eye, Calendar, ArrowLeft, Edit, Trash2, Bookmark, BookOpen } from "lucide-react";
import { useAmbient } from "../contexts/AmbientContext";
import { notify } from "../lib/notify";

/** `initialStory` comes from the server so crawlers receive the full article text. */
export function StoryDetails({ initialStory = null, initialMore = [] }: { initialStory?: Story | null; initialMore?: Story[] }) {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useAuth();
  const { readingMode, setReadingMode } = useAmbient();

  const [story, setStory] = useState<Story | null>(initialStory);
  const [moreStories, setMoreStories] = useState<Story[]>(initialMore.filter((x) => x.id !== initialStory?.id));
  const [loading, setLoading] = useState(!initialStory);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!id) return;

    async function loadStoryData() {
      if (!initialStory) setLoading(true); // with server data we refresh quietly
      setError(null);

      const res = await StoryService.getStory(id);

      if (res.success && res.data) {
        setStory(res.data);

        // Fetch More Stories (featured / published)
        const moreRes = await StoryService.getFeaturedStories(4);
        if (moreRes.success && moreRes.data) {
          setMoreStories(moreRes.data.filter((s) => s.id !== res.data?.id));
        }
      } else {
        setError(res.error || "Story not found.");
      }

      setLoading(false);
    }

    loadStoryData();
  }, [id]);

  const handleDelete = async () => {
    if (!story) return;
    if (window.confirm("Are you sure you want to delete this story? This action cannot be undone.")) {
      const res = await StoryService.deleteStory(story.id);
      if (res.success) {
        router.push("/stories");
      } else {
        notify.error(res.error || "Failed to delete story.");
      }
    }
  };

  const isOwner = user && story && (user.id === story.artist_id || user.role === "artist");

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5EFE0] flex flex-col justify-between">
        <main className="pt-24 pb-32 max-w-4xl mx-auto px-4 w-full">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-32 bg-[#EDE4CE]" />
            <div className="h-12 w-3/4 bg-[#EDE4CE]" />
            <div className="h-64 w-full bg-[#EDE4CE]" />
            <div className="h-32 w-full bg-[#EDE4CE]" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-[#F5EFE0] flex flex-col justify-between">
        <main className="pt-24 pb-32 max-w-2xl mx-auto px-4 text-center">
          <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-12">
            <h2 className="font-serif text-[2rem] text-[#2C1810] mb-4">Story Not Found</h2>
            <p className="font-sans text-[0.95rem] text-[#7A5C4E] mb-8">
              {error || "The requested article does not exist or has been removed."}
            </p>
            <Link
              href="/stories"
              className="inline-block px-6 py-3 bg-[#6B1E2E] text-[#FFFDF7] font-sans text-[0.8rem] uppercase tracking-wider font-semibold"
            >
              Back to All Stories
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const formattedDate = story.published_at
    ? new Date(story.published_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : new Date(story.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

  const authorName = getStoryAuthorName(story);
  const isJournal = authorName === "Kalakaar Journal";
  const authorAvatar = !isJournal && story.profiles?.avatar_url ? story.profiles.avatar_url : "/assets/defaults/avatar.svg";
  const authorHref = isJournal ? "/stories" : `/artist/${story.artist_id}`;
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className={`min-h-screen transition-colors duration-500 flex flex-col justify-between ${
      readingMode ? "bg-[#FAF7F0] text-[#1C120C]" : "bg-[#F5EFE0] text-[#2C1810]"
    }`}>
      {/* Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 h-1.5 bg-[#D4AF37] z-50 transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />

      <main className="pt-8 pb-32">
        {/* Top Header Bar */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-8 flex items-center justify-between gap-4">
          <Link
            href="/stories"
            className="inline-flex items-center gap-2 font-sans text-[0.8rem] uppercase tracking-[0.1em] text-[#7A5C4E] hover:text-[#6B1E2E] transition-colors"
          >
            <ArrowLeft size={16} />
            Explore Stories
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setReadingMode(!readingMode)}
              className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-2 transition-all ${
                readingMode
                  ? "bg-[#6B1E2E] text-white border-[#6B1E2E]"
                  : "bg-[#FFFDF7] text-[#2C1810] border-[#D4AF37] hover:bg-[#F5E6D3]"
              }`}
            >
              <BookOpen size={14} />
              {readingMode ? "Exit Reading Mode" : "Reading Mode"}
            </button>

            {isOwner && (
              <>
                <Link
                  href={`/stories/${story.id}/edit`}
                  className="px-4 py-2 bg-[#EDE4CE] border border-[rgba(107,30,46,0.18)] font-sans text-[0.75rem] uppercase tracking-wider font-semibold text-[#2C1810] hover:bg-[#6B1E2E] hover:text-[#FFFDF7] transition-all flex items-center gap-2"
                >
                  <Edit size={14} /> Edit
                </Link>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 border border-[#C5221F] font-sans text-[0.75rem] uppercase tracking-wider font-semibold text-[#C5221F] hover:bg-[#C5221F] hover:text-white transition-all flex items-center gap-2"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </>
            )}
          </div>
        </div>

        {/* Main Article Container */}
        <article className={`mx-auto px-4 sm:px-6 transition-all ${readingMode ? "max-w-3xl" : "max-w-4xl"}`}>
          <div className={`p-6 sm:p-12 relative shadow-sm transition-all ${
            readingMode
              ? "bg-white border-0 shadow-lg text-[1.125rem] leading-[1.9] font-serif"
              : "bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)]"
          }`}>
            <MadhubaniPattern opacity={0.04} />
            <CornerBracket />

            {/* Category & Read Time */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 relative z-10">
              <span className="px-3.5 py-1.5 bg-[#6B1E2E] text-[#FFFDF7] font-sans text-[0.7rem] uppercase tracking-[0.15em] font-semibold">
                {story.category}
              </span>

              <div className="flex items-center gap-4 font-sans text-[0.8rem] text-[#7A5C4E]">
                <span className="flex items-center gap-1.5">
                  <Clock size={15} />
                  {story.read_time}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Eye size={15} />
                  {story.view_count || 0} reads
                </span>
              </div>
            </div>

            {/* Article Title */}
            <h1 className="font-serif text-[2.5rem] sm:text-[3.4rem] leading-[1.15] text-[#2C1810] font-normal mb-6 relative z-10">
              {story.title}
            </h1>

            {/* Excerpt */}
            {story.excerpt && (
              <p className="font-sans text-[1.15rem] text-[#7A5C4E] italic leading-relaxed border-l-4 border-[#6B1E2E] pl-5 my-8 relative z-10">
                {story.excerpt}
              </p>
            )}

            {/* Author Profile Bar */}
            <div className="flex items-center justify-between flex-wrap gap-4 py-6 border-y border-[rgba(107,30,46,0.12)] my-8 relative z-10">
              <Link
                href={authorHref}
                className="flex items-center gap-4 group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-full overflow-hidden bg-[#EDE4CE] border border-[rgba(107,30,46,0.2)] relative shrink-0">
                  <Image src={authorAvatar} alt={authorName} fill className="object-cover" />
                </div>
                <div>
                  <h3 className="font-serif text-[1.1rem] text-[#2C1810] group-hover:text-[#6B1E2E] transition-colors">
                    {authorName}
                  </h3>
                  <div className="flex items-center gap-2 font-sans text-[0.75rem] text-[#7A5C4E] uppercase tracking-wider">
                    <Calendar size={13} />
                    <span>{formattedDate}</span>
                    {!isJournal && story.profiles?.city && <span>• {story.profiles.city}</span>}
                    {isJournal && <span>• Editorial Desk</span>}
                  </div>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setIsSaved(!isSaved)}
                className={`px-4 py-2 font-sans text-[0.75rem] uppercase tracking-wider font-semibold border transition-all flex items-center gap-2 ${
                  isSaved
                    ? "bg-[#6B1E2E] text-[#FFFDF7] border-[#6B1E2E]"
                    : "bg-[#EDE4CE]/50 border-[rgba(107,30,46,0.18)] text-[#2C1810] hover:bg-[#6B1E2E] hover:text-[#FFFDF7]"
                }`}
              >
                <Bookmark size={15} className={isSaved ? "fill-current" : ""} />
                {isSaved ? "Saved" : "Save Article"}
              </button>
            </div>

            {/* Cover Image */}
            {story.cover_image_url && (
              <div className="relative w-full h-[320px] sm:h-[480px] mb-12 overflow-hidden border border-[rgba(107,30,46,0.18)] relative z-10">
                <Image
                  src={story.cover_image_url}
                  alt={story.title}
                  fill
 sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                  priority
                />
              </div>
            )}

            {/* Article Content Body */}
            <div
              className="font-serif text-[1.15rem] text-[#2C1810] leading-[1.9] space-y-8 relative z-10 [&>h2]:text-[2rem] [&>h2]:font-serif [&>h2]:text-[#6B1E2E] [&>h2]:mt-10 [&>h2]:mb-4 [&>h2]:font-normal [&>h3]:text-[1.5rem] [&>h3]:font-serif [&>h3]:text-[#2C1810] [&>h3]:mt-8 [&>h3]:mb-3 [&>blockquote]:border-l-4 [&>blockquote]:border-[#6B1E2E] [&>blockquote]:bg-[#EDE4CE]/20 [&>blockquote]:p-6 [&>blockquote]:italic [&>blockquote]:my-8 [&>blockquote]:text-[#4A1b24] [&>ul]:list-disc [&>ul]:pl-8 [&>ul]:space-y-2 [&>ol]:list-decimal [&>ol]:pl-8 [&>ol]:space-y-2 [&>a]:text-[#6B1E2E] [&>a]:underline [&>a]:font-semibold"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(story.content) }}
            />

            <MadhubaniDivider />

            {/* Share Section */}
            <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
              <div>
                <h4 className="font-serif text-[1.2rem] text-[#2C1810] mb-1">Share this story</h4>
                <p className="font-sans text-[0.8rem] text-[#7A5C4E]">
                  Help spread appreciation for traditional Indian art and heritage stories.
                </p>
                <div className="mt-3"><ReportButton itemType="story" itemId={story.id} ownerId={story.artist_id} /></div>
              </div>

              <ShareButtons
                title={story.title}
                url={currentUrl}
                artistName={authorName}
              />
            </div>
          </div>
        </article>

        {/* MORE STORIES SECTION */}
        {moreStories.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
            <div className="text-center mb-12">
              <span className="font-sans text-[0.72rem] uppercase tracking-[0.2em] text-[#9C7A6A] block mb-2">
                — EDITORIAL HIGHLIGHTS —
              </span>
              <h2 className="font-serif text-[2.2rem] text-[#2C1810]">More Artisan Stories</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {moreStories.map((s) => (
                <Link
                  key={s.id}
                  href={`/stories/${s.id}`}
                  className="group bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] hover:border-[#6B1E2E] transition-all duration-300 flex flex-col shadow-xs"
                >
                  <div className="relative h-[220px] bg-[#EDE4CE] overflow-hidden">
                    <Image
                      src={s.cover_image_url || "/assets/defaults/artwork.svg"}
                      alt={s.title}
                      fill
 sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-[#6B1E2E] text-[#FFFDF7] px-2.5 py-1 font-sans text-[0.65rem] uppercase tracking-wider font-semibold">
                      {s.category}
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-1 justify-between">
                    <div>
                      <h3 className="font-serif text-[1.25rem] text-[#2C1810] group-hover:text-[#6B1E2E] transition-colors leading-snug line-clamp-2 mb-3">
                        {s.title}
                      </h3>
                      {s.excerpt && (
                        <p className="font-sans text-[0.88rem] text-[#7A5C4E] line-clamp-2 mb-4 leading-relaxed">
                          {s.excerpt}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-[rgba(107,30,46,0.1)] flex items-center justify-between font-sans text-[0.75rem] text-[#7A5C4E]">
                      <span>{getStoryAuthorName(s)}</span>
                      <span>{s.read_time}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
