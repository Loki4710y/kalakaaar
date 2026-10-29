/**
 * The public address of the site, used for canonical links, sitemap, robots, Open Graph and JSON-LD.
 * Set NEXT_PUBLIC_APP_URL (e.g. https://kalakaar.art). A production build refuses to run without it
 * (see next.config.js), so a wrong domain can never be published silently.
 * Only local development falls back to localhost.
 */
export const SITE_URL: string = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
