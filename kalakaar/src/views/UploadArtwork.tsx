"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { AccessDenied } from "../components/auth/AccessDenied";
import { GoldButton } from "../components/ui/GoldButton";
import { UploadCloud, Star, ArrowLeft, ArrowRight, X, Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { StorageService } from "../../services/StorageService";
import { ArtworkService } from "../../services/ArtworkService";

export const artCategories = [
  "Madhubani",
  "Warli",
  "Pattachitra",
  "Tanjore",
  "Gond",
  "Miniature",
  "Rajasthani",
  "Kalamkari",
  "Phad",
  "Kerala Mural",
  "Tribal Art",
  "Folk Art",
  "Oil Painting",
  "Watercolor",
  "Acrylic",
  "Pencil Sketch",
  "Charcoal",
  "Digital Art",
  "Sculpture",
  "Pottery & Ceramics",
  "Textile Art",
  "Embroidery",
  "Rangoli",
  "Mandala",
  "Portrait",
  "Landscape",
  "Abstract",
  "Calligraphy",
  "Mixed Media",
  "Other"
];

interface ImageItem {
  id: string;
  file?: File;
  url: string;
  isExisting?: boolean;
}

const PRESET_SIZES = [
  { label: 'Small', size: '6×8 inches' },
  { label: 'Medium', size: '12×16 inches' },
  { label: 'Large', size: '18×24 inches' },
  { label: 'XL', size: '24×36 inches' },
  { label: 'Custom', size: '' },
];

export function UploadArtwork() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit") || searchParams.get("id");
  const { user, loading: authLoading } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [medium, setMedium] = useState("");
  const [materials, setMaterials] = useState("");
  const [creationYear, setCreationYear] = useState<number>(new Date().getFullYear());
  const [price, setPrice] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  // Dimensions
  const [sizePreset, setSizePreset] = useState("Medium");
  const [customWidth, setCustomWidth] = useState("");
  const [customHeight, setCustomHeight] = useState("");
  const [customUnit, setCustomUnit] = useState("inches");

  // Images state
  const [images, setImages] = useState<ImageItem[]>([]);
  const [coverImageIndex, setCoverImageIndex] = useState<number>(0);

  // Status & UI messages
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loadingArtwork, setLoadingArtwork] = useState(false);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth?mode=signin&redirect=/artist-portal/upload');
    }
  }, [authLoading, user, router]);

  // Load existing artwork if editing
  useEffect(() => {
    if (!editId) return;

    async function loadEditArtwork() {
      setLoadingArtwork(true);
      const res = await ArtworkService.getArtwork(editId as string);
      if (res.success && res.data) {
        const art = res.data;
        setTitle(art.title);
        setDescription(art.description || "");
        
        if (artCategories.includes(art.category)) {
          setCategory(art.category);
        } else {
          setCategory("Other");
          setCustomCategory(art.category);
        }

        setMedium(art.medium || "");
        setMaterials(art.materials || "");
        setCreationYear(art.creation_year || new Date().getFullYear());
        setPrice(art.price ? String(art.price) : "");
        setTags(art.tags || []);
        setCoverImageIndex(art.cover_image_index || 0);

        if (art.dimensions) {
          const matchedPreset = PRESET_SIZES.find(p => p.size === art.dimensions);
          if (matchedPreset) {
            setSizePreset(matchedPreset.label);
          } else {
            setSizePreset("Custom");
          }
        }

        if (art.image_urls && art.image_urls.length > 0) {
          setImages(art.image_urls.map((url, i) => ({
            id: `existing-${i}-${Date.now()}`,
            url,
            isExisting: true
          })));
        }
      }
      setLoadingArtwork(false);
    }

    loadEditArtwork();
  }, [editId]);

  // Tag Handlers
  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (!trimmed) return;
    if (tags.length >= 10) {
      setStatusMessage({ type: "error", text: "Maximum 10 tags allowed." });
      return;
    }
    if (!tags.includes(trimmed)) {
      setTags(prev => [...prev, trimmed]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
  };

  // Image File Handling with Validation
  const handleImagesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (images.length + files.length > 10) {
      setStatusMessage({ type: "error", text: "You can upload a maximum of 10 images per artwork." });
      return;
    }

    const newItems: ImageItem[] = [];
    for (const file of files) {
      // Validate file with StorageService
      const val = StorageService.validateFile(file, 'artworks');
      if (!val.success) {
        setStatusMessage({ type: "error", text: val.error || "Invalid file." });
        return;
      }

      newItems.push({
        id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        url: URL.createObjectURL(file),
        isExisting: false,
      });
    }

    setImages(prev => [...prev, ...newItems]);
    setStatusMessage(null);
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => {
      const next = prev.filter((_, i) => i !== index);
      if (coverImageIndex >= next.length) {
        setCoverImageIndex(Math.max(0, next.length - 1));
      }
      return next;
    });
  };

  const handleMoveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    setImages(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);

      // Adjust cover image index if needed
      if (coverImageIndex === fromIndex) {
        setCoverImageIndex(toIndex);
      } else if (coverImageIndex > fromIndex && coverImageIndex <= toIndex) {
        setCoverImageIndex(coverImageIndex - 1);
      } else if (coverImageIndex < fromIndex && coverImageIndex >= toIndex) {
        setCoverImageIndex(coverImageIndex + 1);
      }

      return next;
    });
  };

  // Main Submit Handler (Publish or Draft)
  const handleSubmit = async (e: React.FormEvent, targetStatus: 'published' | 'draft') => {
    e.preventDefault();
    setStatusMessage(null);

    const ownerId = user?.id || 'anonymous_artist';
    const finalCategory = category === 'Other' ? customCategory.trim() : category;

    // Validation
    if (!title.trim()) {
      setStatusMessage({ type: "error", text: "Please provide an artwork title." });
      return;
    }
    if (title.trim().length > 120) {
      setStatusMessage({ type: "error", text: "Title cannot exceed 120 characters." });
      return;
    }
    if (description.length > 3000) {
      setStatusMessage({ type: "error", text: "Description cannot exceed 3000 characters." });
      return;
    }
    if (!finalCategory) {
      setStatusMessage({ type: "error", text: "Please select or specify a category." });
      return;
    }
    if (images.length === 0) {
      setStatusMessage({ type: "error", text: "Please attach at least one artwork image." });
      return;
    }

    setSaving(true);

    try {
      // Step: Upload any new image files through StorageService pipeline
      const uploadedUrls: string[] = [];

      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        if (item.isExisting) {
          uploadedUrls.push(item.url);
        } else if (item.file) {
          const uploadRes = await StorageService.uploadFile({
            file: item.file,
            bucket: 'artworks',
            ownerId: ownerId,
          });

          if (uploadRes.success && uploadRes.data?.publicUrl) {
            uploadedUrls.push(uploadRes.data.publicUrl);
          } else {
            // Never publish an artwork whose image did not upload.
            setSaving(false);
            setStatusMessage({ type: "error", text: uploadRes.error || "Image upload failed. Please check your connection and try again." });
            return;
          }
        }
      }

      // Compute dimensions string
      let dimensionsStr = sizePreset;
      if (sizePreset === 'Custom') {
        dimensionsStr = `${customWidth || '12'}×${customHeight || '16'} ${customUnit}`;
      } else {
        const preset = PRESET_SIZES.find(p => p.label === sizePreset);
        if (preset?.size) dimensionsStr = preset.size;
      }

      const artworkPayload = {
        id: editId || undefined,
        artist_id: ownerId,
        title: title.trim(),
        description: description.trim(),
        category: finalCategory,
        medium: medium.trim() || 'Mixed Media',
        materials: materials.trim() || 'Canvas',
        tags: tags,
        creation_year: creationYear,
        dimensions: dimensionsStr,
        price: price ? parseFloat(price) : undefined,
        image_urls: uploadedUrls,
        cover_image_index: coverImageIndex < uploadedUrls.length ? coverImageIndex : 0,
        status: targetStatus,
      };

      let result;
      if (editId) {
        result = await ArtworkService.updateArtwork(editId, artworkPayload);
      } else {
        result = await ArtworkService.createArtwork(artworkPayload);
      }

      setSaving(false);

      if (result.success) {
        setStatusMessage({
          type: "success",
          text: targetStatus === 'published' ? "Artwork published successfully!" : "Artwork saved as draft!"
        });
        setTimeout(() => {
          router.push(user ? `/artist/${user.id}` : "/explore");
        }, 1200);
      } else {
        setStatusMessage({ type: "error", text: result.error || "Failed to save artwork." });
      }
    } catch (err: unknown) {
      setSaving(false);
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setStatusMessage({ type: "error", text: msg });
    }
  };

  if (authLoading || loadingArtwork) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-8">
        <p className="font-serif text-lg text-[#2C1810]">Loading Upload Studio...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isArtist = user.role === 'artist' || user.role === 'admin' || user.role === 'super_admin';
  if (!isArtist) {
    return <AccessDenied title="Upload Studio Restricted" requiredRole="Artist or Admin" message="Uploading artwork requires a registered Artist or Admin account." />;
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 mt-16 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-[2.5rem] text-[#2C1810]">
            {editId ? "Edit Artwork" : "Upload Artwork"}
          </h1>
        </div>

        {statusMessage && (
          <div className={`mb-6 p-4 rounded-none border flex items-center gap-3 font-sans text-sm ${
            statusMessage.type === 'success'
              ? 'bg-[#EBF3ED] text-[#1E4620] border-[#A8D5AF]'
              : 'bg-[#FDF2F2] text-[#8A2525] border-[#F2B6B6]'
          }`}>
            {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={(e) => handleSubmit(e, 'published')} className="space-y-10">
          <section className="bg-[#FFFDF7] border border-[#6B1E2E]/[0.072] p-8 shadow-sm">
            <h3 className="font-serif text-[1.5rem] text-[#2C1810] mb-6 pb-4 border-b border-[#6B1E2E]/[0.072]">
              Artwork Details
            </h3>

            <div className="space-y-6">
              {/* Title */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block font-sans text-[0.75rem] uppercase tracking-[0.1em] text-[#7A5C4E] font-semibold">
                    Title *
                  </label>
                  <span className="text-xs text-[#7A5C4E]/60">{title.length}/120</span>
                </div>
                <input
                  required
                  maxLength={120}
                  type="text"
                  placeholder="e.g., Royal Elephant Heritage Painting"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.25)] rounded-none px-4 py-3 font-sans text-[0.95rem] focus:outline-none focus:border-[#6B1E2E] transition-colors text-[#2C1810]"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block font-sans text-[0.75rem] uppercase tracking-[0.1em] text-[#7A5C4E] mb-2 font-semibold">
                  Category *
                </label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {artCategories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                        category === cat
                          ? 'bg-[#6B1E2E] text-[#F5EDD6] border-[#6B1E2E]'
                          : 'bg-transparent text-[#6B1E2E] border-[#6B1E2E] opacity-70 hover:opacity-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                {category === 'Other' && (
                  <input
                    type="text"
                    placeholder="Specify custom style (e.g., Glass Painting, Lippan Art)..."
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    className="w-full border border-[rgba(107,30,46,0.25)] px-4 py-3 bg-[#FFFDF7] text-[#2C1810] focus:outline-none focus:border-[#6B1E2E]"
                  />
                )}
              </div>

              {/* Description */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block font-sans text-[0.75rem] uppercase tracking-[0.1em] text-[#7A5C4E] font-semibold">
                    Description
                  </label>
                  <span className="text-xs text-[#7A5C4E]/60">{description.length}/3000</span>
                </div>
                <textarea
                  rows={4}
                  maxLength={3000}
                  placeholder="Describe the story, inspiration, and technique behind this piece..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.25)] rounded-none px-4 py-3 font-sans text-[0.95rem] focus:outline-none focus:border-[#6B1E2E] transition-colors text-[#2C1810] resize-none"
                />
              </div>

              {/* Medium & Materials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-sans text-[0.75rem] uppercase tracking-[0.1em] text-[#7A5C4E] mb-2 font-semibold">
                    Medium
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Natural Pigments, Acrylic, Oil, Ink"
                    value={medium}
                    onChange={e => setMedium(e.target.value)}
                    className="w-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.25)] rounded-none px-4 py-3 font-sans text-[0.95rem] focus:outline-none focus:border-[#6B1E2E] text-[#2C1810]"
                  />
                </div>
                <div>
                  <label className="block font-sans text-[0.75rem] uppercase tracking-[0.1em] text-[#7A5C4E] mb-2 font-semibold">
                    Materials / Surface
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Handmade Paper, Silk Canvas, Terracotta"
                    value={materials}
                    onChange={e => setMaterials(e.target.value)}
                    className="w-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.25)] rounded-none px-4 py-3 font-sans text-[0.95rem] focus:outline-none focus:border-[#6B1E2E] text-[#2C1810]"
                  />
                </div>
              </div>

              {/* Creation Year & Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-sans text-[0.75rem] uppercase tracking-[0.1em] text-[#7A5C4E] mb-2 font-semibold">
                    Creation Year
                  </label>
                  <input
                    type="number"
                    min={1900}
                    max={new Date().getFullYear()}
                    value={creationYear}
                    onChange={e => setCreationYear(parseInt(e.target.value) || new Date().getFullYear())}
                    className="w-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.25)] rounded-none px-4 py-3 font-sans text-[0.95rem] focus:outline-none focus:border-[#6B1E2E] text-[#2C1810]"
                  />
                </div>

                <div>
                  <label className="block font-sans text-[0.75rem] uppercase tracking-[0.1em] text-[#7A5C4E] mb-2 font-semibold">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 15000"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="w-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.25)] rounded-none px-4 py-3 font-sans text-[0.95rem] focus:outline-none focus:border-[#6B1E2E] transition-colors text-[#2C1810]"
                  />
                </div>
              </div>

              {/* Dimensions */}
              <div>
                <label className="block font-sans text-[0.75rem] uppercase tracking-[0.1em] text-[#7A5C4E] mb-2 font-semibold">
                  Dimensions
                </label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {PRESET_SIZES.map(size => (
                    <button
                      key={size.label}
                      type="button"
                      onClick={() => setSizePreset(size.label)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                        sizePreset === size.label
                          ? 'bg-[#6B1E2E] text-[#F5EDD6] border-[#6B1E2E]'
                          : 'bg-transparent text-[#6B1E2E] border-[#6B1E2E] opacity-70 hover:opacity-100'
                      }`}
                    >
                      {size.label} {size.size && `(${size.size})`}
                    </button>
                  ))}
                </div>
                {sizePreset === 'Custom' && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      placeholder="W"
                      value={customWidth}
                      onChange={e => setCustomWidth(e.target.value)}
                      className="w-24 border border-[rgba(107,30,46,0.25)] px-3 py-2 bg-[#FFFDF7] text-[#2C1810] focus:outline-none focus:border-[#6B1E2E]"
                    />
                    <span className="text-[#6B1E2E] font-serif">×</span>
                    <input
                      type="number"
                      placeholder="H"
                      value={customHeight}
                      onChange={e => setCustomHeight(e.target.value)}
                      className="w-24 border border-[rgba(107,30,46,0.25)] px-3 py-2 bg-[#FFFDF7] text-[#2C1810] focus:outline-none focus:border-[#6B1E2E]"
                    />
                    <select
                      value={customUnit}
                      onChange={e => setCustomUnit(e.target.value)}
                      className="border border-[rgba(107,30,46,0.25)] px-3 py-2 bg-[#FFFDF7] text-[#2C1810] focus:outline-none focus:border-[#6B1E2E]"
                    >
                      <option value="inches">inches</option>
                      <option value="cm">cm</option>
                      <option value="feet">feet</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block font-sans text-[0.75rem] uppercase tracking-[0.1em] text-[#7A5C4E] mb-2 font-semibold">
                  Tags (Up to 10)
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Add tag (e.g. FolkArt, Heritage)"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-grow bg-[#FFFDF7] border border-[rgba(107,30,46,0.25)] rounded-none px-4 py-2 font-sans text-[0.95rem] focus:outline-none focus:border-[#6B1E2E] text-[#2C1810]"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-[#6B1E2E] text-[#FFFDF7] hover:bg-[#8A2B3E] transition-colors flex items-center gap-1 font-sans text-xs uppercase tracking-wider font-semibold"
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F5EDD6] text-[#6B1E2E] text-xs rounded-full border border-[#6B1E2E]/20"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-700 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Artwork Images section */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block font-sans text-[0.75rem] uppercase tracking-[0.1em] text-[#7A5C4E] font-semibold">
                    Artwork Images * (1 to 10 images, max 10MB each)
                  </label>
                  <span className="text-xs text-[#7A5C4E]/60">{images.length}/10 Images</span>
                </div>

                <div className="border border-[rgba(107,30,46,0.25)] p-4 bg-[#FDFBF7]">
                  {/* Previews grid */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {images.map((item, index) => (
                        <div
                          key={item.id}
                          className={`relative aspect-square border overflow-hidden group ${
                            coverImageIndex === index
                              ? 'border-[#6B1E2E] ring-2 ring-[#6B1E2E]/30'
                              : 'border-[rgba(107,30,46,0.18)]'
                          }`}
                        >
                          <Image
                            src={item.url}
                            alt={`Preview ${index + 1}`}
                            fill
                            className="object-cover"
                            unoptimized
                          />

                          {/* Cover Badge */}
                          {coverImageIndex === index && (
                            <span className="absolute top-2 left-2 bg-[#6B1E2E] text-[#F5EDD6] text-[0.65rem] uppercase tracking-widest px-2 py-0.5 font-semibold flex items-center gap-1 shadow">
                              <Star size={10} fill="#F5EDD6" /> Cover
                            </span>
                          )}

                          {/* Controls overlay */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                            <div className="flex justify-between items-center">
                              {coverImageIndex !== index && (
                                <button
                                  type="button"
                                  onClick={() => setCoverImageIndex(index)}
                                  className="bg-white/90 text-[#6B1E2E] text-[0.65rem] px-2 py-1 uppercase font-semibold hover:bg-white flex items-center gap-1"
                                >
                                  Set Cover
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="bg-red-600/90 text-white p-1 rounded-full hover:bg-red-700 ml-auto"
                                title="Remove Image"
                              >
                                <X size={14} />
                              </button>
                            </div>

                            {/* Reorder Buttons */}
                            <div className="flex justify-center gap-2">
                              {index > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveImage(index, index - 1)}
                                  className="bg-white/90 text-[#2C1810] p-1 hover:bg-white"
                                  title="Move Left"
                                >
                                  <ArrowLeft size={14} />
                                </button>
                              )}
                              {index < images.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleMoveImage(index, index + 1)}
                                  className="bg-white/90 text-[#2C1810] p-1 hover:bg-white"
                                  title="Move Right"
                                >
                                  <ArrowRight size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload inputs */}
                  {images.length < 10 && (
                    <div className="flex flex-wrap gap-4 mt-2">
                      <label htmlFor="camera-input" className="cursor-pointer px-6 py-2.5 border border-[rgba(107,30,46,0.25)] text-[#6B1E2E] hover:bg-[#6B1E2E]/10 transition-colors font-sans text-[0.75rem] uppercase tracking-[0.1em] font-semibold flex items-center gap-2">
                        <span>📷 Camera</span>
                        <input
                          type="file"
                          id="camera-input"
                          accept="image/jpeg,image/png,image/webp"
                          capture="environment"
                          className="hidden"
                          onChange={handleImagesSelect}
                        />
                      </label>
                      <label htmlFor="file-input" className="cursor-pointer px-6 py-2.5 bg-[#6B1E2E] text-[#FFFDF7] hover:bg-[#8A2B3E] transition-colors font-sans text-[0.75rem] uppercase tracking-[0.1em] font-semibold flex items-center gap-2">
                        <UploadCloud size={16} /> <span>Upload Images</span>
                        <input
                          type="file"
                          id="file-input"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          className="hidden"
                          onChange={handleImagesSelect}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              disabled={saving}
              onClick={(e) => handleSubmit(e, 'draft')}
              className="px-8 py-3 border border-[#6B1E2E] text-[#6B1E2E] hover:bg-[#6B1E2E]/10 transition-colors font-sans text-xs uppercase tracking-widest font-semibold disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Draft"}
            </button>
            <GoldButton
              variant="primary"
              type="submit"
              disabled={saving}
              className="px-10 py-3"
            >
              {saving ? "Publishing..." : editId ? "Update Artwork" : "Publish Artwork"}
            </GoldButton>
          </div>
        </form>
      </main>
    </div>
  );
}
