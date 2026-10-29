import type { Paged } from '../src/repositories/utils';
import {
  collectionRepository,
  Collection,
  CollectionStatus,
  CollectionFilterOptions,
  CollectionStatistics,
} from '../src/repositories/CollectionRepository';
import { Artwork } from './ArtworkService';
import { memoryCache } from '../src/lib/cache';

export type { CollectionStatus, Collection, CollectionFilterOptions, CollectionStatistics };

export interface CollectionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string | null;
}

export class CollectionService {
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
    return `${baseSlug || 'collection'}-${randomSuffix}`;
  }

  /**
   * Validates collection fields
   */
  static validateCollectionInput(
    data: Partial<Collection>,
    isPublishing = false
  ): CollectionResult<{ valid: boolean }> {
    if (!data.title || !data.title.trim()) {
      return { success: false, error: 'Collection title is required.' };
    }
    if (data.title.trim().length > 120) {
      return { success: false, error: 'Collection title cannot exceed 120 characters.' };
    }
    if (data.description && data.description.length > 1000) {
      return { success: false, error: 'Description cannot exceed 1000 characters.' };
    }
    if (data.artworks && data.artworks.length > 100) {
      return { success: false, error: 'Collection cannot exceed 100 artworks.' };
    }
    if (isPublishing && (!data.artworks || data.artworks.length < 1)) {
      return { success: false, error: 'A published collection must contain at least 1 artwork.' };
    }
    return { success: true, data: { valid: true }, error: null };
  }

  /**
   * Automatically derives cover image URL from selected artworks if not manually set
   */
  static getDerivedCoverImage(coverImageUrl?: string, artworks: Artwork[] = []): string | undefined {
    if (coverImageUrl && coverImageUrl.trim()) {
      return coverImageUrl;
    }
    for (const art of artworks) {
      if (art.image_urls && art.image_urls.length > 0) {
        const coverIdx = art.cover_image_index || 0;
        const img = art.image_urls[coverIdx] || art.image_urls[0];
        if (img) return img;
      }
    }
    return undefined;
  }

  /**
   * Create a new collection
   */
  static async createCollection(
    collectionData: Partial<Collection> & { title: string; artist_id: string }
  ): Promise<CollectionResult<Collection>> {
    try {
      const status = collectionData.status || 'published';
      const validation = this.validateCollectionInput(collectionData, status === 'published');
      if (!validation.success) {
        return { success: false, error: validation.error };
      }

      const now = new Date().toISOString();
      const newId = collectionData.id || `col_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const artworks = collectionData.artworks || [];
      const coverImage = this.getDerivedCoverImage(collectionData.cover_image_url, artworks);

      const collectionPayload: Collection = {
        id: newId,
        artist_id: collectionData.artist_id,
        title: collectionData.title.trim(),
        slug: collectionData.slug || this.generateSlug(collectionData.title),
        description: collectionData.description ? collectionData.description.trim() : '',
        cover_image_url: coverImage,
        status: status,
        is_featured: collectionData.is_featured ?? false,
        view_count: 0,
        created_at: now,
        updated_at: now,
        published_at: status === 'published' ? now : null,
        artworks: artworks,
        profiles: collectionData.profiles || {
          id: collectionData.artist_id,
          full_name: 'Artist',
        },
      };

      const repoRes = await collectionRepository.createCollection(collectionPayload);
      if (!repoRes.success || !repoRes.data) {
        return { success: false, error: repoRes.error || 'Failed to create collection.' };
      }

      memoryCache.invalidate();
      return { success: true, data: repoRes.data, error: null };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create collection.';
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Save or update draft collection
   */
  static async saveDraft(
    collectionData: Partial<Collection> & { title: string; artist_id: string }
  ): Promise<CollectionResult<Collection>> {
    if (collectionData.id) {
      return this.updateCollection(collectionData.id, { ...collectionData, status: 'draft' });
    }
    return this.createCollection({ ...collectionData, status: 'draft' });
  }

  /**
   * Publish a collection
   */
  static async publishCollection(id: string): Promise<CollectionResult<Collection>> {
    const existingResult = await this.getCollection(id);
    if (!existingResult.success || !existingResult.data) {
      return { success: false, error: 'Collection not found.' };
    }

    const col = existingResult.data;
    if (!col.artworks || col.artworks.length < 1) {
      return { success: false, error: 'Cannot publish a collection without at least 1 artwork.' };
    }

    const repoRes = await collectionRepository.publishCollection(id);
    if (!repoRes.success || !repoRes.data) {
      return { success: false, error: repoRes.error || 'Failed to publish collection.' };
    }
    memoryCache.invalidate();
    return { success: true, data: repoRes.data, error: null };
  }

  /**
   * Archive a collection
   */
  static async archiveCollection(id: string): Promise<CollectionResult<Collection>> {
    const repoRes = await collectionRepository.archiveCollection(id);
    if (!repoRes.success || !repoRes.data) {
      return { success: false, error: repoRes.error || 'Failed to archive collection.' };
    }
    memoryCache.invalidate();
    return { success: true, data: repoRes.data, error: null };
  }

  /**
   * Update an existing collection
   */
  static async updateCollection(
    id: string,
    updates: Partial<Collection>
  ): Promise<CollectionResult<Collection>> {
    try {
      if (!id) {
        return { success: false, error: 'Collection ID is required for update.' };
      }

      const existingResult = await this.getCollection(id);
      if (!existingResult.success || !existingResult.data) {
        return { success: false, error: 'Collection not found.' };
      }

      const existing = existingResult.data;
      const mergedArtworks = updates.artworks !== undefined ? updates.artworks : existing.artworks;
      const targetStatus = updates.status || existing.status;

      const validation = this.validateCollectionInput(
        { ...existing, ...updates, artworks: mergedArtworks },
        targetStatus === 'published'
      );
      if (!validation.success) {
        return { success: false, error: validation.error };
      }

      const coverImage = this.getDerivedCoverImage(
        updates.cover_image_url !== undefined ? updates.cover_image_url : existing.cover_image_url,
        mergedArtworks
      );

      const updatedPayload: Partial<Collection> = {
        ...updates,
        artworks: mergedArtworks,
        cover_image_url: coverImage,
        updated_at: new Date().toISOString(),
      };

      const repoRes = await collectionRepository.updateCollection(id, updatedPayload);
      if (!repoRes.success || !repoRes.data) {
        return { success: false, error: repoRes.error || 'Failed to update collection.' };
      }

      memoryCache.invalidate();
      return { success: true, data: repoRes.data, error: null };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update collection.';
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Delete collection (NEVER deletes artworks)
   */
  static async deleteCollection(id: string): Promise<CollectionResult<{ deleted: boolean }>> {
    try {
      if (!id) {
        return { success: false, error: 'Collection ID is required for deletion.' };
      }

      const repoRes = await collectionRepository.deleteCollection(id);
      if (!repoRes.success) {
        return { success: false, error: repoRes.error || 'Failed to delete collection.' };
      }

      memoryCache.invalidate();
      return { success: true, data: { deleted: true }, error: null };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete collection.';
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Get single collection by ID or Slug
   */
  static async getCollection(idOrSlug: string): Promise<CollectionResult<Collection>> {
    if (!idOrSlug) {
      return { success: false, error: 'Collection identifier is required.' };
    }
    const repoRes = await collectionRepository.getCollection(idOrSlug);
    if (!repoRes.success || !repoRes.data) {
      return { success: false, error: repoRes.error || 'Collection not found.' };
    }
    return { success: true, data: repoRes.data, error: null };
  }

  /**
   * Get collections for a specific artist
   */
  /** One page of an artist's collections plus the total count (server-side pagination). */
  static async getArtistCollectionsPage(
    artistId: string,
    options?: { status?: CollectionStatus; includeDrafts?: boolean; page?: number; pageSize?: number }
  ): Promise<CollectionResult<Paged<Collection>>> {
    if (!artistId) return { success: false, error: 'Artist ID is required.' };
    const repoRes = await collectionRepository.getArtistCollectionsPage(artistId, options);
    if (!repoRes.success || !repoRes.data) return { success: false, error: repoRes.error || 'Failed to fetch artist collections.' };
    return { success: true, data: repoRes.data, error: null };
  }

  static async getArtistCollections(
    artistId: string,
    options?: { status?: CollectionStatus; includeDrafts?: boolean }
  ): Promise<CollectionResult<Collection[]>> {
    if (!artistId) {
      return { success: false, error: 'Artist ID is required.' };
    }
    const repoRes = await collectionRepository.getArtistCollections(artistId, options);
    if (!repoRes.success || !repoRes.data) {
      return { success: false, error: repoRes.error || 'Failed to fetch artist collections.' };
    }
    return { success: true, data: repoRes.data, error: null };
  }

  /**
   * Get featured collections
   */
  static async getFeaturedCollections(limit = 6): Promise<CollectionResult<Collection[]>> {
    const cacheKey = `featured_collections_${limit}`;
    const cached = memoryCache.get<Collection[]>(cacheKey);
    if (cached) return { success: true, data: cached, error: null };

    const repoRes = await collectionRepository.getFeaturedCollections(limit);
    if (!repoRes.success || !repoRes.data) {
      return { success: false, error: repoRes.error || 'Failed to fetch featured collections.' };
    }
    memoryCache.set(cacheKey, repoRes.data, 60000);
    return { success: true, data: repoRes.data, error: null };
  }

  /**
   * Get trending collections
   */
  static async getTrendingCollections(limit = 6): Promise<CollectionResult<Collection[]>> {
    const cacheKey = `trending_collections_${limit}`;
    const cached = memoryCache.get<Collection[]>(cacheKey);
    if (cached) return { success: true, data: cached, error: null };

    const repoRes = await collectionRepository.getTrendingCollections(limit);
    if (!repoRes.success || !repoRes.data) {
      return { success: false, error: repoRes.error || 'Failed to fetch trending collections.' };
    }
    memoryCache.set(cacheKey, repoRes.data, 60000);
    return { success: true, data: repoRes.data, error: null };
  }

  /**
   * Get recent collections
   */
  static async getRecentCollections(limit = 6): Promise<CollectionResult<Collection[]>> {
    const cacheKey = `recent_collections_${limit}`;
    const cached = memoryCache.get<Collection[]>(cacheKey);
    if (cached) return { success: true, data: cached, error: null };

    const repoRes = await collectionRepository.getRecentCollections(limit);
    if (!repoRes.success || !repoRes.data) {
      return { success: false, error: repoRes.error || 'Failed to fetch recent collections.' };
    }
    memoryCache.set(cacheKey, repoRes.data, 60000);
    return { success: true, data: repoRes.data, error: null };
  }

  /**
   * Add artwork to collection
   */
  static async addArtwork(collectionId: string, artwork: Artwork): Promise<CollectionResult<Collection>> {
    const repoRes = await collectionRepository.addArtwork(collectionId, artwork);
    if (!repoRes.success || !repoRes.data) {
      return { success: false, error: repoRes.error || 'Failed to add artwork to collection.' };
    }
    return { success: true, data: repoRes.data, error: null };
  }

  /**
   * Remove artwork from collection
   */
  static async removeArtwork(collectionId: string, artworkId: string): Promise<CollectionResult<Collection>> {
    const repoRes = await collectionRepository.removeArtwork(collectionId, artworkId);
    if (!repoRes.success || !repoRes.data) {
      return { success: false, error: repoRes.error || 'Failed to remove artwork from collection.' };
    }
    return { success: true, data: repoRes.data, error: null };
  }

  /**
   * Reorder artworks within collection
   */
  static async reorderArtworks(collectionId: string, artworkIds: string[]): Promise<CollectionResult<Collection>> {
    const repoRes = await collectionRepository.reorderArtworks(collectionId, artworkIds);
    if (!repoRes.success || !repoRes.data) {
      return { success: false, error: repoRes.error || 'Failed to reorder artworks.' };
    }
    return { success: true, data: repoRes.data, error: null };
  }

  /**
   * Set cover artwork image for collection
   */
  static async setCoverArtwork(
    collectionId: string,
    coverImageUrlOrArtworkId: string
  ): Promise<CollectionResult<Collection>> {
    const repoRes = await collectionRepository.setCoverArtwork(collectionId, coverImageUrlOrArtworkId);
    if (!repoRes.success || !repoRes.data) {
      return { success: false, error: repoRes.error || 'Failed to set cover artwork.' };
    }
    return { success: true, data: repoRes.data, error: null };
  }

  /**
   * Search collections by Title, Description, or Artist
   */
  static async searchCollections(
    query: string,
    options?: CollectionFilterOptions
  ): Promise<CollectionResult<Collection[]>> {
    const repoRes = await collectionRepository.searchCollections(query, options);
    if (!repoRes.success || !repoRes.data) {
      return { success: false, error: repoRes.error || 'Failed to search collections.' };
    }
    return { success: true, data: repoRes.data, error: null };
  }

  /**
   * Fetch collection statistics for an artist
   */
  static async getCollectionStatistics(artistId: string): Promise<CollectionResult<CollectionStatistics>> {
    if (!artistId) {
      return { success: false, error: 'Artist ID is required.' };
    }
    const repoRes = await collectionRepository.getCollectionStatistics(artistId);
    if (!repoRes.success || !repoRes.data) {
      return { success: false, error: repoRes.error || 'Failed to fetch collection statistics.' };
    }
    return { success: true, data: repoRes.data, error: null };
  }
}
