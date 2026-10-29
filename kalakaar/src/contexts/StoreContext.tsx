"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "./AuthContext";
import { WishlistService } from "../../services/WishlistService";
import { LikeService } from "../../services/LikeService";
import { FollowService } from "../../services/FollowService";
import { NotificationService, AppNotification } from "../../services/NotificationService";
import { SearchService } from "../../services/SearchService";

type StoreContextType = {
  wishlist: string[];
  toggleWishlist: (id: string) => Promise<{ success: boolean; saved?: boolean; error?: string | null }>;
  likedArtworks: string[];
  toggleLike: (id: string) => Promise<{ success: boolean; liked?: boolean; count?: number; error?: string | null }>;
  recentlyViewed: string[];
  addRecentlyViewed: (id: string) => void;
  clearRecentlyViewed: () => void;
  refreshWishlist: () => Promise<void>;
  
  // Follow State & Action
  followingArtists: string[];
  toggleFollow: (artistId: string) => Promise<{ success: boolean; following?: boolean; count?: number; error?: string | null }>;
  isFollowingArtist: (artistId: string) => boolean;

  // Notification State & Actions
  notifications: AppNotification[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;

  // Recent Searches State & Actions
  recentSearches: string[];
  saveRecentSearch: (query: string) => void;
  removeRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [likedArtworks, setLikedArtworks] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [followingArtists, setFollowingArtists] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const loadUserData = useCallback(async () => {
    if (!user) {
      // Fallback local items for guests
      try {
        const savedWishlist = localStorage.getItem("kalakaar_wishlist");
        if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
        const savedLikes = localStorage.getItem("kalakaar_user_likes");
        if (savedLikes) setLikedArtworks(JSON.parse(savedLikes));
      } catch {
        // ignore
      }
      setFollowingArtists([]);
      setNotifications([]);
      return;
    }

    // 1. Wishlist
    setWishlist(await WishlistService.getSavedIds(user.id));

    // 2. Following
    const followRes = await FollowService.getFollowing(user.id);
    if (followRes.success && followRes.data) {
      setFollowingArtists(followRes.data);
    }

    // 3. Notifications
    const notifRes = await NotificationService.getNotifications(user.id);
    if (notifRes.success && notifRes.data) {
      setNotifications(notifRes.data);
    }

    // 4. Liked Artworks
    const likesRes = await LikeService.getUserLikes(user.id);
    if (likesRes.success && likesRes.data) {
      setLikedArtworks(likesRes.data);
    }
  }, [user]);

  useEffect(() => {
    loadUserData();

    // Load recent views
    const savedViews = localStorage.getItem("kalakaar_recent");
    if (savedViews) {
      try {
        setRecentlyViewed(JSON.parse(savedViews));
      } catch {
        // ignore
      }
    }

    // Load recent searches
    setRecentSearches(SearchService.getRecentSearches());
  }, [loadUserData]);

  const refreshWishlist = useCallback(async () => {
    await loadUserData();
  }, [loadUserData]);

  const refreshNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }
    const notifRes = await NotificationService.getNotifications(user.id);
    if (notifRes.success && notifRes.data) {
      setNotifications(notifRes.data);
    }
  }, [user]);

  const toggleWishlist = useCallback(async (id: string): Promise<{ success: boolean; saved?: boolean; error?: string | null }> => {
    if (!user) {
      return {
        success: false,
        error: "Please log in to save artworks to your wishlist.",
      };
    }

    const isCurrentlySaved = wishlist.includes(id);
    if (isCurrentlySaved) {
      const res = await WishlistService.removeArtwork(id, user.id);
      if (res.success) {
        setWishlist((prev) => prev.filter((i) => i !== id));
        return { success: true, saved: false };
      }
      return { success: false, error: res.error };
    } else {
      const res = await WishlistService.saveArtwork(id, user.id);
      if (res.success) {
        setWishlist((prev) => [...prev, id]);
        return { success: true, saved: true };
      }
      return { success: false, error: res.error };
    }
  }, [user, wishlist]);

  const toggleLike = useCallback(async (
    id: string
  ): Promise<{ success: boolean; liked?: boolean; count?: number; error?: string | null }> => {
    if (!user) {
      return {
        success: false,
        error: "Please log in to like artworks.",
      };
    }

    const hasLiked = likedArtworks.includes(id);
    if (hasLiked) {
      const res = await LikeService.unlikeArtwork(id, user.id);
      if (res.success && res.data) {
        setLikedArtworks((prev) => prev.filter((i) => i !== id));
        return { success: true, liked: false, count: res.data.count };
      }
      return { success: false, error: res.error };
    } else {
      const res = await LikeService.likeArtwork(id, user.id);
      if (res.success && res.data) {
        setLikedArtworks((prev) => [...prev, id]);
        return { success: true, liked: true, count: res.data.count };
      }
      return { success: false, error: res.error };
    }
  }, [user, likedArtworks]);

  const toggleFollow = useCallback(async (
    artistId: string
  ): Promise<{ success: boolean; following?: boolean; count?: number; error?: string | null }> => {
    if (!user) {
      return {
        success: false,
        error: "Please sign in to follow artists.",
      };
    }

    const isFollowing = followingArtists.includes(artistId);
    if (isFollowing) {
      const res = await FollowService.unfollowArtist(artistId, user.id);
      if (res.success && res.data) {
        setFollowingArtists((prev) => prev.filter((id) => id !== artistId));
        return { success: true, following: false, count: res.data.followerCount };
      }
      return { success: false, error: res.error };
    } else {
      const res = await FollowService.followArtist(artistId, user.id, user.name);
      if (res.success && res.data) {
        setFollowingArtists((prev) => [...prev, artistId]);
        return { success: true, following: true, count: res.data.followerCount };
      }
      return { success: false, error: res.error };
    }
  }, [user, followingArtists]);

  const isFollowingArtist = useCallback((artistId: string): boolean => {
    return followingArtists.includes(artistId);
  }, [followingArtists]);

  const markNotificationAsRead = useCallback(async (id: string) => {
    if (!user) return;
    await NotificationService.markAsRead(id, user.id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }, [user]);

  const markAllNotificationsAsRead = useCallback(async () => {
    if (!user) return;
    await NotificationService.markAllAsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, [user]);

  const deleteNotification = useCallback(async (id: string) => {
    if (!user) return;
    await NotificationService.deleteNotification(id, user.id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, [user]);

  const clearAllNotifications = useCallback(async () => {
    if (!user) return;
    await NotificationService.clearAll(user.id);
    setNotifications([]);
  }, [user]);

  const addRecentlyViewed = useCallback((id: string) => {
    setRecentlyViewed((prev) => {
      if (prev[0] === id) return prev;
      const filtered = prev.filter((i) => i !== id);
      const next = [id, ...filtered].slice(0, 10);
      localStorage.setItem("kalakaar_recent", JSON.stringify(next));
      return next;
    });
  }, []);

  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([]);
    localStorage.removeItem("kalakaar_recent");
  }, []);

  const saveRecentSearch = useCallback((query: string) => {
    SearchService.saveRecentSearch(query);
    setRecentSearches(SearchService.getRecentSearches());
  }, []);

  const removeRecentSearch = useCallback((query: string) => {
    SearchService.removeRecentSearch(query);
    setRecentSearches(SearchService.getRecentSearches());
  }, []);

  const clearRecentSearches = useCallback(() => {
    SearchService.clearRecentSearches();
    setRecentSearches([]);
  }, []);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications]);

  const value = useMemo(() => ({
    wishlist,
    toggleWishlist,
    likedArtworks,
    toggleLike,
    recentlyViewed,
    addRecentlyViewed,
    clearRecentlyViewed,
    refreshWishlist,

    followingArtists,
    toggleFollow,
    isFollowingArtist,

    notifications,
    unreadCount,
    refreshNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,

    recentSearches,
    saveRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  }), [
    wishlist,
    toggleWishlist,
    likedArtworks,
    toggleLike,
    recentlyViewed,
    addRecentlyViewed,
    clearRecentlyViewed,
    refreshWishlist,
    followingArtists,
    toggleFollow,
    isFollowingArtist,
    notifications,
    unreadCount,
    refreshNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
    recentSearches,
    saveRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  ]);

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}


