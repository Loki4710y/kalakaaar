"use client";
import React from "react";
import {
  LayoutDashboard,
  Users,
  Image as ImageIcon,
  Layers,
  BookOpen,
  Sparkles,
  Crown,
  Flag,
  BarChart3,
  Megaphone,
  Settings,
  X,
  ChevronRight
} from "lucide-react";

export type AdminTab =
  | "dashboard"
  | "artists"
  | "artworks"
  | "collections"
  | "stories"
  | "featured"
  | "artist_of_month"
  | "reports"
  | "analytics"
  | "broadcast"
  | "settings";

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  isCollapsedTablet: boolean;
  setIsCollapsedTablet: (collapsed: boolean) => void;
}

const MENU_ITEMS: { id: AdminTab; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "artists", label: "Artists", icon: Users },
  { id: "artworks", label: "Artworks", icon: ImageIcon },
  { id: "collections", label: "Collections", icon: Layers },
  { id: "stories", label: "Stories", icon: BookOpen },
  { id: "featured", label: "Featured Content", icon: Sparkles },
  { id: "artist_of_month", label: "Artist of the Month", icon: Crown },
  { id: "reports", label: "Reports", icon: Flag, badge: "Pending" },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "broadcast", label: "Broadcast", icon: Megaphone },
  { id: "settings", label: "Platform Settings", icon: Settings },
];

export function AdminSidebar({
  activeTab,
  setActiveTab,
  isOpenMobile,
  setIsOpenMobile,
  isCollapsedTablet,
}: AdminSidebarProps) {
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#2C1810] text-[#FFFDF7] border-r border-[#6B1E2E]/30 transition-all duration-300 flex flex-col ${
          isOpenMobile ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsedTablet ? "md:w-20 lg:w-64" : "w-64"}`}
      >
        {/* Header Branding */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[rgba(255,253,247,0.1)] bg-[#23120b]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#6B1E2E] flex items-center justify-center text-[#DAA520] font-serif font-bold text-lg shrink-0 border border-[#DAA520]/40 shadow-xs">
              K
            </div>
            <div className={`transition-opacity duration-200 ${isCollapsedTablet ? "md:hidden lg:block" : "block"}`}>
              <h2 className="font-serif text-sm font-semibold tracking-wide text-[#FFFDF7] leading-none">
                Kalakaar Admin
              </h2>
              <span className="font-sans text-[0.65rem] uppercase tracking-widest text-[#DAA520] font-medium">
                Control Center
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsOpenMobile(false)}
            className="lg:hidden text-[#9C7A6A] hover:text-white p-1"
            title="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Menu Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-[#6B1E2E]/40">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpenMobile(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-none font-sans text-xs uppercase tracking-wider font-medium transition-all group relative ${
                  isActive
                    ? "bg-[#6B1E2E] text-white shadow-xs border-l-4 border-[#DAA520]"
                    : "text-[#D8C7B8] hover:bg-[#3D2218] hover:text-white"
                }`}
                title={item.label}
              >
                <Icon
                  size={18}
                  className={`shrink-0 transition-colors ${
                    isActive ? "text-[#DAA520]" : "text-[#9C7A6A] group-hover:text-[#DAA520]"
                  }`}
                />
                <span className={`truncate flex-1 text-left ${isCollapsedTablet ? "md:hidden lg:block" : "block"}`}>
                  {item.label}
                </span>

                {item.badge && !isCollapsedTablet && (
                  <span className="px-1.5 py-0.5 text-[0.6rem] bg-[#DAA520] text-[#2C1810] font-bold rounded-full uppercase tracking-tighter">
                    {item.badge}
                  </span>
                )}

                {isActive && (
                  <ChevronRight
                    size={14}
                    className={`ml-auto text-[#DAA520] opacity-80 ${isCollapsedTablet ? "md:hidden lg:block" : "block"}`}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Admin Status */}
        <div className="p-3 border-t border-[rgba(255,253,247,0.1)] bg-[#23120b] flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#EDE4CE] text-[#2C1810] flex items-center justify-center font-bold text-xs shrink-0 border border-[#6B1E2E]/30">
            AD
          </div>
          <div className={`min-w-0 flex-1 ${isCollapsedTablet ? "md:hidden lg:block" : "block"}`}>
            <p className="font-serif text-xs font-semibold text-[#FFFDF7] truncate">Super Admin</p>
            <p className="font-sans text-[0.65rem] text-[#9C7A6A] truncate">admin@kalakaar.in</p>
          </div>
        </div>
      </aside>
    </>
  );
}
