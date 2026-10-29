import { followRepository } from '../src/repositories/FollowRepository';
import { NotificationService } from './NotificationService';
import { memoryCache } from '../src/lib/cache';

export interface FollowResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string | null;
}

export class FollowService {
  /**
   * Follows an artist.
   * Users cannot follow themselves.
   */
  static async followArtist(
    artistId: string,
    followerId: string,
    followerName?: string
  ): Promise<FollowResult<{ following: boolean; followerCount: number }>> {
    try {
      if (!followerId || followerId.trim() === '') {
        return {
          success: false,
          error: 'Please sign in to follow artists.',
        };
      }

      if (!artistId || artistId.trim() === '') {
        return {
          success: false,
          error: 'Artist ID is required.',
        };
      }

      // Rule: Users cannot follow themselves
      if (artistId === followerId) {
        return {
          success: false,
          error: 'You cannot follow yourself.',
        };
      }

      // Check if already following
      const isFollowingRes = await followRepository.isFollowing(artistId, followerId);
      if (isFollowingRes.data) {
        const currentCount = await this.getFollowerCount(artistId);
        return {
          success: true,
          data: { following: true, followerCount: currentCount },
          error: null,
        };
      }

      const repoRes = await followRepository.follow(artistId, followerId);
      if (!repoRes.success) {
        return {
          success: false,
          error: repoRes.error || 'Failed to follow artist.',
        };
      }

      const updatedCount = await this.getFollowerCount(artistId);

      // Trigger notification for artist
      try {
        await NotificationService.createNotification(
          artistId,
          'New Follower! 🎉',
          `${followerName || 'An art lover'} started following your profile.`,
          'new_follower',
          followerId
        );
      } catch {
        // ignore notification error
      }

      memoryCache.invalidate();
      return {
        success: true,
        data: { following: true, followerCount: updatedCount },
        error: null,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to follow artist.';
      return { success: false, error: message };
    }
  }

  /**
   * Unfollows an artist.
   */
  static async unfollowArtist(
    artistId: string,
    followerId: string
  ): Promise<FollowResult<{ following: boolean; followerCount: number }>> {
    try {
      if (!followerId || followerId.trim() === '') {
        return {
          success: false,
          error: 'Please sign in to manage follows.',
        };
      }

      if (!artistId || artistId.trim() === '') {
        return {
          success: false,
          error: 'Artist ID is required.',
        };
      }

      const repoRes = await followRepository.unfollow(artistId, followerId);
      if (!repoRes.success) {
        return {
          success: false,
          error: repoRes.error || 'Failed to unfollow artist.',
        };
      }

      const updatedCount = await this.getFollowerCount(artistId);

      memoryCache.invalidate();
      return {
        success: true,
        data: { following: false, followerCount: updatedCount },
        error: null,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to unfollow artist.';
      return { success: false, error: message };
    }
  }

  /**
   * Checks if user is following an artist.
   */
  static async isFollowing(artistId: string, followerId?: string): Promise<boolean> {
    if (!followerId || !artistId) return false;
    const res = await followRepository.isFollowing(artistId, followerId);
    return !!res.data;
  }

  /**
   * Gets list of follower IDs for an artist.
   */
  static async getFollowers(artistId: string): Promise<FollowResult<string[]>> {
    try {
      const res = await followRepository.getFollowers(artistId);
      return { success: res.success, data: res.data || [], error: res.error };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch followers.';
      return { success: false, error: message, data: [] };
    }
  }

  /**
   * Gets list of artist IDs that a user is following.
   */
  static async getFollowing(followerId: string): Promise<FollowResult<string[]>> {
    try {
      if (!followerId) return { success: true, data: [], error: null };
      const res = await followRepository.getFollowing(followerId);
      return { success: res.success, data: res.data || [], error: res.error };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch following artists.';
      return { success: false, error: message, data: [] };
    }
  }

  /**
   * Gets the total follower count for an artist.
   */
  static async getFollowerCount(artistId: string): Promise<number> {
    if (!artistId) return 0;
    const res = await followRepository.getFollowerCount(artistId);
    return res.data || 0;
  }
}
