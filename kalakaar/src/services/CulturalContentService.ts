export interface DailyQuote {
  id?: string;
  quote_text: string;
  author: string;
}

export interface CulturalFact {
  id?: string;
  fact_title: string;
  fact_description: string;
  origin_region?: string;
}

export class CulturalContentService {
  /** No backend connected: always returns null so callers use local fallbacks. */
  static async getQuoteOfTheDay(): Promise<DailyQuote | null> {
    return null;
  }

  /** No backend connected: always returns null so callers use local fallbacks. */
  static async getCulturalFactOfTheDay(): Promise<CulturalFact | null> {
    return null;
  }
}
