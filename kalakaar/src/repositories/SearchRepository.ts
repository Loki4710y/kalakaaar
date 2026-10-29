import { BaseRepository, RepositoryResponse } from './BaseRepository';
import { artworkRepository } from './ArtworkRepository';
import { collectionRepository } from './CollectionRepository';
import { storyRepository } from './StoryRepository';
import { profileRepository } from './ProfileRepository';
import { clampLimit, sanitizeSearch, type Paged } from './utils';

export interface ArtistSearchItem {
  id: string;
  full_name: string;
  username: string;
  location: string;
  art_style: string;
  avatar_url: string;
  is_featured: boolean;
  is_verified?: boolean;
  avgRating: number;
  reviewCount: number;
  artworkThumbnails?: string[];
  profile_views?: number;
  bio?: string;
}

export interface ArtistSearchFilters {
  artStyle?: string;
  location?: string;
  featuredOnly?: boolean;
}

export interface ArtworkSearchFilters {
  category?: string;
  medium?: string;
  priceType?: 'all' | 'under_10k' | '10k_25k' | 'over_25k';
  featuredOnly?: boolean;
  sort?: 'newest' | 'most_liked' | 'price_low' | 'price_high';
}

export interface CollectionSearchFilters {
  artist?: string;
  sort?: 'newest' | 'popular';
  featuredOnly?: boolean;
}

export interface StorySearchFilters {
  category?: string;
  sort?: 'newest' | 'popular';
  featuredOnly?: boolean;
}

export interface SearchFilters {
  artistStyle?: string;
  artistLocation?: string;
  artistFeaturedOnly?: boolean;

  artworkCategory?: string;
  artworkMedium?: string;
  artworkPriceType?: 'all' | 'under_10k' | '10k_25k' | 'over_25k';
  artworkFeaturedOnly?: boolean;
  artworkSort?: 'newest' | 'most_liked' | 'price_low' | 'price_high';

  collectionArtist?: string;
  collectionSort?: 'newest' | 'popular';
  collectionFeaturedOnly?: boolean;

  storyCategory?: string;
  storySort?: 'newest' | 'popular';
  storyFeaturedOnly?: boolean;
}

function toArtistItem(p: any): ArtistSearchItem {
  return {
    id: p.id,
    full_name: p.display_name || p.username || 'Artist',
    username: p.username || '',
    location: p.location || [p.city, p.state].filter(Boolean).join(', '),
    art_style: p.primary_art_style || '',
    avatar_url: p.avatar_url || '/assets/defaults/avatar.svg',
    is_featured: !!p.is_featured,
    is_verified: !!p.is_verified,
    avgRating: 0,
    reviewCount: 0,
    artworkThumbnails: [],
    bio: p.bio || '',
  };
}

export type SearchTab = 'artists' | 'artworks' | 'collections' | 'stories';
const SEARCH_PAGE_SIZE = 12;

export class SearchRepository extends BaseRepository {
  /** First page of each of the four searches, run in parallel. `counts` are the true totals, not the page sizes. */
  public async searchEverything(query: string, filters?: SearchFilters): Promise<RepositoryResponse<any>> {
    try {
      const f = filters || {};
      const [artists, artworks, collections, stories] = await Promise.all([
        this.searchArtists(query, { artStyle: f.artistStyle, location: f.artistLocation, featuredOnly: f.artistFeaturedOnly }),
        this.searchArtworks(query, {
          category: f.artworkCategory, medium: f.artworkMedium, priceType: f.artworkPriceType,
          featuredOnly: f.artworkFeaturedOnly, sort: f.artworkSort,
        }),
        this.searchCollections(query, { artist: f.collectionArtist, sort: f.collectionSort, featuredOnly: f.collectionFeaturedOnly }),
        this.searchStories(query, { category: f.storyCategory, sort: f.storySort, featuredOnly: f.storyFeaturedOnly }),
      ]);
      const a = artists.data, w = artworks.data, c = collections.data, st = stories.data;
      const t = { artists: a?.total ?? 0, artworks: w?.total ?? 0, collections: c?.total ?? 0, stories: st?.total ?? 0 };
      return this.handleSuccess<any>({
        query,
        artists: a?.items || [],
        artworks: w?.items || [],
        collections: c?.items || [],
        stories: st?.items || [],
        counts: { all: t.artists + t.artworks + t.collections + t.stories, ...t },
      });
    } catch (err) {
      return this.handleError<any>(err, 'Search failed');
    }
  }

  public async searchArtists(query: string = '', filters?: ArtistSearchFilters, page = 1, pageSize = SEARCH_PAGE_SIZE): Promise<RepositoryResponse<Paged<ArtistSearchItem>>> {
    const res = await profileRepository.searchArtistsPage({
      query, style: filters?.artStyle && filters.artStyle !== 'all' ? filters.artStyle : undefined,
      location: filters?.location && filters.location !== 'all' ? filters.location : undefined,
      featuredOnly: filters?.featuredOnly, page, pageSize,
    });
    if (!res.success || !res.data) return this.handleError<Paged<ArtistSearchItem>>(res.error || 'Failed to search artists');
    const d = res.data;
    return this.handleSuccess<Paged<ArtistSearchItem>>({ ...d, items: d.items.map(toArtistItem) });
  }

  public async searchArtworks(query: string = '', filters?: ArtworkSearchFilters, page = 1, pageSize = SEARCH_PAGE_SIZE): Promise<RepositoryResponse<Paged<any>>> {
    const sortMap: Record<string, any> = { newest: 'newest', most_liked: 'popular', price_low: 'price_asc', price_high: 'price_desc' };
    let minPrice: number | undefined, maxPrice: number | undefined;
    if (filters?.priceType === 'under_10k') maxPrice = 10000;
    if (filters?.priceType === '10k_25k') { minPrice = 10000; maxPrice = 25000; }
    if (filters?.priceType === 'over_25k') minPrice = 25000;
    const res = await artworkRepository.getExplorePage({
      search: query,
      category: filters?.category && filters.category !== 'all' ? filters.category : undefined,
      medium: filters?.medium && filters.medium !== 'all' ? filters.medium : undefined,
      featuredOnly: filters?.featuredOnly,
      minPrice, maxPrice, page, pageSize,
      sortBy: sortMap[filters?.sort || 'newest'],
    });
    if (!res.success || !res.data) return this.handleError<Paged<any>>(res.error || 'Failed to search artworks');
    return this.handleSuccess<Paged<any>>(res.data);
  }

  public async searchCollections(query: string = '', filters?: CollectionSearchFilters, page = 1, pageSize = SEARCH_PAGE_SIZE): Promise<RepositoryResponse<Paged<any>>> {
    const res = await collectionRepository.searchCollectionsPage({
      search: query, featuredOnly: filters?.featuredOnly,
      artist: filters?.artist && filters.artist !== 'all' ? filters.artist : undefined,
      sort: filters?.sort, page, pageSize,
    });
    if (!res.success || !res.data) return this.handleError<Paged<any>>(res.error || 'Failed to search collections');
    return this.handleSuccess<Paged<any>>(res.data);
  }

  public async searchStories(query: string = '', filters?: StorySearchFilters, page = 1, pageSize = SEARCH_PAGE_SIZE): Promise<RepositoryResponse<Paged<any>>> {
    const res = await storyRepository.searchStoriesPage({
      search: query, category: filters?.category && filters.category !== 'all' ? filters.category : undefined,
      featuredOnly: filters?.featuredOnly, sort: filters?.sort, page, pageSize,
    });
    if (!res.success || !res.data) return this.handleError<Paged<any>>(res.error || 'Failed to search stories');
    return this.handleSuccess<Paged<any>>(res.data);
  }

  /** Autocomplete from artwork titles and artist names. */
  public async getSuggestions(query: string): Promise<RepositoryResponse<string[]>> {
    try {
      const term = sanitizeSearch(query);
      if (term.length < 2) return this.handleSuccess<string[]>([]);
      const [t, n] = await Promise.all([
        this.client.from('artworks').select('title').eq('status', 'published').ilike('title', `%${term}%`).limit(5),
        this.client.from('profiles').select('display_name').eq('role', 'artist').eq('is_active', true).ilike('display_name', `%${term}%`).limit(5),
      ]);
      const out = [...(n.data || []).map((r: any) => r.display_name), ...(t.data || []).map((r: any) => r.title)];
      return this.handleSuccess<string[]>(Array.from(new Set(out)).slice(0, clampLimit(8, 8, 8)));
    } catch (err) {
      return this.handleError<string[]>(err, 'Failed to load suggestions');
    }
  }
}

export const searchRepository = new SearchRepository();
