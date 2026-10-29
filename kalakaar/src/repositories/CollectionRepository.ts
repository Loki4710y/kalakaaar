import { BaseRepository, RepositoryResponse } from './BaseRepository';
import { Artwork, normalizeArtwork } from './ArtworkRepository';
import { attachContacts, clampLimit, isUuid, sanitizeSearch, shouldCountView, slugify, pageRange, makePaged, isRangeError, type Paged } from './utils';

export type CollectionStatus = 'draft' | 'published' | 'archived';

export interface CollectionProfile {
  id?: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  whatsapp_number?: string;
}

export interface Collection {
  id: string;
  artist_id: string;
  title: string;
  slug: string;
  description?: string;
  cover_image_url?: string;
  status: CollectionStatus;
  is_featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
  artworks: Artwork[];
  profiles?: CollectionProfile;
}

export interface CollectionFilterOptions {
  search?: string;
  status?: CollectionStatus;
  artistId?: string;
  isFeatured?: boolean;
  limit?: number;
  offset?: number;
}

export interface CollectionStatistics {
  total_collections: number;
  published_collections: number;
  draft_collections: number;
  archived_collections: number;
  total_views: number;
  total_artworks_in_collections: number;
}

const ART_JOIN = 'artworks(*, profiles:artist_id(id, display_name, username, avatar_url))';
const SELECT_FIELDS = `*, profiles:artist_id(id, display_name, username, avatar_url), collection_artworks(position, ${ART_JOIN})`;
const LIST_FIELDS = '*, profiles:artist_id(id, display_name, username, avatar_url)';

function normalizeCollection(col: any): Collection {
  const p = col.profiles;
  const name = p?.display_name || p?.username || 'Artist';
  const links: any[] = Array.isArray(col.collection_artworks) ? col.collection_artworks : [];
  const artworks = links
    .filter((l) => l.artworks)
    .sort((x, y) => (x.position ?? 0) - (y.position ?? 0))
    .map((l) => normalizeArtwork(l.artworks));
  const { collection_artworks: _drop, ...rest } = col;
  void _drop;
  return {
    ...rest,
    description: col.description ?? '',
    artworks,
    profiles: p
      ? { ...p, full_name: name, display_name: name }
      : { id: col.artist_id, full_name: 'Artist', display_name: 'Artist', avatar_url: '/assets/defaults/avatar.svg' },
  } as Collection;
}

function toPatch(input: Record<string, any>): Record<string, any> {
  const patch: Record<string, any> = {};
  for (const k of ['title', 'description', 'cover_image_url'] as const) if (input[k] !== undefined) patch[k] = input[k];
  if (typeof patch.title === 'string') patch.title = patch.title.trim();
  if (typeof patch.cover_image_url === 'string' && !/^(https:\/\/|\/assets\/)/i.test(patch.cover_image_url)) patch.cover_image_url = null;
  if (patch.cover_image_url === '') patch.cover_image_url = null;
  if (['draft', 'published', 'archived'].includes(input.status)) patch.status = input.status;
  return patch;
}

export class CollectionRepository extends BaseRepository {
  /** Makes collection_artworks match the given artwork ids (in order). */
  private async syncArtworks(collectionId: string, artworks: Artwork[] | undefined): Promise<string | null> {
    if (!artworks) return null;
    const ids = Array.from(new Set(artworks.map((a) => a.id).filter(isUuid))).slice(0, 100);
    const { data: current, error: e1 } = await this.client
      .from('collection_artworks').select('artwork_id').eq('collection_id', collectionId);
    if (e1) return e1.message;
    const have = (current || []).map((r: any) => r.artwork_id as string);
    const removed = have.filter((x) => !ids.includes(x));
    if (removed.length) {
      const { error } = await this.client.from('collection_artworks').delete().eq('collection_id', collectionId).in('artwork_id', removed);
      if (error) return error.message;
    }
    if (ids.length) {
      const rows = ids.map((artwork_id, position) => ({ collection_id: collectionId, artwork_id, position }));
      const { error } = await this.client.from('collection_artworks').upsert(rows, { onConflict: 'collection_id,artwork_id' });
      if (error) return error.message;
    }
    return null;
  }

  private async load(id: string): Promise<RepositoryResponse<Collection>> {
    const { data, error } = await this.client.from('collections').select(SELECT_FIELDS).eq('id', id).maybeSingle();
    if (error) return this.handleError<Collection>(error, 'Failed to load collection');
    if (!data) return this.handleError<Collection>('Collection not found');
    const col = normalizeCollection(data);
    await attachContacts(this.client, [col.profiles, ...col.artworks.map((a) => a.profiles)].filter(Boolean) as any[]);
    return this.handleSuccess<Collection>(col);
  }

  public async createCollection(collection: Collection): Promise<RepositoryResponse<Collection>> {
    try {
      const payload: Record<string, any> = {
        ...toPatch(collection as any),
        artist_id: collection.artist_id,
        status: ['draft', 'published', 'archived'].includes(collection.status) ? collection.status : 'draft',
        slug: slugify(collection.title),
      };
      for (let attempt = 0; attempt < 2; attempt++) {
        const { data, error } = await this.client.from('collections').insert(payload).select('id').single();
        if (error?.code === '23505' && /slug/.test(error.message)) { payload.slug = slugify(collection.title); continue; }
        if (error) return this.handleError<Collection>(error, 'Failed to create collection');
        const syncErr = await this.syncArtworks(data.id, collection.artworks);
        if (syncErr) return this.handleError<Collection>(syncErr, 'Collection saved, but some artworks could not be added');
        return this.load(data.id);
      }
      return this.handleError<Collection>('Could not generate a unique link for this collection. Please try again.');
    } catch (err) {
      return this.handleError<Collection>(err, 'Failed to create collection');
    }
  }

  public async updateCollection(id: string, updates: Partial<Collection>): Promise<RepositoryResponse<Collection>> {
    try {
      const patch = toPatch(updates as any);
      if (Object.keys(patch).length) {
        const { data, error } = await this.client.from('collections').update(patch).eq('id', id).select('id');
        if (error) return this.handleError<Collection>(error, 'Failed to update collection');
        if (!data || data.length === 0) return this.handleError<Collection>('Collection not found or you do not have permission to edit it.');
      }
      const syncErr = await this.syncArtworks(id, updates.artworks);
      if (syncErr) return this.handleError<Collection>(syncErr, 'Failed to update collection artworks');
      return this.load(id);
    } catch (err) {
      return this.handleError<Collection>(err, 'Failed to update collection');
    }
  }

  public async deleteCollection(id: string): Promise<RepositoryResponse<boolean>> {
    try {
      const { data, error } = await this.client.from('collections').delete().eq('id', id).select('id');
      if (error) return this.handleError<boolean>(error, 'Failed to delete collection');
      if (!data || data.length === 0) return this.handleError<boolean>('Collection not found or you do not have permission to delete it.');
      return this.handleSuccess<boolean>(true);
    } catch (err) {
      return this.handleError<boolean>(err, 'Failed to delete collection');
    }
  }

  public async publishCollection(id: string): Promise<RepositoryResponse<Collection>> {
    return this.updateCollection(id, { status: 'published' });
  }

  public async archiveCollection(id: string): Promise<RepositoryResponse<Collection>> {
    return this.updateCollection(id, { status: 'archived' });
  }

  public async saveDraft(collection: Collection): Promise<RepositoryResponse<Collection>> {
    if (isUuid(collection.id)) return this.updateCollection(collection.id, { ...collection, status: 'draft' });
    return this.createCollection({ ...collection, status: 'draft' });
  }

  /** By id (uuid) or slug, including its artworks. Drafts only for the owner (database rule). */
  public async getCollection(idOrSlug: string): Promise<RepositoryResponse<Collection>> {
    try {
      if (isUuid(idOrSlug)) return await this.load(idOrSlug);
      const { data, error } = await this.client.from('collections').select('id').eq('slug', idOrSlug).maybeSingle();
      if (error) return this.handleError<Collection>(error, 'Failed to load collection');
      if (!data) return this.handleError<Collection>('Collection not found');
      return await this.load(data.id);
    } catch (err) {
      return this.handleError<Collection>(err, 'Failed to load collection');
    }
  }

  public async getCollectionBySlug(slug: string): Promise<RepositoryResponse<Collection>> {
    return this.getCollection(slug);
  }

  /** List views: includes artworks (for cover/count) but only ids/cover, kept light. */
  private async list(build: (q: any) => any, limit: number): Promise<RepositoryResponse<Collection[]>> {
    try {
      const sel = `${LIST_FIELDS}, collection_artworks(position, artworks(id, title, image_urls, cover_image_index, status))`;
      const q = build(this.client.from('collections').select(sel)).limit(clampLimit(limit, 6, 60));
      const { data, error } = await q;
      if (error) return this.handleError<Collection[]>(error, 'Failed to load collections');
      return this.handleSuccess<Collection[]>((data || []).map(normalizeCollection));
    } catch (err) {
      return this.handleError<Collection[]>(err, 'Failed to load collections');
    }
  }

  public async getFeaturedCollections(limit = 6): Promise<RepositoryResponse<Collection[]>> {
    const featured = await this.list((q) => q.eq('status', 'published').eq('is_featured', true).order('published_at', { ascending: false }), limit);
    if (!featured.success || (featured.data?.length ?? 0) >= limit) return featured;
    const recent = await this.getRecentCollections(limit);
    if (!recent.success) return featured;
    const have = new Set((featured.data || []).map((x) => x.id));
    return this.handleSuccess<Collection[]>([...(featured.data || []), ...(recent.data || []).filter((x) => !have.has(x.id))].slice(0, limit));
  }

  public async getTrendingCollections(limit = 6): Promise<RepositoryResponse<Collection[]>> {
    return this.list((q) => q.eq('status', 'published').order('view_count', { ascending: false }).order('published_at', { ascending: false }), limit);
  }

  public async getRecentCollections(limit = 6): Promise<RepositoryResponse<Collection[]>> {
    return this.list((q) => q.eq('status', 'published').order('published_at', { ascending: false }), limit);
  }

  public async getArtistCollections(
    artistId: string,
    options?: { status?: CollectionStatus; includeDrafts?: boolean }
  ): Promise<RepositoryResponse<Collection[]>> {
    return this.list((q) => {
      let r = q.eq('artist_id', artistId);
      if (options?.status) r = r.eq('status', options.status);
      else if (!options?.includeDrafts) r = r.eq('status', 'published');
      return r.order('created_at', { ascending: false });
    }, 100);
  }

  /** One page of an artist's collections with the total count (public: published only; owner: includeDrafts). */
  public async getArtistCollectionsPage(
    artistId: string,
    options?: { status?: CollectionStatus; includeDrafts?: boolean; page?: number; pageSize?: number }
  ): Promise<RepositoryResponse<Paged<Collection>>> {
    try {
      const r = pageRange(options?.page, options?.pageSize ?? 9, 50);
      const sel = `${LIST_FIELDS}, collection_artworks(position, artworks(id, title, image_urls, cover_image_index, status))`;
      const build = (s: string, opts?: any) => {
        let q: any = this.client.from('collections').select(s, opts).eq('artist_id', artistId);
        if (options?.status) q = q.eq('status', options.status);
        else if (!options?.includeDrafts) q = q.eq('status', 'published');
        return q;
      };
      const { data, error, count } = await build(sel, { count: 'exact' })
        .order('created_at', { ascending: false }).order('id', { ascending: true }).range(r.from, r.to);
      if (error && isRangeError(error)) {
        const head: any = await build('id', { count: 'exact', head: true });
        return this.handleSuccess(makePaged<Collection>([], head.count ?? 0, r));
      }
      if (error) return this.handleError<Paged<Collection>>(error, 'Failed to load collections');
      return this.handleSuccess(makePaged<Collection>((data || []).map(normalizeCollection), count ?? (data || []).length, r));
    } catch (err) {
      return this.handleError<Paged<Collection>>(err, 'Failed to load collections');
    }
  }

  private collectionPageFilters(q: any, o: { search?: string; featuredOnly?: boolean; artist?: string }) {
    q = q.eq('status', 'published');
    if (o.featuredOnly) q = q.eq('is_featured', true);
    const a = sanitizeSearch(o.artist || '');
    if (a) q = q.ilike('profiles.display_name', `%${a}%`);
    const term = sanitizeSearch(o.search || '');
    if (term) q = q.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
    return q;
  }

  /** One page of published collections with the total number of matches (server-side pagination). */
  public async searchCollectionsPage(o: { search?: string; featuredOnly?: boolean; artist?: string; sort?: 'newest' | 'popular'; page?: number; pageSize?: number } = {}): Promise<RepositoryResponse<Paged<Collection>>> {
    try {
      const r = pageRange(o.page, o.pageSize ?? 9, 50);
      const inner = sanitizeSearch(o.artist || '') ? '!inner' : '';
      const sel = `${LIST_FIELDS.replace('artist_id(', `artist_id${inner}(`)}, collection_artworks(position, artworks(id, title, image_urls, cover_image_index, status))`;
      const { data, error, count } = await this.collectionPageFilters(this.client.from('collections').select(sel, { count: 'exact' }), o)
        .order(o.sort === 'popular' ? 'view_count' : 'published_at', { ascending: false })
        .order('published_at', { ascending: false })
        .order('id', { ascending: true })
        .range(r.from, r.to);
      if (error && isRangeError(error)) {
        const head: any = await this.collectionPageFilters(this.client.from('collections').select(`id, profiles:artist_id${inner}(id)`, { count: 'exact', head: true }), o);
        return this.handleSuccess(makePaged<Collection>([], head.count ?? 0, r));
      }
      if (error) return this.handleError<Paged<Collection>>(error, 'Failed to load collections');
      return this.handleSuccess(makePaged<Collection>((data || []).map(normalizeCollection), count ?? (data || []).length, r));
    } catch (err) {
      return this.handleError<Paged<Collection>>(err, 'Failed to load collections');
    }
  }

  public async searchCollections(query: string, options?: CollectionFilterOptions): Promise<RepositoryResponse<Collection[]>> {
    const o = options || {};
    const term = sanitizeSearch(query || o.search || '');
    return this.list((q) => {
      let r = q.eq('status', 'published');
      if (o.artistId) r = r.eq('artist_id', o.artistId);
      if (typeof o.isFeatured === 'boolean') r = r.eq('is_featured', o.isFeatured);
      if (term) r = r.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
      const offset = Math.max(0, Math.floor(o.offset || 0));
      return r.order('published_at', { ascending: false }).range(offset, offset + clampLimit(o.limit, 12, 50) - 1);
    }, o.limit ?? 12);
  }

  public async addArtwork(collectionId: string, artwork: Artwork): Promise<RepositoryResponse<Collection>> {
    try {
      if (!isUuid(artwork.id)) return this.handleError<Collection>('Invalid artwork');
      const { count } = await this.client.from('collection_artworks').select('artwork_id', { count: 'exact', head: true }).eq('collection_id', collectionId);
      const { error } = await this.client.from('collection_artworks')
        .upsert({ collection_id: collectionId, artwork_id: artwork.id, position: count ?? 0 }, { onConflict: 'collection_id,artwork_id' });
      if (error) return this.handleError<Collection>(error, 'Failed to add artwork');
      return this.load(collectionId);
    } catch (err) {
      return this.handleError<Collection>(err, 'Failed to add artwork');
    }
  }

  public async removeArtwork(collectionId: string, artworkId: string): Promise<RepositoryResponse<Collection>> {
    try {
      const { error } = await this.client.from('collection_artworks').delete().eq('collection_id', collectionId).eq('artwork_id', artworkId);
      if (error) return this.handleError<Collection>(error, 'Failed to remove artwork');
      return this.load(collectionId);
    } catch (err) {
      return this.handleError<Collection>(err, 'Failed to remove artwork');
    }
  }

  public async reorderArtworks(collectionId: string, artworkIds: string[]): Promise<RepositoryResponse<Collection>> {
    try {
      const rows = artworkIds.filter(isUuid).map((artwork_id, position) => ({ collection_id: collectionId, artwork_id, position }));
      if (rows.length) {
        const { error } = await this.client.from('collection_artworks').upsert(rows, { onConflict: 'collection_id,artwork_id' });
        if (error) return this.handleError<Collection>(error, 'Failed to reorder artworks');
      }
      return this.load(collectionId);
    } catch (err) {
      return this.handleError<Collection>(err, 'Failed to reorder artworks');
    }
  }

  /** Accepts an image URL or an artwork id (uses that artwork's cover image). */
  public async setCoverArtwork(collectionId: string, coverImageUrlOrArtworkId: string): Promise<RepositoryResponse<Collection>> {
    let url = coverImageUrlOrArtworkId;
    if (isUuid(url)) {
      const { data } = await this.client.from('artworks').select('image_urls, cover_image_index').eq('id', url).maybeSingle();
      url = data?.image_urls?.[data.cover_image_index || 0] || data?.image_urls?.[0] || '';
    }
    return this.updateCollection(collectionId, { cover_image_url: url });
  }

  public async incrementView(id: string): Promise<RepositoryResponse<number>> {
    if (!isUuid(id) || !shouldCountView('collection', id)) return this.handleSuccess<number>(0);
    try {
      await this.client.rpc('increment_view', { p_kind: 'collection', p_id: id });
    } catch {
      /* ignore */
    }
    return this.handleSuccess<number>(0);
  }

  public async incrementShare(id: string): Promise<RepositoryResponse<number>> {
    void id;
    return this.handleSuccess<number>(0);
  }

  public async getCollectionStatistics(artistId: string): Promise<RepositoryResponse<CollectionStatistics>> {
    try {
      const { data, error } = await this.client
        .from('collections').select('status, view_count, collection_artworks(artwork_id)').eq('artist_id', artistId).limit(100);
      if (error) return this.handleError<CollectionStatistics>(error, 'Failed to load statistics');
      const rows: any[] = data || [];
      return this.handleSuccess<CollectionStatistics>({
        total_collections: rows.length,
        published_collections: rows.filter((r) => r.status === 'published').length,
        draft_collections: rows.filter((r) => r.status === 'draft').length,
        archived_collections: rows.filter((r) => r.status === 'archived').length,
        total_views: rows.reduce((n, r) => n + (r.view_count || 0), 0),
        total_artworks_in_collections: rows.reduce((n, r) => n + (r.collection_artworks?.length || 0), 0),
      });
    } catch (err) {
      return this.handleError<CollectionStatistics>(err, 'Failed to load statistics');
    }
  }
}

export const collectionRepository = new CollectionRepository();
