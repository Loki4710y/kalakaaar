import { searchRepository } from '../src/repositories/SearchRepository';
import type {
  ArtistSearchItem,
  ArtistSearchFilters,
  ArtworkSearchFilters,
  CollectionSearchFilters,
  StorySearchFilters,
  SearchFilters,
} from '../src/repositories/SearchRepository';
import type { Paged } from '../src/repositories/utils';
import { Artwork } from './ArtworkService';
import { Collection } from './CollectionService';
import { Story } from './StoryService';

export type {
  ArtistSearchItem,
  ArtistSearchFilters,
  ArtworkSearchFilters,
  CollectionSearchFilters,
  StorySearchFilters,
  SearchFilters,
};

export interface SearchResult<T> {
  success: boolean;
  data?: T;
  error?: string | null;
}

export interface GlobalSearchResults {
  query: string;
  artists: ArtistSearchItem[];
  artworks: Artwork[];
  collections: Collection[];
  stories: Story[];
  counts: {
    all: number;
    artists: number;
    artworks: number;
    collections: number;
    stories: number;
  };
}

const RECENT_SEARCHES_KEY = 'kalakaar_recent_searches';
const MAX_RECENT_SEARCHES = 10;

interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

const searchCache = new Map<string, CacheEntry<any>>();
const CACHE_TTL_MS = 60000; // 60s cache TTL

export class SearchService {
  /**
   * One page of artists for the query and filters (server-side pagination, 12 per page by default).
   */
  static async searchArtists(
    query: string = '',
    filters?: ArtistSearchFilters,
    page = 1,
    pageSize = 12
  ): Promise<SearchResult<Paged<ArtistSearchItem>>> {
    const cacheKey = `artist_${query.trim().toLowerCase()}_${JSON.stringify(filters || {})}_${page}_${pageSize}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const res = await searchRepository.searchArtists(query, filters, page, pageSize);
      if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Failed to search artists.' };
      }
      const result = { success: true, data: res.data, error: null };
      searchCache.set(cacheKey, { timestamp: Date.now(), data: result });
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to search artists.';
      return { success: false, error: msg };
    }
  }

  /**
   * One page of artworks for the query and filters (server-side pagination, 12 per page by default).
   */
  static async searchArtworks(
    query: string = '',
    filters?: ArtworkSearchFilters,
    page = 1,
    pageSize = 12
  ): Promise<SearchResult<Paged<Artwork>>> {
    const cacheKey = `artwork_${query.trim().toLowerCase()}_${JSON.stringify(filters || {})}_${page}_${pageSize}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const res = await searchRepository.searchArtworks(query, filters, page, pageSize);
      if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Failed to search artworks.' };
      }
      const result = { success: true, data: res.data, error: null };
      searchCache.set(cacheKey, { timestamp: Date.now(), data: result });
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to search artworks.';
      return { success: false, error: msg };
    }
  }

  /**
   * One page of collections for the query and filters (server-side pagination, 12 per page by default).
   */
  static async searchCollections(
    query: string = '',
    filters?: CollectionSearchFilters,
    page = 1,
    pageSize = 12
  ): Promise<SearchResult<Paged<Collection>>> {
    const cacheKey = `collection_${query.trim().toLowerCase()}_${JSON.stringify(filters || {})}_${page}_${pageSize}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const res = await searchRepository.searchCollections(query, filters, page, pageSize);
      if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Failed to search collections.' };
      }
      const result = { success: true, data: res.data, error: null };
      searchCache.set(cacheKey, { timestamp: Date.now(), data: result });
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to search collections.';
      return { success: false, error: msg };
    }
  }

  /**
   * One page of stories for the query and filters (server-side pagination, 12 per page by default).
   */
  static async searchStories(
    query: string = '',
    filters?: StorySearchFilters,
    page = 1,
    pageSize = 12
  ): Promise<SearchResult<Paged<Story>>> {
    const cacheKey = `story_${query.trim().toLowerCase()}_${JSON.stringify(filters || {})}_${page}_${pageSize}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const res = await searchRepository.searchStories(query, filters, page, pageSize);
      if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Failed to search stories.' };
      }
      const result = { success: true, data: res.data, error: null };
      searchCache.set(cacheKey, { timestamp: Date.now(), data: result });
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to search stories.';
      return { success: false, error: msg };
    }
  }

  /**
   * Unified Global Search across Artists, Artworks, Collections, Stories
   */
  static async search(
    query: string = '',
    filters?: SearchFilters
  ): Promise<SearchResult<GlobalSearchResults>> {
    const cacheKey = `global_${query.trim().toLowerCase()}_${JSON.stringify(filters || {})}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const res = await searchRepository.searchEverything(query, filters);
      if (!res.success || !res.data) {
        return { success: false, error: res.error || 'Global search failed.' };
      }
      const result = { success: true, data: res.data, error: null };
      searchCache.set(cacheKey, { timestamp: Date.now(), data: result });
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Global search failed.';
      return { success: false, error: msg };
    }
  }

  /**
   * Get search auto-complete suggestions
   */
  static async getSuggestions(query: string): Promise<SearchResult<string[]>> {
    try {
      const res = await searchRepository.getSuggestions(query);
      return { success: true, data: res.data || [], error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to get suggestions.';
      return { success: false, data: [], error: msg };
    }
  }

  /**
   * Get list of recent search queries from LocalStorage
   */
  static getRecentSearches(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Save a search query to LocalStorage
   */
  static saveRecentSearch(query: string): void {
    if (typeof window === 'undefined') return;
    const clean = query.trim();
    if (!clean) return;

    try {
      const current = this.getRecentSearches();
      const filtered = current.filter((item) => item.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  /**
   * Remove a single recent search query
   */
  static removeRecentSearch(query: string): void {
    if (typeof window === 'undefined') return;
    try {
      const current = this.getRecentSearches();
      const updated = current.filter((item) => item.toLowerCase() !== query.trim().toLowerCase());
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  /**
   * Clear all recent search queries
   */
  static clearRecentSearches(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // ignore
    }
  }
}
