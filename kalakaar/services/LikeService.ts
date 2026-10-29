import { likeRepository } from '../src/repositories/LikeRepository';
import { ArtworkService } from './ArtworkService';
import { memoryCache } from '../src/lib/cache';

export interface LikeResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string | null;
}

export class LikeService {
  /**
   * Fetch artwork IDs liked by a user.
   */
  static async getUserLikes(userId: string): Promise<LikeResult<string[]>> {
    try {
      if (!userId) return { success: true, data: [], error: null };
      const res = await likeRepository.getUserLikedArtworks(userId);
      return { success: res.success, data: res.data || [], error: res.error };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch user likes.';
      return { success: false, error: message, data: [] };
    }
  }
  /**
   * Likes an artwork for a user.
   * Users cannot like their own artworks.
   */
  static async likeArtwork(
    artworkId: string,
    userId: string
  ): Promise<LikeResult<{ liked: boolean; count: number }>> {
    try {
      if (!userId || userId.trim() === '') {
        return {
          success: false,
          error: 'Please log in to like artworks.',
        };
      }

      if (!artworkId || artworkId.trim() === '') {
        return {
          success: false,
          error: 'Artwork ID is required.',
        };
      }

      // Check if artwork exists and verify artist_id (users cannot like own artworks)
      const artworkRes = await ArtworkService.getArtwork(artworkId);
      if (!artworkRes.success || !artworkRes.data) {
        return {
          success: false,
          error: artworkRes.error || 'Artwork not found.',
        };
      }

      const artwork = artworkRes.data;

      // Rule: Users cannot like their own artworks
      if (artwork.artist_id === userId) {
        return {
          success: false,
          error: 'You cannot like your own artwork.',
        };
      }

      // Check if already liked
      const hasLikedRes = await likeRepository.hasLiked(artworkId, userId);
      if (hasLikedRes.data) {
        const currentCount = await this.getLikeCount(artworkId);
        return {
          success: true,
          data: { liked: true, count: currentCount },
          error: null,
        };
      }

      const repoRes = await likeRepository.likeArtwork(artworkId, userId);
      if (!repoRes.success) {
        return {
          success: false,
          error: repoRes.error || 'Failed to like artwork.',
        };
      }

      // Increment like count in ArtworkService
      const newCount = (artwork.like_count || 0) + 1;
      await ArtworkService.updateArtwork(artworkId, { like_count: newCount });

      memoryCache.invalidate();
      return {
        success: true,
        data: { liked: true, count: newCount },
        error: null,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to like artwork.';
      return { success: false, error: message };
    }
  }

  /**
   * Removes a like from an artwork.
   */
  static async unlikeArtwork(
    artworkId: string,
    userId: string
  ): Promise<LikeResult<{ liked: boolean; count: number }>> {
    try {
      if (!userId || userId.trim() === '') {
        return {
          success: false,
          error: 'Please log in to manage your likes.',
        };
      }

      if (!artworkId || artworkId.trim() === '') {
        return {
          success: false,
          error: 'Artwork ID is required.',
        };
      }

      const repoRes = await likeRepository.unlikeArtwork(artworkId, userId);
      if (!repoRes.success) {
        return {
          success: false,
          error: repoRes.error || 'Failed to remove like.',
        };
      }

      // Decrement like count in ArtworkService
      const artworkRes = await ArtworkService.getArtwork(artworkId);
      const currentCount = artworkRes.data?.like_count || 0;
      const newCount = Math.max(0, currentCount - 1);

      await ArtworkService.updateArtwork(artworkId, { like_count: newCount });

      memoryCache.invalidate();
      return {
        success: true,
        data: { liked: false, count: newCount },
        error: null,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove like.';
      return { success: false, error: message };
    }
  }

  /**
   * Checks if a user has liked a specific artwork.
   */
  static async hasLiked(artworkId: string, userId?: string): Promise<boolean> {
    if (!userId || !artworkId) return false;
    const res = await likeRepository.hasLiked(artworkId, userId);
    return !!res.data;
  }

  /**
   * Gets the total like count for an artwork.
   */
  static async getLikeCount(artworkId: string): Promise<number> {
    if (!artworkId) return 0;
    const countRes = await likeRepository.getLikeCount(artworkId);
    if (countRes.success && typeof countRes.data === 'number') {
      return countRes.data;
    }

    const artworkRes = await ArtworkService.getArtwork(artworkId);
    if (artworkRes.success && artworkRes.data) {
      return artworkRes.data.like_count || 0;
    }

    return 0;
  }
}
