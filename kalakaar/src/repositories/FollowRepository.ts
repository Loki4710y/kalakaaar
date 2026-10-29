import { BaseRepository, RepositoryResponse } from './BaseRepository';
import { isUuid } from './utils';

export class FollowRepository extends BaseRepository {
  public async follow(artistId: string, followerId: string): Promise<RepositoryResponse<boolean>> {
    try {
      if (!isUuid(artistId) || !isUuid(followerId)) return this.handleError<boolean>('Invalid request');
      if (artistId === followerId) return this.handleError<boolean>('You cannot follow yourself');
      const { error } = await this.client
        .from('followers')
        .upsert({ follower_id: followerId, artist_id: artistId }, { onConflict: 'follower_id,artist_id', ignoreDuplicates: true });
      if (error) return this.handleError<boolean>(error, 'Failed to follow artist');
      return this.handleSuccess<boolean>(true);
    } catch (err) {
      return this.handleError<boolean>(err, 'Failed to follow artist');
    }
  }

  public async unfollow(artistId: string, followerId: string): Promise<RepositoryResponse<boolean>> {
    try {
      const { error } = await this.client.from('followers').delete().eq('artist_id', artistId).eq('follower_id', followerId);
      if (error) return this.handleError<boolean>(error, 'Failed to unfollow artist');
      return this.handleSuccess<boolean>(true);
    } catch (err) {
      return this.handleError<boolean>(err, 'Failed to unfollow artist');
    }
  }

  public async isFollowing(artistId: string, followerId: string): Promise<RepositoryResponse<boolean>> {
    try {
      if (!isUuid(artistId) || !isUuid(followerId)) return this.handleSuccess<boolean>(false);
      const { data, error } = await this.client
        .from('followers').select('artist_id').eq('artist_id', artistId).eq('follower_id', followerId).maybeSingle();
      if (error) return this.handleError<boolean>(error, 'Failed to check follow');
      return this.handleSuccess<boolean>(!!data);
    } catch (err) {
      return this.handleError<boolean>(err, 'Failed to check follow');
    }
  }

  public async getFollowers(artistId: string): Promise<RepositoryResponse<string[]>> {
    try {
      if (!isUuid(artistId)) return this.handleSuccess<string[]>([]);
      const { data, error } = await this.client.from('followers').select('follower_id').eq('artist_id', artistId).limit(200);
      if (error) return this.handleError<string[]>(error, 'Failed to load followers');
      return this.handleSuccess<string[]>((data || []).map((r: any) => r.follower_id));
    } catch (err) {
      return this.handleError<string[]>(err, 'Failed to load followers');
    }
  }

  public async getFollowing(followerId: string): Promise<RepositoryResponse<string[]>> {
    try {
      if (!isUuid(followerId)) return this.handleSuccess<string[]>([]);
      const { data, error } = await this.client.from('followers').select('artist_id').eq('follower_id', followerId).limit(500);
      if (error) return this.handleError<string[]>(error, 'Failed to load following');
      return this.handleSuccess<string[]>((data || []).map((r: any) => r.artist_id));
    } catch (err) {
      return this.handleError<string[]>(err, 'Failed to load following');
    }
  }

  /** Uses the counter the database keeps on profiles. */
  public async getFollowerCount(artistId: string): Promise<RepositoryResponse<number>> {
    try {
      if (!isUuid(artistId)) return this.handleSuccess<number>(0);
      const { data, error } = await this.client.from('profiles').select('follower_count').eq('id', artistId).maybeSingle();
      if (error) return this.handleError<number>(error, 'Failed to load follower count');
      return this.handleSuccess<number>(data?.follower_count ?? 0);
    } catch (err) {
      return this.handleError<number>(err, 'Failed to load follower count');
    }
  }

  public async getFollowingCount(followerId: string): Promise<RepositoryResponse<number>> {
    try {
      if (!isUuid(followerId)) return this.handleSuccess<number>(0);
      const { count, error } = await this.client
        .from('followers').select('artist_id', { count: 'exact', head: true }).eq('follower_id', followerId);
      if (error) return this.handleError<number>(error, 'Failed to load following count');
      return this.handleSuccess<number>(count ?? 0);
    } catch (err) {
      return this.handleError<number>(err, 'Failed to load following count');
    }
  }
}

export const followRepository = new FollowRepository();
