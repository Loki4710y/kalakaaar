import { MetadataRoute } from 'next'
import { SITE_URL } from '@/src/lib/site';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_URL;
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/kalakaar-admin/', '/api/', '/settings/', '/artist-portal/', '/profile', '/wishlist', '/notifications', '/welcome/', '/auth/', '/commissions/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
