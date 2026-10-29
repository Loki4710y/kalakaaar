import { analyticsRepository } from '../src/repositories/AnalyticsRepository';
import type { ArtistAnalytics } from '../src/lib/analytics';

export type { ArtistAnalytics };

export interface AnalyticsResult { success: boolean; data?: ArtistAnalytics; error?: string | null }

export class AnalyticsService {
  /** Views, likes, saves, new followers and contact taps for the signed-in artist (7 to 90 days). */
  static async getMyAnalytics(days: number): Promise<AnalyticsResult> {
    const res = await analyticsRepository.getMyAnalytics(days);
    return res.success && res.data
      ? { success: true, data: res.data, error: null }
      : { success: false, error: res.error || 'Could not load analytics' };
  }
}
