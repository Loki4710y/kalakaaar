import { CulturalContentService } from './CulturalContentService';

export interface HeritageQuote {
  id: string;
  quote_text: string;
  author: string;
}

const HERITAGE_QUOTES: HeritageQuote[] = [
  {
    id: 'quote-1',
    quote_text: 'Every handcrafted artwork carries a story waiting to be discovered.',
    author: 'Kalakaar Journal',
  },
  {
    id: 'quote-2',
    quote_text: 'Art preserves what history cannot always remember.',
    author: 'Heritage Archive',
  },
  {
    id: 'quote-3',
    quote_text: 'Tradition lives through the hands of every artisan.',
    author: 'Master Artisan Wisdom',
  },
  {
    id: 'quote-4',
    quote_text: 'Every brushstroke keeps a culture alive.',
    author: 'Craft Chronicle',
  },
  {
    id: 'quote-5',
    quote_text: 'Heritage is not inherited—it is protected.',
    author: 'Kalakaar Journal',
  },
  {
    id: 'quote-6',
    quote_text: 'The soul of a civilization can be seen through its art.',
    author: 'Living Heritage Archive',
  },
  {
    id: 'quote-7',
    quote_text: 'Every village has a story. Every artisan gives it a voice.',
    author: 'Folk Lore Treasury',
  },
  {
    id: 'quote-8',
    quote_text: 'The beauty of handmade art lies in its imperfections.',
    author: 'Artisan Reflections',
  },
  {
    id: 'quote-9',
    quote_text: 'Craftsmanship is culture made visible.',
    author: 'Heritage Archive',
  },
  {
    id: 'quote-10',
    quote_text: 'Every masterpiece begins with a single handmade stroke.',
    author: 'Kalakaar Journal',
  },
  {
    id: 'quote-11',
    quote_text: 'In the threads of traditional art, the past and present weave together.',
    author: 'Living Heritage Archive',
  },
  {
    id: 'quote-12',
    quote_text: 'Earth, pigment, and patience transform simple materials into timeless lore.',
    author: 'Folk Lore Treasury',
  },
  {
    id: 'quote-13',
    quote_text: 'Sacred geometry and folk motifs are prayers painted on canvas.',
    author: 'Heritage Archive',
  },
  {
    id: 'quote-14',
    quote_text: 'To hold a piece of folk art is to cradle centuries of quiet devotion.',
    author: 'Kalakaar Journal',
  },
  {
    id: 'quote-15',
    quote_text: 'Artisan hands do not merely create; they remember.',
    author: 'Master Artisan Wisdom',
  },
  {
    id: 'quote-16',
    quote_text: 'Natural colors drawn from nature carry the breath of the land itself.',
    author: 'Craft Chronicle',
  },
  {
    id: 'quote-17',
    quote_text: 'A tradition honored today becomes a legacy treasured tomorrow.',
    author: 'Living Heritage Archive',
  },
  {
    id: 'quote-18',
    quote_text: 'Through ancient motifs, our ancestors speak across generations.',
    author: 'Folk Lore Treasury',
  },
];

export class QuoteService {
  /**
   * Get a random quote from the local list.
   */
  static getRandomQuote(): HeritageQuote {
    const index = Math.floor(Math.random() * HERITAGE_QUOTES.length);
    return HERITAGE_QUOTES[index];
  }

  /**
   * Get deterministic Quote of the Day based on date string (YYYY-MM-DD),
   * with fallback to CulturalContentService if populated.
   */
  static async getQuoteOfTheDay(): Promise<HeritageQuote> {
    try {
      const remoteQuote = await CulturalContentService.getQuoteOfTheDay();
      if (remoteQuote && remoteQuote.quote_text) {
        return {
          id: remoteQuote.id || 'remote-quote',
          quote_text: remoteQuote.quote_text,
          author: remoteQuote.author || 'Kalakaar Journal',
        };
      }
    } catch {
      // Fallback to local deterministic picker
    }

    const todayStr = new Date().toISOString().split('T')[0];
    let hash = 0;
    for (let i = 0; i < todayStr.length; i++) {
      hash = (hash << 5) - hash + todayStr.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % HERITAGE_QUOTES.length;
    return HERITAGE_QUOTES[index];
  }
}
