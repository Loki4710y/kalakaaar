import { adminRepository } from '../src/repositories/AdminRepository';
import type { AdminListParams } from '../src/repositories/AdminRepository';
import type { Paged } from '../src/repositories/utils';
import type {
  AdminDashboardStats,
  ActivityLogItem,
  AdminArtist,
  AdminArtwork,
  AdminCollection,
  AdminStory,
  AdminFeaturedContent,
  ArtistOfTheMonth,
  AdminReport,
  AnalyticsData,
  Announcement,
  PlatformSettings,
  DashboardResponse,
} from '../src/repositories/AdminRepository';

export type {
  AdminDashboardStats,
  ActivityLogItem,
  AdminArtist,
  AdminArtwork,
  AdminCollection,
  AdminStory,
  AdminFeaturedContent,
  ArtistOfTheMonth,
  AdminReport,
  AnalyticsData,
  Announcement,
  PlatformSettings,
  DashboardResponse,
};

export type { AdminListParams, Paged };

export interface AdminResult<T> {
  success: boolean;
  data?: T;
  error?: string | null;
}

export class AdminService {
  /**
   * Get overall Dashboard metrics and recent feeds
   */
  static async getDashboard(): Promise<AdminResult<DashboardResponse>> {
    try {
      const res = await adminRepository.getDashboardData();
      if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Failed to load dashboard data.' };
      }
      return { success: true, data: res.data, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load dashboard data.';
      return { success: false, error: msg };
    }
  }

  /**
   * Get list of artists
   */
  static async getArtists(): Promise<AdminResult<AdminArtist[]>> {
    try {
      const res = await adminRepository.getArtists();
      return { success: true, data: res.data || [], error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch artists.';
      return { success: false, data: [], error: msg };
    }
  }

  /** One page of artists (search, filters and sorting run in the database). */
  static async getArtistsPage(params: AdminListParams): Promise<AdminResult<Paged<AdminArtist>>> {
    try {
      const res = await adminRepository.getArtistsPage(params);
      if (!res.success || !res.data) return { success: false, error: res.error || 'Failed to fetch artists.' };
      return { success: true, data: res.data, error: null };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to fetch artists.' };
    }
  }

  /** One page of artworks (search, filters and sorting run in the database). */
  static async getArtworksPage(params: AdminListParams): Promise<AdminResult<Paged<AdminArtwork>>> {
    try {
      const res = await adminRepository.getArtworksPage(params);
      if (!res.success || !res.data) return { success: false, error: res.error || 'Failed to fetch artworks.' };
      return { success: true, data: res.data, error: null };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to fetch artworks.' };
    }
  }

  /** One page of collections (search, filters and sorting run in the database). */
  static async getCollectionsPage(params: AdminListParams): Promise<AdminResult<Paged<AdminCollection>>> {
    try {
      const res = await adminRepository.getCollectionsPage(params);
      if (!res.success || !res.data) return { success: false, error: res.error || 'Failed to fetch collections.' };
      return { success: true, data: res.data, error: null };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to fetch collections.' };
    }
  }

  /** One page of stories (search, filters and sorting run in the database). */
  static async getStoriesPage(params: AdminListParams): Promise<AdminResult<Paged<AdminStory>>> {
    try {
      const res = await adminRepository.getStoriesPage(params);
      if (!res.success || !res.data) return { success: false, error: res.error || 'Failed to fetch stories.' };
      return { success: true, data: res.data, error: null };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to fetch stories.' };
    }
  }

  /**
   * Get list of artworks
   */
  static async getArtworks(): Promise<AdminResult<AdminArtwork[]>> {
    try {
      const res = await adminRepository.getArtworks();
      return { success: true, data: res.data || [], error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch artworks.';
      return { success: false, data: [], error: msg };
    }
  }

  /**
   * Get list of collections
   */
  static async getCollections(): Promise<AdminResult<AdminCollection[]>> {
    try {
      const res = await adminRepository.getCollections();
      return { success: true, data: res.data || [], error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch collections.';
      return { success: false, data: [], error: msg };
    }
  }

  /**
   * Get list of stories
   */
  static async getStories(): Promise<AdminResult<AdminStory[]>> {
    try {
      const res = await adminRepository.getStories();
      return { success: true, data: res.data || [], error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch stories.';
      return { success: false, data: [], error: msg };
    }
  }

  /**
   * Get all featured content
   */
  static async getFeaturedContent(): Promise<AdminResult<AdminFeaturedContent>> {
    try {
      const res = await adminRepository.getFeaturedContent();
      if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Failed to fetch featured content.' };
      }
      return { success: true, data: res.data, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch featured content.';
      return { success: false, error: msg };
    }
  }

  /**
   * Feature or Unfeature Artist
   */
  static async featureArtist(id: string, featured: boolean): Promise<AdminResult<AdminArtist>> {
    try {
      const res = await adminRepository.featureArtist(id, featured);
      if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Failed to feature artist.' };
      }
      return { success: true, data: res.data, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to feature artist.';
      return { success: false, error: msg };
    }
  }

  /**
   * Mark an artist as verified (shows the ✓ badge) or remove it
   */
  static async verifyArtist(id: string, verified: boolean): Promise<AdminResult<AdminArtist>> {
    try {
      const res = await adminRepository.verifyArtist(id, verified);
      if (!res.success || !res.data) return { success: false, error: res.error || 'Failed to update verification.' };
      return { success: true, data: res.data, error: null };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update verification.' };
    }
  }

  /**
   * Feature or Unfeature Artwork
   */
  static async featureArtwork(id: string, featured: boolean): Promise<AdminResult<AdminArtwork>> {
    try {
      const res = await adminRepository.featureArtwork(id, featured);
      if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Failed to feature artwork.' };
      }
      return { success: true, data: res.data, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to feature artwork.';
      return { success: false, error: msg };
    }
  }

  /**
   * Feature or Unfeature Collection
   */
  static async featureCollection(id: string, featured: boolean): Promise<AdminResult<AdminCollection>> {
    try {
      const res = await adminRepository.featureCollection(id, featured);
      if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Failed to feature collection.' };
      }
      return { success: true, data: res.data, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to feature collection.';
      return { success: false, error: msg };
    }
  }

  /**
   * Feature or Unfeature Story
   */
  static async featureStory(id: string, featured: boolean): Promise<AdminResult<AdminStory>> {
    try {
      const res = await adminRepository.featureStory(id, featured);
      if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Failed to feature story.' };
      }
      return { success: true, data: res.data, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to feature story.';
      return { success: false, error: msg };
    }
  }

  /**
   * Set Active Artist of the Month
   */
  static async setArtistOfTheMonth(
    artistId: string,
    month: string,
    year: number,
    reason: string,
    bannerUrl?: string
  ): Promise<AdminResult<ArtistOfTheMonth>> {
    try {
      const res = await adminRepository.setArtistOfTheMonth(artistId, month, year, reason, bannerUrl);
      if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Failed to set Artist of the Month.' };
      }
      return { success: true, data: res.data, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to set Artist of the Month.';
      return { success: false, error: msg };
    }
  }

  /**
   * Get Active Artist of the Month
   */
  static async getArtistOfTheMonth(): Promise<AdminResult<ArtistOfTheMonth>> {
    try {
      const res = await adminRepository.getArtistOfTheMonth();
      if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Failed to get Artist of the Month.' };
      }
      return { success: true, data: res.data, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to get Artist of the Month.';
      return { success: false, error: msg };
    }
  }

  /**
   * Get Analytics and Charting data
   */
  static async getAnalytics(): Promise<AdminResult<AnalyticsData>> {
    try {
      const res = await adminRepository.getAnalytics();
      if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Failed to load analytics.' };
      }
      return { success: true, data: res.data, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load analytics.';
      return { success: false, error: msg };
    }
  }

  /**
   * One page of moderation reports, optionally for one content type
   */
  static async getReportsPage(itemType?: string, page = 1, pageSize = 20): Promise<AdminResult<Paged<AdminReport>>> {
    try {
      const res = await adminRepository.getReportsPage({ itemType, page, pageSize });
      if (!res.success || !res.data) return { success: false, error: res.error || 'Failed to fetch reports.' };
      return { success: true, data: res.data, error: null };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to fetch reports.' };
    }
  }

  /**
   * Update Report Status
   */
  static async updateReportStatus(
    id: string,
    status: 'pending' | 'reviewed' | 'ignored' | 'archived'
  ): Promise<AdminResult<AdminReport>> {
    try {
      const res = await adminRepository.updateReportStatus(id, status);
      if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Failed to update report.' };
      }
      return { success: true, data: res.data, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update report.';
      return { success: false, error: msg };
    }
  }

  /**
   * Create Broadcast Announcement
   */
  static async createAnnouncement(
    announcement: Omit<Announcement, 'id' | 'created_at'>
  ): Promise<AdminResult<Announcement>> {
    try {
      const res = await adminRepository.createAnnouncement(announcement);
      if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Failed to create announcement.' };
      }
      return { success: true, data: res.data, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create announcement.';
      return { success: false, error: msg };
    }
  }

  /**
   * Get Platform Settings
   */
  static async getSettings(): Promise<AdminResult<PlatformSettings>> {
    try {
      const res = await adminRepository.getSettings();
      if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Failed to fetch settings.' };
      }
      return { success: true, data: res.data, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch settings.';
      return { success: false, error: msg };
    }
  }

  /**
   * Update Platform Settings
   */
  static async updateSettings(settings: Partial<PlatformSettings>): Promise<AdminResult<PlatformSettings>> {
    try {
      const res = await adminRepository.updatePlatformSettings(settings);
      if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Failed to update settings.' };
      }
      return { success: true, data: res.data, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update settings.';
      return { success: false, error: msg };
    }
  }

  /**
   * Toggle Artist Status (Suspend / Activate)
   */
  static async toggleArtistStatus(id: string, status: 'active' | 'suspended'): Promise<AdminResult<AdminArtist>> {
    try {
      const res = await adminRepository.toggleArtistStatus(id, status);
      if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Failed to update artist status.' };
      }
      return { success: true, data: res.data, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update artist status.';
      return { success: false, error: msg };
    }
  }

  /**
   * Delete Artist
   */
  static async deleteArtist(id: string): Promise<AdminResult<boolean>> {
    try {
      const res = await adminRepository.deleteArtist(id);
      return { success: true, data: !!res.data, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete artist.';
      return { success: false, data: false, error: msg };
    }
  }

  /**
   * Toggle Artwork Status (Available / Sold / Archived)
   */
  static async setArtworkStatus(id: string, status: 'available' | 'sold' | 'archived'): Promise<AdminResult<AdminArtwork>> {
    try {
      const res = await adminRepository.setArtworkStatus(id, status);
      if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Failed to update artwork status.' };
      }
      return { success: true, data: res.data, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update artwork status.';
      return { success: false, error: msg };
    }
  }

  /**
   * Delete Artwork
   */
  static async deleteArtwork(id: string): Promise<AdminResult<boolean>> {
    try {
      const res = await adminRepository.deleteArtwork(id);
      return { success: true, data: !!res.data, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete artwork.';
      return { success: false, data: false, error: msg };
    }
  }

  /**
   * Toggle Collection Status (Active / Archived)
   */
  static async setCollectionStatus(id: string, status: 'active' | 'archived'): Promise<AdminResult<AdminCollection>> {
    try {
      const res = await adminRepository.setCollectionStatus(id, status);
      if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Failed to update collection status.' };
      }
      return { success: true, data: res.data, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update collection status.';
      return { success: false, error: msg };
    }
  }

  /**
   * Delete Collection
   */
  static async deleteCollection(id: string): Promise<AdminResult<boolean>> {
    try {
      const res = await adminRepository.deleteCollection(id);
      return { success: true, data: !!res.data, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete collection.';
      return { success: false, data: false, error: msg };
    }
  }

  /**
   * Toggle Story Status (Published / Draft / Archived)
   */
  static async setStoryStatus(id: string, status: 'published' | 'draft' | 'archived'): Promise<AdminResult<AdminStory>> {
    try {
      const res = await adminRepository.setStoryStatus(id, status);
      if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Failed to update story status.' };
      }
      return { success: true, data: res.data, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update story status.';
      return { success: false, error: msg };
    }
  }

  /**
   * Delete Story
   */
  static async deleteStory(id: string): Promise<AdminResult<boolean>> {
    try {
      const res = await adminRepository.deleteStory(id);
      return { success: true, data: !!res.data, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete story.';
      return { success: false, data: false, error: msg };
    }
  }
}
