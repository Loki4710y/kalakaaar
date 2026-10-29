"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { GoldButton } from "../components/ui/GoldButton";
import { ProfileService } from "../../services/ProfileService";

export function WelcomeSetup() {
  const router = useRouter();
  const { user } = useAuth();

  const [role, setRole] = useState<"user" | "artist">(user?.role === "artist" ? "artist" : "user");
  const [fullName, setFullName] = useState(user?.name || "");
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || "");
  const [instagram, setInstagram] = useState(user?.instagram || "");
  const [city, setCity] = useState(user?.location || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Admins never go through buyer/artist onboarding.
  useEffect(() => {
    if (user?.role === "admin" || user?.role === "super_admin") router.replace("/kalakaar-admin");
  }, [user?.role, router]);

  useEffect(() => {
    if (user?.name) {
      setFullName(user.name);
    }
  }, [user]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const formattedInstagram = instagram ? (instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram.replace('@', '')}`) : undefined;
      const isArtist = role === "artist";
      
      const res = await ProfileService.updateProfile(user.id, {
        display_name: fullName,
        full_name: fullName,
        role: role,
        is_artist: isArtist,
        location: city,
        bio: bio,
        instagram_url: formattedInstagram,
        whatsapp_number: whatsapp || undefined,
      });

      if (res.error) {
        setErrorMsg(res.error.message || "Failed to update profile");
        setLoading(false);
        return;
      }
      
      router.push(isArtist ? "/artist-portal" : "/explore");
    } catch (err: any) {
      setErrorMsg(err?.message || "Something went wrong while saving profile.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
      <div className="bg-[#FFFDF7] border border-[#6B1E2E]/[0.072] max-w-xl w-full p-8 shadow-sm">
        <h1 className="font-serif text-[2rem] text-[#2C1810] mb-2 text-center">
          Welcome to Kalakaar 🎨
        </h1>
        <p className="text-[#7A5C4E] text-center text-sm mb-6">
          Tell us about yourself to personalize your experience
        </p>

        {errorMsg && (
          <div className="mb-6 p-4 bg-[#FFF5F5] border border-[#E53E3E] text-[#C53030] text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSetup} className="space-y-6">
          <div>
            <label className="block font-sans text-[0.75rem] uppercase tracking-[0.1em] text-[#7A5C4E] mb-3 font-semibold">I am joining as *</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole("user")}
                className={`p-4 border text-center transition-all cursor-pointer ${role === "user" ? "border-[#6B1E2E] bg-[#6B1E2E]/[0.05] text-[#6B1E2E] font-medium shadow-sm" : "border-[#EDE4CE] text-[#7A5C4E] hover:border-[#6B1E2E]/30"}`}
              >
                <div className="text-xl mb-1">🖼️</div>
                <div className="font-serif text-base">Art Collector / Buyer</div>
                <div className="text-xs opacity-75 mt-1 font-sans">Discover & collect original artworks</div>
              </button>
              <button
                type="button"
                onClick={() => setRole("artist")}
                className={`p-4 border text-center transition-all cursor-pointer ${role === "artist" ? "border-[#6B1E2E] bg-[#6B1E2E]/[0.05] text-[#6B1E2E] font-medium shadow-sm" : "border-[#EDE4CE] text-[#7A5C4E] hover:border-[#6B1E2E]/30"}`}
              >
                <div className="text-xl mb-1">🎨</div>
                <div className="font-serif text-base">Creator / Artist</div>
                <div className="text-xs opacity-75 mt-1 font-sans">Showcase & sell your art</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block font-sans text-[0.75rem] uppercase tracking-[0.1em] text-[#7A5C4E] mb-2 font-semibold">Full Name *</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.25)] px-4 py-3 font-sans focus:outline-none focus:border-[#6B1E2E] text-[#2C1810]" />
          </div>

          <div>
            <label className="block font-sans text-[0.75rem] uppercase tracking-[0.1em] text-[#7A5C4E] mb-2 font-semibold">WhatsApp / Phone</label>
            <input type="tel" placeholder="+91 98765 43210" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="w-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.25)] px-4 py-3 font-sans focus:outline-none focus:border-[#6B1E2E] text-[#2C1810]" />
            <p className="text-xs opacity-60 mt-1 text-[#7A5C4E]">Optional: Allows direct communication for orders & inquiries</p>
          </div>

          <div>
            <label className="block font-sans text-[0.75rem] uppercase tracking-[0.1em] text-[#7A5C4E] mb-2 font-semibold">Instagram Handle</label>
            <input type="text" placeholder="@yourhandle" value={instagram} onChange={e => setInstagram(e.target.value.replace('@',''))} className="w-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.25)] px-4 py-3 font-sans focus:outline-none focus:border-[#6B1E2E] text-[#2C1810]" />
          </div>

          <div>
            <label className="block font-sans text-[0.75rem] uppercase tracking-[0.1em] text-[#7A5C4E] mb-2 font-semibold">City / Location</label>
            <input type="text" placeholder="Delhi, Mumbai, Jaipur..." value={city} onChange={e => setCity(e.target.value)} className="w-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.25)] px-4 py-3 font-sans focus:outline-none focus:border-[#6B1E2E] text-[#2C1810]" />
          </div>

          <div>
            <label className="block font-sans text-[0.75rem] uppercase tracking-[0.1em] text-[#7A5C4E] mb-2 font-semibold">Bio / Art Style</label>
            <textarea placeholder="Tell us about your art style or interests..." value={bio} onChange={e => setBio(e.target.value)} rows={3} className="w-full bg-[#FFFDF7] border border-[rgba(107,30,46,0.25)] px-4 py-3 font-sans focus:outline-none focus:border-[#6B1E2E] text-[#2C1810] resize-none" />
          </div>

          <div className="flex flex-col gap-4 pt-4">
            <GoldButton variant="primary" type="submit" disabled={loading} className="w-full py-3 justify-center">
              {loading ? "Saving Profile..." : "Complete Setup & Continue →"}
            </GoldButton>
            
            <button type="button" onClick={() => router.push('/explore')} className="text-[#6B1E2E] text-sm text-center opacity-80 hover:opacity-100 transition-opacity cursor-pointer">
              Skip for now →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

