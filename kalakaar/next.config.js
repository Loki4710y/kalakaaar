/** @type {import('next').NextConfig} */
const supabaseHost = (() => {
  try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '').hostname; } catch { return ''; }
})();

const isProd = process.env.NODE_ENV === 'production';

// ---- Build-time safety: never publish a build with a missing or wrong site address ----
// Vercel preview deployments get their own URL automatically; production must set NEXT_PUBLIC_APP_URL.
let appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').trim().replace(/\/+$/, '');
if (!appUrl && process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL) appUrl = `https://${process.env.VERCEL_URL}`;
if (isProd && process.env.SKIP_ENV_CHECK !== '1') {
  const problems = [];
  if (!appUrl) problems.push('NEXT_PUBLIC_APP_URL is not set (use your real address, e.g. https://yourdomain.com).');
  else if (!/^https:\/\//.test(appUrl) && !/^http:\/\/localhost(:\d+)?$/.test(appUrl)) problems.push(`NEXT_PUBLIC_APP_URL must start with https:// (got "${appUrl}").`);
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) problems.push('NEXT_PUBLIC_SUPABASE_URL is not set.');
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) problems.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set.');
  if (problems.length) {
    throw new Error('\nBuild stopped: missing or invalid environment variables.\n - ' + problems.join('\n - ') + '\nSet them (Vercel > Project > Settings > Environment Variables) and redeploy. See .env.example.\n');
  }
}
const sentryHost = (() => {
  try { return new URL(process.env.NEXT_PUBLIC_SENTRY_DSN || '').host.replace(/^[^.]+\./, '*.'); } catch { return ''; }
})();

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"} https://plausible.io https://challenges.cloudflare.com`,
  "frame-src https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  `img-src 'self' data: blob: https://${supabaseHost || '*.supabase.co'}`,
  `connect-src 'self' https://${supabaseHost || '*.supabase.co'} wss://${supabaseHost || '*.supabase.co'} https://plausible.io${sentryHost ? ` https://${sentryHost}` : ''}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  env: { NEXT_PUBLIC_APP_URL: appUrl },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  // The share-card route reads its fonts from disk, so make sure they ship with the deployment.
  outputFileTracingIncludes: { '/api/share-card/[kind]/[id]': ['./assets/fonts/**'] },
  images: {
    formats: ['image/avif', 'image/webp'],
    // Uploaded files get a random name and are never overwritten, so they can be cached for a month.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      ...(supabaseHost ? [{ protocol: 'https', hostname: supabaseHost }] : []),
      // A local Supabase (supabase start) serves images over plain http. Development only: never in a production build.
      ...(!isProd ? [{ protocol: 'http', hostname: '127.0.0.1' }, { protocol: 'http', hostname: 'localhost' }] : []),
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google sign-in profile photos
    ],
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // Our own static images/icons: let browsers and the CDN keep them for a day.
      { source: '/assets/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }] },
    ];
  },
};
module.exports = nextConfig;
