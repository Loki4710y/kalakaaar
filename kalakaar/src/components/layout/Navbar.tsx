"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User as UserIcon, LayoutDashboard, Settings, LogOut, Heart, Bell, Check, ArrowRight, Upload, Shield, Menu, X } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useStore } from "../../contexts/StoreContext";
import { GlobalSearchBar } from "./GlobalSearchBar";
import Image from "next/image";

import { FEATURES } from "../../config/features";
import { BrandLogo } from "../ui/BrandLogo";
import { LanguageToggle } from "../ui/LanguageToggle";
import { useLanguage } from "../../contexts/LanguageContext";

export function Navbar() {
  const { user: currentUserContext, logout } = useAuth();
  const { t } = useLanguage();
  const { wishlist, notifications, unreadCount, markNotificationAsRead, markAllNotificationsAsRead } = useStore();
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentUser = useMemo(() => currentUserContext ? {
    id: currentUserContext.id,
    full_name: currentUserContext.name,
    email: currentUserContext.email,
    avatar_url: currentUserContext.avatar,
    role: currentUserContext.role,
    is_artist: currentUserContext.role === 'artist' || currentUserContext.role === 'admin' || currentUserContext.role === 'super_admin',
  } : null, [currentUserContext]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    logout();
    setDropdownOpen(false);
    setNotifDropdownOpen(false);
    router.push("/");
  };

  const handleNotificationClick = async (id: string, referenceId?: string, type?: string) => {
    await markNotificationAsRead(id);
    setNotifDropdownOpen(false);

    if (type === "featured_artwork" || type === "artwork_liked" || type === "artwork_saved") {
      if (referenceId) router.push(`/artwork/${referenceId}`);
      else router.push("/explore");
    } else if (type === "story_published" || type === "featured_story") {
      if (referenceId) router.push(`/stories/${referenceId}`);
      else router.push("/stories");
    } else if (type === "collection_published" || type === "featured_collection") {
      if (referenceId) router.push(`/collections/${referenceId}`);
      else router.push("/explore");
    } else if (type === "new_follower" || type === "new_review") {
      router.push("/profile");
    } else {
      router.push("/notifications");
    }
  };

  const latestNotifications = notifications.slice(0, 5);

  return (
    <header className="sticky top-0 z-50 w-full border-b-[1.5px] border-primary-border bg-background py-4 px-5 sm:px-8 lg:px-10">
      <nav aria-label="Main Navigation" className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4">
        <BrandLogo variant="navbar" />
        <div className="hidden lg:flex items-center gap-[1.5rem]">
          <Link href="/explore" className="font-sans text-[0.78rem] uppercase tracking-[0.08em] text-[#7A5C4E] hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1E2E] transition-all duration-250 ease-in-out flex items-center shrink-0">
            {t("nav.explore")}
          </Link>
          <Link href="/stories" className="font-sans text-[0.78rem] uppercase tracking-[0.08em] text-[#7A5C4E] hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1E2E] transition-all duration-250 ease-in-out flex items-center shrink-0">
            {t("nav.stories")}
          </Link>
          <Link href="/artists" className="font-sans text-[0.78rem] uppercase tracking-[0.08em] text-[#7A5C4E] hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1E2E] transition-all duration-250 ease-in-out flex items-center shrink-0">
            {t("nav.artists")}
          </Link>
          <Link href="/community" className="font-sans text-[0.78rem] uppercase tracking-[0.08em] text-[#7A5C4E] hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1E2E] transition-all duration-250 ease-in-out flex items-center shrink-0">
            {t("nav.community")}
          </Link>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md mx-2 lg:mx-6 hidden md:block">
          <GlobalSearchBar />
        </div>
        <div className="flex items-center space-x-3 sm:space-x-6">
          <LanguageToggle />
          {!currentUser ? (
            <>
              <Link href="/auth?mode=signin"
                className="font-sans text-[0.78rem] uppercase tracking-[0.08em] text-[#7A5C4E] hover:text-primary transition-all duration-250 ease-in-out hidden sm:block"
              >
                {t("nav.signIn")}
              </Link>
              <Link href="/auth?role=artist"
                className="px-[1rem] sm:px-[1.2rem] py-[0.4rem] sm:py-[0.45rem] font-sans text-[0.75rem] sm:text-[0.82rem] uppercase tracking-[0.08em] border-[1.5px] border-primary text-primary hover:bg-primary hover:text-surface transition-all duration-250 ease-in-out rounded-none"
              >
                {t("nav.artistPortal")}
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3 sm:gap-5 relative" ref={dropdownRef}>
               
               {/* Notification Bell Dropdown */}
               {FEATURES.notifications && (
               <div className="relative" ref={notifDropdownRef}>
                 <button 
                   type="button"
                   onClick={() => {
                     setNotifDropdownOpen(!notifDropdownOpen);
                     setDropdownOpen(false);
                   }}
                   className="relative text-[#7A5C4E] hover:text-primary transition-colors flex items-center p-1 focus:outline-none" 
                   title={t("nav.notifications")}
                 >
                   <Bell size={20} />
                   {unreadCount > 0 && (
                     <span className="absolute -top-1 -right-1.5 bg-[#6B1E2E] text-white text-[0.62rem] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center border border-surface shadow-xs">
                       {unreadCount}
                     </span>
                   )}
                 </button>

                 {/* Dropdown Preview */}
                 {notifDropdownOpen && (
                   <div className="absolute right-0 top-12 w-72 sm:w-96 bg-surface border border-primary-border shadow-xl z-50 rounded-none overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                     <div className="px-4 py-3 border-b border-primary-border/40 bg-[#EDE4CE]/50 flex justify-between items-center">
                       <div className="flex items-center gap-2">
                         <span className="font-serif text-sm font-semibold text-[#2C1810]">{t("nav.notifications")}</span>
                         {unreadCount > 0 && (
                           <span className="bg-[#6B1E2E] text-white text-[0.65rem] font-medium px-2 py-0.5 rounded-full">
                             {t("nav.newCount", { n: unreadCount })}
                           </span>
                         )}
                       </div>
                       {unreadCount > 0 && (
                         <button 
                           onClick={markAllNotificationsAsRead}
                           className="font-sans text-[0.7rem] uppercase text-[#6B1E2E] hover:underline flex items-center gap-1 font-medium"
                         >
                           <Check size={12} /> {t("nav.markRead")}
                         </button>
                       )}
                     </div>

                     <div className="max-h-80 overflow-y-auto divide-y divide-primary-border/20">
                       {latestNotifications.length === 0 ? (
                         <div className="p-6 text-center text-text-muted font-sans text-xs">
                           {t("nav.noNotifications")}
                         </div>
                       ) : (
                         latestNotifications.map((notif) => (
                           <div
                             key={notif.id}
                             onClick={() => handleNotificationClick(notif.id, notif.reference_id, notif.type)}
                             className={`p-3.5 cursor-pointer hover:bg-[#F5EFE0] transition-colors flex items-start gap-3 ${
                               !notif.is_read ? "bg-[#FFFDF7]" : "bg-surface/50 opacity-80"
                             }`}
                           >
                             <div className="mt-1 shrink-0">
                               {!notif.is_read ? (
                                 <div className="w-2 h-2 rounded-full bg-[#6B1E2E]" />
                               ) : (
                                 <div className="w-2 h-2 rounded-full bg-[#7A5C4E]/30" />
                               )}
                             </div>
                             <div className="flex-1 min-w-0">
                               <h4
                                 className={`font-sans text-[0.82rem] leading-snug truncate ${
                                   !notif.is_read ? "font-bold text-[#6B1E2E]" : "font-medium text-[#2C1810]"
                                 }`}
                               >
                                 {notif.title}
                               </h4>
                               <p className="font-sans text-[0.78rem] text-[#7A5C4E] line-clamp-2 mt-0.5 leading-tight">
                                 {notif.message}
                               </p>
                               <span className="font-sans text-[0.65rem] text-[#9C7A6A] uppercase tracking-wider block mt-1">
                                 {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                               </span>
                             </div>
                           </div>
                         ))
                       )}
                     </div>

                     <div className="p-2.5 bg-[#EDE4CE]/30 border-t border-primary-border/40 text-center">
                       <Link
                         href="/notifications"
                         onClick={() => setNotifDropdownOpen(false)}
                         className="inline-flex items-center gap-1.5 font-sans text-[0.75rem] uppercase tracking-wider text-[#6B1E2E] font-semibold hover:underline"
                       >
                         {t("nav.viewAllNotifications")} <ArrowRight size={13} />
                       </Link>
                     </div>
                   </div>
                 )}
               </div>
               )}

               <div className="w-px h-6 bg-primary-border/60 mx-1 sm:mx-3"></div>
               
               <Link href="/wishlist" className="relative text-[#7A5C4E] hover:text-primary transition-colors flex items-center" title={t("nav.savedArtworks")}>
                  <Heart size={20} />
                  {wishlist.length > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-primary text-surface text-[0.6rem] font-bold rounded-full w-[15px] h-[15px] flex items-center justify-center">
                      {wishlist.length}
                    </span>
                  )}
               </Link>

               <div className="w-px h-6 bg-primary-border/60 mx-1 sm:mx-2"></div>
               
                <button 
                 onClick={() => setDropdownOpen(!dropdownOpen)}
                 className="w-9 h-9 rounded-full bg-primary-pale border border-primary/30 flex items-center justify-center font-serif text-primary hover:border-primary transition-colors focus:outline-none ml-1 overflow-hidden relative shrink-0"
               >
                 {currentUser.avatar_url ? (
                   <Image src={currentUser.avatar_url} alt="Profile" fill className="object-cover" referrerPolicy="no-referrer" sizes="36px" />
                 ) : (
                   <span className="font-bold text-lg">{(currentUser.full_name || 'U').charAt(0).toUpperCase()}</span>
                 )}
               </button>

               {dropdownOpen && (
                 <div className="absolute right-0 top-14 w-60 bg-surface border border-primary-border shadow-xl z-50 animate-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-primary-border/40 bg-[#EDE4CE]/40 flex items-center gap-3">
                       <div className="w-9 h-9 rounded-full bg-primary-pale border border-primary/30 shrink-0 overflow-hidden relative">
                         {currentUser.avatar_url ? (
                           <Image src={currentUser.avatar_url} alt="Profile" fill className="object-cover" referrerPolicy="no-referrer" sizes="36px" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center font-serif text-primary font-bold text-base">
                             {(currentUser.full_name || 'U').charAt(0).toUpperCase()}
                           </div>
                         )}
                       </div>
                       <div className="min-w-0 flex-1">
                          <p className="font-sans text-[0.85rem] font-semibold text-text-primary truncate">{currentUser.full_name}</p>
                          {currentUser.is_artist ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#6B1E2E] text-white text-[0.62rem] uppercase tracking-wider font-semibold mt-0.5">
                              {t("nav.roleArtist")} <Check size={10} className="text-white" />
                            </span>
                          ) : currentUser.role === 'admin' ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 bg-[#2C1810] text-white text-[0.62rem] uppercase tracking-wider font-semibold mt-0.5">
                              {t("nav.roleAdmin")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 bg-[#EDE4CE] text-[#6B1E2E] border border-[rgba(107,30,46,0.2)] text-[0.62rem] uppercase tracking-wider font-semibold mt-0.5">
                              {t("nav.roleBuyer")}
                            </span>
                          )}
                       </div>
                    </div>
                    <div className="py-2 flex flex-col">
                       <Link href="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 font-sans text-[0.85rem] text-text-muted hover:text-primary hover:bg-surface-2/50 transition-colors">
                          <UserIcon size={14} /> {t("nav.myProfile")}
                       </Link>
                       <Link href="/settings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 font-sans text-[0.85rem] text-text-muted hover:text-primary hover:bg-surface-2/50 transition-colors">
                          <Settings size={14} /> {t("nav.editProfile")}
                       </Link>
                       <Link href="/wishlist" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 font-sans text-[0.85rem] text-text-muted hover:text-primary hover:bg-surface-2/50 transition-colors">
                          <Heart size={14} /> {t("nav.wishlist")} ({wishlist.length})
                       </Link>
{FEATURES.commissions && (
                       <Link href="/commissions" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 font-sans text-[0.85rem] text-text-muted hover:text-primary hover:bg-surface-2/50 transition-colors">
                          <ArrowRight size={14} /> {t("nav.orders")}
                       </Link>
)}
{FEATURES.notifications && (
                       <Link href="/notifications" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 font-sans text-[0.85rem] text-text-muted hover:text-primary hover:bg-surface-2/50 transition-colors">
                          <Bell size={14} /> {t("nav.notifications")} {unreadCount > 0 && `(${unreadCount})`}
                       </Link>
)}
                       {currentUser.is_artist && (
                         <>
                           <div className="mx-4 my-1 h-px bg-primary-border/30"></div>
                           <Link href="/artist-portal" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 font-sans text-[0.85rem] text-[#6B1E2E] font-semibold hover:bg-surface-2/50 transition-colors">
                              <LayoutDashboard size={14} /> {t("nav.artistPortal")}
                           </Link>
                           <Link href="/artist-portal/upload" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 font-sans text-[0.85rem] text-[#6B1E2E] font-medium hover:bg-surface-2/50 transition-colors">
                              <Upload size={14} /> {t("nav.uploadArtwork")}
                           </Link>
                         </>
                       )}
                       {(currentUser.role === 'admin' || currentUser.role === 'super_admin') && (
                         <>
                           <div className="mx-4 my-1 h-px bg-primary-border/30"></div>
                           <Link href="/kalakaar-admin" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 font-sans text-[0.85rem] text-[#2C1810] font-semibold hover:bg-surface-2/50 transition-colors">
                              <Shield size={14} /> {t("nav.adminPanel")}
                           </Link>
                         </>
                       )}
                       <div className="mx-4 my-2 h-px bg-primary-border/30"></div>
                       <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 font-sans text-[0.85rem] text-[#D32F2F] hover:bg-surface-2/50 transition-colors text-left font-medium">
                          <LogOut size={14} /> {t("nav.signOut")}
                       </button>
                    </div>
                 </div>
               )}
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-[#7A5C4E] hover:text-[#6B1E2E] focus:outline-none shrink-0"
            aria-label={t("nav.toggleMenu")}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#FFFDF7] border-t border-[rgba(107,30,46,0.12)] mt-3 pt-3 pb-4 px-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
          <Link href="/explore" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between px-3 py-2.5 font-sans text-[0.82rem] uppercase tracking-wider text-[#2C1810] hover:text-[#6B1E2E] font-medium border-b border-[rgba(107,30,46,0.08)]">
            <span>{t("nav.explore")}</span>
            <ArrowRight size={14} className="text-[#6B1E2E]" />
          </Link>
          <Link href="/stories" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between px-3 py-2.5 font-sans text-[0.82rem] uppercase tracking-wider text-[#2C1810] hover:text-[#6B1E2E] font-medium border-b border-[rgba(107,30,46,0.08)]">
            <span>{t("nav.stories")}</span>
            <ArrowRight size={14} className="text-[#6B1E2E]" />
          </Link>
          <Link href="/artists" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between px-3 py-2.5 font-sans text-[0.82rem] uppercase tracking-wider text-[#2C1810] hover:text-[#6B1E2E] font-medium border-b border-[rgba(107,30,46,0.08)]">
            <span>{t("nav.artists")}</span>
            <ArrowRight size={14} className="text-[#6B1E2E]" />
          </Link>
          <Link href="/community" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between px-3 py-2.5 font-sans text-[0.82rem] uppercase tracking-wider text-[#2C1810] hover:text-[#6B1E2E] font-medium border-b border-[rgba(107,30,46,0.08)]">
            <span>{t("nav.community")}</span>
            <ArrowRight size={14} className="text-[#6B1E2E]" />
          </Link>
          <Link href="/wishlist" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between px-3 py-2.5 font-sans text-[0.82rem] uppercase tracking-wider text-[#2C1810] hover:text-[#6B1E2E] font-medium border-b border-[rgba(107,30,46,0.08)]">
            <span>{t("nav.wishlist")} ({wishlist.length})</span>
            <Heart size={14} className="text-[#6B1E2E]" />
          </Link>
          {!currentUser ? (
            <div className="pt-3 flex flex-col gap-2 px-1">
              <Link href="/auth?mode=signin" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-2 bg-[#EDE4CE] text-[#6B1E2E] font-sans text-[0.78rem] uppercase tracking-widest font-semibold border border-[rgba(107,30,46,0.2)]">
                {t("nav.signIn")}
              </Link>
              <Link href="/auth?role=artist" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-2 bg-[#6B1E2E] text-white font-sans text-[0.78rem] uppercase tracking-widest font-semibold">
                {t("nav.artistPortal")}
              </Link>
            </div>
          ) : (
            <div className="pt-3 flex flex-col gap-2 px-1">
              {currentUser.is_artist && (
                <Link href="/artist-portal" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-2 bg-[#6B1E2E] text-white font-sans text-[0.78rem] uppercase tracking-widest font-semibold flex items-center justify-center gap-2">
                  <LayoutDashboard size={14} /> {t("nav.artistPortal")}
                </Link>
              )}
              {(currentUser.role === 'admin' || currentUser.role === 'super_admin') && (
                <Link href="/kalakaar-admin" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-2 bg-[#2C1810] text-white font-sans text-[0.78rem] uppercase tracking-widest font-semibold flex items-center justify-center gap-2">
                  <Shield size={14} /> {t("nav.adminPanel")}
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mobile Search Row */}
      <div className="mt-2 pt-2 border-t border-[rgba(107,30,46,0.12)] md:hidden">
        <GlobalSearchBar />
      </div>
    </header>
  );
}
