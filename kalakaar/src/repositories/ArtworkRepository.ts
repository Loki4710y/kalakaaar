import { BaseRepository, RepositoryResponse } from './BaseRepository';
import { attachContacts, clampLimit, cleanImageUrls, isUuid, sanitizeSearch, shouldCountView, slugify, categoryVariants, pageRange, makePaged, isRangeError, type Paged } from './utils';

export type ArtworkStatus = 'draft' | 'published' | 'archived';

export interface ArtworkProfile {
  id?: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  whatsapp_number?: string;
}

export interface Artwork {
  id: string;
  artist_id: string;
  title: string;
  slug: string;
  description: string;
  image_urls: string[];
  cover_image_index: number;
  category: string;
  medium: string;
  tags: string[];
  creation_year: number;
  dimensions: string;
  materials: string;
  price?: number;
  status: ArtworkStatus;
  is_sold?: boolean;
  sold_visibility?: string;
  is_featured: boolean;
  view_count: number;
  like_count: number;
  wishlist_count: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  profiles?: ArtworkProfile;
}

export interface ArtworkFilterOptions {
  category?: string;
  search?: string;
  status?: ArtworkStatus;
  artistId?: string;
  limit?: number;
  offset?: number;
  minPrice?: number;
  maxPrice?: number;
  medium?: string;
  featuredOnly?: boolean;
  sortBy?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'popular' | 'featured';
}

export interface ArtworkStatistics {
  total_artworks: number;
  published_artworks: number;
  draft_artworks: number;
  archived_artworks: number;
  total_views: number;
  total_likes: number;
  total_wishlists: number;
}

const SELECT_FIELDS = '*, profiles:artist_id(id, display_name, username, avatar_url, is_verified)';

export function normalizeArtwork(art: any): Artwork {
  const p = art.profiles;
  const name = p?.display_name || p?.username || 'Artist';
  return {
    ...art,
    description: art.description ?? '',
    medium: art.medium ?? '',
    dimensions: art.dimensions ?? '',
    materials: art.materials ?? '',
    creation_year: art.creation_year ?? 0,
    price: art.price == null ? undefined : Number(art.price),
    image_urls: art.image_urls?.length ? art.image_urls : ['/assets/defaults/artwork.svg'],
    profiles: p
      ? { ...p, full_name: name, display_name: name }
      : { id: art.artist_id, full_name: 'Artist', display_name: 'Artist', avatar_url: '/assets/defaults/avatar.svg' },
  } as Artwork;
}

const EDITABLE = [
  'title', 'description', 'cover_image_index', 'category', 'medium', 'tags', 'creation_year',
  'dimensions', 'materials', 'price', 'is_sold', 'sold_visibility',
] as const;

/** Turns UI input into a database-safe patch (allow-list; maps legacy 'sold'/'available' statuses). */
function toPatch(input: Record<string, any>): Record<string, any> {
  const patch: Record<string, any> = {};
  for (const k of EDITABLE) if (input[k] !== undefined) patch[k] = input[k];
  if (input.image_urls !== undefined) patch.image_urls = cleanImageUrls(input.image_urls);
  if (typeof patch.title === 'string') patch.title = patch.title.trim();
  if (typeof patch.category === 'string') patch.category = patch.category.trim();
  if (patch.price === undefined && 'price' in input) patch.price = null;
  if (patch.price === null || Number.isNaN(patch.price)) patch.price = null;
  if (patch.creation_year === 0) patch.creation_year = null;
  const st = input.status;
  if (st === 'draft' || st === 'published' || st === 'archived') patch.status = st;
  if (st === 'sold') { patch.status = 'published'; patch.is_sold = true; }
  if (st === 'available') { patch.status = 'published'; patch.is_sold = false; }
  return patch;
}

export class ArtworkRepository extends BaseRepository {
  private async finish(rows: any[]): Promise<Artwork[]> {
    const list = rows.map(normalizeArtwork);
    await attachContacts(this.client, list.map((a) => a.profiles).filter(Boolean));
    return list;
  }

  public async createArtwork(artwork: Artwork): Promise<RepositoryResponse<Artwork>> {
    try {
      const payload: Record<string, any> = {
        ...toPatch(artwork as any),
        artist_id: artwork.artist_id,
        status: ['draft', 'published', 'archived'].includes(artwork.status) ? artwork.status : 'draft',
        slug: slugify(artwork.title),
      };
      if (isUuid(artwork.id)) payload.id = artwork.id;
      for (let attempt = 0; attempt < 2; attempt++) {
        const { data, error } = await this.client.from('artworks').insert(payload).select(SELECT_FIELDS).single();
        if (error?.code === '23505' && /slug/.test(error.message)) { payload.slug = slugify(artwork.title); continue; }
        if (error) return this.handleError<Artwork>(error, 'Failed to create artwork');
        return this.handleSuccess<Artwork>(normalizeArtwork(data));
      }
      return this.handleError<Artwork>('Could not generate a unique link for this artwork. Please try again.');
    } catch (err) {
      return this.handleError<Artwork>(err, 'Failed to create artwork');
    }
  }

  public async updateArtwork(id: string, updates: Partial<Artwork>): Promise<RepositoryResponse<Artwork>> {
    try {
      const patch = toPatch(updates as any);
      if (Object.keys(patch).length === 0) return this.getArtwork(id);
      const { data, error } = await this.client.from('artworks').update(patch).eq('id', id).select(SELECT_FIELDS).maybeSingle();
      if (error) return this.handleError<Artwork>(error, 'Failed to update artwork');
      if (!data) return this.handleError<Artwork>('Artwork not found or you do not have permission to edit it.');
      return this.handleSuccess<Artwork>(normalizeArtwork(data));
    } catch (err) {
      return this.handleError<Artwork>(err, 'Failed to update artwork');
    }
  }

  public async deleteArtwork(id: string): Promise<RepositoryResponse<boolean>> {
    try {
      const { data, error } = await this.client.from('artworks').delete().eq('id', id).select('id');
      if (error) return this.handleError<boolean>(error, 'Failed to delete artwork');
      if (!data || data.length === 0) return this.handleError<boolean>('Artwork not found or you do not have permission to delete it.');
      return this.handleSuccess<boolean>(true);
    } catch (err) {
      return this.handleError<boolean>(err, 'Failed to delete artwork');
    }
  }

  public async publishArtwork(id: string): Promise<RepositoryResponse<Artwork>> {
    return this.updateArtworkStatus(id, 'published');
  }

  public async archiveArtwork(id: string): Promise<RepositoryResponse<Artwork>> {
    return this.updateArtworkStatus(id, 'archived');
  }

  public async saveDraft(artwork: Artwork): Promise<RepositoryResponse<Artwork>> {
    if (isUuid(artwork.id)) return this.updateArtwork(artwork.id, { ...artwork, status: 'draft' });
    return this.createArtwork({ ...artwork, status: 'draft' });
  }

  /** By id (uuid) or slug. Drafts are only returned to their owner (database rule). */
  public async getArtwork(id: string): Promise<RepositoryResponse<Artwork>> {
    try {
      const col = isUuid(id) ? 'id' : 'slug';
      const { data, error } = await this.client.from('artworks').select(SELECT_FIELDS).eq(col, id).maybeSingle();
      if (error) return this.handleError<Artwork>(error, 'Failed to load artwork');
      if (!data) return this.handleError<Artwork>('Artwork not found');
      const [art] = await this.finish([data]);
      return this.handleSuccess<Artwork>(art);
    } catch (err) {
      return this.handleError<Artwork>(err, 'Failed to load artwork');
    }
  }

  public async getArtworkBySlug(slug: string): Promise<RepositoryResponse<Artwork>> {
    return this.getArtwork(slug);
  }

  private async listPublished(
    build: (q: any) => any,
    limit: number
  ): Promise<RepositoryResponse<Artwork[]>> {
    try {
      const q = build(this.client.from('artworks').select(SELECT_FIELDS).eq('status', 'published')).limit(clampLimit(limit, 6, 60));
      const { data, error } = await q;
      if (error) return this.handleError<Artwork[]>(error, 'Failed to load artworks');
      return this.handleSuccess<Artwork[]>(await this.finish(data || []));
    } catch (err) {
      return this.handleError<Artwork[]>(err, 'Failed to load artworks');
    }
  }

  /** Featured first; if there are fewer than `limit`, fills up with the newest artworks. */
  public async getFeaturedArtworks(limit = 6): Promise<RepositoryResponse<Artwork[]>> {
    const featured = await this.listPublished((q) => q.eq('is_featured', true).order('published_at', { ascending: false }), limit);
    if (!featured.success || (featured.data?.length ?? 0) >= limit) return featured;
    const recent = await this.getRecentArtworks(limit);
    if (!recent.success) return featured;
    const have = new Set((featured.data || []).map((a) => a.id));
    const merged = [...(featured.data || []), ...(recent.data || []).filter((a) => !have.has(a.id))].slice(0, limit);
    return this.handleSuccess<Artwork[]>(merged);
  }

  public async getTrendingArtworks(limit = 6): Promise<RepositoryResponse<Artwork[]>> {
    return this.listPublished(
      (q) => q.order('like_count', { ascending: false }).order('view_count', { ascending: false }).order('published_at', { ascending: false }),
      limit
    );
  }

  public async getRecentArtworks(limit = 6): Promise<RepositoryResponse<Artwork[]>> {
    return this.listPublished((q) => q.order('published_at', { ascending: false }), limit);
  }

  /**
   * An artist's artworks. Public visitors only ever receive published ones (database rule);
   * pass includeDrafts to also load the owner's drafts/archived (artist portal, collection studio).
   */
  public async getArtistArtworks(
    artistId: string,
    options?: { status?: ArtworkStatus; includeDrafts?: boolean }
  ): Promise<RepositoryResponse<Artwork[]>> {
    try {
      let q = this.client.from('artworks').select(SELECT_FIELDS).eq('artist_id', artistId);
      if (options?.status) q = q.eq('status', options.status);
      else if (!options?.includeDrafts) q = q.eq('status', 'published');
      const { data, error } = await q.order('created_at', { ascending: false }).limit(200);
      if (error) return this.handleError<Artwork[]>(error, 'Failed to load artworks');
      return this.handleSuccess<Artwork[]>(await this.finish(data || []));
    } catch (err) {
      return this.handleError<Artwork[]>(err, 'Failed to load artworks');
    }
  }

  /** One page of an artist's artworks with the total count (public: published only; owner: pass includeDrafts). */
  public async getArtistArtworksPage(
    artistId: string,
    options?: { status?: ArtworkStatus; includeDrafts?: boolean; page?: number; pageSize?: number }
  ): Promise<RepositoryResponse<Paged<Artwork>>> {
    try {
      const r = pageRange(options?.page, options?.pageSize ?? 12, 60);
      const build = (sel: string, opts?: any) => {
        let q: any = this.client.from('artworks').select(sel, opts).eq('artist_id', artistId);
        if (options?.status) q = q.eq('status', options.status);
        else if (!options?.includeDrafts) q = q.eq('status', 'published');
        return q;
      };
      const { data, error, count } = await build(SELECT_FIELDS, { count: 'exact' })
        .order('created_at', { ascending: false }).order('id', { ascending: true }).range(r.from, r.to);
      if (error && isRangeError(error)) {
        const head: any = await build('id', { count: 'exact', head: true });
        return this.handleSuccess(makePaged<Artwork>([], head.count ?? 0, r));
      }
      if (error) return this.handleError<Paged<Artwork>>(error, 'Failed to load artworks');
      return this.handleSuccess(makePaged<Artwork>(await this.finish(data || []), count ?? (data || []).length, r));
    } catch (err) {
      return this.handleError<Paged<Artwork>>(err, 'Failed to load artworks');
    }
  }

  /** Filters shared by the plain list and the paged list (so both always agree). */
  private exploreFilters(q: any, o: ArtworkFilterOptions) {
    q = q.eq('status', 'published');
    if (o.category && o.category !== 'All') q = q.in('category', categoryVariants(o.category));
    if (o.artistId) q = q.eq('artist_id', o.artistId);
    if (typeof o.minPrice === 'number') q = q.gte('price', o.minPrice);
    if (typeof o.maxPrice === 'number') q = q.lte('price', o.maxPrice);
    if (o.medium && o.medium !== 'All') { const m = sanitizeSearch(o.medium); if (m) q = q.ilike('medium', `%${m}%`); }
    if (o.featuredOnly) q = q.eq('is_featured', true);
    const term = sanitizeSearch(o.search || '');
    if (term) q = q.or(`title.ilike.%${term}%,description.ilike.%${term}%,medium.ilike.%${term}%,category.ilike.%${term}%`);
    return q;
  }

  /** Sorting always ends with `id` so pages never overlap or skip rows when values tie. */
  private exploreOrder(q: any, sortBy?: ArtworkFilterOptions['sortBy']) {
    switch (sortBy) {
      case 'oldest': q = q.order('published_at', { ascending: true }); break;
      case 'price_asc': q = q.order('price', { ascending: true, nullsFirst: false }); break;
      case 'price_desc': q = q.order('price', { ascending: false, nullsFirst: false }); break;
      case 'popular': q = q.order('like_count', { ascending: false }).order('view_count', { ascending: false }); break;
      case 'featured': q = q.order('is_featured', { ascending: false }).order('published_at', { ascending: false }); break;
      default: q = q.order('published_at', { ascending: false });
    }
    return q.order('id', { ascending: true });
  }

  /** One page of the public gallery, with the total number of matches (server-side pagination). */
  public async getExplorePage(options?: ArtworkFilterOptions & { page?: number; pageSize?: number }): Promise<RepositoryResponse<Paged<Artwork>>> {
    try {
      const o = options || {};
      const r = pageRange(o.page, o.pageSize ?? 12, 60);
      let q = this.exploreFilters(this.client.from('artworks').select(SELECT_FIELDS, { count: 'exact' }), o);
      q = this.exploreOrder(q, o.sortBy);
      const { data, error, count } = await q.range(r.from, r.to);
      if (error && isRangeError(error)) {
        const head: any = await this.exploreFilters(this.client.from('artworks').select('id', { count: 'exact', head: true }), o);
        return this.handleSuccess(makePaged<Artwork>([], head.count ?? 0, r));
      }
      if (error) return this.handleError<Paged<Artwork>>(error, 'Failed to load artworks');
      return this.handleSuccess(makePaged<Artwork>(await this.finish(data || []), count ?? (data || []).length, r));
    } catch (err) {
      return this.handleError<Paged<Artwork>>(err, 'Failed to load artworks');
    }
  }

  public async getExploreArtworks(options?: ArtworkFilterOptions): Promise<RepositoryResponse<Artwork[]>> {
    try {
      const o = options || {};
      const limit = clampLimit(o.limit, 24, 60);
      const offset = Math.max(0, Math.floor(o.offset || 0));
      let q = this.exploreFilters(this.client.from('artworks').select(SELECT_FIELDS), o);
      q = this.exploreOrder(q, o.sortBy);
      const { data, error } = await q.range(offset, offset + limit - 1);
      if (error) return this.handleError<Artwork[]>(error, 'Failed to load artworks');
      return this.handleSuccess<Artwork[]>(await this.finish(data || []));
    } catch (err) {
      return this.handleError<Artwork[]>(err, 'Failed to load artworks');
    }
  }

  public async searchArtworks(query: string, filters?: ArtworkFilterOptions): Promise<RepositoryResponse<Artwork[]>> {
    return this.getExploreArtworks({ ...(filters || {}), search: query });
  }

  public async getArtworkStatistics(artistId: string): Promise<RepositoryResponse<ArtworkStatistics>> {
    try {
      const { data, error } = await this.client
        .from('artworks').select('status, view_count, like_count, wishlist_count').eq('artist_id', artistId).limit(500);
      if (error) return this.handleError<ArtworkStatistics>(error, 'Failed to load statistics');
      const rows = data || [];
      return this.handleSuccess<ArtworkStatistics>({
        total_artworks: rows.length,
        published_artworks: rows.filter((r) => r.status === 'published').length,
        draft_artworks: rows.filter((r) => r.status === 'draft').length,
        archived_artworks: rows.filter((r) => r.status === 'archived').length,
        total_views: rows.reduce((n, r) => n + (r.view_count || 0), 0),
        total_likes: rows.reduce((n, r) => n + (r.like_count || 0), 0),
        total_wishlists: rows.reduce((n, r) => n + (r.wishlist_count || 0), 0),
      });
    } catch (err) {
      return this.handleError<ArtworkStatistics>(err, 'Failed to load statistics');
    }
  }

  /** Counts a view (once per browser per 12h). Never fails the page. */
  public async incrementView(id: string): Promise<RepositoryResponse<number>> {
    if (!isUuid(id) || !shouldCountView('artwork', id)) return this.handleSuccess<number>(0);
    try {
      await this.client.rpc('increment_view', { p_kind: 'artwork', p_id: id });
    } catch {
      /* ignore */
    }
    return this.handleSuccess<number>(0);
  }

  /** There is no share counter in the database; kept for API compatibility. */
  public async incrementShare(id: string): Promise<RepositoryResponse<number>> {
    void id;
    return this.handleSuccess<number>(0);
  }

  public async updateArtworkStatus(id: string, status: ArtworkStatus): Promise<RepositoryResponse<Artwork>> {
    return this.updateArtwork(id, { status });
  }

  public async updateCoverImage(id: string, coverIndex: number): Promise<RepositoryResponse<Artwork>> {
    return this.updateArtwork(id, { cover_image_index: Math.max(0, Math.floor(coverIndex)) });
  }

  public async updateArtworkImages(id: string, imageUrls: string[], coverIndex?: number): Promise<RepositoryResponse<Artwork>> {
    const patch: Partial<Artwork> = { image_urls: imageUrls };
    if (coverIndex !== undefined) patch.cover_image_index = Math.max(0, Math.floor(coverIndex));
    return this.updateArtwork(id, patch);
  }
}

export const artworkRepository = new ArtworkRepository();
