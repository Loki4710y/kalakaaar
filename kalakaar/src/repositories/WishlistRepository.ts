import { BaseRepository, RepositoryResponse } from './BaseRepository';
import { isUuid, pageRange, makePaged, isRangeError, attachContacts, type Paged } from './utils';
import { normalizeArtwork } from './ArtworkRepository';
import type { Artwork } from './ArtworkRepository';

export interface WishlistItem {
  id?: string;
  user_id: string;
  content_id: string;
  content_type: string;
  created_at?: string;
}

/** The wishlist only holds artworks and is private to the user (database rule). */
export class WishlistRepository extends BaseRepository {
  public async addToWishlist(userId: string, contentId: string, contentType = 'artwork'): Promise<RepositoryResponse<boolean>> {
    try {
      if (contentType !== 'artwork') return this.handleError<boolean>('Only artworks can be saved');
      if (!isUuid(contentId) || !isUuid(userId)) return this.handleError<boolean>('Invalid request');
      const { error } = await this.client
        .from('wishlists')
        .upsert({ user_id: userId, artwork_id: contentId }, { onConflict: 'user_id,artwork_id', ignoreDuplicates: true });
      if (error) return this.handleError<boolean>(error, 'Failed to save artwork');
      return this.handleSuccess<boolean>(true);
    } catch (err) {
      return this.handleError<boolean>(err, 'Failed to save artwork');
    }
  }

  public async removeFromWishlist(userId: string, contentId: string, _contentType = 'artwork'): Promise<RepositoryResponse<boolean>> {
    try {
      const { error } = await this.client.from('wishlists').delete().eq('user_id', userId).eq('artwork_id', contentId);
      if (error) return this.handleError<boolean>(error, 'Failed to remove artwork');
      return this.handleSuccess<boolean>(true);
    } catch (err) {
      return this.handleError<boolean>(err, 'Failed to remove artwork');
    }
  }

  public async isSaved(userId: string, contentId: string, _contentType = 'artwork'): Promise<RepositoryResponse<boolean>> {
    try {
      if (!isUuid(contentId) || !isUuid(userId)) return this.handleSuccess<boolean>(false);
      const { data, error } = await this.client
        .from('wishlists').select('artwork_id').eq('user_id', userId).eq('artwork_id', contentId).maybeSingle();
      if (error) return this.handleError<boolean>(error, 'Failed to check wishlist');
      return this.handleSuccess<boolean>(!!data);
    } catch (err) {
      return this.handleError<boolean>(err, 'Failed to check wishlist');
    }
  }

  public async getWishlist(userId: string, contentType = 'artwork'): Promise<RepositoryResponse<string[]>> {
    try {
      if (contentType !== 'artwork' || !isUuid(userId)) return this.handleSuccess<string[]>([]);
      const { data, error } = await this.client
        .from('wishlists').select('artwork_id').eq('user_id', userId).order('created_at', { ascending: false }).limit(500);
      if (error) return this.handleError<string[]>(error, 'Failed to load wishlist');
      return this.handleSuccess<string[]>((data || []).map((r: any) => r.artwork_id));
    } catch (err) {
      return this.handleError<string[]>(err, 'Failed to load wishlist');
    }
  }

  /** One page of the user's saved artworks (newest first) with the total, in a single query. */
  public async getWishlistPage(userId: string, opts?: { page?: number; pageSize?: number }): Promise<RepositoryResponse<Paged<Artwork>>> {
    const r = pageRange(opts?.page, opts?.pageSize ?? 12, 60);
    try {
      if (!isUuid(userId)) return this.handleSuccess(makePaged<Artwork>([], 0, r));
      const base = () => this.client.from('wishlists');
      const { data, error, count } = await base()
        .select('artwork_id, created_at, artworks!inner(*, profiles:artist_id(id, display_name, username, avatar_url))', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .order('artwork_id', { ascending: false })
        .range(r.from, r.to);
      if (error && isRangeError(error)) {
        const head: any = await base().select('artwork_id', { count: 'exact', head: true }).eq('user_id', userId);
        return this.handleSuccess(makePaged<Artwork>([], head.count ?? 0, r));
      }
      if (error) return this.handleError<Paged<Artwork>>(error, 'Failed to load wishlist');
      const list = (data || []).map((row: any) => normalizeArtwork(row.artworks)).filter((a) => a && a.id);
      await attachContacts(this.client, list.map((a) => a.profiles).filter(Boolean));
      return this.handleSuccess(makePaged<Artwork>(list, count ?? list.length, r));
    } catch (err) {
      return this.handleError<Paged<Artwork>>(err, 'Failed to load wishlist');
    }
  }

  public async clearWishlist(userId: string): Promise<RepositoryResponse<boolean>> {
    try {
      const { error } = await this.client.from('wishlists').delete().eq('user_id', userId);
      if (error) return this.handleError<boolean>(error, 'Failed to clear wishlist');
      return this.handleSuccess<boolean>(true);
    } catch (err) {
      return this.handleError<boolean>(err, 'Failed to clear wishlist');
    }
  }
}

export const wishlistRepository = new WishlistRepository();
