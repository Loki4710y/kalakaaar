"use client";
import React, { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Image as ImageIcon, Layers, BookOpen, Award, Sparkles, Zap } from "lucide-react";
import { AdminService, AnalyticsData } from "../../../../services/AdminService";

export function AdminAnalyticsView() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await AdminService.getAnalytics();
      if (res.success && res.data) {
        setAnalytics(res.data);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading || !analytics) {
    return (
      <div className="py-20 text-center font-serif text-sm text-[#2C1810]">
        Loading analytics engine...
      </div>
    );
  }

  const widgets = [
    {
      title: "Top Master Artisan",
      label: analytics.topArtist.name,
      sub: `${analytics.topArtist.views.toLocaleString()} Views • ${analytics.topArtist.sales} Sales`,
      icon: Award,
      badge: analytics.topArtist.style,
    },
    {
      title: "Top Artwork",
      label: analytics.topArtwork.title,
      sub: `By ${analytics.topArtwork.artist} • ${analytics.topArtwork.views.toLocaleString()} Views`,
      icon: ImageIcon,
      badge: `${analytics.topArtwork.likes} Likes`,
    },
    {
      title: "Top Collection",
      label: analytics.topCollection.title,
      sub: `${analytics.topCollection.views.toLocaleString()} Views • ${analytics.topCollection.count} Masterpieces`,
      icon: Layers,
      badge: "Curated",
    },
    {
      title: "Top Folk Story",
      label: analytics.topStory.title,
      sub: `${analytics.topStory.views.toLocaleString()} Readers • ${analytics.topStory.readTime}`,
      icon: BookOpen,
      badge: "Viral Lore",
    },
    {
      title: "Most Viewed Style",
      label: analytics.mostViewedCategory.name,
      sub: `${analytics.mostViewedCategory.count.toLocaleString()} Total Impressions`,
      icon: Sparkles,
      badge: "High Demand",
    },
    {
      title: "Most Active Artisan",
      label: analytics.mostActiveArtist.name,
      sub: `${analytics.mostActiveArtist.uploads} Masterwork Uploads`,
      icon: Zap,
      badge: "Top Contributor",
    },
  ];

  const maxUpload = Math.max(...analytics.charts.uploads.map((c) => c.count));
  const maxView = Math.max(...analytics.charts.views.map((c) => c.count));
  const maxUser = Math.max(...analytics.charts.newUsers.map((c) => c.count));

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="pb-4 border-b border-[rgba(107,30,46,0.18)]">
        <h1 className="font-serif text-2xl font-bold text-[#2C1810] flex items-center gap-2">
          <BarChart3 className="text-[#6B1E2E]" size={24} /> Kalakaar Platform Analytics & Insights
        </h1>
        <p className="font-sans text-xs text-[#7A5C4E] mt-0.5">
          Real-time performance metrics across traditional art styles, artisan growth, traffic trends, and uploads.
        </p>
      </div>

      {/* 6 Top Key Performance Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {widgets.map((w, i) => {
          const Icon = w.icon;
          return (
            <div
              key={i}
              className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-5 relative overflow-hidden shadow-2xs hover:border-[#6B1E2E] transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="w-8 h-8 bg-[#F5EFE0] text-[#6B1E2E] flex items-center justify-center font-bold">
                  <Icon size={16} />
                </div>
                <span className="font-sans text-[0.65rem] uppercase tracking-wider font-bold bg-[#EDE4CE] text-[#6B1E2E] px-2 py-0.5">
                  {w.badge}
                </span>
              </div>

              <span className="font-sans text-[0.68rem] uppercase font-bold text-[#9C7A6A] block">
                {w.title}
              </span>
              <h3 className="font-serif text-base font-bold text-[#2C1810] mt-0.5 truncate">
                {w.label}
              </h3>
              <p className="font-sans text-xs text-[#7A5C4E] mt-1">{w.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Uploads Trend Bar Chart */}
        <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-6 shadow-2xs">
          <div className="flex justify-between items-center mb-6 pb-2 border-b border-[rgba(107,30,46,0.12)]">
            <div>
              <h3 className="font-serif text-base font-bold text-[#2C1810]">Artworks Uploaded (2026)</h3>
              <p className="font-sans text-xs text-[#7A5C4E]">Monthly artisan submissions</p>
            </div>
            <span className="font-sans text-xs font-bold text-[#6B1E2E] flex items-center gap-1">
              <TrendingUp size={14} /> +42% growth
            </span>
          </div>

          <div className="h-48 flex items-end justify-between gap-2 pt-4">
            {analytics.charts.uploads.map((u, i) => {
              const heightPct = (u.count / maxUpload) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="font-sans text-[0.65rem] text-[#6B1E2E] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    {u.count}
                  </div>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full bg-[#6B1E2E] hover:bg-[#802437] transition-all relative"
                  />
                  <span className="font-sans text-[0.68rem] text-[#7A5C4E] font-semibold">{u.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Traffic Views Trend Bar Chart */}
        <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-6 shadow-2xs">
          <div className="flex justify-between items-center mb-6 pb-2 border-b border-[rgba(107,30,46,0.12)]">
            <div>
              <h3 className="font-serif text-base font-bold text-[#2C1810]">Platform Page Views</h3>
              <p className="font-sans text-xs text-[#7A5C4E]">Total impressions & gallery visits</p>
            </div>
            <span className="font-sans text-xs font-bold text-[#6B1E2E] flex items-center gap-1">
              <TrendingUp size={14} /> 38.2k Total
            </span>
          </div>

          <div className="h-48 flex items-end justify-between gap-2 pt-4">
            {analytics.charts.views.map((v, i) => {
              const heightPct = (v.count / maxView) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="font-sans text-[0.65rem] text-[#DAA520] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    {(v.count / 1000).toFixed(1)}k
                  </div>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full bg-[#2C1810] hover:bg-[#3D2218] transition-all relative border-t-2 border-[#DAA520]"
                  />
                  <span className="font-sans text-[0.68rem] text-[#7A5C4E] font-semibold">{v.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* New Users Growth */}
        <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-6 shadow-2xs">
          <div className="flex justify-between items-center mb-6 pb-2 border-b border-[rgba(107,30,46,0.12)]">
            <div>
              <h3 className="font-serif text-base font-bold text-[#2C1810]">User & Patron Onboarding</h3>
              <p className="font-sans text-xs text-[#7A5C4E]">New registered accounts per month</p>
            </div>
            <span className="font-sans text-xs font-bold text-[#6B1E2E]">580 in July</span>
          </div>

          <div className="h-48 flex items-end justify-between gap-2 pt-4">
            {analytics.charts.newUsers.map((nu, i) => {
              const heightPct = (nu.count / maxUser) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="font-sans text-[0.65rem] text-[#6B1E2E] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    {nu.count}
                  </div>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full bg-[#EDE4CE] group-hover:bg-[#6B1E2E] group-hover:text-white transition-all"
                  />
                  <span className="font-sans text-[0.68rem] text-[#7A5C4E] font-semibold">{nu.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quarterly Growth Summary */}
        <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="font-serif text-base font-bold text-[#2C1810] mb-1">Quarterly Platform Velocity</h3>
            <p className="font-sans text-xs text-[#7A5C4E] mb-6">Aggregate growth trajectory across all traditional folk categories.</p>

            <div className="space-y-4">
              {analytics.charts.growth.map((g, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between font-sans text-xs font-bold text-[#2C1810]">
                    <span>{g.label} 2026 Target Rate</span>
                    <span className="text-[#6B1E2E]">{g.rate}%</span>
                  </div>
                  <div className="w-full h-3 bg-[#F5EFE0] overflow-hidden">
                    <div
                      style={{ width: `${g.rate}%` }}
                      className="h-full bg-[#6B1E2E]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
