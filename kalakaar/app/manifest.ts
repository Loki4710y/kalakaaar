import { MetadataRoute } from 'next';
import { BRANDING } from '@/src/config/assets';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kalakaar - India's Living Heritage Platform",
    short_name: 'Kalakaar',
    description: "Kalakaar is India's Living Heritage Platform connecting traditional artists with collectors through authentic handcrafted artworks, cultural stories, and heritage experiences.",
    start_url: '/',
    display: 'standalone',
    background_color: '#F5EFE0',
    theme_color: '#6B1E2E',
    icons: [
      {
        src: BRANDING.appIcon,
        sizes: '192x192',
        type: 'image/jpeg',
      },
      {
        src: BRANDING.appIcon,
        sizes: '512x512',
        type: 'image/jpeg',
      },
    ],
  }
}
