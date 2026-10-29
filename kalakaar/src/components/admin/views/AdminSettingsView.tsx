"use client";
import React, { useEffect, useState } from "react";
import { Settings, Save, AlertTriangle, ShieldCheck } from "lucide-react";
import { AdminService, PlatformSettings } from "../../../../services/AdminService";

export function AdminSettingsView() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<PlatformSettings>({
    hero_headline: "Where Traditional Indian Art Finds Home",
    hero_subheadline: "Directly empower master artisans across Madhubani, Pattachitra, Warli, and Gond folk traditions.",
    max_featured_artworks: 6,
    max_featured_artists: 4,
    maintenance_mode: false,
    platform_announcement: "Welcome to Kalakaar V1 Admin Control Center.",
  });

  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      const res = await AdminService.getSettings();
      if (res.success && res.data) {
        setSettings(res.data);
      }
      setLoading(false);
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await AdminService.updateSettings(settings);
    if (res.success && res.data) {
      setSettings(res.data);
      setNotice("Platform settings saved successfully!");
      setTimeout(() => setNotice(null), 3000);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="py-20 text-center font-serif text-sm text-[#2C1810]">
        Loading platform settings...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(107,30,46,0.18)]">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#2C1810] flex items-center gap-2">
            <Settings className="text-[#6B1E2E]" size={24} /> Platform Configuration & System Controls
          </h1>
          <p className="font-sans text-xs text-[#7A5C4E] mt-0.5">
            Configure homepage hero headlines, featured display limits, maintenance toggles, and global banners.
          </p>
        </div>

        {notice && (
          <div className="px-3 py-1.5 bg-[#6B1E2E] text-white font-sans text-xs font-semibold animate-in fade-in shadow-xs">
            {notice}
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Homepage Content Configuration */}
        <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-6 shadow-2xs space-y-6">
          <h2 className="font-serif text-lg font-bold text-[#2C1810] pb-2 border-b border-[rgba(107,30,46,0.12)]">
            Homepage Hero Section Settings
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block font-sans text-xs uppercase font-bold text-[#2C1810] mb-2">
                Hero Headline
              </label>
              <input
                type="text"
                value={settings.hero_headline}
                onChange={(e) => setSettings({ ...settings, hero_headline: e.target.value })}
                className="w-full bg-[#F5EFE0] border border-[rgba(107,30,46,0.2)] focus:border-[#6B1E2E] focus:outline-none p-2.5 text-xs font-sans text-[#2C1810]"
                required
              />
            </div>

            <div>
              <label className="block font-sans text-xs uppercase font-bold text-[#2C1810] mb-2">
                Hero Subheadline / Mission Statement
              </label>
              <textarea
                rows={3}
                value={settings.hero_subheadline}
                onChange={(e) => setSettings({ ...settings, hero_subheadline: e.target.value })}
                className="w-full bg-[#F5EFE0] border border-[rgba(107,30,46,0.2)] focus:border-[#6B1E2E] focus:outline-none p-2.5 text-xs font-sans text-[#2C1810]"
                required
              />
            </div>
          </div>
        </div>

        {/* Featured Content Limits */}
        <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-6 shadow-2xs space-y-6">
          <h2 className="font-serif text-lg font-bold text-[#2C1810] pb-2 border-b border-[rgba(107,30,46,0.12)]">
            Showcase & Display Limits
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-sans text-xs uppercase font-bold text-[#2C1810] mb-2">
                Max Featured Artworks on Homepage
              </label>
              <input
                type="number"
                value={settings.max_featured_artworks}
                onChange={(e) => setSettings({ ...settings, max_featured_artworks: Number(e.target.value) })}
                className="w-full bg-[#F5EFE0] border border-[rgba(107,30,46,0.2)] focus:border-[#6B1E2E] focus:outline-none p-2.5 text-xs font-sans text-[#2C1810]"
                min={1}
                max={20}
              />
            </div>

            <div>
              <label className="block font-sans text-xs uppercase font-bold text-[#2C1810] mb-2">
                Max Featured Artisans on Homepage
              </label>
              <input
                type="number"
                value={settings.max_featured_artists}
                onChange={(e) => setSettings({ ...settings, max_featured_artists: Number(e.target.value) })}
                className="w-full bg-[#F5EFE0] border border-[rgba(107,30,46,0.2)] focus:border-[#6B1E2E] focus:outline-none p-2.5 text-xs font-sans text-[#2C1810]"
                min={1}
                max={20}
              />
            </div>
          </div>
        </div>

        {/* Maintenance Mode & Safety */}
        <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-6 shadow-2xs space-y-6">
          <h2 className="font-serif text-lg font-bold text-[#2C1810] pb-2 border-b border-[rgba(107,30,46,0.12)] flex items-center justify-between">
            <span>Maintenance Mode & System Banner</span>
            <ShieldCheck size={20} className="text-[#6B1E2E]" />
          </h2>

          <div className="p-4 bg-[#F5EFE0]/60 border border-[rgba(107,30,46,0.18)] flex items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-sm font-bold text-[#2C1810]">System Maintenance Mode</h3>
              <p className="font-sans text-xs text-[#7A5C4E] mt-0.5">
                When enabled, public platform access is paused while admins perform upgrades.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenance_mode}
                onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6B1E2E]" />
            </label>
          </div>

          {settings.maintenance_mode && (
            <div className="p-3 bg-amber-100 border-l-4 border-amber-600 text-amber-900 font-sans text-xs flex items-center gap-2">
              <AlertTriangle size={16} /> Maintenance mode is active! Public visitors will see a scheduled maintenance notice.
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-[#6B1E2E] hover:bg-[#802437] text-white font-sans text-xs uppercase tracking-wider font-semibold transition-colors flex items-center gap-2 shadow-xs"
          >
            <Save size={16} />
            {saving ? "Saving Settings..." : "Save Platform Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
