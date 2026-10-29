/**
 * Strict Supabase environment access. There is intentionally NO fallback:
 * if the variables are missing the app must fail loudly, never talk to a fake backend.
 */
export function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
        'Add them to .env.local (local) or the Vercel project settings (production).'
    );
  }
  return { url, anonKey };
}
