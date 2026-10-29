import type { Paged } from '../src/repositories/utils';
import {
  storyRepository,
  Story,
  StoryStatus,
  StoryCategory,
  STORY_CATEGORIES,
  CreateStoryInput,
  UpdateStoryInput,
  StoryFilterOptions,
  StoryStatistics,
} from '../src/repositories/StoryRepository';
import { memoryCache } from '../src/lib/cache';

export type {
  Story,
  StoryStatus,
  StoryCategory,
  CreateStoryInput,
  UpdateStoryInput,
  StoryFilterOptions,
  StoryStatistics,
};
export { STORY_CATEGORIES };

export interface StoryResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string | null;
}

export class StoryService {
  /**
   * Helper to generate clean URL slug from title
   */
  static generateSlug(title: string): string {
    const base = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `${base || 'story'}-${Math.random().toString(36).substring(2, 7)}`;
  }

  /**
   * Automatically calculate read time based on article length.
   * Standard reading speed: ~200 words per minute.
   */
  static calculateReadTime(content: string): string {
    if (!content) return '1 min read';
    const plainText = content.replace(/<[^>]*>/g, ' ').trim();
    const words = plainText.split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return `${minutes} min read`;
  }

  /**
   * Get a single story by ID or Slug
   */
  static async getStory(idOrSlug: string): Promise<StoryResult<Story>> {
    try {
      if (!idOrSlug) {
        return { success: false, error: 'Story identifier is required.' };
      }
      const repoRes = await storyRepository.getStory(idOrSlug);
      if (!repoRes.success || !repoRes.data) {
        return { success: false, error: repoRes.error || 'Story not found.' };
      }
      return { success: true, data: repoRes.data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch story';
      return { success: false, error: message };
    }
  }

  /**
   * Get featured stories for homepage / explore highlights
   */
  static async getFeaturedStories(limit = 3): Promise<StoryResult<Story[]>> {
    try {
      const cacheKey = `featured_stories_${limit}`;
      const cached = memoryCache.get<Story[]>(cacheKey);
      if (cached) return { success: true, data: cached, error: null };

      const repoRes = await storyRepository.getFeaturedStories(limit);
      if (!repoRes.success || !repoRes.data) {
        return { success: false, error: repoRes.error || 'Failed to fetch featured stories' };
      }
      memoryCache.set(cacheKey, repoRes.data, 60000);
      return { success: true, data: repoRes.data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch featured stories';
      return { success: false, error: message };
    }
  }

  /**
   * Get stories by artist ID
   */
  /** One page of an artist's stories plus the total count (server-side pagination). */
  static async getArtistStoriesPage(
    artistId: string,
    options?: { includeDrafts?: boolean; page?: number; pageSize?: number }
  ): Promise<StoryResult<Paged<Story>>> {
    if (!artistId) return { success: false, error: 'Artist ID is required.' };
    const repoRes = await storyRepository.getArtistStoriesPage(artistId, options);
    if (!repoRes.success || !repoRes.data) return { success: false, error: repoRes.error || 'Failed to fetch artist stories' };
    return { success: true, data: repoRes.data, error: null };
  }

  static async getArtistStories(
    artistId: string,
    options?: { includeDrafts?: boolean }
  ): Promise<StoryResult<Story[]>> {
    try {
      if (!artistId) {
        return { success: false, error: 'Artist ID is required.' };
      }
      const repoRes = await storyRepository.getArtistStories(artistId, options);
      if (!repoRes.success || !repoRes.data) {
        return { success: false, error: repoRes.error || 'Failed to fetch artist stories' };
      }
      return { success: true, data: repoRes.data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch artist stories';
      return { success: false, error: message };
    }
  }

  /**
   * Search and filter stories for Explore Stories page
   */
  static async searchStories(options?: StoryFilterOptions): Promise<StoryResult<Story[]>> {
    try {
      const repoRes = await storyRepository.searchStories(options);
      if (!repoRes.success || !repoRes.data) {
        return { success: false, error: repoRes.error || 'Failed to search stories' };
      }
      return { success: true, data: repoRes.data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to search stories';
      return { success: false, error: message };
    }
  }

  /**
   * Create a new story
   */
  static async createStory(input: CreateStoryInput): Promise<StoryResult<Story>> {
    try {
      // Validate title
      if (!input.title || !input.title.trim()) {
        return { success: false, error: 'Title is required.' };
      }
      if (input.title.length > 150) {
        return { success: false, error: 'Title cannot exceed 150 characters.' };
      }

      // Validate excerpt if present
      if (input.excerpt && input.excerpt.length > 300) {
        return { success: false, error: 'Excerpt cannot exceed 300 characters.' };
      }

      // Validate content if published
      const isPublishing = input.status === 'published';
      if (isPublishing) {
        if (!input.content || input.content.trim().length < 100) {
          return {
            success: false,
            error: 'Article content must be at least 100 characters to publish.',
          };
        }
      }

      const id = `story-${Date.now()}`;
      const now = new Date().toISOString();
      const status: StoryStatus = input.status || 'draft';
      const read_time = this.calculateReadTime(input.content || '');

      const newStory: Story = {
        id,
        artist_id: input.artist_id,
        title: input.title.trim(),
        slug: this.generateSlug(input.title),
        excerpt: input.excerpt?.trim(),
        content: input.content || '',
        cover_image_url: input.cover_image_url,
        category: input.category || 'Artist Journey',
        status,
        read_time,
        view_count: 0,
        created_at: now,
        updated_at: now,
        published_at: status === 'published' ? now : null,
        profiles: {
          id: input.artist_id,
          full_name: 'Artist',
          avatar_url: '/assets/defaults/avatar.svg',
        },
      };

      const repoRes = await storyRepository.createStory(newStory);
      if (!repoRes.success || !repoRes.data) {
        return { success: false, error: repoRes.error || 'Failed to create story' };
      }

      memoryCache.invalidate();
      return { success: true, data: repoRes.data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create story';
      return { success: false, error: message };
    }
  }

  /**
   * Update an existing story
   */
  static async updateStory(id: string, input: UpdateStoryInput): Promise<StoryResult<Story>> {
    try {
      if (!id) {
        return { success: false, error: 'Story ID is required.' };
      }

      const existingRes = await this.getStory(id);
      if (!existingRes.success || !existingRes.data) {
        return { success: false, error: 'Story not found.' };
      }

      const existing = existingRes.data;

      // Validate title if updating
      if (input.title !== undefined) {
        if (!input.title.trim()) {
          return { success: false, error: 'Title is required.' };
        }
        if (input.title.length > 150) {
          return { success: false, error: 'Title cannot exceed 150 characters.' };
        }
      }

      // Validate excerpt
      if (input.excerpt !== undefined && input.excerpt.length > 300) {
        return { success: false, error: 'Excerpt cannot exceed 300 characters.' };
      }

      // Validate content if setting to published
      const targetStatus = input.status !== undefined ? input.status : existing.status;
      const targetContent = input.content !== undefined ? input.content : existing.content;

      if (targetStatus === 'published' && (!targetContent || targetContent.trim().length < 100)) {
        return {
          success: false,
          error: 'Article content must be at least 100 characters to publish.',
        };
      }

      const now = new Date().toISOString();
      const updatedStoryPayload: Partial<Story> = {
        title: input.title !== undefined ? input.title.trim() : existing.title,
        slug: input.title !== undefined ? this.generateSlug(input.title) : existing.slug,
        excerpt: input.excerpt !== undefined ? input.excerpt.trim() : existing.excerpt,
        content: targetContent,
        cover_image_url: input.cover_image_url !== undefined ? input.cover_image_url : existing.cover_image_url,
        category: input.category !== undefined ? input.category : existing.category,
        status: targetStatus,
        read_time: this.calculateReadTime(targetContent),
        updated_at: now,
        published_at:
          targetStatus === 'published' && !existing.published_at ? now : existing.published_at,
      };

      const repoRes = await storyRepository.updateStory(id, updatedStoryPayload);
      if (!repoRes.success || !repoRes.data) {
        return { success: false, error: repoRes.error || 'Failed to update story' };
      }

      memoryCache.invalidate();
      return { success: true, data: repoRes.data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update story';
      return { success: false, error: message };
    }
  }

  /**
   * Save draft (create or update with status='draft')
   */
  static async saveDraft(
    input: Partial<CreateStoryInput> & { id?: string; artist_id?: string }
  ): Promise<StoryResult<Story>> {
    try {
      if (input.id) {
        return this.updateStory(input.id, {
          ...input,
          status: 'draft',
        });
      }

      if (!input.artist_id) {
        return { success: false, error: 'Artist ID is required to save a draft.' };
      }

      return this.createStory({
        artist_id: input.artist_id,
        title: input.title?.trim() || 'Untitled Story Draft',
        excerpt: input.excerpt,
        content: input.content || '',
        cover_image_url: input.cover_image_url,
        category: input.category || 'Artist Journey',
        status: 'draft',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save draft';
      return { success: false, error: message };
    }
  }

  /**
   * Publish story
   */
  static async publishStory(id: string): Promise<StoryResult<Story>> {
    const repoRes = await storyRepository.publishStory(id);
    if (!repoRes.success || !repoRes.data) {
      return { success: false, error: repoRes.error || 'Failed to publish story' };
    }
    memoryCache.invalidate();
    return { success: true, data: repoRes.data, error: null };
  }

  /**
   * Archive story
   */
  static async archiveStory(id: string): Promise<StoryResult<Story>> {
    const repoRes = await storyRepository.archiveStory(id);
    if (!repoRes.success || !repoRes.data) {
      return { success: false, error: repoRes.error || 'Failed to archive story' };
    }
    memoryCache.invalidate();
    return { success: true, data: repoRes.data, error: null };
  }

  /**
   * Delete story
   */
  static async deleteStory(id: string): Promise<StoryResult<void>> {
    try {
      if (!id) {
        return { success: false, error: 'Story ID is required.' };
      }
      const repoRes = await storyRepository.deleteStory(id);
      if (!repoRes.success) {
        return { success: false, error: repoRes.error || 'Failed to delete story' };
      }
      memoryCache.invalidate();
      return { success: true, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete story';
      return { success: false, error: message };
    }
  }

  /**
   * Fetch story statistics for an artist
   */
  static async getStoryStatistics(artistId: string): Promise<StoryResult<StoryStatistics>> {
    try {
      if (!artistId) {
        return { success: false, error: 'Artist ID is required.' };
      }
      const repoRes = await storyRepository.getStoryStatistics(artistId);
      if (!repoRes.success || !repoRes.data) {
        return { success: false, error: repoRes.error || 'Failed to fetch story statistics' };
      }
      return { success: true, data: repoRes.data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch story statistics';
      return { success: false, error: message };
    }
  }
}
