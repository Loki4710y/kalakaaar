import { BaseRepository, RepositoryResponse } from './BaseRepository';
import { categoryVariants, isRangeError, isUuid, makePaged, pageRange, sanitizeSearch, type Paged } from './utils';

export interface AdminDashboardStats {
  totalUsers: number;
  totalArtists: number;
  totalArtworks: number;
  totalCollections: number;
  totalStories: number;
  totalReviews: number;
  totalLikes: number;
  totalViews: number;
}

export interface ActivityLogItem {
  id: string;
  type: 'artist' | 'artwork' | 'collection' | 'story' | 'user';
  title: string;
  subtitle: string;
  timestamp: string;
  status?: string;
  image?: string;
}

export interface AdminArtist {
  id: string;
  avatar_url: string;
  full_name: string;
  username: string;
  email: string;
  followers_count: number;
  artworks_count: number;
  stories_count: number;
  collections_count: number;
  status: 'active' | 'suspended';
  is_featured: boolean;
  is_verified: boolean;
  joined_date: string;
  art_style: string;
  location: string;
}

export interface AdminArtwork {
  id: string;
  thumbnail_url: string;
  title: string;
  artist_id: string;
  artist_name: string;
  category: string;
  views_count: number;
  likes_count: number;
  status: 'available' | 'sold' | 'archived';
  is_featured: boolean;
  created_at: string;
  price: number;
}

export interface AdminCollection {
  id: string;
  cover_url: string;
  title: string;
  artist_id: string;
  artist_name: string;
  artwork_count: number;
  views_count: number;
  status: 'active' | 'archived';
  is_featured: boolean;
  created_at: string;
}

export interface AdminStory {
  id: string;
  cover_url: string;
  title: string;
  author_id: string;
  author_name: string;
  category: string;
  read_time: string;
  views_count: number;
  status: 'published' | 'draft' | 'archived';
  is_featured: boolean;
  created_at: string;
}

export interface AdminFeaturedContent {
  artists: AdminArtist[];
  artworks: AdminArtwork[];
  collections: AdminCollection[];
  stories: AdminStory[];
}

export interface ArtistOfTheMonth {
  id: string;
  artist_id: string;
  artist_name: string;
  artist_avatar: string;
  art_style: string;
  month: string;
  year: number;
  reason: string;
  banner_url: string;
  created_at: string;
}

export interface AdminReport {
  id: string;
  item_type: 'artist' | 'artwork' | 'story';
  item_id: string;
  item_title: string;
  reporter_name: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'ignored' | 'archived';
  created_at: string;
}

export interface AnalyticsData {
  topArtist: { name: string; views: number; sales: number; style: string };
  topArtwork: { title: string; artist: string; views: number; likes: number };
  topCollection: { title: string; views: number; count: number };
  topStory: { title: string; views: number; readTime: string };
  mostViewedCategory: { name: string; count: number };
  mostActiveArtist: { name: string; uploads: number };
  charts: {
    uploads: { label: string; count: number }[];
    views: { label: string; count: number }[];
    newUsers: { label: string; count: number }[];
    growth: { label: string; rate: number }[];
  };
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'system';
  created_at: string;
}

export interface PlatformSettings {
  hero_headline: string;
  hero_subheadline: string;
  max_featured_artworks: number;
  max_featured_artists: number;
  maintenance_mode: boolean;
  platform_announcement: string;
}

export interface DashboardResponse {
  stats: AdminDashboardStats;
  recentActivity: ActivityLogItem[];
  newestArtists: AdminArtist[];
  newestArtworks: AdminArtwork[];
  newestStories: AdminStory[];
}

const DEFAULT_SETTINGS: PlatformSettings = {
  hero_headline: '',
  hero_subheadline: '',
  max_featured_artworks: 6,
  max_featured_artists: 6,
  maintenance_mode: false,
  platform_announcement: '',
};

const PROFILE_COLS =
  'id, display_name, username, avatar_url, is_featured, is_verified, featured_since, is_active, created_at, primary_art_style, location, artwork_count, collection_count, story_count, follower_count, role';
const NOT_AVAILABLE = 'This feature is not available yet.';

const toArtist = (p: any): AdminArtist => ({
  id: p.id,
  avatar_url: p.avatar_url || '/assets/defaults/avatar.svg',
  full_name: p.display_name || p.username || 'Artist',
  username: p.username || '',
  email: '', // emails live in Supabase Auth and are never exposed to the browser
  followers_count: p.follower_count || 0,
  artworks_count: p.artwork_count || 0,
  stories_count: p.story_count || 0,
  collections_count: p.collection_count || 0,
  status: p.is_active === false ? 'suspended' : 'active',
  is_featured: !!p.is_featured,
  is_verified: !!p.is_verified,
  joined_date: p.created_at,
  art_style: p.primary_art_style || '',
  location: p.location || '',
});

const toArtwork = (a: any): AdminArtwork => ({
  id: a.id,
  thumbnail_url: a.image_urls?.[a.cover_image_index || 0] || a.image_urls?.[0] || '/assets/defaults/artwork.svg',
  title: a.title,
  artist_id: a.artist_id,
  artist_name: a.profiles?.display_name || a.profiles?.username || 'Artist',
  category: a.category || '',
  views_count: a.view_count || 0,
  likes_count: a.like_count || 0,
  status: a.status === 'published' ? (a.is_sold ? 'sold' : 'available') : 'archived',
  is_featured: !!a.is_featured,
  created_at: a.created_at,
  price: Number(a.price) || 0,
});

const toCollection = (c: any): AdminCollection => ({
  id: c.id,
  cover_url: c.cover_image_url || '/assets/defaults/artwork.svg',
  title: c.title,
  artist_id: c.artist_id,
  artist_name: c.profiles?.display_name || c.profiles?.username || 'Artist',
  artwork_count: c.collection_artworks?.[0]?.count ?? 0,
  views_count: c.view_count || 0,
  status: c.status === 'published' ? 'active' : 'archived',
  is_featured: !!c.is_featured,
  created_at: c.created_at,
});

const toStory = (st: any): AdminStory => ({
  id: st.id,
  cover_url: st.cover_image_url || '/assets/defaults/artwork.svg',
  title: st.title,
  author_id: st.artist_id,
  author_name: st.profiles?.display_name || st.profiles?.username || 'Artist',
  category: st.category || '',
  read_time: st.read_time || '',
  views_count: st.view_count || 0,
  status: st.status,
  is_featured: !!st.is_featured,
  created_at: st.created_at,
});

export interface AdminListParams {
  page?: number;
  pageSize?: number;
  query?: string;
  status?: string;
  filter?: string;
  sortField?: string;
  sortAsc?: boolean;
}

interface ListConfig<T> {
  table: string;
  select: string;
  map: (r: any) => T;
  searchCols: string[];
  sortMap: Record<string, string>;
  defaultSort: string;
  apply: (q: any, p: AdminListParams) => any;
  what: string;
}

const AW_SEL = '*, profiles:artist_id(display_name, username)';
const COL_SEL = '*, profiles:artist_id(display_name, username), collection_artworks(count)';
const ST_SEL = '*, profiles:artist_id(display_name, username)';

/**
 * Every call here is protected by the database itself: the admin policies only
 * allow rows to be read/changed when is_admin() is true, so a normal user calling
 * these methods simply gets nothing / an error.
 */
export class AdminRepository extends BaseRepository {
  private async count(table: string, apply?: (q: any) => any): Promise<number> {
    let q = this.client.from(table).select('*', { count: 'exact', head: true });
    if (apply) q = apply(q);
    const { count } = await q;
    return count ?? 0;
  }

  public async getDashboardData(): Promise<RepositoryResponse<DashboardResponse>> {
    try {
      const [totalUsers, totalArtists, totalArtworks, totalCollections, totalStories, totalLikes, metrics, artists, artworks, stories] =
        await Promise.all([
          this.count('profiles'),
          this.count('profiles', (q) => q.eq('role', 'artist')),
          this.count('artworks'),
          this.count('collections'),
          this.count('stories'),
          this.count('artwork_likes'),
          this.client.rpc('admin_overview'),
          this.client.from('profiles').select(PROFILE_COLS).eq('role', 'artist').order('created_at', { ascending: false }).limit(5),
          this.client.from('artworks').select(AW_SEL).order('created_at', { ascending: false }).limit(5),
          this.client.from('stories').select(ST_SEL).order('created_at', { ascending: false }).limit(5),
        ]);
      const newestArtists = (artists.data || []).map(toArtist);
      const newestArtworks = (artworks.data || []).map(toArtwork);
      const newestStories = (stories.data || []).map(toStory);
      const recentActivity: ActivityLogItem[] = [
        ...newestArtists.map((x) => ({ id: x.id, type: 'artist' as const, title: x.full_name, subtitle: 'New artist joined', timestamp: x.joined_date, image: x.avatar_url })),
        ...newestArtworks.map((x) => ({ id: x.id, type: 'artwork' as const, title: x.title, subtitle: `by ${x.artist_name}`, timestamp: x.created_at, status: x.status, image: x.thumbnail_url })),
        ...newestStories.map((x) => ({ id: x.id, type: 'story' as const, title: x.title, subtitle: `by ${x.author_name}`, timestamp: x.created_at, status: x.status, image: x.cover_url })),
      ].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)).slice(0, 10);
      return this.handleSuccess<DashboardResponse>({
        stats: {
          totalUsers, totalArtists, totalArtworks, totalCollections, totalStories, totalReviews: 0, totalLikes,
          // exact total from the database (admin_overview, migration 008)
          totalViews: Number((metrics.data as any)?.total_views) || 0,
        },
        recentActivity, newestArtists, newestArtworks, newestStories,
      });
    } catch (err) {
      return this.handleError<DashboardResponse>(err, 'Failed to load dashboard');
    }
  }

  public async getUsers(): Promise<RepositoryResponse<AdminArtist[]>> {
    try {
      const { data, error } = await this.client.from('profiles').select(PROFILE_COLS).order('created_at', { ascending: false }).limit(200);
      if (error) return this.handleError<AdminArtist[]>(error, 'Failed to load users');
      return this.handleSuccess<AdminArtist[]>((data || []).map(toArtist));
    } catch (err) {
      return this.handleError<AdminArtist[]>(err, 'Failed to load users');
    }
  }

  public async getArtists(): Promise<RepositoryResponse<AdminArtist[]>> {
    try {
      const { data, error } = await this.client.from('profiles').select(PROFILE_COLS).eq('role', 'artist').order('created_at', { ascending: false }).limit(200);
      if (error) return this.handleError<AdminArtist[]>(error, 'Failed to load artists');
      return this.handleSuccess<AdminArtist[]>((data || []).map(toArtist));
    } catch (err) {
      return this.handleError<AdminArtist[]>(err, 'Failed to load artists');
    }
  }

  public async getArtworks(): Promise<RepositoryResponse<AdminArtwork[]>> {
    try {
      const { data, error } = await this.client.from('artworks').select(AW_SEL).order('created_at', { ascending: false }).limit(200);
      if (error) return this.handleError<AdminArtwork[]>(error, 'Failed to load artworks');
      return this.handleSuccess<AdminArtwork[]>((data || []).map(toArtwork));
    } catch (err) {
      return this.handleError<AdminArtwork[]>(err, 'Failed to load artworks');
    }
  }

  public async getCollections(): Promise<RepositoryResponse<AdminCollection[]>> {
    try {
      const { data, error } = await this.client.from('collections').select(COL_SEL).order('created_at', { ascending: false }).limit(200);
      if (error) return this.handleError<AdminCollection[]>(error, 'Failed to load collections');
      return this.handleSuccess<AdminCollection[]>((data || []).map(toCollection));
    } catch (err) {
      return this.handleError<AdminCollection[]>(err, 'Failed to load collections');
    }
  }

  public async getStories(): Promise<RepositoryResponse<AdminStory[]>> {
    try {
      const { data, error } = await this.client.from('stories').select(ST_SEL).order('created_at', { ascending: false }).limit(200);
      if (error) return this.handleError<AdminStory[]>(error, 'Failed to load stories');
      return this.handleSuccess<AdminStory[]>((data || []).map(toStory));
    } catch (err) {
      return this.handleError<AdminStory[]>(err, 'Failed to load stories');
    }
  }

  /** One page of an admin table; search, filters and sorting all run in the database. */
  private async listPage<T>(cfg: ListConfig<T>, p: AdminListParams): Promise<RepositoryResponse<Paged<T>>> {
    const r = pageRange(p.page, p.pageSize ?? 10, 100);
    try {
      const build = (sel: string, opts: any) => {
        let q: any = this.client.from(cfg.table).select(sel, opts);
        q = cfg.apply(q, p);
        const term = sanitizeSearch(p.query || '');
        if (term) q = q.or(cfg.searchCols.map((c) => `${c}.ilike.%${term}%`).join(','));
        return q;
      };
      const col = cfg.sortMap[p.sortField || ''] || cfg.defaultSort;
      const { data, error, count } = await build(cfg.select, { count: 'exact' })
        .order(col, { ascending: p.sortField ? p.sortAsc !== false : false })
        .order('id', { ascending: true })
        .range(r.from, r.to);
      if (error && isRangeError(error)) {
        const head: any = await build('id', { count: 'exact', head: true });
        return this.handleSuccess(makePaged<T>([], head.count ?? 0, r));
      }
      if (error) return this.handleError<Paged<T>>(error, `Failed to load ${cfg.what}`);
      return this.handleSuccess(makePaged<T>((data || []).map(cfg.map), count ?? (data || []).length, r));
    } catch (err) {
      return this.handleError<Paged<T>>(err, `Failed to load ${cfg.what}`);
    }
  }

  public getArtistsPage(p: AdminListParams = {}) {
    return this.listPage<AdminArtist>({
      table: 'profiles', select: PROFILE_COLS, map: toArtist, what: 'artists',
      searchCols: ['display_name', 'username', 'primary_art_style', 'location'],
      sortMap: { full_name: 'display_name', followers_count: 'follower_count', artworks_count: 'artwork_count', joined_date: 'created_at', art_style: 'primary_art_style' },
      defaultSort: 'created_at',
      apply: (q, f) => {
        q = q.eq('role', 'artist');
        if (f.status === 'active') q = q.eq('is_active', true);
        if (f.status === 'suspended') q = q.eq('is_active', false);
        const style = sanitizeSearch(f.filter || '');
        if (style && style !== 'all') q = q.ilike('primary_art_style', style);
        return q;
      },
    }, p);
  }

  public getArtworksPage(p: AdminListParams = {}) {
    return this.listPage<AdminArtwork>({
      table: 'artworks', select: AW_SEL, map: toArtwork, what: 'artworks',
      searchCols: ['title', 'category', 'medium'],
      sortMap: { title: 'title', price: 'price', views_count: 'view_count', likes_count: 'like_count', created_at: 'created_at', category: 'category' },
      defaultSort: 'created_at',
      apply: (q, f) => {
        if (f.status === 'available') q = q.eq('status', 'published').eq('is_sold', false);
        if (f.status === 'sold') q = q.eq('status', 'published').eq('is_sold', true);
        if (f.status === 'archived') q = q.neq('status', 'published');
        if (f.filter && f.filter !== 'all') q = q.in('category', categoryVariants(f.filter));
        return q;
      },
    }, p);
  }

  public getCollectionsPage(p: AdminListParams = {}) {
    return this.listPage<AdminCollection>({
      table: 'collections', select: COL_SEL, map: toCollection, what: 'collections',
      searchCols: ['title', 'description'],
      sortMap: { title: 'title', views_count: 'view_count', created_at: 'created_at' },
      defaultSort: 'created_at',
      apply: (q, f) => {
        if (f.status === 'active') q = q.eq('status', 'published');
        if (f.status === 'archived') q = q.neq('status', 'published');
        return q;
      },
    }, p);
  }

  public getStoriesPage(p: AdminListParams = {}) {
    return this.listPage<AdminStory>({
      table: 'stories', select: ST_SEL, map: toStory, what: 'stories',
      searchCols: ['title', 'excerpt', 'category'],
      sortMap: { title: 'title', views_count: 'view_count', created_at: 'created_at', category: 'category' },
      defaultSort: 'created_at',
      apply: (q, f) => {
        if (f.status && f.status !== 'all') q = q.eq('status', f.status);
        return q;
      },
    }, p);
  }

  public async getFeaturedContent(): Promise<RepositoryResponse<AdminFeaturedContent>> {
    try {
      const [a, w, c, st] = await Promise.all([
        this.client.from('profiles').select(PROFILE_COLS).eq('is_featured', true).limit(50),
        this.client.from('artworks').select(AW_SEL).eq('is_featured', true).limit(50),
        this.client.from('collections').select(COL_SEL).eq('is_featured', true).limit(50),
        this.client.from('stories').select(ST_SEL).eq('is_featured', true).limit(50),
      ]);
      return this.handleSuccess<AdminFeaturedContent>({
        artists: (a.data || []).map(toArtist),
        artworks: (w.data || []).map(toArtwork),
        collections: (c.data || []).map(toCollection),
        stories: (st.data || []).map(toStory),
      });
    } catch (err) {
      return this.handleError<AdminFeaturedContent>(err, 'Failed to load featured content');
    }
  }

  private async patchOne<T>(table: string, id: string, patch: Record<string, any>, select: string, map: (r: any) => T, what: string): Promise<RepositoryResponse<T>> {
    try {
      if (!isUuid(id)) return this.handleError<T>('Invalid id');
      const { data, error } = await this.client.from(table).update(patch).eq('id', id).select(select).maybeSingle();
      if (error) return this.handleError<T>(error, `Failed to update ${what}`);
      if (!data) return this.handleError<T>(`Could not update ${what} (not found or not allowed).`);
      return this.handleSuccess<T>(map(data));
    } catch (err) {
      return this.handleError<T>(err, `Failed to update ${what}`);
    }
  }

  private async removeOne(table: string, id: string, what: string): Promise<RepositoryResponse<boolean>> {
    try {
      if (!isUuid(id)) return this.handleError<boolean>('Invalid id');
      const { data, error } = await this.client.from(table).delete().eq('id', id).select('id');
      if (error) return this.handleError<boolean>(error, `Failed to delete ${what}`);
      if (!data || data.length === 0) return this.handleError<boolean>(`Could not delete ${what} (not found or not allowed).`);
      return this.handleSuccess<boolean>(true);
    } catch (err) {
      return this.handleError<boolean>(err, `Failed to delete ${what}`);
    }
  }

  public featureArtist(id: string, featured: boolean) {
    return this.patchOne('profiles', id, { is_featured: featured }, PROFILE_COLS, toArtist, 'artist');
  }
  public verifyArtist(id: string, verified: boolean) {
    return this.patchOne('profiles', id, { is_verified: verified }, PROFILE_COLS, toArtist, 'artist');
  }
  public featureArtwork(id: string, featured: boolean) {
    return this.patchOne('artworks', id, { is_featured: featured }, AW_SEL, toArtwork, 'artwork');
  }
  public featureCollection(id: string, featured: boolean) {
    return this.patchOne('collections', id, { is_featured: featured }, COL_SEL, toCollection, 'collection');
  }
  public featureStory(id: string, featured: boolean) {
    return this.patchOne('stories', id, { is_featured: featured }, ST_SEL, toStory, 'story');
  }

  public async suspendUser(userId: string): Promise<RepositoryResponse<boolean>> {
    const r = await this.patchOne('profiles', userId, { is_active: false }, PROFILE_COLS, toArtist, 'user');
    return r.success ? this.handleSuccess<boolean>(true) : this.handleError<boolean>(r.error || 'Failed');
  }

  public async restoreUser(userId: string): Promise<RepositoryResponse<boolean>> {
    const r = await this.patchOne('profiles', userId, { is_active: true }, PROFILE_COLS, toArtist, 'user');
    return r.success ? this.handleSuccess<boolean>(true) : this.handleError<boolean>(r.error || 'Failed');
  }

  /** "Artist of the Month" = the one featured artist highlighted on the site. Month/reason are not stored. */
  public async setArtistOfTheMonth(
    artistId: string, month: string, year: number, reason: string, bannerUrl?: string
  ): Promise<RepositoryResponse<ArtistOfTheMonth>> {
    try {
      if (!isUuid(artistId)) return this.handleError<ArtistOfTheMonth>('Invalid artist');
      const r = await this.featureArtist(artistId, true);
      if (!r.success || !r.data) return this.handleError<ArtistOfTheMonth>(r.error || 'Failed to set artist of the month');
      return this.handleSuccess<ArtistOfTheMonth>({
        id: r.data.id, artist_id: r.data.id, artist_name: r.data.full_name, artist_avatar: r.data.avatar_url,
        art_style: r.data.art_style, month, year, reason, banner_url: bannerUrl || '', created_at: new Date().toISOString(),
      });
    } catch (err) {
      return this.handleError<ArtistOfTheMonth>(err, 'Failed to set artist of the month');
    }
  }

  /** Most recently featured artist, or null-ish empty object when none. */
  public async getArtistOfTheMonth(): Promise<RepositoryResponse<ArtistOfTheMonth>> {
    try {
      const { data, error } = await this.client
        .from('profiles').select(PROFILE_COLS).eq('role', 'artist').eq('is_featured', true).eq('is_active', true)
        .order('featured_since', { ascending: false, nullsFirst: false }).limit(1).maybeSingle();
      if (error) return this.handleError<ArtistOfTheMonth>(error, 'Failed to load artist of the month');
      if (!data) return this.handleError<ArtistOfTheMonth>('No featured artist yet');
      const now = new Date();
      return this.handleSuccess<ArtistOfTheMonth>({
        id: data.id, artist_id: data.id, artist_name: data.display_name || data.username || 'Artist',
        artist_avatar: data.avatar_url || '/assets/defaults/avatar.svg', art_style: data.primary_art_style || '',
        month: now.toLocaleString('en-US', { month: 'long' }), year: now.getFullYear(), reason: '', banner_url: '',
        created_at: data.featured_since || data.created_at,
      });
    } catch (err) {
      return this.handleError<ArtistOfTheMonth>(err, 'Failed to load artist of the month');
    }
  }

  public async getAnalytics(): Promise<RepositoryResponse<AnalyticsData>> {
    try {
      const [topArt, topCol, topStory, overview, topArtist] = await Promise.all([
        this.client.from('artworks').select(AW_SEL).eq('status', 'published').order('view_count', { ascending: false }).limit(1),
        this.client.from('collections').select(COL_SEL).eq('status', 'published').order('view_count', { ascending: false }).limit(1),
        this.client.from('stories').select(ST_SEL).eq('status', 'published').order('view_count', { ascending: false }).limit(1),
        this.client.rpc('admin_overview'),
        this.client.from('profiles').select('display_name, primary_art_style, artwork_count').eq('role', 'artist').order('artwork_count', { ascending: false }).limit(1),
      ]);
      const ov: any = overview.data || {};
      const daily: any[] = Array.isArray(ov.daily) ? ov.daily : [];
      const series = (key: 'uploads' | 'views' | 'users') =>
        daily.map((d) => ({
          label: new Date(`${d.day}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' }),
          count: Number(d[key]) || 0,
        }));
      const topCat = ov.top_category as { name: string; count: number } | null | undefined;
      const art = topArt.data?.[0], col = topCol.data?.[0], st = topStory.data?.[0], ta = topArtist.data?.[0];
      return this.handleSuccess<AnalyticsData>({
        topArtist: { name: ta?.display_name || '', views: 0, sales: 0, style: ta?.primary_art_style || '' },
        topArtwork: { title: art?.title || '', artist: art?.profiles?.display_name || '', views: art?.view_count || 0, likes: art?.like_count || 0 },
        topCollection: { title: col?.title || '', views: col?.view_count || 0, count: col?.collection_artworks?.[0]?.count ?? 0 },
        topStory: { title: st?.title || '', views: st?.view_count || 0, readTime: st?.read_time || '' },
        mostViewedCategory: { name: topCat?.name || '', count: Number(topCat?.count) || 0 },
        mostActiveArtist: { name: ta?.display_name || '', uploads: ta?.artwork_count || 0 },
        charts: {
          uploads: series('uploads'),
          views: series('views'),
          newUsers: series('users'),
          growth: [],
        },
      });
    } catch (err) {
      return this.handleError<AnalyticsData>(err, 'Failed to load analytics');
    }
  }

  public async getReportsPage(o: { itemType?: string; page?: number; pageSize?: number } = {}): Promise<RepositoryResponse<Paged<AdminReport>>> {
    const r = pageRange(o.page, o.pageSize ?? 20, 100);
    try {
      const base = (sel: string, opts: any) => {
        let q: any = this.client.from('reports').select(sel, opts);
        if (o.itemType) q = q.eq('item_type', o.itemType);
        return q;
      };
      const { data, error, count } = await base('id, reporter_id, item_type, item_id, reason, status, created_at', { count: 'exact' })
        .order('created_at', { ascending: false }).order('id', { ascending: true }).range(r.from, r.to);
      if (error && isRangeError(error)) {
        const head: any = await base('id', { count: 'exact', head: true });
        return this.handleSuccess(makePaged<AdminReport>([], head.count ?? 0, r));
      }
      if (error) return this.handleError<Paged<AdminReport>>(error, 'Failed to load reports');
      const rows: any[] = data || [];
      const ids = (type: string) => Array.from(new Set(rows.filter((x) => x.item_type === type).map((x) => x.item_id)));
      const [artists, artworks, stories, reporters] = await Promise.all([
        ids('artist').length ? this.client.from('profiles').select('id, display_name').in('id', ids('artist')) : { data: [] },
        ids('artwork').length ? this.client.from('artworks').select('id, title').in('id', ids('artwork')) : { data: [] },
        ids('story').length ? this.client.from('stories').select('id, title').in('id', ids('story')) : { data: [] },
        rows.length ? this.client.from('profiles').select('id, display_name').in('id', Array.from(new Set(rows.map((x) => x.reporter_id)))) : { data: [] },
      ]);
      const titles = new Map<string, string>();
      (artists.data || []).forEach((x: any) => titles.set(x.id, x.display_name));
      (artworks.data || []).forEach((x: any) => titles.set(x.id, x.title));
      (stories.data || []).forEach((x: any) => titles.set(x.id, x.title));
      const names = new Map<string, string>((reporters.data || []).map((x: any) => [x.id, x.display_name]));
      const items: AdminReport[] = rows.map((r) => ({
        id: r.id,
        item_type: r.item_type,
        item_id: r.item_id,
        item_title: titles.get(r.item_id) || '(deleted)',
        reporter_name: names.get(r.reporter_id) || 'User',
        reason: r.reason,
        status: r.status,
        created_at: r.created_at,
      }));
      return this.handleSuccess(makePaged<AdminReport>(items, count ?? items.length, r));
    } catch (err) {
      return this.handleError<Paged<AdminReport>>(err, 'Failed to load reports');
    }
  }

  public async updateReportStatus(id: string, status: 'pending' | 'reviewed' | 'ignored' | 'archived'): Promise<RepositoryResponse<AdminReport>> {
    try {
      if (!isUuid(id)) return this.handleError<AdminReport>('Invalid id');
      const { data, error } = await this.client.from('reports').update({ status }).eq('id', id).select('id, item_type, item_id, reason, status, created_at').maybeSingle();
      if (error) return this.handleError<AdminReport>(error, 'Failed to update report');
      if (!data) return this.handleError<AdminReport>('Report not found or not allowed.');
      return this.handleSuccess<AdminReport>({ ...(data as any), item_title: '', reporter_name: '' });
    } catch (err) {
      return this.handleError<AdminReport>(err, 'Failed to update report');
    }
  }

  public async createAnnouncement(announcement: Omit<Announcement, 'id' | 'created_at'>): Promise<RepositoryResponse<Announcement>> {
    void announcement;
    return this.handleError<Announcement>(NOT_AVAILABLE);
  }

  /** Site settings are not stored in the database in this version. */
  public async getSettings(): Promise<RepositoryResponse<PlatformSettings>> {
    return this.handleSuccess<PlatformSettings>({ ...DEFAULT_SETTINGS });
  }

  public async updatePlatformSettings(settings: Partial<PlatformSettings>): Promise<RepositoryResponse<PlatformSettings>> {
    void settings;
    return this.handleError<PlatformSettings>(NOT_AVAILABLE);
  }

  public toggleArtistStatus(id: string, status: 'active' | 'suspended') {
    return this.patchOne('profiles', id, { is_active: status === 'active' }, PROFILE_COLS, toArtist, 'artist');
  }

  /** Accounts live in Supabase Auth, which the browser can never delete. Suspend instead. */
  public async deleteArtist(id: string): Promise<RepositoryResponse<boolean>> {
    void id;
    return this.handleError<boolean>('Accounts cannot be deleted from the website. Suspend the artist, or delete the user from the Supabase dashboard.');
  }

  public setArtworkStatus(id: string, status: 'available' | 'sold' | 'archived') {
    const patch =
      status === 'archived' ? { status: 'archived' }
      : status === 'sold' ? { status: 'published', is_sold: true }
      : { status: 'published', is_sold: false };
    return this.patchOne('artworks', id, patch, AW_SEL, toArtwork, 'artwork');
  }
  public deleteArtwork(id: string) { return this.removeOne('artworks', id, 'artwork'); }

  public setCollectionStatus(id: string, status: 'active' | 'archived') {
    return this.patchOne('collections', id, { status: status === 'active' ? 'published' : 'archived' }, COL_SEL, toCollection, 'collection');
  }
  public deleteCollection(id: string) { return this.removeOne('collections', id, 'collection'); }

  public setStoryStatus(id: string, status: 'published' | 'draft' | 'archived') {
    return this.patchOne('stories', id, { status }, ST_SEL, toStory, 'story');
  }
  public deleteStory(id: string) { return this.removeOne('stories', id, 'story'); }
}

export const adminRepository = new AdminRepository();
