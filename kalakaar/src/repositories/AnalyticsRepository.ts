import { BaseRepository, RepositoryResponse } from './BaseRepository';
import { normalizeAnalytics, type ArtistAnalytics } from '../lib/analytics';

/**
 * Reads the signed-in artist's own analytics through the database function my_analytics().
 * The function only ever looks at the caller's own artworks, so there is nothing to filter here.
 */
export class AnalyticsRepository extends BaseRepository {
  public async getMyAnalytics(days: number): Promise<RepositoryResponse<ArtistAnalytics>> {
    try {
      const safeDays = Math.min(Math.max(Math.floor(Number(days)) || 30, 7), 90);
      const { data, error } = await this.client.rpc('my_analytics', { p_days: safeDays });
      if (error) return this.handleError<ArtistAnalytics>(error, 'Could not load analytics');
      return this.handleSuccess<ArtistAnalytics>(normalizeAnalytics(data));
    } catch (err) {
      return this.handleError<ArtistAnalytics>(err, 'Could not load analytics');
    }
  }
}

export const analyticsRepository = new AnalyticsRepository();
