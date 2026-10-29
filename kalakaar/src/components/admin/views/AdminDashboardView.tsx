"use client";
import React, { useEffect, useState } from "react";
import { Users, Image as ImageIcon, Layers, BookOpen, Eye, Heart, Star, UserCheck, TrendingUp, Clock, ArrowUpRight, Sparkles } from "lucide-react";
import {
  AdminService,
  AdminDashboardStats,
  ActivityLogItem,
  AdminArtist,
  AdminArtwork,
  AdminStory
} from "../../../../services/AdminService";
import { getStoryAuthorName } from "../../../lib/storyUtils";
import { AdminTab } from "../AdminSidebar";

interface AdminDashboardViewProps {
  setActiveTab: (tab: AdminTab) => void;
}

export function AdminDashboardView({ setActiveTab }: AdminDashboardViewProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [newestArtists, setNewestArtists] = useState<AdminArtist[]>([]);
  const [newestArtworks, setNewestArtworks] = useState<AdminArtwork[]>([]);
  const [newestStories, setNewestStories] = useState<AdminStory[]>([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await AdminService.getDashboard();
      if (res.success && res.data) {
        setStats(res.data.stats);
        setActivities(res.data.recentActivity);
        setNewestArtists(res.data.newestArtists);
        setNewestArtworks(res.data.newestArtworks);
        setNewestStories(res.data.newestStories);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center font-serif text-lg text-[#2C1810]">
        <div className="w-10 h-10 border-2 border-[#6B1E2E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        Loading Admin Dashboard Metrics...
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", val: stats?.totalUsers, icon: Users, change: "+12% this month", tab: "artists" as AdminTab },
    { label: "Total Artists", val: stats?.totalArtists, icon: UserCheck, change: "+3 new artisans", tab: "artists" as AdminTab },
    { label: "Total Artworks", val: stats?.totalArtworks, icon: ImageIcon, change: "+15 uploads", tab: "artworks" as AdminTab },
    { label: "Total Collections", val: stats?.totalCollections, icon: Layers, change: "+2 curated", tab: "collections" as AdminTab },
    { label: "Total Stories", val: stats?.totalStories, icon: BookOpen, change: "+4 folk lores", tab: "stories" as AdminTab },
    { label: "Total Reviews", val: stats?.totalReviews, icon: Star, change: "4.9 avg rating", tab: "artworks" as AdminTab },
    { label: "Total Likes", val: stats?.totalLikes, icon: Heart, change: "+890 appreciation", tab: "analytics" as AdminTab },
    { label: "Total Views", val: stats?.totalViews, icon: Eye, change: "+18.4k traffic", tab: "analytics" as AdminTab },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-6 sm:p-8 relative overflow-hidden shadow-2xs">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#EDE4CE] text-[#6B1E2E] font-sans text-[0.68rem] uppercase tracking-widest font-bold mb-2">
              <Sparkles size={12} /> Kalakaar V1 Executive Suite
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2C1810]">
              Welcome back, Administrator
            </h1>
            <p className="font-sans text-xs text-[#7A5C4E] mt-1 max-w-2xl leading-relaxed">
              Real-time monitoring of master artisans, heritage artworks, collections, cultural stories, and platform moderation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("analytics")}
              className="px-4 py-2 bg-[#EDE4CE] hover:bg-[#6B1E2E] hover:text-white text-[#2C1810] font-sans text-xs uppercase font-semibold tracking-wider transition-colors"
            >
              View Analytics
            </button>
            <button
              onClick={() => setActiveTab("featured")}
              className="px-4 py-2 bg-[#6B1E2E] hover:bg-[#802437] text-white font-sans text-xs uppercase font-semibold tracking-wider transition-colors"
            >
              Manage Featured
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid (8 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              onClick={() => setActiveTab(c.tab)}
              className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-5 hover:border-[#6B1E2E] cursor-pointer transition-all hover:shadow-sm group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-sans text-[0.68rem] uppercase tracking-wider text-[#9C7A6A] font-bold">
                  {c.label}
                </span>
                <div className="w-8 h-8 bg-[#F5EFE0] text-[#6B1E2E] flex items-center justify-center group-hover:bg-[#6B1E2E] group-hover:text-white transition-colors">
                  <Icon size={16} />
                </div>
              </div>

              <div className="font-serif text-3xl font-bold text-[#2C1810] mb-1">
                {c.val?.toLocaleString("en-IN") || 0}
              </div>

              <div className="flex items-center gap-1 font-sans text-[0.7rem] text-[#6B1E2E] font-medium">
                <TrendingUp size={12} /> {c.change}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Split: Recent Activity + Quick Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Activity Feed & Newest Artworks */}
        <div className="lg:col-span-2 space-y-8">
          {/* Activity Feed */}
          <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-6 shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-[rgba(107,30,46,0.12)] mb-4">
              <h2 className="font-serif text-lg font-bold text-[#2C1810] flex items-center gap-2">
                <Clock size={18} className="text-[#6B1E2E]" /> System Activity Feed
              </h2>
              <span className="font-sans text-[0.68rem] uppercase tracking-wider text-[#9C7A6A] font-semibold">
                Live Updates
              </span>
            </div>

            <div className="space-y-3">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 bg-[#F5EFE0]/50 hover:bg-[#EDE4CE] border-l-3 border-[#6B1E2E] transition-colors flex items-start justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-sans text-[0.65rem] uppercase font-bold text-[#6B1E2E] bg-[#EDE4CE] px-2 py-0.5">
                        {act.type}
                      </span>
                      <h3 className="font-serif text-xs font-semibold text-[#2C1810]">
                        {act.title}
                      </h3>
                    </div>
                    <p className="font-sans text-xs text-[#7A5C4E]">{act.subtitle}</p>
                  </div>
                  <span className="font-sans text-[0.68rem] text-[#9C7A6A] shrink-0">
                    {act.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Newest Artworks Showcase */}
          <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-6 shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-[rgba(107,30,46,0.12)] mb-4">
              <h2 className="font-serif text-lg font-bold text-[#2C1810] flex items-center gap-2">
                <ImageIcon size={18} className="text-[#6B1E2E]" /> Newest Artworks
              </h2>
              <button
                onClick={() => setActiveTab("artworks")}
                className="font-sans text-xs uppercase font-bold text-[#6B1E2E] hover:underline flex items-center gap-1"
              >
                View All Artworks <ArrowUpRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {newestArtworks.map((art) => (
                <div
                  key={art.id}
                  className="p-3 bg-[#F5EFE0]/40 border border-[rgba(107,30,46,0.1)] flex items-center gap-3 hover:bg-[#EDE4CE] transition-colors"
                >
                  <div className="w-12 h-12 bg-[#EDE4CE] shrink-0 border border-[#6B1E2E]/20 flex items-center justify-center font-bold text-xs text-[#6B1E2E]">
                    ART
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-xs font-semibold text-[#2C1810] truncate">
                      {art.title}
                    </p>
                    <p className="font-sans text-[0.7rem] text-[#7A5C4E] truncate">
                      {art.artist_name} • {art.category}
                    </p>
                    <p className="font-sans text-[0.68rem] font-bold text-[#6B1E2E] mt-0.5">
                      ₹{art.price.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Newest Artists & Stories */}
        <div className="space-y-8">
          {/* Newest Master Artisans */}
          <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-6 shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-[rgba(107,30,46,0.12)] mb-4">
              <h2 className="font-serif text-base font-bold text-[#2C1810] flex items-center gap-2">
                <Users size={18} className="text-[#6B1E2E]" /> New Artisans
              </h2>
              <button
                onClick={() => setActiveTab("artists")}
                className="font-sans text-[0.7rem] uppercase font-bold text-[#6B1E2E] hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {newestArtists.map((artist) => (
                <div
                  key={artist.id}
                  className="p-2.5 bg-[#F5EFE0]/50 border border-[rgba(107,30,46,0.1)] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-xs font-semibold text-[#2C1810] truncate">
                      {artist.full_name}
                    </p>
                    <p className="font-sans text-[0.68rem] text-[#7A5C4E] truncate">
                      {artist.art_style} • {artist.location}
                    </p>
                  </div>
                  <span className="font-sans text-[0.65rem] uppercase font-bold px-2 py-0.5 bg-[#EDE4CE] text-[#6B1E2E]">
                    {artist.followers_count} Followers
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Newest Folk Stories */}
          <div className="bg-[#FFFDF7] border border-[rgba(107,30,46,0.18)] p-6 shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-[rgba(107,30,46,0.12)] mb-4">
              <h2 className="font-serif text-base font-bold text-[#2C1810] flex items-center gap-2">
                <BookOpen size={18} className="text-[#6B1E2E]" /> Newest Stories
              </h2>
              <button
                onClick={() => setActiveTab("stories")}
                className="font-sans text-[0.7rem] uppercase font-bold text-[#6B1E2E] hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {newestStories.map((story) => (
                <div
                  key={story.id}
                  className="p-2.5 bg-[#F5EFE0]/50 border border-[rgba(107,30,46,0.1)] space-y-1"
                >
                  <p className="font-serif text-xs font-semibold text-[#2C1810] line-clamp-1">
                    {story.title}
                  </p>
                  <p className="font-sans text-[0.68rem] text-[#7A5C4E]">
                    By {getStoryAuthorName(story)} • {story.read_time}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
