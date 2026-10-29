"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { AccessDenied } from "../components/auth/AccessDenied";
import { AdminSidebar, AdminTab } from "../components/admin/AdminSidebar";
import { AdminHeader } from "../components/admin/AdminHeader";
import { QuickActionsModal } from "../components/admin/QuickActionsModal";

// Modular Views
import { AdminDashboardView } from "../components/admin/views/AdminDashboardView";
import { AdminArtistsView } from "../components/admin/views/AdminArtistsView";
import { AdminArtworksView } from "../components/admin/views/AdminArtworksView";
import { AdminCollectionsView } from "../components/admin/views/AdminCollectionsView";
import { AdminStoriesView } from "../components/admin/views/AdminStoriesView";
import { AdminFeaturedView } from "../components/admin/views/AdminFeaturedView";
import { AdminArtistOfTheMonthView } from "../components/admin/views/AdminArtistOfTheMonthView";
import { AdminReportsView } from "../components/admin/views/AdminReportsView";
import { AdminAnalyticsView } from "../components/admin/views/AdminAnalyticsView";
import { AdminBroadcastView } from "../components/admin/views/AdminBroadcastView";
import { AdminSettingsView } from "../components/admin/views/AdminSettingsView";

export function AdminPanel() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [isCollapsedTablet, setIsCollapsedTablet] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/auth?mode=signin&redirect=/kalakaar-admin');
      return;
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5EFE0] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-t-2 border-[#6B1E2E] animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isAdmin = user.role === 'admin' || user.role === 'super_admin';
  if (!isAdmin) {
    return <AccessDenied title="Admin Panel Restricted" requiredRole="Admin" message="The Kalakaar Admin Panel is reserved for system administrators." />;
  }

  return (
    <div className="min-h-screen bg-[#F5EFE0] flex flex-col font-sans selection:bg-[#6B1E2E] selection:text-white">
      {/* Admin Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
        isCollapsedTablet={isCollapsedTablet}
        setIsCollapsedTablet={setIsCollapsedTablet}
      />

      {/* Main Content Area offset by Sidebar width on desktop */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isCollapsedTablet ? "md:ml-20 lg:ml-64" : "lg:ml-64"
        }`}
      >
        {/* Top Header Navigation */}
        <AdminHeader
          onToggleMobileMenu={() => setIsOpenMobile(!isOpenMobile)}
          onToggleTabletCollapse={() => setIsCollapsedTablet(!isCollapsedTablet)}
          onOpenQuickActions={() => setIsQuickActionsOpen(true)}
          setActiveTab={setActiveTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Dashboard Main Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {activeTab === "dashboard" && <AdminDashboardView setActiveTab={setActiveTab} />}
          {activeTab === "artists" && <AdminArtistsView />}
          {activeTab === "artworks" && <AdminArtworksView />}
          {activeTab === "collections" && <AdminCollectionsView />}
          {activeTab === "stories" && <AdminStoriesView />}
          {activeTab === "featured" && <AdminFeaturedView />}
          {activeTab === "artist_of_month" && <AdminArtistOfTheMonthView />}
          {activeTab === "reports" && <AdminReportsView />}
          {activeTab === "analytics" && <AdminAnalyticsView />}
          {activeTab === "broadcast" && <AdminBroadcastView />}
          {activeTab === "settings" && <AdminSettingsView />}
        </main>
      </div>

      {/* Floating Quick Actions Modal */}
      <QuickActionsModal
        isOpen={isQuickActionsOpen}
        onClose={() => setIsQuickActionsOpen(false)}
        setActiveTab={setActiveTab}
      />
    </div>
  );
}
