import type { Paged } from '../src/repositories/utils';
import {
  artworkRepository,
  Artwork,
  ArtworkStatus,
  ArtworkFilterOptions,
  ArtworkStatistics,
} from '../src/repositories/ArtworkRepository';
import { StorageService } from './StorageService';
import { memoryCache } from '../src/lib/cache';

export type { ArtworkStatus, Artwork, ArtworkFilterOptions, ArtworkStatistics };

export interface ArtworkResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string | null;
}

export class ArtworkService {
  /**
   * Helper to generate clean URL slug from title
   */
  static generateSlug(title: string): string {
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `${baseSlug || 'artwork'}-${randomSuffix}`;
  }

  /**
   * Validates Artwork input against constraints
   */
  static validateArtworkInput(data: Partial<Artwork>): ArtworkResult<{ valid: boolean }> {
    if (!data.title || !data.title.trim()) {
      return { success: false, error: 'Artwork title is required.' };
    }
    if (data.title.trim().length > 120) {
      return { success: false, error: 'Artwork title cannot exceed 120 characters.' };
    }
    if (data.description && data.description.length > 3000) {
      return { success: false, error: 'Description cannot exceed 3000 characters.' };
    }
    if (!data.category || !data.category.trim()) {
      return { success: false, error: 'Artwork category is required.' };
    }
    if (data.tags && data.tags.length > 10) {
      return { success: false, error: 'Maximum 10 tags are allowed.' };
    }
    if (data.image_urls && (data.image_urls.length < 1 || data.image_urls.length > 10)) {
      return { success: false, error: 'Artwork must have between 1 and 10 images.' };
    }
    if (data.price !== undefined && data.price < 0) {
      return { success: false, error: 'Artwork price cannot be negative.' };
    }
    return { success: true, data: { valid: true }, error: null };
  }

  /**
   * Creates a new artwork record (Draft or Published)
   */
  static async createArtwork(
    artworkData: Partial<Artwork> & { title: string; artist_id: string }
  ): Promise<ArtworkResult<Artwork>> {
    try {
      const validation = this.validateArtworkInput(artworkData);
      if (!validation.success) {
        return { success: false, error: validation.error };
      }

      const now = new Date().toISOString();
      const newId = artworkData.id || `art_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const status: ArtworkStatus = artworkData.status || 'published';

      const artworkPayload: Artwork = {
        id: newId,
        artist_id: artworkData.artist_id,
        title: artworkData.title.trim(),
        slug: artworkData.slug || this.generateSlug(artworkData.title),
        description: artworkData.description ? artworkData.description.trim() : '',
        image_urls: artworkData.image_urls && artworkData.image_urls.length > 0 ? artworkData.image_urls : ['/assets/defaults/artwork.svg'],
        cover_image_index: artworkData.cover_image_index ?? 0,
        category: artworkData.category.trim(),
        medium: artworkData.medium ? artworkData.medium.trim() : 'Mixed Media',
        tags: artworkData.tags || [],
        creation_year: artworkData.creation_year || new Date().getFullYear(),
        dimensions: artworkData.dimensions ? artworkData.dimensions.trim() : '12×16 inches',
        materials: artworkData.materials ? artworkData.materials.trim() : 'Canvas',
        price: artworkData.price,
        status,
        is_featured: artworkData.is_featured ?? false,
        view_count: 0,
        like_count: 0,
        wishlist_count: 0,
        created_at: now,
        updated_at: now,
        published_at: status === 'published' ? now : null,
        profiles: artworkData.profiles,
      };

      const repoRes = await artworkRepository.createArtwork(artworkPayload);
      if (!repoRes.success || !repoRes.data) {
        return { success: false, error: repoRes.error || 'Failed to create artwork.' };
      }

      memoryCache.invalidate();
      return { success: true, data: repoRes.data, error: null };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create artwork.';
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Saves or updates an artwork as a Draft
   */
  static async saveDraft(
    artworkData: Partial<Artwork> & { title: string; artist_id: string }
  ): Promise<ArtworkResult<Artwork>> {
    if (artworkData.id) {
      return this.updateArtwork(artworkData.id, { ...artworkData, status: 'draft' });
    }
    return this.createArtwork({ ...artworkData, status: 'draft' });
  }

  /**
   * Publishes an artwork
   */
  static async publishArtwork(id: string): Promise<ArtworkResult<Artwork>> {
    const repoRes = await artworkRepository.publishArtwork(id);
    if (!repoRes.success || !repoRes.data) {
      return { success: false, error: repoRes.error || 'Failed to publish artwork.' };
    }
    memoryCache.invalidate();
    return { success: true, data: repoRes.data, error: null };
  }

  /**
   * Archives an artwork
   */
  static async archiveArtwork(id: string): Promise<ArtworkResult<Artwork>> {
    const repoRes = await artworkRepository.archiveArtwork(id);
    if (!repoRes.success || !repoRes.data) {
      return { success: false, error: repoRes.error || 'Failed to archive artwork.' };
    }
    memoryCache.invalidate();
    return { success: true, data: repoRes.data, error: null };
  }

  /**
   * Updates an existing artwork by ID
   */
  static async updateArtwork(
    id: string,
    updates: Partial<Artwork>
  ): Promise<ArtworkResult<Artwork>> {
    try {
      if (!id) {
        return { success: false, error: 'Artwork ID is required for update.' };
      }

      const existingRes = await artworkRepository.getArtwork(id);
      if (!existingRes.success || !existingRes.data) {
        return { success: false, error: 'Artwork not found.' };
      }

      const mergedData: Artwork = {
        ...existingRes.data,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const validation = this.validateArtworkInput(mergedData);
      if (!validation.success) {
        return { success: false, error: validation.error };
      }

      const repoRes = await artworkRepository.updateArtwork(id, updates);
      if (!repoRes.success || !repoRes.data) {
        return { success: false, error: repoRes.error || 'Failed to update artwork.' };
      }

      memoryCache.invalidate();
      return { success: true, data: repoRes.data, error: null };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update artwork.';
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Deletes artwork record and all associated images in StorageService
   */
  static async deleteArtwork(id: string): Promise<ArtworkResult<{ deleted: boolean }>> {
    try {
      if (!id) {
        return { success: false, error: 'Artwork ID is required for deletion.' };
      }

      const existingRes = await artworkRepository.getArtwork(id);
      if (existingRes.success && existingRes.data) {
        const images = existingRes.data.image_urls || [];
        for (const imgUrl of images) {
          if (imgUrl && !imgUrl.startsWith('/assets/')) {
            await StorageService.deleteFile('artworks', imgUrl);
          }
        }
      }

      const repoRes = await artworkRepository.deleteArtwork(id);
      if (!repoRes.success) {
        return { success: false, error: repoRes.error || 'Failed to delete artwork.' };
      }

      memoryCache.invalidate();
      return { success: true, data: { deleted: true }, error: null };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete artwork.';
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Gets single artwork by ID
   */
  static async getArtwork(id: string): Promise<ArtworkResult<Artwork>> {
    if (!id) {
      return { success: false, error: 'Artwork ID is required.' };
    }
    const repoRes = await artworkRepository.getArtwork(id);
    if (!repoRes.success || !repoRes.data) {
      return { success: false, error: repoRes.error || 'Artwork not found.' };
    }
    return { success: true, data: repoRes.data, error: null };
  }

  /**
   * Gets single artwork by slug
   */
  static async getArtworkBySlug(slug: string): Promise<ArtworkResult<Artwork>> {
    if (!slug) {
      return { success: false, error: 'Artwork slug is required.' };
    }
    const repoRes = await artworkRepository.getArtworkBySlug(slug);
    if (!repoRes.success || !repoRes.data) {
      return { success: false, error: repoRes.error || 'Artwork not found.' };
    }
    return { success: true, data: repoRes.data, error: null };
  }

  /**
   * Gets all artworks for a specific artist
   */
  /** One page of an artist's artworks plus the total count (server-side pagination). */
  static async getArtistArtworksPage(
    artistId: string,
    options?: { status?: ArtworkStatus; includeDrafts?: boolean; page?: number; pageSize?: number }
  ): Promise<ArtworkResult<Paged<Artwork>>> {
    if (!artistId) return { success: false, error: 'Artist ID is required.' };
    const repoRes = await artworkRepository.getArtistArtworksPage(artistId, options);
    if (!repoRes.success || !repoRes.data) return { success: false, error: repoRes.error || 'Failed to fetch artist artworks.' };
    return { success: true, data: repoRes.data, error: null };
  }

  static async getArtistArtworks(
    artistId: string,
    options?: { status?: ArtworkStatus; includeDrafts?: boolean }
  ): Promise<ArtworkResult<Artwork[]>> {
    if (!artistId) {
      return { success: false, error: 'Artist ID is required.' };
    }
    const repoRes = await artworkRepository.getArtistArtworks(artistId, options);
    if (!repoRes.success || !repoRes.data) {
      return { success: false, error: repoRes.error || 'Failed to fetch artist artworks.' };
    }
    return { success: true, data: repoRes.data, error: null };
  }

  /**
   * Gets featured published artworks
   */
  static async getFeaturedArtworks(limit = 6): Promise<ArtworkResult<Artwork[]>> {
    const cacheKey = `featured_artworks_${limit}`;
    const cached = memoryCache.get<Artwork[]>(cacheKey);
    if (cached) return { success: true, data: cached, error: null };

    const repoRes = await artworkRepository.getFeaturedArtworks(limit);
    if (!repoRes.success || !repoRes.data) {
      return { success: false, error: repoRes.error || 'Failed to fetch featured artworks.' };
    }
    memoryCache.set(cacheKey, repoRes.data, 60000);
    return { success: true, data: repoRes.data, error: null };
  }

  /**
   * Gets trending published artworks
   */
  static async getTrendingArtworks(limit = 6): Promise<ArtworkResult<Artwork[]>> {
    const cacheKey = `trending_artworks_${limit}`;
    const cached = memoryCache.get<Artwork[]>(cacheKey);
    if (cached) return { success: true, data: cached, error: null };

    const repoRes = await artworkRepository.getTrendingArtworks(limit);
    if (!repoRes.success || !repoRes.data) {
      return { success: false, error: repoRes.error || 'Failed to fetch trending artworks.' };
    }
    memoryCache.set(cacheKey, repoRes.data, 60000);
    return { success: true, data: repoRes.data, error: null };
  }

  /**
   * Gets recent published artworks
   */
  static async getRecentArtworks(limit = 6): Promise<ArtworkResult<Artwork[]>> {
    const cacheKey = `recent_artworks_${limit}`;
    const cached = memoryCache.get<Artwork[]>(cacheKey);
    if (cached) return { success: true, data: cached, error: null };

    const repoRes = await artworkRepository.getRecentArtworks(limit);
    if (!repoRes.success || !repoRes.data) {
      return { success: false, error: repoRes.error || 'Failed to fetch recent artworks.' };
    }
    memoryCache.set(cacheKey, repoRes.data, 60000);
    return { success: true, data: repoRes.data, error: null };
  }

  /**
   * Gets artworks for Explore feed with category, search and filter options
   */
  static async getExploreArtworks(
    options?: ArtworkFilterOptions
  ): Promise<ArtworkResult<Artwork[]>> {
    const repoRes = await artworkRepository.getExploreArtworks(options);
    if (!repoRes.success || !repoRes.data) {
      return { success: false, error: repoRes.error || 'Failed to fetch explore artworks.' };
    }
    return { success: true, data: repoRes.data, error: null };
  }

  /**
   * Search artworks by query string and filter options
   */
  static async searchArtworks(
    query: string,
    filters?: ArtworkFilterOptions
  ): Promise<ArtworkResult<Artwork[]>> {
    const repoRes = await artworkRepository.searchArtworks(query, filters);
    if (!repoRes.success || !repoRes.data) {
      return { success: false, error: repoRes.error || 'Failed to search artworks.' };
    }
    return { success: true, data: repoRes.data, error: null };
  }

  /**
   * Fetch artwork statistics for an artist
   */
  static async getArtworkStatistics(artistId: string): Promise<ArtworkResult<ArtworkStatistics>> {
    if (!artistId) {
      return { success: false, error: 'Artist ID is required.' };
    }
    const repoRes = await artworkRepository.getArtworkStatistics(artistId);
    if (!repoRes.success || !repoRes.data) {
      return { success: false, error: repoRes.error || 'Failed to fetch artwork statistics.' };
    }
    return { success: true, data: repoRes.data, error: null };
  }

  /**
   * Increments view count on an artwork
   */
  static async incrementView(id: string): Promise<ArtworkResult<number>> {
    if (!id) {
      return { success: false, error: 'Artwork ID is required.' };
    }
    const repoRes = await artworkRepository.incrementView(id);
    if (!repoRes.success || repoRes.data === undefined) {
      return { success: false, error: repoRes.error || 'Failed to increment view count.' };
    }
    return { success: true, data: repoRes.data, error: null };
  }

  /**
   * Increments share count on an artwork
   */
  static async incrementShare(id: string): Promise<ArtworkResult<number>> {
    if (!id) {
      return { success: false, error: 'Artwork ID is required.' };
    }
    const repoRes = await artworkRepository.incrementShare(id);
    if (!repoRes.success || repoRes.data === undefined) {
      return { success: false, error: repoRes.error || 'Failed to increment share count.' };
    }
    return { success: true, data: repoRes.data, error: null };
  }

  /**
   * Update cover image index for an artwork
   */
  static async updateCoverImage(id: string, coverIndex: number): Promise<ArtworkResult<Artwork>> {
    if (!id) {
      return { success: false, error: 'Artwork ID is required.' };
    }
    const repoRes = await artworkRepository.updateCoverImage(id, coverIndex);
    if (!repoRes.success || !repoRes.data) {
      return { success: false, error: repoRes.error || 'Failed to update cover image.' };
    }
    return { success: true, data: repoRes.data, error: null };
  }

  /**
   * Update gallery image URLs and cover index
   */
  static async updateArtworkImages(
    id: string,
    imageUrls: string[],
    coverIndex?: number
  ): Promise<ArtworkResult<Artwork>> {
    if (!id) {
      return { success: false, error: 'Artwork ID is required.' };
    }
    if (!imageUrls || imageUrls.length === 0) {
      return { success: false, error: 'At least one image URL is required.' };
    }
    const repoRes = await artworkRepository.updateArtworkImages(id, imageUrls, coverIndex);
    if (!repoRes.success || !repoRes.data) {
      return { success: false, error: repoRes.error || 'Failed to update artwork images.' };
    }
    return { success: true, data: repoRes.data, error: null };
  }
}
