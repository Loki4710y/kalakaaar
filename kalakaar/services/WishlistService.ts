import type { Paged } from '../src/repositories/utils';
import { wishlistRepository } from '../src/repositories/WishlistRepository';
import { ArtworkService, Artwork } from './ArtworkService';
import { memoryCache } from '../src/lib/cache';

export interface WishlistResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string | null;
}

export class WishlistService {
  /**
   * Saves an artwork to user's private wishlist.
   */
  static async saveArtwork(
    artworkId: string,
    userId: string
  ): Promise<WishlistResult<{ saved: boolean }>> {
    try {
      if (!userId || userId.trim() === '') {
        return {
          success: false,
          error: 'Please log in to save artworks to your wishlist.',
        };
      }

      if (!artworkId || artworkId.trim() === '') {
        return {
          success: false,
          error: 'Artwork ID is required.',
        };
      }

      const isSavedRes = await wishlistRepository.isSaved(userId, artworkId, 'artwork');
      if (isSavedRes.data) {
        return {
          success: true,
          data: { saved: true },
          error: null,
        };
      }

      const repoRes = await wishlistRepository.addToWishlist(userId, artworkId, 'artwork');
      if (!repoRes.success) {
        return {
          success: false,
          error: repoRes.error || 'Failed to save artwork.',
        };
      }

      // Increment artwork wishlist_count in ArtworkService
      const artworkRes = await ArtworkService.getArtwork(artworkId);
      if (artworkRes.success && artworkRes.data) {
        const currentCount = artworkRes.data.wishlist_count || 0;
        await ArtworkService.updateArtwork(artworkId, {
          wishlist_count: currentCount + 1,
        });
      }

      memoryCache.invalidate();
      return {
        success: true,
        data: { saved: true },
        error: null,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save artwork.';
      return { success: false, error: message };
    }
  }

  /**
   * Removes an artwork from user's wishlist.
   */
  static async removeArtwork(
    artworkId: string,
    userId: string
  ): Promise<WishlistResult<{ saved: boolean }>> {
    try {
      if (!userId || userId.trim() === '') {
        return {
          success: false,
          error: 'Please log in to manage your wishlist.',
        };
      }

      if (!artworkId || artworkId.trim() === '') {
        return {
          success: false,
          error: 'Artwork ID is required.',
        };
      }

      const repoRes = await wishlistRepository.removeFromWishlist(userId, artworkId, 'artwork');
      if (!repoRes.success) {
        return {
          success: false,
          error: repoRes.error || 'Failed to remove artwork from wishlist.',
        };
      }

      // Decrement artwork wishlist_count in ArtworkService
      const artworkRes = await ArtworkService.getArtwork(artworkId);
      if (artworkRes.success && artworkRes.data) {
        const currentCount = artworkRes.data.wishlist_count || 0;
        await ArtworkService.updateArtwork(artworkId, {
          wishlist_count: Math.max(0, currentCount - 1),
        });
      }

      memoryCache.invalidate();
      return {
        success: true,
        data: { saved: false },
        error: null,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove artwork from wishlist.';
      return { success: false, error: message };
    }
  }

  /**
   * Checks if an artwork is saved in a user's wishlist.
   */
  static async isSaved(artworkId: string, userId?: string): Promise<boolean> {
    if (!userId || !artworkId) return false;
    const res = await wishlistRepository.isSaved(userId, artworkId, 'artwork');
    return !!res.data;
  }

  /**
   * One page of the user's private wishlist, fetched in a single database query.
   */
  static async getWishlistPage(userId: string, page = 1, pageSize = 12): Promise<WishlistResult<Paged<Artwork>>> {
    if (!userId || userId.trim() === '') {
      return { success: false, error: 'Please log in to view your private wishlist.' };
    }
    const res = await wishlistRepository.getWishlistPage(userId, { page, pageSize });
    if (!res.success || !res.data) return { success: false, error: res.error || 'Failed to retrieve wishlist.' };
    return { success: true, data: res.data, error: null };
  }

  /** Ids of saved artworks (one light query) so hearts show as filled across the site. */
  static async getSavedIds(userId: string): Promise<string[]> {
    if (!userId) return [];
    const res = await wishlistRepository.getWishlist(userId, 'artwork');
    return res.data || [];
  }
}
