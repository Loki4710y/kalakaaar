"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Crown, User, Calendar, FileText, Image as ImageIcon } from "lucide-react";
import { AdminService, ArtistOfTheMonth, AdminArtist } from "../../../../services/AdminService";

export function AdminArtistOfTheMonthView() {
  const [, setLoading] = useState(true);
  const [artists, setArtists] = useState<AdminArtist[]>([]);
  const [activeAOTM, setActiveAOTM] = useState<ArtistOfTheMonth | null>(null);

  // Form Fields
  const [selectedArtistId, setSelectedArtistId] = useState("");
  const [month, setMonth] = useState("August");
  const [year, setYear] = useState<number>(2026);
  const [reason, setReason] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [artRes, aotmRes] = await Promise.all([
      AdminService.getArtists(),
      AdminService.getArtistOfTheMonth(),
    ]);

    if (artRes.success && artRes.data) {
      setArtists(artRes.data);
      if (artRes.data.length > 0) {
        setSelectedArtistId(artRes.data[0].id);
      }
    }

    if (aotmRes.success && aotmRes.data) {
      setActiveAOTM(aotmRes.data);
      setSelectedArtistId(aotmRes.data.artist_id);
      setMonth(aotmRes.data.month);
      setYear(aotmRes.data.year);
      setReason(aotmRes.data.reason);
      setBannerUrl(aotmRes.data.banner_url || "");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArtistId) return;

    setSaving(true);
    const res = await AdminService.setArtistOfTheMonth(
      selectedArtistId,
      month,
      year,
      reason,
      bannerUrl
    );

    if (res.success && res.data) {
      setActiveAOTM(res.data);
      setNotice("Active Artist of the Month updated successfully!");
      setTimeout(() => setNotice(null), 3000);
    }
    setSaving(false);
  };


  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(107,30,46,0.18)]">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#2C1810] flex items-center gap-2">
            <Crown className="text-[#DAA520]" size={24} /> Artist of the Month Designation
          </h1>
          <p className="font-sans text-xs text-[#7A5C4E] mt-0.5">
            Select and spotlight ONE active Master Artisan as the featured Artist of the Month.
          </p>
        </div>

        {notice && (
          <div className="px-3 py-1.5 bg-[#6B1E2E] text-white font-sans text-xs font-semibold animate-in fade-in shadow-xs">
            {notice}
          </div>
        )}
      </div>

      {/* Active AOTM Preview Hero Banner */}
      {activeAOTM && (
        <div className="bg-[#2C1810] text-[#FFFDF7] p-6 sm:p-8 border-2 border-[#DAA520] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-[#DAA520] text-[#2C1810] font-sans text-[0.68rem] font-bold uppercase tracking-widest px-4 py-1 flex items-center gap-1 shadow-xs">
            <Crown size={14} /> Active Monthly Spotlight
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-[#DAA520] overflow-hidden shrink-0 shadow-md">
              <Image
                src={activeAOTM.artist_avatar || "/assets/defaults/avatar.svg"}
                alt={activeAOTM.artist_name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            <div className="text-center md:text-left flex-1">
              <span className="font-sans text-xs uppercase tracking-widest text-[#DAA520] font-bold">
                {activeAOTM.month} {activeAOTM.year} Master Artisan
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#FFFDF7] mt-0.5">
                {activeAOTM.artist_name}
              </h2>
              <p className="font-sans text-xs text-[#D8C7B8] italic mt-1">
                Folk Style: {activeAOTM.art_style}
              </p>
              <p className="font-sans text-xs text-[#FFFDF7]/90 mt-3 max-w-2xl leading-relaxed bg-[#3D2218]/80 p-3 border-l-2 border-[#DAA520]">
                &ldquo;{activeAOTM.reason}&rdquo;
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Form */}
      <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-6 sm:p-8 shadow-2xs">
        <h2 className="font-serif text-lg font-bold text-[#2C1810] mb-6 pb-2 border-b border-[rgba(107,30,46,0.12)]">
          Designate New Artist of the Month
        </h2>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Select Artisan */}
            <div>
              <label className="block font-sans text-xs uppercase font-bold text-[#2C1810] mb-2 flex items-center gap-1.5">
                <User size={14} className="text-[#6B1E2E]" /> Select Artisan
              </label>
              <select
                value={selectedArtistId}
                onChange={(e) => setSelectedArtistId(e.target.value)}
                className="w-full bg-[#F5EFE0] border border-[rgba(107,30,46,0.2)] focus:border-[#6B1E2E] focus:outline-none p-2.5 text-xs font-sans text-[#2C1810]"
              >
                {artists.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.full_name} ({a.art_style} • {a.location})
                  </option>
                ))}
              </select>
            </div>

            {/* Month & Year */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-sans text-xs uppercase font-bold text-[#2C1810] mb-2 flex items-center gap-1.5">
                  <Calendar size={14} className="text-[#6B1E2E]" /> Month
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full bg-[#F5EFE0] border border-[rgba(107,30,46,0.2)] focus:border-[#6B1E2E] focus:outline-none p-2.5 text-xs font-sans text-[#2C1810]"
                >
                  {[
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                  ].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-sans text-xs uppercase font-bold text-[#2C1810] mb-2">Year</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full bg-[#F5EFE0] border border-[rgba(107,30,46,0.2)] focus:border-[#6B1E2E] focus:outline-none p-2.5 text-xs font-sans text-[#2C1810]"
                />
              </div>
            </div>
          </div>

          {/* Banner URL */}
          <div>
            <label className="block font-sans text-xs uppercase font-bold text-[#2C1810] mb-2 flex items-center gap-1.5">
              <ImageIcon size={14} className="text-[#6B1E2E]" /> Custom Banner Image URL (Optional)
            </label>
            <input
              type="text"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-[#F5EFE0] border border-[rgba(107,30,46,0.2)] focus:border-[#6B1E2E] focus:outline-none p-2.5 text-xs font-sans text-[#2C1810]"
            />
          </div>

          {/* Reason / Curator's Note */}
          <div>
            <label className="block font-sans text-xs uppercase font-bold text-[#2C1810] mb-2 flex items-center gap-1.5">
              <FileText size={14} className="text-[#6B1E2E]" /> Curator&apos;s Note / Recognition Reason
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this master artisan was selected for this month..."
              className="w-full bg-[#F5EFE0] border border-[rgba(107,30,46,0.2)] focus:border-[#6B1E2E] focus:outline-none p-2.5 text-xs font-sans text-[#2C1810]"
              required
            />
          </div>

          {/* Action */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-[#6B1E2E] hover:bg-[#802437] text-white font-sans text-xs uppercase tracking-wider font-semibold transition-colors flex items-center gap-2 shadow-xs"
            >
              <Crown size={16} className="text-[#DAA520]" />
              {saving ? "Saving Spotlight..." : "Set Artist of the Month"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
