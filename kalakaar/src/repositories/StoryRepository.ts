import { BaseRepository, RepositoryResponse } from './BaseRepository';
import { clampLimit, isUuid, sanitizeSearch, shouldCountView, slugify, pageRange, makePaged, isRangeError, type Paged } from './utils';

export type StoryStatus = 'draft' | 'published' | 'archived';

export type StoryCategory =
  | 'Artist Journey'
  | 'Behind the Art'
  | 'Tutorials'
  | 'Techniques'
  | 'Exhibitions'
  | 'Inspiration'
  | 'Art History'
  | 'News'
  | 'Tips'
  | 'Other';

export const STORY_CATEGORIES: StoryCategory[] = [
  'Artist Journey',
  'Behind the Art',
  'Tutorials',
  'Techniques',
  'Exhibitions',
  'Inspiration',
  'Art History',
  'News',
  'Tips',
  'Other',
];

export interface StoryProfile {
  id?: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  city?: string;
  state?: string;
  bio?: string;
}

export interface Story {
  id: string;
  artist_id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  cover_image_url?: string;
  category: StoryCategory;
  status: StoryStatus;
  read_time: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
  profiles?: StoryProfile;
}

export interface CreateStoryInput {
  artist_id: string;
  title: string;
  excerpt?: string;
  content: string;
  cover_image_url?: string;
  category: StoryCategory;
  status?: StoryStatus;
}

export interface UpdateStoryInput {
  title?: string;
  excerpt?: string;
  content?: string;
  cover_image_url?: string;
  category?: StoryCategory;
  status?: StoryStatus;
}

export interface StoryFilterOptions {
  category?: string;
  search?: string;
  status?: StoryStatus;
  artistId?: string;
  limit?: number;
  offset?: number;
}

export interface StoryStatistics {
  total_stories: number;
  published_stories: number;
  draft_stories: number;
  archived_stories: number;
  total_views: number;
}

const SELECT_FIELDS = '*, profiles:artist_id(id, display_name, username, avatar_url, city, state, bio)';

function normalizeStory(story: any): Story {
  const p = story.profiles;
  const name = p?.display_name || p?.username || 'Artist';
  return {
    ...story,
    excerpt: story.excerpt ?? '',
    read_time: story.read_time ?? '',
    profiles: p
      ? { ...p, full_name: name, display_name: name }
      : { id: story.artist_id, full_name: 'Artist', display_name: 'Artist', avatar_url: '/assets/defaults/avatar.svg' },
  } as Story;
}

const EDITABLE = ['title', 'excerpt', 'content', 'cover_image_url', 'category', 'read_time'] as const;

function toPatch(input: Record<string, any>): Record<string, any> {
  const patch: Record<string, any> = {};
  for (const k of EDITABLE) if (input[k] !== undefined) patch[k] = input[k];
  if (typeof patch.title === 'string') patch.title = patch.title.trim();
  if (typeof patch.cover_image_url === 'string' && !/^https:\/\//i.test(patch.cover_image_url)) patch.cover_image_url = null;
  if (patch.cover_image_url === '') patch.cover_image_url = null;
  if (['draft', 'published', 'archived'].includes(input.status)) patch.status = input.status;
  return patch;
}

export class StoryRepository extends BaseRepository {
  public async createStory(story: Story): Promise<RepositoryResponse<Story>> {
    try {
      const payload: Record<string, any> = {
        ...toPatch(story as any),
        artist_id: story.artist_id,
        status: ['draft', 'published', 'archived'].includes(story.status) ? story.status : 'draft',
        slug: slugify(story.title),
      };
      for (let attempt = 0; attempt < 2; attempt++) {
        const { data, error } = await this.client.from('stories').insert(payload).select(SELECT_FIELDS).single();
        if (error?.code === '23505' && /slug/.test(error.message)) { payload.slug = slugify(story.title); continue; }
        if (error) return this.handleError<Story>(error, 'Failed to create story');
        return this.handleSuccess<Story>(normalizeStory(data));
      }
      return this.handleError<Story>('Could not generate a unique link for this story. Please try again.');
    } catch (err) {
      return this.handleError<Story>(err, 'Failed to create story');
    }
  }

  public async updateStory(id: string, updates: Partial<Story>): Promise<RepositoryResponse<Story>> {
    try {
      const patch = toPatch(updates as any);
      if (Object.keys(patch).length === 0) return this.getStory(id);
      const { data, error } = await this.client.from('stories').update(patch).eq('id', id).select(SELECT_FIELDS).maybeSingle();
      if (error) return this.handleError<Story>(error, 'Failed to update story');
      if (!data) return this.handleError<Story>('Story not found or you do not have permission to edit it.');
      return this.handleSuccess<Story>(normalizeStory(data));
    } catch (err) {
      return this.handleError<Story>(err, 'Failed to update story');
    }
  }

  public async deleteStory(id: string): Promise<RepositoryResponse<boolean>> {
    try {
      const { data, error } = await this.client.from('stories').delete().eq('id', id).select('id');
      if (error) return this.handleError<boolean>(error, 'Failed to delete story');
      if (!data || data.length === 0) return this.handleError<boolean>('Story not found or you do not have permission to delete it.');
      return this.handleSuccess<boolean>(true);
    } catch (err) {
      return this.handleError<boolean>(err, 'Failed to delete story');
    }
  }

  public async publishStory(id: string): Promise<RepositoryResponse<Story>> {
    return this.updateStory(id, { status: 'published' });
  }

  public async archiveStory(id: string): Promise<RepositoryResponse<Story>> {
    return this.updateStory(id, { status: 'archived' });
  }

  public async saveDraft(story: Story): Promise<RepositoryResponse<Story>> {
    if (isUuid(story.id)) return this.updateStory(story.id, { ...story, status: 'draft' });
    return this.createStory({ ...story, status: 'draft' });
  }

  /** By id (uuid) or slug. Drafts are only visible to their owner (database rule). */
  public async getStory(idOrSlug: string): Promise<RepositoryResponse<Story>> {
    try {
      const col = isUuid(idOrSlug) ? 'id' : 'slug';
      const { data, error } = await this.client.from('stories').select(SELECT_FIELDS).eq(col, idOrSlug).maybeSingle();
      if (error) return this.handleError<Story>(error, 'Failed to load story');
      if (!data) return this.handleError<Story>('Story not found');
      return this.handleSuccess<Story>(normalizeStory(data));
    } catch (err) {
      return this.handleError<Story>(err, 'Failed to load story');
    }
  }

  public async getStoryBySlug(slug: string): Promise<RepositoryResponse<Story>> {
    return this.getStory(slug);
  }

  private async listPublished(build: (q: any) => any, limit: number): Promise<RepositoryResponse<Story[]>> {
    try {
      const q = build(this.client.from('stories').select(SELECT_FIELDS).eq('status', 'published')).limit(clampLimit(limit, 6, 60));
      const { data, error } = await q;
      if (error) return this.handleError<Story[]>(error, 'Failed to load stories');
      return this.handleSuccess<Story[]>((data || []).map(normalizeStory));
    } catch (err) {
      return this.handleError<Story[]>(err, 'Failed to load stories');
    }
  }

  /** Featured first, topped up with the newest stories. */
  public async getFeaturedStories(limit = 3): Promise<RepositoryResponse<Story[]>> {
    const featured = await this.listPublished((q) => q.eq('is_featured', true).order('published_at', { ascending: false }), limit);
    if (!featured.success || (featured.data?.length ?? 0) >= limit) return featured;
    const recent = await this.getRecentStories(limit);
    if (!recent.success) return featured;
    const have = new Set((featured.data || []).map((x) => x.id));
    return this.handleSuccess<Story[]>([...(featured.data || []), ...(recent.data || []).filter((x) => !have.has(x.id))].slice(0, limit));
  }

  public async getTrendingStories(limit = 6): Promise<RepositoryResponse<Story[]>> {
    return this.listPublished((q) => q.order('view_count', { ascending: false }).order('published_at', { ascending: false }), limit);
  }

  public async getRecentStories(limit = 6): Promise<RepositoryResponse<Story[]>> {
    return this.listPublished((q) => q.order('published_at', { ascending: false }), limit);
  }

  public async getArtistStories(
    artistId: string,
    options?: { includeDrafts?: boolean }
  ): Promise<RepositoryResponse<Story[]>> {
    try {
      let q = this.client.from('stories').select(SELECT_FIELDS).eq('artist_id', artistId);
      if (!options?.includeDrafts) q = q.eq('status', 'published');
      const { data, error } = await q.order('created_at', { ascending: false }).limit(100);
      if (error) return this.handleError<Story[]>(error, 'Failed to load stories');
      return this.handleSuccess<Story[]>((data || []).map(normalizeStory));
    } catch (err) {
      return this.handleError<Story[]>(err, 'Failed to load stories');
    }
  }

  /** One page of an artist's stories with the total count (public: published only; owner: includeDrafts). */
  public async getArtistStoriesPage(
    artistId: string,
    options?: { includeDrafts?: boolean; page?: number; pageSize?: number }
  ): Promise<RepositoryResponse<Paged<Story>>> {
    try {
      const r = pageRange(options?.page, options?.pageSize ?? 9, 50);
      const build = (sel: string, opts?: any) => {
        let q: any = this.client.from('stories').select(sel, opts).eq('artist_id', artistId);
        if (!options?.includeDrafts) q = q.eq('status', 'published');
        return q;
      };
      const { data, error, count } = await build(SELECT_FIELDS, { count: 'exact' })
        .order('created_at', { ascending: false }).order('id', { ascending: true }).range(r.from, r.to);
      if (error && isRangeError(error)) {
        const head: any = await build('id', { count: 'exact', head: true });
        return this.handleSuccess(makePaged<Story>([], head.count ?? 0, r));
      }
      if (error) return this.handleError<Paged<Story>>(error, 'Failed to load stories');
      return this.handleSuccess(makePaged<Story>((data || []).map(normalizeStory), count ?? (data || []).length, r));
    } catch (err) {
      return this.handleError<Paged<Story>>(err, 'Failed to load stories');
    }
  }

  private storyPageFilters(q: any, o: { category?: string; search?: string; featuredOnly?: boolean }) {
    q = q.eq('status', 'published');
    if (o.featuredOnly) q = q.eq('is_featured', true);
    if (o.category && o.category !== 'All') q = q.eq('category', o.category);
    const term = sanitizeSearch(o.search || '');
    if (term) q = q.or(`title.ilike.%${term}%,excerpt.ilike.%${term}%`);
    return q;
  }

  /** One page of published stories with the total number of matches (server-side pagination). */
  public async searchStoriesPage(o: { category?: string; search?: string; featuredOnly?: boolean; sort?: 'newest' | 'popular'; page?: number; pageSize?: number } = {}): Promise<RepositoryResponse<Paged<Story>>> {
    try {
      const r = pageRange(o.page, o.pageSize ?? 9, 50);
      const { data, error, count } = await this.storyPageFilters(this.client.from('stories').select(SELECT_FIELDS, { count: 'exact' }), o)
        .order(o.sort === 'popular' ? 'view_count' : 'published_at', { ascending: false })
        .order('published_at', { ascending: false })
        .order('id', { ascending: true })
        .range(r.from, r.to);
      if (error && isRangeError(error)) {
        const head: any = await this.storyPageFilters(this.client.from('stories').select('id', { count: 'exact', head: true }), o);
        return this.handleSuccess(makePaged<Story>([], head.count ?? 0, r));
      }
      if (error) return this.handleError<Paged<Story>>(error, 'Failed to load stories');
      return this.handleSuccess(makePaged<Story>((data || []).map(normalizeStory), count ?? (data || []).length, r));
    } catch (err) {
      return this.handleError<Paged<Story>>(err, 'Failed to load stories');
    }
  }

  public async searchStories(options?: StoryFilterOptions): Promise<RepositoryResponse<Story[]>> {
    try {
      const o = options || {};
      const limit = clampLimit(o.limit, 12, 50);
      const offset = Math.max(0, Math.floor(o.offset || 0));
      let q = this.client.from('stories').select(SELECT_FIELDS).eq('status', o.status && o.status !== 'published' && o.artistId ? o.status : 'published');
      if (o.artistId) q = q.eq('artist_id', o.artistId);
      if (o.category && o.category !== 'All') q = q.eq('category', o.category);
      const term = sanitizeSearch(o.search || '');
      if (term) q = q.or(`title.ilike.%${term}%,excerpt.ilike.%${term}%`);
      const { data, error } = await q.order('published_at', { ascending: false }).range(offset, offset + limit - 1);
      if (error) return this.handleError<Story[]>(error, 'Failed to load stories');
      return this.handleSuccess<Story[]>((data || []).map(normalizeStory));
    } catch (err) {
      return this.handleError<Story[]>(err, 'Failed to load stories');
    }
  }

  public async incrementView(id: string): Promise<RepositoryResponse<number>> {
    if (!isUuid(id) || !shouldCountView('story', id)) return this.handleSuccess<number>(0);
    try {
      await this.client.rpc('increment_view', { p_kind: 'story', p_id: id });
    } catch {
      /* ignore */
    }
    return this.handleSuccess<number>(0);
  }

  /** No share counter in the database; kept for API compatibility. */
  public async incrementShare(id: string): Promise<RepositoryResponse<number>> {
    void id;
    return this.handleSuccess<number>(0);
  }

  public async getStoryStatistics(artistId: string): Promise<RepositoryResponse<StoryStatistics>> {
    try {
      const { data, error } = await this.client.from('stories').select('status, view_count').eq('artist_id', artistId).limit(200);
      if (error) return this.handleError<StoryStatistics>(error, 'Failed to load statistics');
      const rows = data || [];
      return this.handleSuccess<StoryStatistics>({
        total_stories: rows.length,
        published_stories: rows.filter((r) => r.status === 'published').length,
        draft_stories: rows.filter((r) => r.status === 'draft').length,
        archived_stories: rows.filter((r) => r.status === 'archived').length,
        total_views: rows.reduce((n, r) => n + (r.view_count || 0), 0),
      });
    } catch (err) {
      return this.handleError<StoryStatistics>(err, 'Failed to load statistics');
    }
  }
}

export const storyRepository = new StoryRepository();
