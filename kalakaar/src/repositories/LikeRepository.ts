import { BaseRepository, RepositoryResponse } from './BaseRepository';
import { isUuid } from './utils';

export interface ArtworkLikeRecord {
  id?: string;
  artwork_id: string;
  user_id: string;
  created_at?: string;
}

/** Likes are private: the database only lets a user see and change their own rows. */
export class LikeRepository extends BaseRepository {
  public async likeArtwork(artworkId: string, userId: string): Promise<RepositoryResponse<boolean>> {
    try {
      if (!isUuid(artworkId) || !isUuid(userId)) return this.handleError<boolean>('Invalid request');
      const { error } = await this.client
        .from('artwork_likes')
        .upsert({ user_id: userId, artwork_id: artworkId }, { onConflict: 'user_id,artwork_id', ignoreDuplicates: true });
      if (error) return this.handleError<boolean>(error, 'Failed to like artwork');
      return this.handleSuccess<boolean>(true);
    } catch (err) {
      return this.handleError<boolean>(err, 'Failed to like artwork');
    }
  }

  public async unlikeArtwork(artworkId: string, userId: string): Promise<RepositoryResponse<boolean>> {
    try {
      const { error } = await this.client.from('artwork_likes').delete().eq('artwork_id', artworkId).eq('user_id', userId);
      if (error) return this.handleError<boolean>(error, 'Failed to unlike artwork');
      return this.handleSuccess<boolean>(true);
    } catch (err) {
      return this.handleError<boolean>(err, 'Failed to unlike artwork');
    }
  }

  public async hasLiked(artworkId: string, userId: string): Promise<RepositoryResponse<boolean>> {
    try {
      if (!isUuid(artworkId) || !isUuid(userId)) return this.handleSuccess<boolean>(false);
      const { data, error } = await this.client
        .from('artwork_likes').select('artwork_id').eq('artwork_id', artworkId).eq('user_id', userId).maybeSingle();
      if (error) return this.handleError<boolean>(error, 'Failed to check like');
      return this.handleSuccess<boolean>(!!data);
    } catch (err) {
      return this.handleError<boolean>(err, 'Failed to check like');
    }
  }

  /** Only the caller's own like is visible (privacy), so this returns at most the current user's id. */
  public async getArtworkLikes(artworkId: string): Promise<RepositoryResponse<string[]>> {
    try {
      const { data, error } = await this.client.from('artwork_likes').select('user_id').eq('artwork_id', artworkId).limit(100);
      if (error) return this.handleError<string[]>(error, 'Failed to load likes');
      return this.handleSuccess<string[]>((data || []).map((r: any) => r.user_id));
    } catch (err) {
      return this.handleError<string[]>(err, 'Failed to load likes');
    }
  }

  /** Public counter maintained by the database. */
  public async getLikeCount(artworkId: string): Promise<RepositoryResponse<number>> {
    try {
      if (!isUuid(artworkId)) return this.handleSuccess<number>(0);
      const { data, error } = await this.client.from('artworks').select('like_count').eq('id', artworkId).maybeSingle();
      if (error) return this.handleError<number>(error, 'Failed to load like count');
      return this.handleSuccess<number>(data?.like_count ?? 0);
    } catch (err) {
      return this.handleError<number>(err, 'Failed to load like count');
    }
  }

  public async getUserLikedArtworks(userId: string): Promise<RepositoryResponse<string[]>> {
    try {
      if (!isUuid(userId)) return this.handleSuccess<string[]>([]);
      const { data, error } = await this.client
        .from('artwork_likes').select('artwork_id').eq('user_id', userId).order('created_at', { ascending: false }).limit(500);
      if (error) return this.handleError<string[]>(error, 'Failed to load liked artworks');
      return this.handleSuccess<string[]>((data || []).map((r: any) => r.artwork_id));
    } catch (err) {
      return this.handleError<string[]>(err, 'Failed to load liked artworks');
    }
  }
}

export const likeRepository = new LikeRepository();
