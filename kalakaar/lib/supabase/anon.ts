import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseEnv } from './env';

let anonClient: SupabaseClient | undefined;

/**
 * Cookie-free, anonymous server client for PUBLIC data only (share previews, cached pages).
 * It never reads the visitor's session, so pages that use it can be cached and shared by the CDN.
 * Row Level Security still applies: it only ever sees what a logged-out visitor may see.
 */
export function createAnonClient(): SupabaseClient {
  if (!anonClient) {
    const { url, anonKey } = getSupabaseEnv();
    anonClient = createSupabaseClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return anonClient;
}
