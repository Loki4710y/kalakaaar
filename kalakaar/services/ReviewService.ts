import { reviewRepository, Review } from '../src/repositories/ReviewRepository';
import { NotificationService } from './NotificationService';
import { memoryCache } from '../src/lib/cache';

export type { Review };

export interface ReviewResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string | null;
}

export class ReviewService {
  /**
   * Submits a new review for an artist.
   */
  static async createReview(
    artistId: string,
    userId: string,
    userName: string,
    userAvatar: string | null,
    rating: number,
    comment?: string
  ): Promise<ReviewResult<Review>> {
    try {
      if (!userId || userId.trim() === '') {
        return { success: false, error: 'Please sign in to post a review.' };
      }

      if (!artistId || artistId.trim() === '') {
        return { success: false, error: 'Artist ID is required.' };
      }

      // Rule: Artist cannot review themselves
      if (artistId === userId) {
        return { success: false, error: 'You cannot post a review on your own artist profile.' };
      }

      // Validation: Rating 1 - 5
      if (!rating || rating < 1 || rating > 5) {
        return { success: false, error: 'Rating must be between 1 and 5 stars.' };
      }

      // Validation: Comment length max 500 characters
      if (comment && comment.length > 500) {
        return { success: false, error: 'Review text cannot exceed 500 characters.' };
      }

      const existingRes = await reviewRepository.getArtistReviews(artistId);
      const currentReviews = existingRes.data || [];

      // Rule: Only one review per user per artist
      const existing = currentReviews.find((r) => r.user_id === userId);
      if (existing) {
        return {
          success: false,
          error: 'You have already reviewed this artist. You can edit your existing review.',
        };
      }

      const now = new Date().toISOString();
      const newReview: Review = {
        id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        artist_id: artistId,
        user_id: userId,
        user_name: userName || 'Art Enthusiast',
        user_avatar: userAvatar,
        rating: Math.round(rating),
        comment: comment?.trim() || '',
        created_at: now,
        updated_at: now,
      };

      const repoRes = await reviewRepository.createReview(newReview);
      if (!repoRes.success || !repoRes.data) {
        return { success: false, error: repoRes.error || 'Failed to submit review.' };
      }

      // Notify artist
      try {
        await NotificationService.createNotification(
          artistId,
          'New Review Received! ⭐',
          `${userName || 'A collector'} rated your profile ${'★'.repeat(newReview.rating)} (${newReview.rating}/5)`,
          'new_review',
          newReview.id
        );
      } catch {
        // ignore
      }

      memoryCache.invalidate();
      return {
        success: true,
        data: repoRes.data,
        error: null,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit review.';
      return { success: false, error: message };
    }
  }

  /**
   * Updates an existing review.
   */
  static async updateReview(
    reviewId: string,
    userId: string,
    artistId: string,
    rating: number,
    comment?: string
  ): Promise<ReviewResult<Review>> {
    try {
      if (!userId || !reviewId || !artistId) {
        return { success: false, error: 'Required fields missing.' };
      }

      if (!rating || rating < 1 || rating > 5) {
        return { success: false, error: 'Rating must be between 1 and 5 stars.' };
      }

      if (comment && comment.length > 500) {
        return { success: false, error: 'Review text cannot exceed 500 characters.' };
      }

      const existingRes = await reviewRepository.getArtistReviews(artistId);
      const currentReviews = existingRes.data || [];
      const target = currentReviews.find((r) => r.id === reviewId);

      if (!target) {
        return { success: false, error: 'Review not found.' };
      }

      if (target.user_id !== userId) {
        return { success: false, error: 'You can only edit your own review.' };
      }

      const updates: Partial<Review> = {
        rating: Math.round(rating),
        comment: comment?.trim() || '',
        updated_at: new Date().toISOString(),
      };

      const repoRes = await reviewRepository.updateReview(reviewId, updates);
      if (!repoRes.success || !repoRes.data) {
        return { success: false, error: repoRes.error || 'Failed to update review.' };
      }

      memoryCache.invalidate();
      return {
        success: true,
        data: repoRes.data,
        error: null,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update review.';
      return { success: false, error: message };
    }
  }

  /**
   * Deletes a review.
   */
  static async deleteReview(
    reviewId: string,
    userId: string,
    artistId: string
  ): Promise<ReviewResult<boolean>> {
    try {
      if (!userId || !reviewId || !artistId) {
        return { success: false, error: 'Parameters missing.' };
      }

      const existingRes = await reviewRepository.getArtistReviews(artistId);
      const currentReviews = existingRes.data || [];
      const target = currentReviews.find((r) => r.id === reviewId);

      if (!target) {
        return { success: false, error: 'Review not found.' };
      }

      if (target.user_id !== userId) {
        return { success: false, error: 'You can only delete your own review.' };
      }

      const repoRes = await reviewRepository.deleteReview(reviewId, artistId);
      memoryCache.invalidate();
      return {
        success: repoRes.success,
        data: repoRes.data || false,
        error: repoRes.error,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete review.';
      return { success: false, error: message };
    }
  }

  /**
   * Gets all reviews for an artist with optional sorting.
   */
  static async getReviews(
    artistId: string,
    sortBy: 'newest' | 'highest' | 'lowest' = 'newest'
  ): Promise<ReviewResult<Review[]>> {
    try {
      if (!artistId) {
        return { success: true, data: [], error: null };
      }

      const repoRes = await reviewRepository.getArtistReviews(artistId, sortBy);
      return {
        success: repoRes.success,
        data: repoRes.data || [],
        error: repoRes.error,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch reviews.';
      return { success: false, error: message, data: [] };
    }
  }

  /**
   * Calculates average rating for an artist.
   */
  static async getAverageRating(artistId: string): Promise<number> {
    if (!artistId) return 0;
    const res = await reviewRepository.getAverageRating(artistId);
    return res.data || 0;
  }

  /**
   * Gets total number of reviews for an artist.
   */
  static async getReviewCount(artistId: string): Promise<number> {
    if (!artistId) return 0;
    const res = await reviewRepository.getReviewCount(artistId);
    return res.data || 0;
  }
}
