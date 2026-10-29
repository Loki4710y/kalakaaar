"use client";
import { FEATURES } from "../config/features";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { Star } from "lucide-react";
import { ProfileService } from "../../services/ProfileService";
import { notify } from "../lib/notify";
import { useLanguage } from "../contexts/LanguageContext";
import { ART_STYLES } from "../config/artStyles";
import { AvatarUploader } from "../components/ui/AvatarUploader";
import { refreshPublicPages, saveAvatarEverywhere } from "../lib/profileSync";

export function Profile() {
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const isArtist = user?.role === "artist" || user?.role === "admin" || user?.role === "super_admin";
  const [artStyle, setArtStyle] = useState("");
  const [profile, setProfile] = useState<any>(user);
  const [commissions] = useState<any[]>([]);
  const [loading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.name || "",
    bio: user?.bio || "",
    location: user?.location || "",
    whatsapp_number: user?.whatsapp || "",
    instagram_handle: user?.instagram || "",
    avatar_url: user?.avatar || ""
  });

  useEffect(() => {
    if (user) {
      setProfile(user);
      setFormData({
        full_name: user.name || "",
        bio: user.bio || "",
        location: user.location || "",
        whatsapp_number: user.whatsapp || "",
        instagram_handle: user.instagram || "",
        avatar_url: user.avatar || ""
      });
    }
  }, [user]);

  // The art style is not part of the signed-in user object, so read it from the profile once.
  useEffect(() => {
    if (!user?.id || !isArtist) return;
    let cancelled = false;
    ProfileService.getProfile(user.id).then((res) => {
      if (!cancelled && res.data?.primary_art_style) setArtStyle(res.data.primary_art_style);
    });
    return () => { cancelled = true; };
  }, [user?.id, isArtist]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await ProfileService.updateProfile(user.id, {
      display_name: formData.full_name,
      bio: formData.bio,
      location: formData.location,
      avatar_url: formData.avatar_url,
      ...(isArtist && artStyle ? { primary_art_style: artStyle } : {}),
      whatsapp_number: formData.whatsapp_number || undefined,
      instagram_handle: formData.instagram_handle ? `https://instagram.com/${formData.instagram_handle.replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')}` : undefined,
    });
    setSaving(false);
    if (error) { notify.error(error.message || t("profile.saveFailed")); } else { notify.success(t("profile.saved")); await refreshUser(); void refreshPublicPages(); };
  };

  if (loading) {
     return <div className="min-h-screen bg-[#FDFBF7] pt-24"><div className="flex justify-center"><div className="w-8 h-8 rounded-full border-t-2 border-[#6B1E2E] animate-spin"></div></div></div>
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <main className="pt-24 pb-32 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-6 border-b border-[rgba(107,30,46,0.18)] gap-4">
           <h1 className="font-serif text-[2.5rem] text-[#2C1810]">
              My Profile
           </h1>
           <Link
             href="/wishlist"
             className="inline-flex items-center gap-2 px-4 py-2 border border-[#6B1E2E] text-[#6B1E2E] hover:bg-[#6B1E2E] hover:text-[#FFFDF7] transition-colors font-sans text-[0.8rem] uppercase tracking-wider font-semibold"
           >
             <Star size={16} className="fill-[#E8C99A]" /> My Saved Wishlist
           </Link>
         </div>

         <div className="space-y-6">
            <div>
               <label className="block font-sans text-[0.8rem] uppercase tracking-wider text-[#9C7A6A] mb-2">Full Name</label>
               <input 
                 type="text"
                 value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})}
                 className="w-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.25)] px-4 py-3 font-sans focus:outline-none focus:border-[#6B1E2E] text-[#2C1810]"
               />
            </div>
            
            {user && (
              <div className="flex justify-center py-2">
                <AvatarUploader
                  userId={user.id}
                  value={formData.avatar_url}
                  fallbackLetter={formData.full_name || user.email || "U"}
                  onChange={async (url) => {
                    const res = await saveAvatarEverywhere(user.id, url, refreshUser);
                    if (res.ok) setFormData((f) => ({ ...f, avatar_url: url }));
                    return res.ok;
                  }}
                  onStatus={(kind, text) => { if (kind === "success") notify.success(text); }}
                />
              </div>
            )}

            <div>
               <label className="block font-sans text-[0.8rem] uppercase tracking-wider text-[#9C7A6A] mb-2">Location / City</label>
               <input 
                 type="text"
                 value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}
                 className="w-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.25)] px-4 py-3 font-sans focus:outline-none focus:border-[#6B1E2E] text-[#2C1810]"
               />
            </div>

            {isArtist && (
              <div>
                 <label htmlFor="profile-art-style" className="block font-sans text-[0.8rem] uppercase tracking-wider text-[#9C7A6A] mb-2">{t("profile.artStyle")}</label>
                 <select
                   id="profile-art-style"
                   value={artStyle}
                   onChange={e => setArtStyle(e.target.value)}
                   className="w-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.25)] px-4 py-3 font-sans focus:outline-none focus:border-[#6B1E2E] text-[#2C1810]"
                 >
                   <option value="">{t("profile.artStyleSelect")}</option>
                   {ART_STYLES.map(style => <option key={style} value={style}>{style}</option>)}
                   {artStyle && !(ART_STYLES as readonly string[]).includes(artStyle) && <option value={artStyle}>{artStyle}</option>}
                 </select>
              </div>
            )}

            <div>
               <label className="block font-sans text-[0.8rem] uppercase tracking-wider text-[#9C7A6A] mb-2">Bio / About</label>
               <textarea 
                 rows={4}
                 value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})}
                 className="w-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.25)] px-4 py-3 font-sans focus:outline-none focus:border-[#6B1E2E] text-[#2C1810] resize-none"
               />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               <div>
                  <label className="block font-sans text-[0.8rem] uppercase tracking-wider text-[#9C7A6A] mb-2">WhatsApp Number</label>
                  <input 
                    type="text"
                    value={formData.whatsapp_number} onChange={e => setFormData({...formData, whatsapp_number: e.target.value})}
                    className="w-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.25)] px-4 py-3 font-sans focus:outline-none focus:border-[#6B1E2E] text-[#2C1810]"
                  />
               </div>
               <div>
                  <label className="block font-sans text-[0.8rem] uppercase tracking-wider text-[#9C7A6A] mb-2">Instagram Handle</label>
                  <input 
                    type="text"
                    value={formData.instagram_handle} onChange={e => setFormData({...formData, instagram_handle: e.target.value})}
                    className="w-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.25)] px-4 py-3 font-sans focus:outline-none focus:border-[#6B1E2E] text-[#2C1810]"
                  />
               </div>
            </div>

            <button onClick={handleSave} disabled={saving} className="mt-8 px-8 py-3 bg-[#6B1E2E] text-[#FFFDF7] font-sans text-[0.85rem] uppercase tracking-wider font-semibold hover:bg-[#8A2B3E] transition-colors">
               {saving ? 'Saving...' : 'Save Changes'}
            </button>
         </div>

         {FEATURES.commissions && !profile?.is_artist && (
            <div className="mt-16">
               <h2 className="font-serif text-[2rem] text-[#2C1810] mb-6 pb-4 border-b border-[rgba(107,30,46,0.18)]">
                  My Commission Requests
               </h2>
               {commissions.length === 0 ? (
                  <p className="font-sans text-[0.95rem] text-[#7A5C4E]">You haven&apos;t requested any custom artworks yet.</p>
               ) : (
                  <div className="space-y-4">
                     {commissions.map(c => (
                        <div key={c.id} className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-6">
                           <div className="flex justify-between items-start mb-2">
                              <h3 className="font-serif text-[1.2rem] text-[#2C1810]">{c.title}</h3>
                              <span className="font-sans text-[0.7rem] uppercase tracking-wider px-2 py-1 bg-[#EDE4CE] text-[#6B1E2E]">
                                 {c.status || 'Pending'}
                              </span>
                           </div>
                           <p className="font-sans text-[0.85rem] text-[#7A5C4E] mb-1">Artist: {c.profiles?.full_name}</p>
                           <p className="font-sans text-[0.85rem] text-[#7A5C4E] mb-2">Budget: ₹{c.budget?.toLocaleString()}</p>
                           <p className="font-sans text-[0.9rem] text-[#2C1810] line-clamp-2">{c.description}</p>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         )}
      </main>
    </div>
  );
}
