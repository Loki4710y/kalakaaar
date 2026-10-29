"use client";
import { useLanguage } from "../contexts/LanguageContext";
import { ContactGate } from "../components/ui/ContactGate";
import { ReportButton } from "../components/ui/ReportButton";
import { FEATURES } from "../config/features";
import { whatsappLink } from "../lib/contact";
import { trackContact } from "../lib/trackContact";
import { MadhubaniPattern } from "../components/patterns/MadhubaniPattern";
import { ArtworkCard } from "../components/ui/ArtworkCard";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ZoomIn, Star, Heart, Edit3, Archive, Trash2, Eye } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useStore } from "../contexts/StoreContext";
import { useAmbient } from "../contexts/AmbientContext";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Reviews } from "../components/ui/Reviews";
import ShareButtons from "../components/ShareButtons";
import { ShareCardPanel } from "../components/ShareCardPanel";
import { ArtworkService, Artwork } from "../../services/ArtworkService";
import { LikeService } from "../../services/LikeService";

import { ProfileService } from "../../services/ProfileService";
import { notify } from "../lib/notify";
import { SITE_URL } from "@/src/lib/site";

const SITE = SITE_URL;
/** `initialArt`/`initialRecommended` come from the server so crawlers receive the real page content. */
export function ArtworkDetails({ initialArt = null, initialRecommended = [] }: { initialArt?: Artwork | null; initialRecommended?: Artwork[] }) {
  const { id } = useParams() as { id: string };
  const { toggleWishlist, wishlist } = useStore();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { galleryMode, setGalleryMode } = useAmbient();
  const router = useRouter();
  
  const [art, setArt] = useState<Artwork | null>(initialArt);
  const [artist, setArtist] = useState<any>(initialArt?.profiles ?? null);
  const [recommended, setRecommended] = useState<Artwork[]>(initialRecommended.filter(a => a.id !== initialArt?.id));
  const [loading, setLoading] = useState(!initialArt);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [activeImage, setActiveImage] = useState(initialArt?.cover_image_index || 0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      if (!initialArt) setLoading(true); // with server data we refresh quietly (adds contact details for logged-in visitors)

      const res = await ArtworkService.getArtwork(id);
      if (res.success && res.data) {
        const loadedArt = res.data;
        setArt(loadedArt);
        if (loadedArt.cover_image_index) {
          setActiveImage(loadedArt.cover_image_index);
        }

        if (loadedArt.profiles) {
          setArtist(loadedArt.profiles);
        } else if (loadedArt.artist_id) {
          const profileRes = await ProfileService.getProfile(loadedArt.artist_id);
          if (profileRes.data) {
            setArtist(profileRes.data);
          }
        }
      }

      // Fetch real like count & user liked status
      setLikesCount(res.data?.like_count || 0); // already part of the artwork row: no extra request

      if (user) {
        const liked = await LikeService.hasLiked(id, user.id);
        setIsLiked(liked);
      }

      // Load recommendations
      const recRes = await ArtworkService.getExploreArtworks({ limit: 3 });
      if (recRes.success && recRes.data) {
        setRecommended(recRes.data.filter(a => a.id !== id));
      }

      setLoading(false);
    }

    loadData();
  }, [id, user]);

  const handleLikeToggle = async () => {
    if (!user) {
      showNotice("Please log in to like artworks.");
      router.push('/auth?mode=signin');
      return;
    }

    if (art && user.id === art.artist_id) {
      showNotice("You cannot like your own artwork.");
      return;
    }

    if (isLiked) {
      const res = await LikeService.unlikeArtwork(id, user.id);
      if (res.success) {
        setIsLiked(false);
        setLikesCount(res.data?.count ?? Math.max(0, likesCount - 1));
        showNotice("Removed like.");
      } else {
        showNotice(res.error || "Failed to remove like.");
      }
    } else {
      const res = await LikeService.likeArtwork(id, user.id);
      if (res.success) {
        setIsLiked(true);
        setLikesCount(res.data?.count ?? likesCount + 1);
        showNotice("Liked artwork!");
      } else {
        showNotice(res.error || "Failed to like artwork.");
      }
    }
  };

  const handleArchive = async () => {
    if (!art || !confirm("Are you sure you want to archive this artwork?")) return;
    const res = await ArtworkService.archiveArtwork(art.id);
    if (res.success) {
      notify.success("Artwork archived.");
      setArt(prev => prev ? { ...prev, status: 'archived' } : null);
    } else {
      notify.error(res.error || "Failed to archive artwork.");
    }
  };

  const handleDelete = async () => {
    if (!art || !confirm("Are you sure you want to delete this artwork? This action cannot be undone.")) return;
    const res = await ArtworkService.deleteArtwork(art.id);
    if (res.success) {
      notify.success("Artwork deleted.");
      router.push(user ? `/artist/${user.id}` : "/explore");
    } else {
      notify.error(res.error || "Failed to delete artwork.");
    }
  };

  const isInWishlist = art ? wishlist.includes(art.id) : false;
  const isOwner = user && art && (user.id === art.artist_id);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5EFE0] pt-24 pb-32 px-4 flex justify-center">
        <div className="animate-pulse w-full max-w-4xl h-[400px] bg-[#EDE4CE]"></div>
      </div>
    );
  }

  if (!art) {
    return (
      <div className="min-h-screen bg-[#F5EFE0] pt-24 pb-32 px-4 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-serif text-[#2C1810] mb-4">{t("artwork.notFound")}</h1>
        <Link href="/explore" className="text-[#6B1E2E] underline">
          Back to Explore
        </Link>
      </div>
    );
  }
  
  const images = art.image_urls || [];
  const mainImage = images[activeImage] || images[0] || "/assets/defaults/artwork.svg";

  return (
    <main className={`relative min-h-screen pt-12 pb-32 transition-colors duration-500 ${
      galleryMode ? "bg-[#140C08] text-[#F5E6D3]" : "bg-[#F5EFE0]"
    }`}>
      {/* Toast Banner Notice */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#2C1810] text-[#FFFDF7] text-xs px-4 py-2 font-sans shadow-lg rounded-md animate-fade-in border border-[#E8C99A]/30">
          {toastMessage}
        </div>
      )}

      <div className="fixed inset-0 z-0 pointer-events-none">
        <MadhubaniPattern opacity={galleryMode ? 0.01 : 0.03} />
      </div>
      <div className="relative z-10 max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-10">
        
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            <Link href="/explore" className={`inline-flex items-center transition-colors font-sans text-[0.8rem] uppercase tracking-[0.1em] group ${
              galleryMode ? "text-[#D4AF37] hover:text-white" : "text-[#7A5C4E] hover:text-[#6B1E2E]"
            }`}>
              <ArrowLeft size={16} className="mr-2 transform group-hover:-translate-x-1 transition-transform" /> Back to Gallery
            </Link>

            <button
              onClick={() => setGalleryMode(!galleryMode)}
              className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-2 transition-all ${
                galleryMode
                  ? "bg-[#D4AF37] text-[#2C1810] border-[#D4AF37]"
                  : "bg-[#FFFDF7] text-[#2C1810] border-[#D4AF37] hover:bg-[#F5E6D3]"
              }`}
            >
              <Eye size={14} />
              {galleryMode ? "Exit Gallery Mode" : "Gallery Mode"}
            </button>
          </div>

          {/* Owner Action Toolbar */}
          {isOwner && (
            <div className="flex items-center gap-3">
              <Link
                href={`/artist-portal/upload?edit=${art.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#6B1E2E] text-[#6B1E2E] hover:bg-[#6B1E2E] hover:text-white transition-colors text-xs uppercase tracking-wider font-semibold"
              >
                <Edit3 size={14} /> Edit
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

        {art.status === 'archived' && (
          <div className="mb-6 p-4 bg-amber-100 border border-amber-300 text-amber-900 font-sans text-sm">
            ⚠️ This artwork is archived and currently hidden from public search.
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mt-4">
          
          {/* Left 60%: Image Section */}
          <div className="lg:col-span-7 flex flex-col gap-4">
             <div className="relative h-[520px] bg-[#FFFDF7] border border-[#6B1E2E]/[0.09] flex items-center justify-center overflow-hidden group">
               {mainImage ? (
                  <Image src={mainImage} alt={`${art.title || "Artwork"}${art.category ? ` – ${art.category} painting` : ""}${artist?.full_name ? ` by ${artist.full_name}` : ""}`} fill priority sizes="(max-width: 1024px) 100vw, 58vw" className="object-cover" referrerPolicy="no-referrer" />
               ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#EDE4CE]">
                    <p className="text-[#6B1E2E] opacity-50">{t("artwork.noImage")}</p>
                  </div>
               )}
               <button className="absolute top-4 right-4 p-2.5 bg-[#FFFDF7]/90 hover:bg-[#FFFDF7] text-[#6B1E2E] border border-[rgba(107,30,46,0.18)] transition-colors opacity-0 group-hover:opacity-100 duration-300 shadow-sm">
                 <ZoomIn size={18} />
               </button>
             </div>
             {images.length > 1 && (
             <div className="grid grid-cols-4 gap-4">
               {images.map((img: string, i: number) => (
                 <button key={i} onClick={() => setActiveImage(i)} className={`relative h-[80px] bg-[#FFFDF7] border flex items-center justify-center cursor-pointer transition-colors overflow-hidden ${activeImage === i ? 'border-[#6B1E2E] ring-2 ring-[#6B1E2E]/30' : 'border-transparent'}`}>
                   <Image src={img} alt={`${art.title || "Artwork"} – image ${i + 1}`} fill sizes="120px" className="object-cover" referrerPolicy="no-referrer" />
                 </button>
               ))}
             </div>
             )}
          </div>

          {/* Right 40%: Details Section */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="mb-4 inline-flex bg-[#6B1E2E]/10 px-2.5 py-1 text-[0.7rem] text-[#6B1E2E] font-sans uppercase tracking-[0.15em] font-medium w-fit border border-[#6B1E2E]/[0.036] shadow-sm">
              {art.category || "General"}
            </div>
            
            <h1 className="font-serif text-[2.4rem] leading-[1.1] text-[#2C1810] font-semibold mb-4">
              {art.title || "Untitled"}
            </h1>
            
            <div className="flex items-center gap-6 mb-6">
               <button onClick={handleLikeToggle} className="flex items-center gap-2 group transition-colors">
                  <Heart size={18} className={`transition-colors ${isLiked ? 'fill-[#6B1E2E] text-[#6B1E2E]' : 'text-[#7A5C4E] group-hover:text-[#6B1E2E]'}`} />
                  <span className={`font-sans text-[0.85rem] ${isLiked ? 'text-[#6B1E2E] font-medium' : 'text-[#7A5C4E] group-hover:text-[#2C1810]'}`}>{likesCount} Likes</span>
               </button>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full border-[1.5px] border-[#6B1E2E] p-[1px] shrink-0 overflow-hidden bg-[#FFFDF7]">
                   <Image src={artist?.avatar_url || "/assets/defaults/avatar.svg"} alt={artist?.full_name || "Artist"} fill className="object-cover rounded-full" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <p className="font-sans text-[0.85rem] text-[#2C1810] uppercase tracking-[0.05em] flex items-center gap-1">
                    <span className="text-[#7A5C4E] lowercase tracking-normal">by</span> {artist?.full_name || "Master Artisan"}
                    {artist?.is_verified && <span className="text-[#3B82F6]" title={t("artwork.verified")}>✓</span>}
                  </p>
                  <p className="font-sans text-[0.75rem] text-[#7A5C4E] mt-0.5">{artist?.location || "India"}</p>
                </div>
              </div>
              <Link href={`/artist/${art.artist_id}`} className="font-sans text-[0.8rem] text-[#6B1E2E] uppercase tracking-[0.1em] transition-colors flex items-center group shrink-0">
                View Profile <span className="ml-1 transform group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>

            <div className="border border-[#6B1E2E]/[0.09] bg-[#FFFDF7] p-6 mb-8 mt-6">
              <h3 className="font-serif text-[1.4rem] text-[#2C1810] mb-2">{t("artwork.interested")}</h3>
              <p className="font-sans text-[0.85rem] text-[#7A5C4E] mb-6">{t("artwork.interestedDesc")}</p>
              
              <div className="flex flex-col gap-3">
                {/* WhatsApp Order Button */}
                {artist?.whatsapp_number && (
                  <a
                    href={whatsappLink(artist.whatsapp_number, `🎨 *Kalakaar — Artwork Inquiry*\n\nHi!\n\nI saw your artwork "${art.title}" on Kalakaar and I'm interested in ordering it.`) || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackContact(artist?.id, "whatsapp", art.id)}
                    className="w-full flex items-center justify-center gap-3 bg-[#25D366] text-white rounded-lg py-4 text-base font-bold shadow-md hover:opacity-90 active:scale-95 transition-all duration-200"
                  >
                    Order on WhatsApp
                  </a>
                )}
                <ContactGate hasContact={!!artist?.whatsapp_number} loggedIn={!!user} redirectPath={`/artwork/${art.id}`} />
              </div>
              <div className="mt-4 flex justify-end"><ReportButton itemType="artwork" itemId={art.id} ownerId={art.artist_id} /></div>
            </div>

            <div className="flex flex-col gap-1 mb-8 pt-4">
              <span className="font-sans text-[0.8rem] uppercase tracking-wider text-[#9C7A6A]">{t("artwork.price")}</span>
              <div className="flex items-center justify-between">
                <p className="font-sans text-[2rem] text-[#6B1E2E] font-semibold leading-none">
                  ₹{art.price?.toLocaleString('en-IN') || "Price on Request"}
                </p>
                <button
                  onClick={async () => {
                    if (!user) {
                      showNotice("Please log in to save artworks to your wishlist.");
                      router.push('/auth?mode=signin');
                      return;
                    }
                    const res = await toggleWishlist(art.id);
                    if (res.success) {
                      showNotice(res.saved ? "Saved to wishlist!" : "Removed from wishlist.");
                    } else if (res.error) {
                      showNotice(res.error);
                    }
                  }}
                  className="flex items-center gap-2 border border-[#6B1E2E] px-4 py-2 hover:bg-[#6B1E2E] hover:text-[#FFFDF7] text-[#6B1E2E] transition-colors font-sans text-[0.8rem] uppercase tracking-[0.05em] shadow-sm rounded-md"
                >
                  <Star size={16} className={isInWishlist ? "fill-[#E8C99A] text-[#6B1E2E]" : ""} />
                  {isInWishlist ? "Saved in Wishlist" : "Save to Wishlist"}
                </button>
              </div>
            </div>

            <div className="space-y-3 mb-8 font-sans text-[0.9rem] text-[#7A5C4E] bg-[#EDE4CE]/20 p-4 border border-[#6B1E2E]/[0.036]">
              <p className="flex"><span className="text-[#2C1810] font-medium w-28 shrink-0 uppercase tracking-widest text-[0.7rem] mt-0.5">{t("artwork.dimensions")}</span> {art.dimensions || 'N/A'}</p>
              <p className="flex"><span className="text-[#2C1810] font-medium w-28 shrink-0 uppercase tracking-widest text-[0.7rem] mt-0.5">{t("artwork.medium")}</span> {art.medium || 'N/A'}</p>
              <p className="flex"><span className="text-[#2C1810] font-medium w-28 shrink-0 uppercase tracking-widest text-[0.7rem] mt-0.5">{t("artwork.materials")}</span> {art.materials || 'N/A'}</p>
              <p className="flex"><span className="text-[#2C1810] font-medium w-28 shrink-0 uppercase tracking-widest text-[0.7rem] mt-0.5">{t("artwork.year")}</span> {art.creation_year || 'N/A'}</p>
            </div>

            <div className="flex items-center gap-6 pt-2 pb-8">
              <ShareButtons
                title={art.title}
                price={art.price}
                artistName={artist?.full_name}
                url={`${SITE}/artwork/${art.id}`}
                image_urls={art.image_urls}
              />
            </div>

            <div className="pb-8">
              <ShareCardPanel kind="artwork" id={art.id} title={art.title} pageUrl={`${SITE}/artwork/${art.id}`} />
            </div>
            
            <div className="border-t border-[rgba(107,30,46,0.18)] w-full mb-8"></div>
            
            <p className="font-sans text-[0.95rem] text-[#7A5C4E] leading-[1.8] mb-8">
              {art.description || "No description provided."}
            </p>

            {art.tags && art.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {art.tags.map((tag: string) => (
                  <span key={tag} className="font-sans text-[0.7rem] uppercase tracking-widest text-[#6B1E2E] bg-[#6B1E2E]/10 border border-[rgba(107,30,46,0.1)] px-2 py-1 shadow-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* Reviews */}
        {FEATURES.reviews && <Reviews artworkId={art.id} artistId={art.artist_id} />}

        {/* You May Also Like */}
        {recommended.length > 0 && (
          <div className="mt-32 mb-10">
            <div className="flex flex-col items-center text-center mx-auto mb-12">
               <p className="font-sans text-[0.72rem] uppercase tracking-[0.18em] text-[#9C7A6A] mb-3">{t("artwork.collectionLabel")}</p>
               <h2 className="font-serif text-[2.5rem] font-semibold text-[#2C1810] mb-5">{t("artwork.mayLike")}</h2>
               <div className="w-[40px] h-[2px] bg-[#6B1E2E]"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 border-t border-[#6B1E2E]/[0.036] pt-10">
              {recommended.map(rec => (
                <ArtworkCard
                  key={rec.id}
                  id={rec.id}
                  like_count={rec.like_count}
                  artistId={rec.artist_id}
                  title={rec.title}
                  artistName={rec.profiles?.full_name || "Artisan"}
                  price={rec.price || 0}
                  image_urls={rec.image_urls}
                  style={rec.category}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
