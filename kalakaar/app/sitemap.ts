import { MetadataRoute } from 'next'
import { createAnonClient } from '@/lib/supabase/anon'
import { SITE_URL } from '@/src/lib/site';

// Rebuilt at most once an hour, so crawlers never hammer the database.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;
  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/artists`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/collections`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/stories`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/community`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // Real published content from the database (public data only, via the anonymous client).
  // The database returns at most 1000 rows per request, so we read in pages of 1000 until a table is
  // exhausted (capped, because one sitemap file may hold at most 50,000 URLs).
  // If the database cannot be reached, the sitemap still works with the fixed pages above.
  const entries: MetadataRoute.Sitemap = [];
  const PAGE = 1000;
  const CAP = 12000; // per content type: 4 types x 12,000 stays under the 50,000 limit
  try {
    const supabase = createAnonClient();
    const readAll = async (table: string, build: (q: any) => any): Promise<{ id: string; updated_at?: string }[]> => {
      const rows: { id: string; updated_at?: string }[] = [];
      for (let from = 0; from < CAP; from += PAGE) {
        const { data, error } = await build(supabase.from(table).select('id, updated_at'))
          .order('id', { ascending: true })
          .range(from, from + PAGE - 1);
        if (error || !data) break;
        rows.push(...data);
        if (data.length < PAGE) break;
      }
      return rows;
    };
    const [artworks, artists, collections, stories] = await Promise.all([
      readAll('artworks', (q) => q.eq('status', 'published')),
      readAll('profiles', (q) => q.eq('role', 'artist').eq('is_active', true)),
      readAll('collections', (q) => q.eq('status', 'published')),
      readAll('stories', (q) => q.eq('status', 'published')),
    ]);
    const add = (rows: { id: string; updated_at?: string }[], path: string, changeFrequency: 'weekly' | 'monthly', priority: number) =>
      rows.forEach((r) =>
        entries.push({ url: `${baseUrl}${path}/${r.id}`, lastModified: r.updated_at ? new Date(r.updated_at) : new Date(), changeFrequency, priority })
      );
    add(artworks, '/artwork', 'weekly', 0.8);
    add(artists, '/artist', 'weekly', 0.8);
    add(collections, '/collections', 'monthly', 0.7);
    add(stories, '/stories', 'monthly', 0.7);
  } catch {
    /* fall back to the fixed pages */
  }

  return [...staticRoutes, ...entries];
}
