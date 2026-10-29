"use client";
import React from "react";
import {
  X,
  Sparkles,
  Crown,
  Megaphone,
  UserCheck,
  ImageIcon,
  Layers,
  BookOpen,
  ArrowRight
} from "lucide-react";
import { AdminTab } from "./AdminSidebar";

interface QuickActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: AdminTab) => void;
}

export function QuickActionsModal({ isOpen, onClose, setActiveTab }: QuickActionsModalProps) {
  if (!isOpen) return null;

  const actions = [
    {
      id: "feature_artwork",
      title: "Feature Artwork",
      desc: "Promote exceptional traditional artwork to the homepage showcase",
      icon: ImageIcon,
      tab: "artworks" as AdminTab,
      badge: "⭐ Featured",
    },
    {
      id: "feature_collection",
      title: "Feature Collection",
      desc: "Highlight curated folk art collections to gallery visitors",
      icon: Layers,
      tab: "collections" as AdminTab,
      badge: "⭐ Featured",
    },
    {
      id: "feature_story",
      title: "Feature Story",
      desc: "Elevate inspiring artisan lore and cultural heritage stories",
      icon: BookOpen,
      tab: "stories" as AdminTab,
      badge: "⭐ Featured",
    },
    {
      id: "artist_of_month",
      title: "Select Artist of the Month",
      desc: "Designate the active Master Artisan for August 2026",
      icon: Crown,
      tab: "artist_of_month" as AdminTab,
      badge: "👑 Crown",
    },
    {
      id: "broadcast",
      title: "Broadcast Announcement",
      desc: "Send platform-wide alerts, exhibition news, or maintenance notices",
      icon: Megaphone,
      tab: "broadcast" as AdminTab,
      badge: "📢 Broadcast",
    },
    {
      id: "feature_artist",
      title: "Feature Artist Profile",
      desc: "Highlight master traditional folk artists on the homepage",
      icon: UserCheck,
      tab: "artists" as AdminTab,
      badge: "🎨 Artist",
    },
  ];

  const handleActionClick = (tab: AdminTab) => {
    setActiveTab(tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#FFFDF7] border-2 border-[#6B1E2E] max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[rgba(107,30,46,0.18)] mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#6B1E2E] text-[#DAA520] flex items-center justify-center font-bold shadow-xs">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#2C1810]">Admin Quick Actions</h2>
              <p className="font-sans text-xs text-[#7A5C4E]">
                Direct shortcuts to curate content, spotlight artisans, and send announcements.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#9C7A6A] hover:text-[#6B1E2E] p-1 transition-colors"
            title="Close Quick Actions"
          >
            <X size={20} />
          </button>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                onClick={() => handleActionClick(act.tab)}
                className="group text-left bg-[#F5EFE0]/60 hover:bg-[#EDE4CE] border border-[rgba(107,30,46,0.18)] hover:border-[#6B1E2E] p-4 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#FFFDF7] text-[#6B1E2E] flex items-center justify-center border border-[rgba(107,30,46,0.2)] group-hover:bg-[#6B1E2E] group-hover:text-[#FFFDF7] transition-colors">
                      <Icon size={16} />
                    </div>
                    <span className="font-sans text-[0.65rem] uppercase tracking-wider text-[#6B1E2E] font-bold bg-[#EDE4CE] px-2 py-0.5 border border-[rgba(107,30,46,0.1)]">
                      {act.badge}
                    </span>
                  </div>
                  <h3 className="font-serif text-sm font-semibold text-[#2C1810] group-hover:text-[#6B1E2E] transition-colors mb-1">
                    {act.title}
                  </h3>
                  <p className="font-sans text-[0.75rem] text-[#7A5C4E] leading-snug">
                    {act.desc}
                  </p>
                </div>

                <div className="mt-4 pt-2 flex items-center justify-end font-sans text-[0.7rem] uppercase tracking-wider font-bold text-[#6B1E2E] group-hover:translate-x-1 transition-transform gap-1">
                  Launch Action <ArrowRight size={12} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[rgba(107,30,46,0.18)] text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#EDE4CE] hover:bg-[#2C1810] hover:text-[#FFFDF7] text-[#2C1810] font-sans text-xs uppercase tracking-wider font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
