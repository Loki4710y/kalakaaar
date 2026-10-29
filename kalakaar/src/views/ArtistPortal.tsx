"use client";
import { FEATURES } from "../config/features";
import { LoadMoreButton } from "../components/ui/LoadMoreButton";
import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { AccessDenied } from "../components/auth/AccessDenied";
import Link from "next/link";
import { Users, Eye, Edit2, Trash2, Plus, Heart, Bookmark, MessageSquare } from "lucide-react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { useLanguage } from "../contexts/LanguageContext";
import { AnalyticsPanel } from "../components/artist/AnalyticsPanel";
import { OnboardingChecklist, useOnboardingFlags } from "../components/artist/OnboardingChecklist";
import { EmptyState } from "../components/ui/EmptyState";
import { ShareCardPanel } from "../components/ShareCardPanel";
import { versionOf } from "../lib/shareCard";
import { computeOnboarding } from "../lib/onboarding";
import { SITE_URL } from "../lib/site";

import { ArtworkService } from "../../services/ArtworkService";
import { ProfileService } from "../../services/ProfileService";

import { useRouter } from "next/navigation";

const PAGE_SIZE = 12;

export function ArtistPortal() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const flags = useOnboardingFlags(user?.id);
  const [profileData, setProfileData] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [artworks, setArtworks] = useState<any[]>([]);
  const [totalArtworks, setTotalArtworks] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreFailed, setLoadMoreFailed] = useState(false);
  const [stats, setStats] = useState({
    artworksCount: 0,
    totalViews: 0,
    totalLikes: 0,
    totalSaves: 0,
    followers: 0,
    pendingOrders: 0
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth?mode=signin&redirect=/artist-portal');
      return;
    }
    const isArtist = user.role === 'artist' || user.role === 'admin' || user.role === 'super_admin';
    if (!isArtist) return;

    async function loadArtistPortalData() {
      setLoading(true);
      try {
        // One page of the portfolio (12 rows) plus the totals; more rows load on request.
        const [artRes, statRes, profRes] = await Promise.all([
          ArtworkService.getArtistArtworksPage(user!.id, { includeDrafts: true, page: 1, pageSize: PAGE_SIZE }),
          ArtworkService.getArtworkStatistics(user!.id),
          ProfileService.getProfile(user!.id)
        ]);

        if (artRes.success && artRes.data) {
          setArtworks(artRes.data.items);
          setTotalArtworks(artRes.data.total);
          setPage(1);
          setStats(prev => ({ ...prev, artworksCount: artRes.data!.total }));
        }
        if (statRes.success && statRes.data) {
          const st = statRes.data;
          setStats(prev => ({ ...prev, totalViews: st.total_views, totalLikes: st.total_likes, totalSaves: st.total_wishlists }));
        }

        if (profRes.data) {
          const prof = profRes.data as any;
          setProfileData(prof);
          setStats(prev => ({ ...prev, followers: prof.follower_count || prof.followers_count || 0 }));
        }
      } catch (err) {
        console.error("Error loading artist portal data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadArtistPortalData();
  }, [user, authLoading, router]);

  const toggleSold = async (id: string, is_sold: boolean, visibility: string) => {
    const newStatus = is_sold ? 'sold' : 'published';
    const res = await ArtworkService.updateArtwork(id, { status: newStatus as any });
    if (res.success) {
      setArtworks(prev => prev.map(art => art.id === id ? { ...art, status: newStatus, is_sold, sold_visibility: visibility } : art));
      toast.success(is_sold ? t('portal.markedSold') : t('portal.markedAvailable'));
    } else {
      toast.error(res.error || t('portal.statusFailed'));
    }
  };

  const loadMoreArtworks = async () => {
    if (!user || loadingMore) return;
    setLoadingMore(true);
    setLoadMoreFailed(false);
    const res = await ArtworkService.getArtistArtworksPage(user.id, { includeDrafts: true, page: page + 1, pageSize: PAGE_SIZE });
    if (res.success && res.data) {
      setArtworks(prev => {
        const seen = new Set(prev.map(a => a.id));
        return [...prev, ...res.data!.items.filter(a => !seen.has(a.id))];
      });
      setTotalArtworks(res.data.total);
      setPage(page + 1);
    } else {
      setLoadMoreFailed(true);
    }
    setLoadingMore(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("portal.confirmDelete"))) return;
    const res = await ArtworkService.deleteArtwork(id);
    if (res.success) {
      setArtworks(prev => prev.filter(art => art.id !== id));
      setTotalArtworks(n => Math.max(0, n - 1));
      setStats(prev => ({ ...prev, artworksCount: Math.max(0, prev.artworksCount - 1) }));
      toast.success(t("portal.deleted"));
    } else {
      toast.error(res.error || t('portal.deleteFailed'));
    }
  };

  if (authLoading || loading) {
    return (
       <div className="min-h-screen bg-[#FDFBF7]">
          <div className="pt-24 pb-12 flex justify-center"><div className="w-8 h-8 rounded-full border-t-2 border-[#6B1E2E] animate-spin"></div></div>
       </div>
    );
  }

  if (!user) {
    return null;
  }

  const isArtist = user.role === 'artist' || user.role === 'admin' || user.role === 'super_admin';
  if (!isArtist) {
    return <AccessDenied title={t("portal.restrictedTitle")} requiredRole="Artist or Admin" message={t("portal.restrictedMsg")} />;
  }

  const profileLink = `${SITE_URL}/artist/${profileData?.username || user.id}`;
  const copyProfileLink = async (): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(profileLink);
      flags.markShared();
      return true;
    } catch {
      return false;
    }
  };
  const onboarding = computeOnboarding({
    avatarUrl: profileData?.avatar_url,
    bio: profileData?.bio,
    location: profileData?.location,
    primaryArtStyle: profileData?.primary_art_style,
    whatsapp: profileData?.whatsapp_number,
    instagram: profileData?.instagram_handle || profileData?.instagram_url,
    contactEmail: profileData?.contact_email,
    artworkCount: totalArtworks,
    shared: flags.shared,
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-[rgba(107,30,46,0.18)] pb-8 gap-6">
          <div>
            <h1 className="font-serif text-[2.5rem] md:text-[3.5rem] text-[#2C1810] leading-none mb-2">{t("portal.title")}</h1>
            <p className="font-sans text-[1rem] text-[#7A5C4E]">{t("portal.subtitle")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
             <Link href="/profile" className="px-5 py-2.5 border border-[rgba(107,30,46,0.3)] text-[#6B1E2E] font-sans text-[0.85rem] uppercase tracking-wider font-semibold hover:bg-[rgba(107,30,46,0.05)] transition-colors flex items-center gap-2">
               {t("portal.editProfile")}
             </Link>
{FEATURES.commissions && (
             <Link href="/commissions" className="px-5 py-2.5 border border-[rgba(107,30,46,0.3)] text-[#6B1E2E] font-sans text-[0.85rem] uppercase tracking-wider font-semibold hover:bg-[rgba(107,30,46,0.05)] transition-colors flex items-center gap-2">
               {t("portal.customOrders")}
             </Link>
)}
{FEATURES.notifications && (
             <Link href="/notifications" className="px-5 py-2.5 border border-[rgba(107,30,46,0.3)] text-[#6B1E2E] font-sans text-[0.85rem] uppercase tracking-wider font-semibold hover:bg-[rgba(107,30,46,0.05)] transition-colors flex items-center gap-2">
               {t("portal.notifications")}
             </Link>
)}
             <Link href="/community" className="px-5 py-2.5 border border-[rgba(107,30,46,0.3)] text-[#6B1E2E] font-sans text-[0.85rem] uppercase tracking-wider font-semibold hover:bg-[rgba(107,30,46,0.05)] transition-colors flex items-center gap-2">
               {t("portal.community")}
             </Link>
             <Link href="/artist-portal/bulk" className="px-5 py-2.5 border border-[rgba(107,30,46,0.3)] text-[#6B1E2E] font-sans text-[0.85rem] uppercase tracking-wider font-semibold hover:bg-[rgba(107,30,46,0.05)] transition-colors flex items-center gap-2">
               {t("portal.addMany")}
             </Link>
             <Link href="/artist-portal/upload" className="px-5 py-2.5 bg-[#6B1E2E] text-[#FFFDF7] font-sans text-[0.85rem] uppercase tracking-wider font-semibold hover:bg-[#8A2B3E] transition-colors flex items-center gap-2">
               <Plus size={16} /> {t("portal.upload")}
             </Link>
          </div>
        </div>

        <OnboardingChecklist
          steps={onboarding.steps}
          done={onboarding.done}
          total={onboarding.total}
          complete={onboarding.complete}
          hidden={flags.hidden}
          onHide={() => flags.setHidden(true)}
          onShow={() => flags.setHidden(false)}
          onShare={copyProfileLink}
        />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-16">
          <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-6 flex flex-col justify-center">
             <span className="font-sans text-[0.75rem] uppercase tracking-widest text-[#9C7A6A] mb-2 flex items-center gap-2">
                <Users size={14} /> {t("portal.totalArtworks")}
             </span>
             <span className="font-serif text-[2.5rem] text-[#2C1810] leading-none">{stats.artworksCount}</span>
          </div>
          <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-6 flex flex-col justify-center">
             <span className="font-sans text-[0.75rem] uppercase tracking-widest text-[#9C7A6A] mb-2 flex items-center gap-2">
                <Eye size={14} /> {t("portal.artworkViews")}
             </span>
             <span className="font-serif text-[2.5rem] text-[#2C1810] leading-none">{stats.totalViews}</span>
          </div>
          <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-6 flex flex-col justify-center">
             <span className="font-sans text-[0.75rem] uppercase tracking-widest text-[#9C7A6A] mb-2 flex items-center gap-2">
                <Heart size={14} /> {t("portal.likes")}
             </span>
             <span className="font-serif text-[2.5rem] text-[#2C1810] leading-none">{stats.totalLikes}</span>
          </div>
          <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-6 flex flex-col justify-center">
             <span className="font-sans text-[0.75rem] uppercase tracking-widest text-[#9C7A6A] mb-2 flex items-center gap-2">
                <Bookmark size={14} /> {t("portal.saved")}
             </span>
             <span className="font-serif text-[2.5rem] text-[#2C1810] leading-none">{stats.totalSaves}</span>
          </div>
          <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-6 flex flex-col justify-center">
             <span className="font-sans text-[0.75rem] uppercase tracking-widest text-[#9C7A6A] mb-2 flex items-center gap-2">
                <Users size={14} /> {t("portal.followers")}
             </span>
             <span className="font-serif text-[2.5rem] text-[#2C1810] leading-none">{stats.followers}</span>
          </div>
          {FEATURES.commissions && (
          <Link href="/commissions" className="bg-[#EDE4CE] border border-[rgba(107,30,46,0.18)] p-6 flex flex-col justify-center group hover:bg-[#6B1E2E] transition-colors hover:border-[#6B1E2E] cursor-pointer">
             <span className="font-sans text-[0.75rem] uppercase tracking-widest text-[#6B1E2E] group-hover:text-white/80 mb-2 flex items-center gap-2 transition-colors">
                <MessageSquare size={14} /> Pending Orders
             </span>
             <span className="font-serif text-[2.5rem] text-[#6B1E2E] group-hover:text-white leading-none transition-colors">{stats.pendingOrders}</span>
          </Link>
          )}
        </div>

        <div className="mb-16">
          <ShareCardPanel kind="artist" id={user.id} title={profileData?.display_name || user.name} pageUrl={profileLink} version={versionOf(user.avatar)} />
        </div>

        <AnalyticsPanel profileLink={profileLink} onLinkCopied={flags.markShared} />

        {/* Portfolio */}
        <h2 className="font-serif text-[2rem] text-[#2C1810] mb-6">{t("portal.manage")}</h2>
        {artworks.length === 0 ? (
          <EmptyState type="my_artworks" />
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-[rgba(107,30,46,0.18)]">
                  <th className="py-4 px-4 font-sans text-[0.75rem] uppercase tracking-wider text-[#9C7A6A] font-medium w-24">{t("portal.colImage")}</th>
                  <th className="py-4 px-4 font-sans text-[0.75rem] uppercase tracking-wider text-[#9C7A6A] font-medium">{t("portal.colDetails")}</th>
                  <th className="py-4 px-4 font-sans text-[0.75rem] uppercase tracking-wider text-[#9C7A6A] font-medium">{t("portal.colStatus")}</th>
                  <th className="py-4 px-4 font-sans text-[0.75rem] uppercase tracking-wider text-[#9C7A6A] font-medium">{t("portal.colViews")}</th>
                  <th className="py-4 px-4 font-sans text-[0.75rem] uppercase tracking-wider text-[#9C7A6A] font-medium text-right">{t("portal.colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {artworks.map((art) => (
                  <tr key={art.id} className="border-b border-[rgba(107,30,46,0.08)] bg-[#FFFDF7]">
                    <td className="py-4 px-4">
                      {art.image_urls?.[0] ? (
                        <div className="w-16 h-16 relative bg-[#EDE4CE] border border-[rgba(107,30,46,0.1)]">
                          <Image src={art.image_urls[0]} alt={art.title || "Artwork"} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-[#EDE4CE] border border-[rgba(107,30,46,0.1)] flex items-center justify-center text-xs text-[#9C7A6A]">{t("portal.noImg")}</div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-serif text-[1.1rem] text-[#2C1810] mb-1">{art.title || t('portal.untitled')}</p>
                      <p className="font-sans text-[0.8rem] text-[#7A5C4E]">₹{art.price?.toLocaleString()} • {art.categories?.[0] || t('portal.mixed')}</p>
                    </td>
                    <td className="py-4 px-4">
                      {art.is_sold ? (
                        <div className="flex flex-col gap-1">
                           <span className="px-2 py-1 text-[0.7rem] uppercase tracking-wider font-semibold rounded-full bg-gray-200 text-gray-700 w-fit">
                             {art.sold_visibility === 'hidden' ? t("portal.soldHidden") : t("portal.soldVisible")}
                           </span>
                           <button onClick={() => toggleSold(art.id, false, 'visible')} className="text-[0.7rem] text-[#6B1E2E] hover:underline text-left">
                             {t("portal.markAvailable")}
                           </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                           <span className="px-2 py-1 text-[0.7rem] uppercase tracking-wider font-semibold rounded-full bg-green-100 text-green-700 w-fit">
                             {t("portal.available")}
                           </span>
                           <div className="flex flex-col text-[0.7rem] gap-1 mt-1">
                             <span className="text-[#9C7A6A] font-semibold">{t("portal.markSold")}</span>
                             <button onClick={() => toggleSold(art.id, true, 'visible')} className="text-left text-[#6B1E2E] hover:underline">{t("portal.keepVisible")}</button>
                             <button onClick={() => toggleSold(art.id, true, 'hidden')} className="text-left text-[#6B1E2E] hover:underline">{t("portal.hideFromPublic")}</button>
                           </div>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 font-sans text-[0.9rem] text-[#2C1810]">
                      {art.artwork_views || 0}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-3 text-[#7A5C4E]">
                        <button className="hover:text-[#6B1E2E] transition-colors" title={t("portal.editSoon")}><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(art.id)} className="hover:text-red-600 transition-colors" title={t("portal.delete")}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <LoadMoreButton shown={artworks.length} total={totalArtworks} loading={loadingMore} failed={loadMoreFailed} onClick={loadMoreArtworks} />
      </main>
    </div>
  );
}
