"use client";
import React, { useState } from "react";
import { Menu, Search, Bell, Sparkles, ChevronDown, X, ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AdminTab } from "./AdminSidebar";

interface AdminHeaderProps {
  onToggleMobileMenu: () => void;
  onToggleTabletCollapse: () => void;
  onOpenQuickActions: () => void;
  setActiveTab: (tab: AdminTab) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export function AdminHeader({
  onToggleMobileMenu,
  onOpenQuickActions,
  setActiveTab,
  searchQuery,
  setSearchQuery,
}: AdminHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const mockNotifications: { id: string; title: string; text: string; time: string }[] = [];

  return (
    <header className="sticky top-0 z-30 bg-[#FFFDF7] border-b border-[rgba(107,30,46,0.18)] shadow-2xs h-16 flex items-center justify-between px-4 sm:px-6">
      {/* Left side: Hamburger + Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden text-[#2C1810] hover:text-[#6B1E2E] p-2 hover:bg-[#F5EFE0] transition-colors"
          title="Toggle Menu"
        >
          <Menu size={20} />
        </button>

        {/* Global Admin Search Bar */}
        <div className="relative w-full max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A5C4E]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search artists, artworks, stories, collections..."
            className="w-full bg-[#F5EFE0] border border-[rgba(107,30,46,0.18)] focus:border-[#6B1E2E] focus:bg-[#FFFDF7] focus:outline-none pl-9 pr-8 py-1.5 text-xs font-sans text-[#2C1810] placeholder-[#9C7A6A] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9C7A6A] hover:text-[#6B1E2E] p-0.5"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Right side: Quick Actions + Notifications + Profile */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Quick Actions Button */}
        <button
          onClick={onOpenQuickActions}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#6B1E2E] hover:bg-[#802437] text-white font-sans text-xs uppercase tracking-wider font-semibold transition-colors shadow-xs"
        >
          <Sparkles size={14} className="text-[#DAA520]" />
          <span className="hidden sm:inline">Quick Actions</span>
        </button>

        {/* Public Site Link */}
        <Link
          href="/"
          target="_blank"
          className="hidden md:flex items-center gap-1 px-2.5 py-1.5 bg-[#EDE4CE]/60 hover:bg-[#EDE4CE] text-[#2C1810] font-sans text-xs uppercase tracking-wider font-medium border border-[rgba(107,30,46,0.15)] transition-colors"
          title="View Public Kalakaar Site"
        >
          View Site <ExternalLink size={12} />
        </Link>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative p-2 text-[#2C1810] hover:text-[#6B1E2E] hover:bg-[#F5EFE0] transition-colors"
            title="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#6B1E2E] rounded-full ring-2 ring-[#FFFDF7]" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#FFFDF7] border border-[rgba(107,30,46,0.2)] shadow-xl z-50 p-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(107,30,46,0.1)] mb-3">
                <h3 className="font-serif text-sm font-semibold text-[#2C1810]">System Notifications</h3>
                <span className="text-[0.65rem] font-sans uppercase font-bold text-[#6B1E2E] bg-[#EDE4CE] px-2 py-0.5">
                  3 New
                </span>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {mockNotifications.map((n) => (
                  <div key={n.id} className="p-2.5 bg-[#F5EFE0]/60 hover:bg-[#EDE4CE] transition-colors border-l-2 border-[#6B1E2E]">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-sans text-xs font-semibold text-[#2C1810]">{n.title}</p>
                      <span className="font-sans text-[0.65rem] text-[#9C7A6A]">{n.time}</span>
                    </div>
                    <p className="font-sans text-[0.72rem] text-[#7A5C4E] leading-tight">{n.text}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setActiveTab("reports");
                  setShowNotifications(false);
                }}
                className="w-full mt-3 pt-2 text-center font-sans text-xs uppercase tracking-wider font-bold text-[#6B1E2E] border-t border-[rgba(107,30,46,0.1)] hover:underline block"
              >
                Go to Moderation Reports
              </button>
            </div>
          )}
        </div>

        {/* Admin Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1.5 hover:bg-[#F5EFE0] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#2C1810] text-[#DAA520] font-bold text-xs flex items-center justify-center border border-[#6B1E2E]/30">
              <ShieldCheck size={16} />
            </div>
            <div className="hidden sm:block text-left">
              <p className="font-serif text-xs font-semibold text-[#2C1810] leading-none">Admin Control</p>
              <p className="font-sans text-[0.65rem] text-[#9C7A6A] leading-none mt-0.5">Super Admin</p>
            </div>
            <ChevronDown size={14} className="text-[#7A5C4E]" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-[#FFFDF7] border border-[rgba(107,30,46,0.2)] shadow-xl z-50 p-2 animate-in fade-in slide-in-from-top-2">
              <div className="p-2 border-b border-[rgba(107,30,46,0.1)] mb-1">
                <p className="font-serif text-xs font-bold text-[#2C1810]">Kalakaar Admin</p>
                <p className="font-sans text-[0.7rem] text-[#9C7A6A]">admin@kalakaar.in</p>
              </div>

              <button
                onClick={() => {
                  setActiveTab("settings");
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs font-sans text-[#2C1810] hover:bg-[#F5EFE0] transition-colors block"
              >
                Platform Settings
              </button>
              <button
                onClick={() => {
                  setActiveTab("broadcast");
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs font-sans text-[#2C1810] hover:bg-[#F5EFE0] transition-colors block"
              >
                Broadcast Announcement
              </button>
              <Link
                href="/"
                className="w-full text-left px-3 py-2 text-xs font-sans text-[#6B1E2E] hover:bg-[#F5EFE0] font-semibold transition-colors block border-t border-[rgba(107,30,46,0.1)] mt-1"
              >
                Exit Admin Panel
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
