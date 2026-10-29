"use client";
import { sanitizeHtml } from "../lib/sanitize";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { StoryService, STORY_CATEGORIES, StoryCategory } from "../../services/StoryService";
import { StorageService } from "../../services/StorageService";
import { MadhubaniPattern } from "../components/patterns/MadhubaniPattern";
import { CornerBracket } from "../components/ui/CornerBracket";
import {
  Heading2,
  Heading3,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Upload,
  X,
  Eye,
  Edit3,
  Save,
  Send,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Clock,
} from "lucide-react";

interface CreateStoryProps {
  editStoryId?: string;
}

export function CreateStory({ editStoryId }: CreateStoryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storyId = editStoryId || searchParams.get("id");
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState<StoryCategory>("Artist Journey");
  const [content, setContent] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [currentStoryId, setCurrentStoryId] = useState<string | null>(storyId || null);
  const [isPreview, setIsPreview] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Link Modal State for Rich Text
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Load existing story if editing
  useEffect(() => {
    if (!storyId) return;
    async function loadStory() {
      setIsLoading(true);
      const res = await StoryService.getStory(storyId as string);
      if (res.success && res.data) {
        const s = res.data;
        setTitle(s.title);
        setExcerpt(s.excerpt || "");
        setCategory(s.category);
        setContent(s.content);
        setCoverImageUrl(s.cover_image_url || "");
        setCurrentStoryId(s.id);
      } else {
        setStatusMessage({ type: "error", text: "Failed to load story for editing." });
      }
      setIsLoading(false);
    }
    loadStory();
  }, [storyId]);

  // Image Upload Handler
  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Validation: JPG, PNG, WEBP, Max 5MB
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setUploadError("Invalid image format. Only JPG, PNG, and WEBP files are supported.");
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUploadError("Image size exceeds 5 MB. Please choose a smaller file.");
      return;
    }

    setIsUploading(true);

    try {
      // Try StorageService first
      const res = await StorageService.uploadFile({
        file,
        bucket: "stories",
        ownerId: user?.id || "anonymous",
      });

      if (res.success && res.data?.publicUrl) {
        setCoverImageUrl(res.data.publicUrl);
      } else {
        // Fallback to Data URL for local display
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            setCoverImageUrl(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch {
      // Fallback
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setCoverImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  // Helper to insert rich text formatting tags at selection in textarea
  const insertFormatting = (beforeTag: string, afterTag: string, placeholder = "") => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || placeholder;

    const replacement = `${beforeTag}${selectedText}${afterTag}`;
    const newContent = content.substring(0, start) + replacement + content.substring(end);

    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + beforeTag.length, start + beforeTag.length + selectedText.length);
    }, 10);
  };

  const handleAddLink = () => {
    if (!linkUrl.trim()) return;
    const url = linkUrl.startsWith("http") ? linkUrl.trim() : `https://${linkUrl.trim()}`;
    const text = linkText.trim() || url;
    insertFormatting(`<a href="${url}" target="_blank" rel="noopener noreferrer">`, `</a>`, text);
    setShowLinkModal(false);
    setLinkUrl("");
    setLinkText("");
  };

  // Save Draft Handler
  const handleSaveDraft = async () => {
    if (!user) {
      router.push("/auth?mode=signin&returnUrl=/stories/new");
      return;
    }

    if (!title.trim()) {
      setStatusMessage({ type: "error", text: "Please enter a story title to save a draft." });
      return;
    }

    if (title.length > 150) {
      setStatusMessage({ type: "error", text: "Title cannot exceed 150 characters." });
      return;
    }

    if (excerpt.length > 300) {
      setStatusMessage({ type: "error", text: "Excerpt cannot exceed 300 characters." });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    const res = await StoryService.saveDraft({
      id: currentStoryId || undefined,
      artist_id: user.id,
      title,
      excerpt,
      category,
      content,
      cover_image_url: coverImageUrl,
    });

    setIsSaving(false);

    if (res.success && res.data) {
      setCurrentStoryId(res.data.id);
      setStatusMessage({ type: "success", text: "Draft saved successfully." });
    } else {
      setStatusMessage({ type: "error", text: res.error || "Failed to save draft." });
    }
  };

  // Publish Story Handler
  const handlePublish = async () => {
    if (!user) {
      router.push("/auth?mode=signin&returnUrl=/stories/new");
      return;
    }

    // Validation
    if (!title.trim()) {
      setStatusMessage({ type: "error", text: "Title is required." });
      return;
    }

    if (title.length > 150) {
      setStatusMessage({ type: "error", text: "Title cannot exceed 150 characters." });
      return;
    }

    if (excerpt.length > 300) {
      setStatusMessage({ type: "error", text: "Excerpt cannot exceed 300 characters." });
      return;
    }

    if (!content.trim() || content.trim().length < 100) {
      setStatusMessage({
        type: "error",
        text: "Article content must be at least 100 characters long to publish.",
      });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    let res;
    if (currentStoryId) {
      res = await StoryService.updateStory(currentStoryId, {
        title,
        excerpt,
        category,
        content,
        cover_image_url: coverImageUrl,
        status: "published",
      });
    } else {
      res = await StoryService.createStory({
        artist_id: user.id,
        title,
        excerpt,
        category,
        content,
        cover_image_url: coverImageUrl,
        status: "published",
      });
    }

    setIsSaving(false);

    if (res.success && res.data) {
      setStatusMessage({ type: "success", text: "Story published successfully!" });
      setTimeout(() => {
        router.push(`/stories/${res.data?.id}`);
      }, 1000);
    } else {
      setStatusMessage({ type: "error", text: res.error || "Failed to publish story." });
    }
  };

  const calculatedReadTime = StoryService.calculateReadTime(content);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5EFE0] flex flex-col justify-between">
        <main className="py-24 text-center">
          <div className="inline-block w-8 h-8 border-4 border-[#6B1E2E] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="font-serif text-[#7A5C4E]">Loading story studio...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5EFE0] text-[#2C1810] flex flex-col justify-between">
      <main className="pt-8 pb-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full flex-1">
        {/* Navigation / Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[rgba(107,30,46,0.15)]">
          <div className="flex items-center gap-4">
            <Link
              href="/stories"
              className="p-2 bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] hover:bg-[#EDE4CE] transition-colors"
              title="Back to Stories"
            >
              <ArrowLeft size={18} className="text-[#6B1E2E]" />
            </Link>
            <div>
              <span className="font-sans text-[0.72rem] uppercase tracking-[0.18em] text-[#9C7A6A]">
                ARTIST EDITORIAL STUDIO
              </span>
              <h1 className="font-serif text-[1.8rem] text-[#2C1810]">
                {storyId ? "Edit Artist Story" : "Write a New Story"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setIsPreview(!isPreview)}
              className="px-4 py-2 border border-[#6B1E2E] text-[#6B1E2E] font-sans text-[0.75rem] uppercase tracking-wider font-semibold hover:bg-[#6B1E2E] hover:text-[#FFFDF7] transition-all flex items-center gap-2"
            >
              {isPreview ? <Edit3 size={15} /> : <Eye size={15} />}
              {isPreview ? "Edit Mode" : "Preview"}
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="px-4 py-2 bg-[#EDE4CE] border border-[rgba(107,30,46,0.18)] text-[#2C1810] font-sans text-[0.75rem] uppercase tracking-wider font-semibold hover:bg-[#2C1810] hover:text-[#FFFDF7] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={15} />
              Save Draft
            </button>

            <button
              type="button"
              onClick={handlePublish}
              disabled={isSaving}
              className="px-5 py-2 bg-[#6B1E2E] text-[#FFFDF7] font-sans text-[0.75rem] uppercase tracking-wider font-semibold hover:bg-[#8B2A3E] transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Send size={15} />
              Publish Story
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {statusMessage && (
          <div
            className={`p-4 mb-6 border flex items-center gap-3 font-sans text-[0.88rem] ${
              statusMessage.type === "success"
                ? "bg-[#E6F4EA] border-[#34A853] text-[#137333]"
                : "bg-[#FCE8E6] border-[#EA4335] text-[#C5221F]"
            }`}
          >
            {statusMessage.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* PREVIEW MODE */}
        {isPreview ? (
          <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-6 sm:p-12 relative shadow-md">
            <MadhubaniPattern opacity={0.04} />
            <CornerBracket />

            <div className="max-w-3xl mx-auto relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-[#6B1E2E] text-[#FFFDF7] font-sans text-[0.7rem] uppercase tracking-wider font-semibold">
                  {category}
                </span>
                <span className="font-sans text-[0.8rem] text-[#7A5C4E] flex items-center gap-1">
                  <Clock size={14} /> {calculatedReadTime}
                </span>
              </div>

              <h1 className="font-serif text-[2.4rem] sm:text-[3rem] leading-[1.2] text-[#2C1810] mb-6">
                {title || "Untitled Story"}
              </h1>

              {excerpt && (
                <p className="font-sans text-[1.1rem] text-[#7A5C4E] italic border-l-2 border-[#6B1E2E] pl-4 mb-8 leading-relaxed">
                  {excerpt}
                </p>
              )}

              {/* Author Bar */}
              <div className="flex items-center gap-4 py-4 mb-8 border-y border-[rgba(107,30,46,0.12)]">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-[#EDE4CE] relative shrink-0">
                  <Image
                    src={user?.avatar || "/assets/defaults/avatar.svg"}
                    alt={user?.name || "Artist"}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-serif text-[1rem] text-[#2C1810]">{user?.name || "Artisan Creator"}</h4>
                  <p className="font-sans text-[0.75rem] text-[#7A5C4E]">Published on Kalakaar Stories</p>
                </div>
              </div>

              {/* Cover Image */}
              {coverImageUrl && (
                <div className="relative w-full h-[320px] sm:h-[420px] mb-10 overflow-hidden border border-[rgba(107,30,46,0.18)]">
                  <Image
                    src={coverImageUrl}
                    alt={title || "Cover"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}

              {/* Formatted Article Body */}
              <div
                className="font-serif text-[1.1rem] text-[#2C1810] leading-[1.85] space-y-6 [&>h2]:text-[1.8rem] [&>h2]:font-serif [&>h2]:text-[#6B1E2E] [&>h2]:mt-8 [&>h2]:mb-3 [&>h3]:text-[1.4rem] [&>h3]:font-serif [&>h3]:text-[#2C1810] [&>h3]:mt-6 [&>blockquote]:border-l-4 [&>blockquote]:border-[#6B1E2E] [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:my-6 [&>blockquote]:text-[#7A5C4E] [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:list-decimal [&>ol]:pl-6 [&>a]:text-[#6B1E2E] [&>a]:underline"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(content || "<p><i>Article content preview will appear here...</i></p>"),
                }}
              />
            </div>
          </div>
        ) : (
          /* EDIT / CREATE FORM */
          <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-6 sm:p-10 shadow-sm relative space-y-8">
            <MadhubaniPattern opacity={0.03} />

            {/* 1. TITLE FIELD */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="font-sans text-[0.8rem] uppercase tracking-[0.1em] font-semibold text-[#2C1810]">
                  Article Title <span className="text-[#6B1E2E]">*</span>
                </label>
                <span
                  className={`font-sans text-[0.75rem] ${
                    title.length > 150 ? "text-[#C5221F] font-bold" : "text-[#7A5C4E]"
                  }`}
                >
                  {title.length} / 150
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={150}
                placeholder="e.g. Echoes of Bihar: Four Generations of Madhubani Storytelling"
                className="w-full bg-[#EDE4CE]/30 border border-[rgba(107,30,46,0.18)] p-3 font-serif text-[1.2rem] text-[#2C1810] focus:outline-none focus:border-[#6B1E2E] placeholder:text-[#9C7A6A]"
              />
            </div>

            {/* 2. CATEGORY & READ TIME DISPLAY */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block font-sans text-[0.8rem] uppercase tracking-[0.1em] font-semibold text-[#2C1810] mb-2">
                  Category <span className="text-[#6B1E2E]">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as StoryCategory)}
                  className="w-full bg-[#EDE4CE]/30 border border-[rgba(107,30,46,0.18)] p-3 font-sans text-[0.9rem] text-[#2C1810] focus:outline-none focus:border-[#6B1E2E]"
                >
                  {STORY_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-sans text-[0.8rem] uppercase tracking-[0.1em] font-semibold text-[#2C1810] mb-2">
                  Calculated Read Time
                </label>
                <div className="bg-[#EDE4CE]/50 border border-[rgba(107,30,46,0.18)] p-3 font-sans text-[0.9rem] text-[#6B1E2E] font-semibold flex items-center gap-2">
                  <Clock size={16} />
                  {calculatedReadTime}
                </div>
              </div>
            </div>

            {/* 3. COVER IMAGE UPLOAD */}
            <div>
              <label className="block font-sans text-[0.8rem] uppercase tracking-[0.1em] font-semibold text-[#2C1810] mb-2">
                Cover Image (Optional)
              </label>

              {coverImageUrl ? (
                <div className="relative w-full h-[220px] sm:h-[300px] border border-[rgba(107,30,46,0.18)] overflow-hidden group">
                  <Image src={coverImageUrl} alt="Cover Preview" fill className="object-cover" unoptimized />
                  <div className="absolute inset-0 bg-[#2C1810]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => setCoverImageUrl("")}
                      className="px-4 py-2 bg-[#C5221F] text-white font-sans text-[0.75rem] uppercase tracking-wider font-semibold flex items-center gap-2"
                    >
                      <X size={15} /> Remove Cover
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-[rgba(107,30,46,0.25)] bg-[#EDE4CE]/20 p-8 text-center hover:border-[#6B1E2E] transition-colors relative">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageFile}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-[#EDE4CE] flex items-center justify-center text-[#6B1E2E]">
                      <Upload size={20} />
                    </div>
                    <p className="font-sans text-[0.9rem] text-[#2C1810] font-medium">
                      {isUploading ? "Uploading cover image..." : "Click or drag to upload cover image"}
                    </p>
                    <p className="font-sans text-[0.75rem] text-[#7A5C4E]">
                      Supported: JPG, PNG, WEBP • Max size: 5 MB
                    </p>
                  </div>
                </div>
              )}

              {uploadError && (
                <p className="font-sans text-[0.8rem] text-[#C5221F] mt-2 flex items-center gap-1">
                  <AlertCircle size={14} /> {uploadError}
                </p>
              )}
            </div>

            {/* 4. EXCERPT FIELD */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="font-sans text-[0.8rem] uppercase tracking-[0.1em] font-semibold text-[#2C1810]">
                  Article Excerpt (Optional Summary)
                </label>
                <span
                  className={`font-sans text-[0.75rem] ${
                    excerpt.length > 300 ? "text-[#C5221F] font-bold" : "text-[#7A5C4E]"
                  }`}
                >
                  {excerpt.length} / 300
                </span>
              </div>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                maxLength={300}
                rows={2}
                placeholder="A brief summary of your article that appears on story preview cards..."
                className="w-full bg-[#EDE4CE]/30 border border-[rgba(107,30,46,0.18)] p-3 font-sans text-[0.95rem] text-[#2C1810] focus:outline-none focus:border-[#6B1E2E] placeholder:text-[#9C7A6A] resize-none"
              />
            </div>

            {/* 5. RICH TEXT EDITOR & TOOLBAR */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="font-sans text-[0.8rem] uppercase tracking-[0.1em] font-semibold text-[#2C1810]">
                  Article Content <span className="text-[#6B1E2E]">*</span>
                </label>
                <span
                  className={`font-sans text-[0.75rem] ${
                    content.trim().length < 100 ? "text-[#9C7A6A]" : "text-[#137333] font-semibold"
                  }`}
                >
                  {content.trim().length} / 100 min chars
                </span>
              </div>

              {/* Rich Text Toolbar */}
              <div className="bg-[#EDE4CE] border border-[rgba(107,30,46,0.18)] border-b-0 p-2 flex flex-wrap items-center gap-1 text-[#2C1810]">
                <button
                  type="button"
                  onClick={() => insertFormatting("<h2>", "</h2>", "Section Heading")}
                  className="p-2 hover:bg-[#FFFDF7] rounded transition-colors text-[0.8rem] font-serif font-bold flex items-center gap-1"
                  title="Heading 2"
                >
                  <Heading2 size={16} />
                  H2
                </button>

                <button
                  type="button"
                  onClick={() => insertFormatting("<h3>", "</h3>", "Subheading")}
                  className="p-2 hover:bg-[#FFFDF7] rounded transition-colors text-[0.8rem] font-serif font-bold flex items-center gap-1"
                  title="Heading 3"
                >
                  <Heading3 size={16} />
                  H3
                </button>

                <div className="h-5 w-[1px] bg-[#6B1E2E]/20 mx-1" />

                <button
                  type="button"
                  onClick={() => insertFormatting("<b>", "</b>", "bold text")}
                  className="p-2 hover:bg-[#FFFDF7] rounded transition-colors"
                  title="Bold"
                >
                  <Bold size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => insertFormatting("<i>", "</i>", "italic text")}
                  className="p-2 hover:bg-[#FFFDF7] rounded transition-colors"
                  title="Italic"
                >
                  <Italic size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => insertFormatting("<u>", "</u>", "underlined text")}
                  className="p-2 hover:bg-[#FFFDF7] rounded transition-colors"
                  title="Underline"
                >
                  <Underline size={16} />
                </button>

                <div className="h-5 w-[1px] bg-[#6B1E2E]/20 mx-1" />

                <button
                  type="button"
                  onClick={() =>
                    insertFormatting(
                      "<ul>\n  <li>",
                      "</li>\n  <li>Second item</li>\n</ul>",
                      "First item"
                    )
                  }
                  className="p-2 hover:bg-[#FFFDF7] rounded transition-colors"
                  title="Bullet List"
                >
                  <List size={16} />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    insertFormatting(
                      "<ol>\n  <li>",
                      "</li>\n  <li>Second item</li>\n</ol>",
                      "First item"
                    )
                  }
                  className="p-2 hover:bg-[#FFFDF7] rounded transition-colors"
                  title="Numbered List"
                >
                  <ListOrdered size={16} />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    insertFormatting("<blockquote>", "</blockquote>", "A meaningful quote from your artistic journey...")
                  }
                  className="p-2 hover:bg-[#FFFDF7] rounded transition-colors"
                  title="Quote"
                >
                  <Quote size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowLinkModal(true)}
                  className="p-2 hover:bg-[#FFFDF7] rounded transition-colors"
                  title="Hyperlink"
                >
                  <LinkIcon size={16} />
                </button>
              </div>

              {/* Textarea Editor */}
              <textarea
                ref={editorRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={16}
                placeholder="Write your story here... Describe your artistic journey, techniques, inspiration, or creative process. Use the formatting toolbar above for headings, quotes, and lists."
                className="w-full bg-[#EDE4CE]/20 border border-[rgba(107,30,46,0.18)] p-4 font-serif text-[1rem] leading-[1.7] text-[#2C1810] focus:outline-none focus:border-[#6B1E2E] placeholder:text-[#9C7A6A] resize-y"
              />
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-[rgba(107,30,46,0.15)] flex items-center justify-between flex-wrap gap-4">
              <div className="font-sans text-[0.8rem] text-[#7A5C4E]">
                Stories allow traditional Indian artisans to preserve and share authentic heritage.
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-[#EDE4CE] text-[#2C1810] font-sans text-[0.8rem] uppercase tracking-wider font-semibold hover:bg-[#2C1810] hover:text-[#FFFDF7] transition-all"
                >
                  Save Draft
                </button>

                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-[#6B1E2E] text-[#FFFDF7] font-sans text-[0.8rem] uppercase tracking-wider font-semibold hover:bg-[#8B2A3E] transition-all flex items-center gap-2"
                >
                  <Send size={15} />
                  Publish Story
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LINK MODAL */}
        {showLinkModal && (
          <div className="fixed inset-0 z-50 bg-[#2C1810]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-6 max-w-md w-full shadow-xl space-y-4">
              <h3 className="font-serif text-[1.4rem] text-[#2C1810]">Insert Hyperlink</h3>

              <div>
                <label className="block font-sans text-[0.75rem] uppercase tracking-wider text-[#7A5C4E] mb-1">
                  Link Text
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="e.g. Visit my artwork portfolio"
                  className="w-full bg-[#EDE4CE]/30 border border-[rgba(107,30,46,0.18)] p-2.5 font-sans text-[0.9rem] focus:outline-none focus:border-[#6B1E2E]"
                />
              </div>

              <div>
                <label className="block font-sans text-[0.75rem] uppercase tracking-wider text-[#7A5C4E] mb-1">
                  URL Destination
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://kalakaar.art/explore"
                  className="w-full bg-[#EDE4CE]/30 border border-[rgba(107,30,46,0.18)] p-2.5 font-sans text-[0.9rem] focus:outline-none focus:border-[#6B1E2E]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 border border-[rgba(107,30,46,0.18)] text-[#7A5C4E] font-sans text-[0.75rem] uppercase tracking-wider font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleAddLink}
                  className="px-5 py-2 bg-[#6B1E2E] text-[#FFFDF7] font-sans text-[0.75rem] uppercase tracking-wider font-semibold"
                >
                  Insert Link
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
