"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { ProfileService } from "../../services/ProfileService";
import { GoldButton } from "../components/ui/GoldButton";
import { CheckCircle2, AlertCircle, LogOut, Trash2 } from "lucide-react";
import { AvatarUploader } from "../components/ui/AvatarUploader";
import { refreshPublicPages, saveAvatarEverywhere } from "../lib/profileSync";
import { AccountService } from "../../services/AccountService";

export default function Settings() {
  const router = useRouter();
  const { user, loading: authLoading, logout, resetPassword, refreshUser } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [loading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [profile, setProfile] = useState<any>({
    full_name: user?.name || "",
    bio: user?.bio || "",
    city: user?.location || "",
    avatar_url: user?.avatar || "",
    is_artist: user?.role === 'artist',
    website: user?.website || "",
    social_instagram: user?.instagram || "",
    whatsapp: user?.whatsapp || "",
    artist_bio: user?.bio || "",
  });

  useEffect(() => {
    if (authLoading) return; // the session is still being checked: do not treat that as "signed out"
    if (user === null) {
      router.push("/auth");
    } else if (user) {
      setProfile({
        full_name: user.name || "",
        bio: user.bio || "",
        city: user.location || "",
        avatar_url: user.avatar || "",
        is_artist: user.role === 'artist',
        website: user.website || "",
        social_instagram: user.instagram || "",
        whatsapp: user.whatsapp || "",
        artist_bio: user.bio || "",
      });
    }
  }, [user, authLoading, router]);

  const handleDeleteAccount = async () => {
    if (!user || deleting || deleteText.trim().toUpperCase() !== "DELETE") return;
    setDeleting(true);
    setDeleteError("");
    const res = await AccountService.deleteMyAccount(user.id);
    if (!res.success) {
      setDeleteError(res.error || "Could not delete your account.");
      setDeleting(false);
      return;
    }
    await logout();
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      const res = await resetPassword(user.email);
      if (res?.error) throw res.error;
      setMessage({ type: "success", text: "We have emailed you a link to set a new password." });
    } catch {
      setMessage({ type: "error", text: "Could not send the reset email. Please try again later." });
    }
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  const saveSettings = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const formatUrl = (input?: string, defaultHost?: string) => {
        if (!input || !input.trim()) return undefined;
        let trimmed = input.trim();
        if (trimmed.startsWith('@')) {
          trimmed = (defaultHost || '') + trimmed.slice(1);
        }
        if (!/^https?:\/\//i.test(trimmed)) {
          trimmed = 'https://' + trimmed;
        }
        return trimmed;
      };

      const instagramUrl = formatUrl(profile.social_instagram, 'instagram.com/');
      const websiteUrl = formatUrl(profile.website);

      const { error } = await ProfileService.updateProfile(user.id, {
        display_name: profile.full_name,
        bio: profile.artist_bio || profile.bio,
        location: profile.city,
        avatar_url: profile.avatar_url,
        website_url: websiteUrl,
        instagram_url: instagramUrl,
        whatsapp_number: profile.whatsapp || undefined,
      });

      if (error) {
        setMessage({ type: "error", text: error.message || "Failed to update profile." });
      } else {
        setMessage({ type: "success", text: "Settings saved successfully." });
        await refreshUser();
        void refreshPublicPages();
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred saving settings." });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#6B1E2E]/20 border-t-[#6B1E2E] rounded-full animate-spin mb-4"></div>
          <p className="font-sans text-[0.8rem] uppercase tracking-[0.1em] text-[#7A5C4E]">Loading Settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col">

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 mt-16 max-w-4xl mx-auto w-full">
        <h1 className="font-serif text-[2.5rem] text-[#2C1810] mb-8">Settings</h1>

        {message.text && (
          <div className={`p-4 mb-8 border rounded-none flex items-center gap-3 ${
            message.type === 'success' ? 'bg-[#EDF4ED] border-[#4CAF50]/30 text-[#2E7D32]' : 'bg-[#FDF2F2] border-[#D32F2F]/30 text-[#D32F2F]'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="font-sans text-[0.95rem]">{message.text}</span>
          </div>
        )}

        <div className="space-y-10">
          
          {/* Profile Settings */}
          <section className="bg-[#FFFDF7] border border-[#6B1E2E]/[0.072] p-8 shadow-sm relative">
            <h3 className="font-serif text-[1.5rem] text-[#2C1810] mb-6 pb-4 border-b border-[#6B1E2E]/[0.072]">Profile Settings</h3>
            
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-1/3 flex flex-col items-center border-r border-[#6B1E2E]/[0.072] md:pr-8">
                {user && (
                  <AvatarUploader
                    userId={user.id}
                    value={profile.avatar_url}
                    fallbackLetter={profile.full_name || user.email || "U"}
                    onChange={async (url) => {
                      const res = await saveAvatarEverywhere(user.id, url, refreshUser);
                      if (res.ok) setProfile((prev: any) => ({ ...prev, avatar_url: url }));
                      return res.ok;
                    }}
                    onStatus={(kind, text) => setMessage({ type: kind, text })}
                    disabled={saving}
                  />
                )}
              </div>

              <div className="w-full md:w-2/3 space-y-6">
                <div>
                  <label className="block font-sans text-[0.75rem] uppercase tracking-[0.1em] text-[#7A5C4E] mb-2 font-semibold">Full Name</label>
                  <input type="text" value={profile.full_name} onChange={e => setProfile({...profile, full_name: e.target.value})} className="w-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.25)] rounded-none px-4 py-3 font-sans text-[0.95rem] focus:outline-none focus:border-[#6B1E2E] transition-colors text-[#2C1810]" />
                </div>
                <div>
                  <label className="block font-sans text-[0.75rem] uppercase tracking-[0.1em] text-[#7A5C4E] mb-2 font-semibold">Location / City</label>
                  <input type="text" value={profile.city} onChange={e => setProfile({...profile, city: e.target.value})} className="w-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.25)] rounded-none px-4 py-3 font-sans text-[0.95rem] focus:outline-none focus:border-[#6B1E2E] transition-colors text-[#2C1810]" />
                </div>
                <div>
                  <label className="block font-sans text-[0.75rem] uppercase tracking-[0.1em] text-[#7A5C4E] mb-2 font-semibold">Short Bio</label>
                  <textarea rows={4} value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} className="w-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.25)] rounded-none px-4 py-3 font-sans text-[0.95rem] focus:outline-none focus:border-[#6B1E2E] transition-colors text-[#2C1810] resize-none"></textarea>
                </div>
              </div>
            </div>
          </section>

          {/* Artist Settings (Conditional) */}
          {profile.is_artist && (
            <section className="bg-[#FFFDF7] border border-[#6B1E2E]/[0.072] p-8 shadow-sm">
              <h3 className="font-serif text-[1.5rem] text-[#2C1810] mb-6 pb-4 border-b border-[#6B1E2E]/[0.072]">Artist Profile</h3>
              <div className="space-y-6">
                <div>
                  <label className="block font-sans text-[0.75rem] uppercase tracking-[0.1em] text-[#7A5C4E] mb-2 font-semibold">Artist Bio & Philosophy</label>
                  <textarea rows={6} value={profile.artist_bio} onChange={e => setProfile({...profile, artist_bio: e.target.value})} placeholder="Tell collectors about your artistic journey, inspiration, and techniques..." className="w-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.25)] rounded-none px-4 py-3 font-sans text-[0.95rem] focus:outline-none focus:border-[#6B1E2E] transition-colors text-[#2C1810] resize-none"></textarea>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-sans text-[0.75rem] uppercase tracking-[0.1em] text-[#7A5C4E] mb-2 font-semibold">Portfolio Website</label>
                    <input type="url" placeholder="https://" value={profile.website} onChange={e => setProfile({...profile, website: e.target.value})} className="w-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.25)] rounded-none px-4 py-3 font-sans text-[0.95rem] focus:outline-none focus:border-[#6B1E2E] transition-colors text-[#2C1810]" />
                  </div>
                  <div>
                    <label className="block font-sans text-[0.75rem] uppercase tracking-[0.1em] text-[#7A5C4E] mb-2 font-semibold">WhatsApp Number</label>
                    <div className="flex items-center border border-[#6B1E2E] rounded-lg overflow-hidden">
                      <span className="px-3 py-2 bg-[#6B1E2E] text-[#F5EDD6] text-sm">
                        +91
                      </span>
                      <input
                        type="tel"
                        placeholder="98765 43210"
                        value={profile.whatsapp}
                        onChange={e => setProfile({...profile, whatsapp: e.target.value})}
                        className="flex-1 px-3 py-2 bg-transparent focus:outline-none text-[#2C1810]"
                      />
                    </div>
                    <p className="text-xs opacity-60 mt-1 text-[#7A5C4E]">
                      Art lovers will contact you on this number
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-sans text-[0.75rem] uppercase tracking-[0.1em] text-[#7A5C4E] mb-2 font-semibold">Instagram Handle</label>
                    <div className="flex items-center border border-[#6B1E2E] rounded-lg overflow-hidden">
                      <span className="px-3 py-2 bg-[#6B1E2E] text-[#F5EDD6] text-sm">
                        @
                      </span>
                      <input
                        type="text"
                        placeholder="yourinstagram"
                        value={profile.social_instagram}
                        onChange={e => setProfile({...profile, social_instagram: e.target.value.replace('@','')})}
                        className="flex-1 px-3 py-2 bg-transparent focus:outline-none text-[#2C1810]"
                      />
                    </div>
                    <p className="text-xs opacity-60 mt-1 text-[#7A5C4E]">
                      Optional — for Instagram DMs
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Save Profile Button */}
          <div className="flex justify-end">
            <GoldButton variant="primary" onClick={saveSettings} disabled={saving} className="px-10 py-3">
              {saving ? "Saving Changes..." : "Save Profile"}
            </GoldButton>
          </div>

          {/* Account Settings */}
          <section className="bg-[#FFFDF7] border border-[#6B1E2E]/[0.072] p-8 shadow-sm">
            <h3 className="font-serif text-[1.5rem] text-[#2C1810] mb-6 pb-4 border-b border-[#6B1E2E]/[0.072]">Account Settings</h3>
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-[#6B1E2E]/[0.036]">
                <div>
                  <p className="font-sans text-[0.75rem] uppercase tracking-[0.1em] text-[#9C7A6A] mb-1">Email Address</p>
                  <p className="font-sans font-medium text-[#2C1810]">{user?.email}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-[#6B1E2E]/[0.036]">
                <div>
                  <p className="font-sans text-[0.75rem] uppercase tracking-[0.1em] text-[#9C7A6A] mb-1">Password</p>
                  <p className="font-sans font-medium text-[#2C1810] mt-1 text-xl leading-none tracking-widest">•••••••••</p>
                </div>
                <button onClick={handlePasswordReset} className="font-sans text-[0.75rem] uppercase tracking-wider text-[#6B1E2E] hover:text-[#2C1810] font-semibold mt-2 sm:mt-0 px-4 py-2 border border-[#6B1E2E]">Change Password</button>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-[#6B1E2E]/[0.072]">
              <button 
                onClick={logout}
                className="flex items-center gap-3 px-6 py-3 font-sans text-[0.85rem] uppercase tracking-widest font-semibold text-[#D32F2F] hover:bg-[#D32F2F]/5 transition-colors"
              >
                <LogOut size={16} /> Sign Out of All Devices
              </button>
            </div>

            <div className="mt-8 pt-8 border-t border-[#D32F2F]/20">
              <h4 className="font-serif text-[1.2rem] text-[#D32F2F] mb-2">Delete my account</h4>
              <p className="font-sans text-[0.9rem] text-[#7A5C4E] mb-4 leading-relaxed">
                This permanently deletes your login, profile and everything you posted (artworks, stories, collections, images), along with your likes, saved artworks and follows. It cannot be undone.
              </p>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-2 px-5 py-2.5 border border-[#D32F2F] font-sans text-[0.8rem] uppercase tracking-widest font-semibold text-[#D32F2F] hover:bg-[#D32F2F]/5 transition-colors"
                >
                  <Trash2 size={15} /> Delete my account
                </button>
              ) : (
                <div className="border border-[#D32F2F]/30 bg-[#FDF2F2] p-5 space-y-3 max-w-md">
                  <label htmlFor="delete-confirm" className="block font-sans text-[0.85rem] text-[#2C1810]">
                    Type <strong>DELETE</strong> to confirm.
                  </label>
                  <input
                    id="delete-confirm"
                    value={deleteText}
                    onChange={(e) => setDeleteText(e.target.value)}
                    autoComplete="off"
                    className="w-full border border-[#D32F2F]/40 bg-white px-3 py-2 font-sans text-sm text-[#2C1810] focus:outline-none focus:border-[#D32F2F]"
                  />
                  {deleteError && <p role="alert" className="font-sans text-[0.8rem] text-[#D32F2F]">{deleteError}</p>}
                  <div className="flex gap-3">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleting || deleteText.trim().toUpperCase() !== "DELETE"}
                      className="px-5 py-2 bg-[#D32F2F] text-white font-sans text-[0.8rem] uppercase tracking-widest font-semibold disabled:opacity-50"
                    >
                      {deleting ? "Deleting…" : "Permanently delete"}
                    </button>
                    <button
                      onClick={() => { setConfirmDelete(false); setDeleteText(""); setDeleteError(""); }}
                      disabled={deleting}
                      className="px-5 py-2 border border-[#6B1E2E]/30 font-sans text-[0.8rem] uppercase tracking-widest font-semibold text-[#6B1E2E]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

    </div>
  );
}
