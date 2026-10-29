"use client";
import { EmptyState } from "../components/ui/EmptyState";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MadhubaniPattern, MadhubaniDivider } from "../components/patterns/MadhubaniPattern";
import { ArtworkCard } from "../components/ui/ArtworkCard";
import ShareButtons from "../components/ShareButtons";
import { useAuth } from "../contexts/AuthContext";
import { CollectionService, Collection } from "../../services/CollectionService";
import { ArrowLeft, Edit3, Archive, Trash2, Layers, CheckCircle2 } from "lucide-react";
import { notify } from "../lib/notify";

/** `initialCollection` comes from the server so crawlers receive the real collection content. */
export function CollectionDetails({ initialCollection = null }: { initialCollection?: Collection | null }) {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useAuth();

  const [collection, setCollection] = useState<Collection | null>(initialCollection);
  const [loading, setLoading] = useState(!initialCollection);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCollection() {
      if (!id) return;
      if (!initialCollection) setLoading(true); // with server data we refresh quietly
      setError(null);

      const res = await CollectionService.getCollection(id);
      if (res.success && res.data) {
        setCollection(res.data);
      } else {
        setError(res.error || "Collection not found.");
      }
      setLoading(false);
    }

    fetchCollection();
  }, [id]);

  const handleArchive = async () => {
    if (!collection || !confirm("Are you sure you want to archive this collection?")) return;
    const res = await CollectionService.archiveCollection(collection.id);
    if (res.success && res.data) {
      notify.success("Collection archived.");
      setCollection(res.data);
    } else {
      notify.error(res.error || "Failed to archive collection.");
    }
  };

  const handleDelete = async () => {
    if (!collection || !confirm("Are you sure you want to delete this collection? Artworks in this collection will NOT be deleted.")) return;
    const res = await CollectionService.deleteCollection(collection.id);
    if (res.success) {
      notify.success("Collection deleted.");
      router.push("/collections");
    } else {
      notify.error(res.error || "Failed to delete collection.");
    }
  };

  const isOwner = user && collection && (user.id === collection.artist_id);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F5EFE0] pt-24 pb-32 px-4 flex justify-center">
        <div className="animate-pulse w-full max-w-5xl h-[400px] bg-[#EDE4CE]"></div>
      </main>
    );
  }

  if (error || !collection) {
    return (
      <main className="min-h-screen bg-[#F5EFE0] pt-24 pb-32 px-4 flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-serif text-[#2C1810] mb-4">Collection Not Found</h1>
        <p className="font-sans text-[#7A5C4E] mb-8">{error || "The collection you are looking for does not exist or has been removed."}</p>
        <Link
          href="/collections"
          className="px-6 py-3 bg-[#6B1E2E] text-[#FFFDF7] font-sans text-xs uppercase tracking-widest font-semibold hover:bg-[#8A2B3E] transition-colors"
        >
          Explore Collections
        </Link>
      </main>
    );
  }

  const artworks = collection.artworks || [];
  const coverUrl = collection.cover_image_url || (artworks[0]?.image_urls?.[0]) || "/assets/defaults/collection.svg";

  return (
    <main className="relative min-h-screen pb-32 bg-[#F5EFE0]">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <MadhubaniPattern opacity={0.03} />
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-10 pt-12">
        {/* Navigation & Toolbar */}
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <Link
            href="/collections"
            className="inline-flex items-center text-[#7A5C4E] hover:text-[#6B1E2E] transition-colors font-sans text-[0.8rem] uppercase tracking-[0.1em] group"
          >
            <ArrowLeft size={16} className="mr-2 transform group-hover:-translate-x-1 transition-transform" /> Back to Collections
          </Link>

          {/* Owner Actions */}
          {isOwner && (
            <div className="flex items-center gap-3">
              <Link
                href={`/collections/${collection.id}/edit`}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#6B1E2E] text-[#6B1E2E] hover:bg-[#6B1E2E] hover:text-white transition-colors text-xs uppercase tracking-wider font-semibold"
              >
                <Edit3 size={14} /> Edit Collection
              </Link>
              <button
                type="button"
                onClick={handleArchive}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#7A5C4E] text-[#7A5C4E] hover:bg-[#7A5C4E] hover:text-white transition-colors text-xs uppercase tracking-wider font-semibold"
              >
                <Archive size={14} /> Archive
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-700 text-red-700 hover:bg-red-700 hover:text-white transition-colors text-xs uppercase tracking-wider font-semibold"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>

        {collection.status === 'archived' && (
          <div className="mb-6 p-4 bg-amber-100 border border-amber-300 text-amber-900 font-sans text-sm">
            ⚠️ This collection is archived and currently hidden from public discovery.
          </div>
        )}

        {/* Collection Hero Box */}
        <section className="relative bg-[#FFFDF7] border border-[#6B1E2E]/[0.09] p-8 md:p-12 mb-16 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Cover Image */}
            <div className="md:col-span-5 relative aspect-[4/3] w-full bg-[#EDE4CE] border border-[rgba(107,30,46,0.18)] overflow-hidden">
              <Image
                src={coverUrl}
                alt={collection.title}
                fill
 sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="absolute top-4 left-4 bg-[#6B1E2E] text-[#F5EDD6] text-[0.65rem] uppercase tracking-widest px-3 py-1 font-semibold flex items-center gap-1.5 shadow">
                <Layers size={12} /> Curated Collection
              </span>
            </div>

            {/* Collection Details */}
            <div className="md:col-span-7 flex flex-col">
              <span className="font-sans text-[0.72rem] uppercase tracking-[0.18em] text-[#9C7A6A] mb-2">
                — Theme Gallery —
              </span>

              <h1 className="font-serif text-[2.8rem] leading-[1.15] text-[#2C1810] font-semibold mb-4">
                {collection.title}
              </h1>

              {/* Artist Details */}
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-[#6B1E2E]/[0.072]">
                <div className="relative w-10 h-10 rounded-full border-[1.5px] border-[#6B1E2E] overflow-hidden bg-[#FFFDF7] shrink-0">
                  <Image
                    src={collection.profiles?.avatar_url || "/assets/defaults/avatar.svg"}
                    alt={collection.profiles?.full_name || "Artist"}
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <p className="font-sans text-[0.85rem] text-[#2C1810] font-semibold flex items-center gap-1.5">
                    Curated by {collection.profiles?.full_name || "Artisan"}
                    <CheckCircle2 size={14} className="text-[#3B82F6]" />
                  </p>
                  <p className="font-sans text-[0.75rem] text-[#7A5C4E]">
                    {artworks.length} {artworks.length === 1 ? "Artwork" : "Artworks"} in Collection
                  </p>
                </div>
                {collection.artist_id && (
                  <Link
                    href={`/artist/${collection.artist_id}`}
                    className="ml-auto font-sans text-[0.75rem] text-[#6B1E2E] uppercase tracking-wider hover:underline"
                  >
                    View Artist →
                  </Link>
                )}
              </div>

              {/* Description */}
              {collection.description && (
                <p className="font-sans text-[0.95rem] text-[#7A5C4E] leading-[1.8] mb-6">
                  {collection.description}
                </p>
              )}

              {/* Share & Meta */}
              <div className="flex items-center justify-between pt-2">
                <ShareButtons
                  title={collection.title}
                  artistName={collection.profiles?.full_name}
                  url={typeof window !== 'undefined' ? window.location.href : ''}
                  image_urls={[coverUrl]}
                />
                <span className="font-sans text-xs text-[#7A5C4E]/70">
                  👁 {collection.view_count || 0} Views
                </span>
              </div>
            </div>

          </div>
        </section>

        <MadhubaniDivider />

        {/* Artworks Grid Header */}
        <div className="flex flex-col items-center text-center my-12">
          <p className="font-sans text-[0.72rem] uppercase tracking-[0.18em] text-[#9C7A6A] mb-2">
            The Gallery
          </p>
          <h2 className="font-serif text-[2.4rem] font-semibold text-[#2C1810]">
            Artworks in this Collection ({artworks.length})
          </h2>
          <div className="w-[40px] h-[2px] bg-[#6B1E2E] mt-3"></div>
        </div>

        {/* Artworks Grid */}
        {artworks.length === 0 ? (
          <EmptyState type="no_artworks" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {artworks.map((art) => (
              <ArtworkCard
                key={art.id}
                id={art.id}
                like_count={art.like_count}
                artistId={art.artist_id}
                title={art.title || 'Untitled'}
                artistName={collection.profiles?.full_name || 'Artisan'}
                price={art.price || 0}
                image_urls={art.image_urls}
                style={art.category}
                categories={[art.category]}
                isSold={art.status === 'archived'}
              />
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
