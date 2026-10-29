"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useAuth } from "../contexts/AuthContext";
import { GoldButton } from "../components/ui/GoldButton";
import { CollectionService } from "../../services/CollectionService";
import { ArtworkService, Artwork } from "../../services/ArtworkService";
import { Layers, Star, Plus, X, ArrowUp, ArrowDown, CheckCircle2, AlertCircle } from "lucide-react";

export function CollectionStudio() {
  const router = useRouter();
  const params = useParams() as { id?: string };
  const searchParams = useSearchParams();
  const editId = params?.id || searchParams.get("edit") || searchParams.get("id");

  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedArtworks, setSelectedArtworks] = useState<Artwork[]>([]);
  const [coverArtworkId, setCoverArtworkId] = useState<string>("");

  const [artistArtworks, setArtistArtworks] = useState<Artwork[]>([]);
  const [artworkTotal, setArtworkTotal] = useState(0);
  const [artworkPage, setArtworkPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingArtworks, setLoadingArtworks] = useState(true);
  const [loadingCollection, setLoadingCollection] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [showArtworkPicker, setShowArtworkPicker] = useState(false);

  // Load Artist's existing artworks
  useEffect(() => {
    async function loadArtistArtworks() {
      const artistId = user?.id;
      if (!artistId) return;
      setLoadingArtworks(true);
      const res = await ArtworkService.getArtistArtworksPage(artistId, { includeDrafts: true, page: 1, pageSize: 24 });
      if (res.success && res.data) {
        setArtistArtworks(res.data.items);
        setArtworkTotal(res.data.total);
        setArtworkPage(1);
      }
      setLoadingArtworks(false);
    }

    loadArtistArtworks();
  }, [user]);

  const loadMoreArtworks = async () => {
    const artistId = user?.id;
    if (!artistId || loadingMore) return;
    setLoadingMore(true);
    const res = await ArtworkService.getArtistArtworksPage(artistId, { includeDrafts: true, page: artworkPage + 1, pageSize: 24 });
    if (res.success && res.data) {
      setArtistArtworks(prev => {
        const seen = new Set(prev.map(a => a.id));
        return [...prev, ...res.data!.items.filter(a => !seen.has(a.id))];
      });
      setArtworkTotal(res.data.total);
      setArtworkPage(artworkPage + 1);
    }
    setLoadingMore(false);
  };

  // Load existing collection if editing
  useEffect(() => {
    if (!editId) return;

    async function loadCollectionToEdit() {
      setLoadingCollection(true);
      const res = await CollectionService.getCollection(editId as string);
      if (res.success && res.data) {
        const col = res.data;
        setTitle(col.title);
        setDescription(col.description || "");
        setSelectedArtworks(col.artworks || []);
        
        // Find matching cover artwork
        if (col.cover_image_url && col.artworks) {
          const match = col.artworks.find(a => a.image_urls?.includes(col.cover_image_url!));
          if (match) {
            setCoverArtworkId(match.id);
          } else if (col.artworks[0]) {
            setCoverArtworkId(col.artworks[0].id);
          }
        }
      } else {
        setStatusMessage({ type: "error", text: "Could not load collection details." });
      }
      setLoadingCollection(false);
    }

    loadCollectionToEdit();
  }, [editId]);

  // Add artwork to collection
  const handleSelectArtwork = (art: Artwork) => {
    if (selectedArtworks.some(a => a.id === art.id)) {
      setStatusMessage({ type: "error", text: "Artwork is already in this collection." });
      return;
    }
    if (selectedArtworks.length >= 100) {
      setStatusMessage({ type: "error", text: "Maximum 100 artworks allowed per collection." });
      return;
    }

    const updated = [...selectedArtworks, art];
    setSelectedArtworks(updated);

    // Set cover artwork if first artwork
    if (!coverArtworkId && art.id) {
      setCoverArtworkId(art.id);
    }

    setStatusMessage(null);
  };

  // Remove artwork from collection
  const handleRemoveArtwork = (artId: string) => {
    const updated = selectedArtworks.filter(a => a.id !== artId);
    setSelectedArtworks(updated);
    if (coverArtworkId === artId) {
      setCoverArtworkId(updated[0]?.id || "");
    }
  };

  // Reorder artwork
  const handleMoveArtwork = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= selectedArtworks.length) return;

    const next = [...selectedArtworks];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    setSelectedArtworks(next);
  };

  // Save / Publish Submit Handler
  const handleSubmit = async (e: React.FormEvent, targetStatus: 'published' | 'draft') => {
    e.preventDefault();
    setStatusMessage(null);

    const ownerId = user?.id;
    if (!ownerId) {
      setStatusMessage({ type: 'error', text: 'Please log in to save a collection.' } as any);
      return;
    }

    // Validation
    if (!title.trim()) {
      setStatusMessage({ type: "error", text: "Please enter a collection title." });
      return;
    }
    if (title.trim().length > 120) {
      setStatusMessage({ type: "error", text: "Collection title cannot exceed 120 characters." });
      return;
    }
    if (description.length > 1000) {
      setStatusMessage({ type: "error", text: "Description cannot exceed 1000 characters." });
      return;
    }
    if (targetStatus === 'published' && selectedArtworks.length < 1) {
      setStatusMessage({ type: "error", text: "Please select at least 1 artwork to publish this collection." });
      return;
    }

    setSaving(true);

    try {
      // Find derived cover image URL
      let coverUrl: string | undefined = undefined;
      const selectedCoverArt = selectedArtworks.find(a => a.id === coverArtworkId) || selectedArtworks[0];
      if (selectedCoverArt && selectedCoverArt.image_urls && selectedCoverArt.image_urls.length > 0) {
        const idx = selectedCoverArt.cover_image_index || 0;
        coverUrl = selectedCoverArt.image_urls[idx] || selectedCoverArt.image_urls[0];
      }

      const payload = {
        id: editId || undefined,
        artist_id: ownerId,
        title: title.trim(),
        description: description.trim(),
        cover_image_url: coverUrl,
        artworks: selectedArtworks,
        status: targetStatus,
        profiles: {
          id: ownerId,
          full_name: (user as any)?.user_metadata?.full_name || user?.name || "Artist",
          avatar_url: "/assets/defaults/avatar.svg",
        }
      };

      let result;
      if (editId) {
        result = await CollectionService.updateCollection(editId, payload);
      } else {
        result = await CollectionService.createCollection(payload);
      }

      setSaving(false);

      if (result.success && result.data) {
        setStatusMessage({
          type: "success",
          text: targetStatus === 'published' ? "Collection published successfully!" : "Collection saved as draft!"
        });
        const savedColId = result.data.id;
        setTimeout(() => {
          router.push(`/collections/${savedColId}`);
        }, 1200);
      } else {
        setStatusMessage({ type: "error", text: result.error || "Failed to save collection." });
      }
    } catch (err: unknown) {
      setSaving(false);
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setStatusMessage({ type: "error", text: msg });
    }
  };

  if (loadingCollection) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-8">
        <p className="font-serif text-lg text-[#2C1810]">Loading collection builder...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 mt-16 max-w-4xl mx-auto w-full">
        
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-[2.5rem] text-[#2C1810]">
            {editId ? "Edit Collection" : "Create New Collection"}
          </h1>
        </div>

        {statusMessage && (
          <div className={`mb-6 p-4 border flex items-center gap-3 font-sans text-sm ${
            statusMessage.type === 'success'
              ? 'bg-[#EBF3ED] text-[#1E4620] border-[#A8D5AF]'
              : 'bg-[#FDF2F2] text-[#8A2525] border-[#F2B6B6]'
          }`}>
            {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={(e) => handleSubmit(e, 'published')} className="space-y-10">
          
          {/* Metadata Section */}
          <section className="bg-[#FFFDF7] border border-[#6B1E2E]/[0.072] p-8 shadow-sm space-y-6">
            <h3 className="font-serif text-[1.5rem] text-[#2C1810] pb-4 border-b border-[#6B1E2E]/[0.072]">
              Collection Overview
            </h3>

            {/* Title */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block font-sans text-[0.75rem] uppercase tracking-[0.1em] text-[#7A5C4E] font-semibold">
                  Collection Title *
                </label>
                <span className="text-xs text-[#7A5C4E]/60">{title.length}/120</span>
              </div>
              <input
                required
                maxLength={120}
                type="text"
                placeholder="e.g. Sacred Folk Tales of Mithila"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.25)] px-4 py-3 font-sans text-[0.95rem] focus:outline-none focus:border-[#6B1E2E] text-[#2C1810]"
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block font-sans text-[0.75rem] uppercase tracking-[0.1em] text-[#7A5C4E] font-semibold">
                  Description
                </label>
                <span className="text-xs text-[#7A5C4E]/60">{description.length}/1000</span>
              </div>
              <textarea
                rows={4}
                maxLength={1000}
                placeholder="Describe the unifying theme, artistic journey, or narrative behind this curated collection..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.25)] px-4 py-3 font-sans text-[0.95rem] focus:outline-none focus:border-[#6B1E2E] text-[#2C1810] resize-none"
              />
            </div>
          </section>

          {/* Artworks Selection Section */}
          <section className="bg-[#FFFDF7] border border-[#6B1E2E]/[0.072] p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#6B1E2E]/[0.072]">
              <div>
                <h3 className="font-serif text-[1.5rem] text-[#2C1810]">
                  Collection Artworks ({selectedArtworks.length})
                </h3>
                <p className="font-sans text-xs text-[#7A5C4E] mt-1">
                  Reuses existing artworks. Reorder pieces or set a cover image for the collection.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowArtworkPicker(true)}
                className="px-4 py-2 bg-[#6B1E2E] text-[#FFFDF7] hover:bg-[#8A2B3E] transition-colors flex items-center gap-2 font-sans text-xs uppercase tracking-wider font-semibold"
              >
                <Plus size={16} /> Add Artwork
              </button>
            </div>

            {/* Selected Artworks List */}
            {selectedArtworks.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-[rgba(107,30,46,0.25)] p-6 bg-[#FDFBF7]">
                <Layers className="mx-auto text-[#7A5C4E] mb-3" size={32} />
                <p className="font-serif text-lg text-[#2C1810] mb-1">No artworks added yet</p>
                <p className="font-sans text-xs text-[#7A5C4E] mb-4">Select existing artworks from your portfolio to curate into this gallery.</p>
                <button
                  type="button"
                  onClick={() => setShowArtworkPicker(true)}
                  className="px-5 py-2 border border-[#6B1E2E] text-[#6B1E2E] font-sans text-xs uppercase tracking-wider font-semibold hover:bg-[#6B1E2E]/10"
                >
                  Browse Portfolio Artworks
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedArtworks.map((art, index) => {
                  const img = art.image_urls?.[art.cover_image_index || 0] || art.image_urls?.[0] || "/assets/defaults/artwork.svg";
                  const isCover = coverArtworkId === art.id || (!coverArtworkId && index === 0);

                  return (
                    <div
                      key={art.id}
                      className={`flex items-center gap-4 p-4 border transition-all ${
                        isCover ? 'border-[#6B1E2E] bg-[#F5EDD6]/30' : 'border-[rgba(107,30,46,0.18)] bg-[#FFFDF7]'
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <div className="relative w-16 h-16 bg-[#EDE4CE] border shrink-0 overflow-hidden">
                        <Image src={img} alt={art.title} fill className="object-cover" referrerPolicy="no-referrer" unoptimized />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif text-base text-[#2C1810] truncate font-semibold">{art.title}</h4>
                        <p className="font-sans text-xs text-[#7A5C4E]">{art.category} • ₹{art.price?.toLocaleString('en-IN') || 'N/A'}</p>
                        {isCover && (
                          <span className="inline-flex items-center gap-1 text-[0.65rem] font-sans text-[#6B1E2E] font-bold uppercase tracking-wider mt-1">
                            <Star size={10} fill="#6B1E2E" /> Collection Cover
                          </span>
                        )}
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-2">
                        {!isCover && (
                          <button
                            type="button"
                            onClick={() => setCoverArtworkId(art.id)}
                            className="px-2.5 py-1 text-xs border border-[#6B1E2E] text-[#6B1E2E] hover:bg-[#6B1E2E] hover:text-white transition-colors"
                          >
                            Set as Cover
                          </button>
                        )}

                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveArtwork(index, 'up')}
                            className="p-1 text-[#7A5C4E] hover:text-[#6B1E2E] disabled:opacity-30"
                            title="Move Up"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            disabled={index === selectedArtworks.length - 1}
                            onClick={() => handleMoveArtwork(index, 'down')}
                            className="p-1 text-[#7A5C4E] hover:text-[#6B1E2E] disabled:opacity-30"
                            title="Move Down"
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveArtwork(art.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Remove from collection"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Form Actions */}
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
              {saving ? "Publishing..." : editId ? "Update Collection" : "Publish Collection"}
            </GoldButton>
          </div>

        </form>
      </main>

      {/* Modal: Artwork Selector */}
      {showArtworkPicker && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#FFFDF7] border border-[#6B1E2E]/0.2 max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-[#6B1E2E]/[0.072] flex justify-between items-center">
              <h3 className="font-serif text-xl text-[#2C1810] font-semibold">Select Artworks from Portfolio</h3>
              <button
                onClick={() => setShowArtworkPicker(false)}
                className="text-[#7A5C4E] hover:text-[#2C1810]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              {loadingArtworks ? (
                <p className="font-sans text-sm text-[#7A5C4E]">Loading your artworks...</p>
              ) : artistArtworks.length === 0 ? (
                <p className="font-sans text-sm text-[#7A5C4E]">No published artworks found. Please upload artwork to your portfolio first.</p>
              ) : (
                artistArtworks.map((art) => {
                  const isSelected = selectedArtworks.some(a => a.id === art.id);
                  const img = art.image_urls?.[0] || "/assets/defaults/artwork.svg";

                  return (
                    <div
                      key={art.id}
                      className={`flex items-center justify-between p-3 border ${
                        isSelected ? 'border-green-600 bg-green-50/50' : 'border-[rgba(107,30,46,0.18)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 bg-[#EDE4CE] border shrink-0">
                          <Image src={img} alt={art.title} fill className="object-cover" referrerPolicy="no-referrer" unoptimized />
                        </div>
                        <div>
                          <h4 className="font-serif text-sm font-semibold text-[#2C1810]">{art.title}</h4>
                          <span className="font-sans text-xs text-[#7A5C4E]">{art.category}</span>
                        </div>
                      </div>

                      {isSelected ? (
                        <span className="text-xs text-green-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 size={14} /> Added
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSelectArtwork(art)}
                          className="px-3 py-1 bg-[#6B1E2E] text-white text-xs uppercase tracking-wider font-semibold hover:bg-[#8A2B3E]"
                        >
                          Select
                        </button>
                      )}
                    </div>
                  );
                })
              )}
              {artistArtworks.length < artworkTotal && (
                <button
                  type="button"
                  onClick={loadMoreArtworks}
                  disabled={loadingMore}
                  className="w-full py-2.5 border border-[#6B1E2E] text-[#6B1E2E] text-xs uppercase tracking-wider font-semibold hover:bg-[#6B1E2E] hover:text-white transition-colors disabled:opacity-60"
                >
                  {loadingMore ? "Loading…" : `Show more (${artistArtworks.length} of ${artworkTotal})`}
                </button>
              )}
            </div>

            <div className="p-4 border-t border-[#6B1E2E]/[0.072] bg-[#FDFBF7] flex justify-end">
              <button
                type="button"
                onClick={() => setShowArtworkPicker(false)}
                className="px-6 py-2 bg-[#6B1E2E] text-white font-sans text-xs uppercase tracking-wider font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
