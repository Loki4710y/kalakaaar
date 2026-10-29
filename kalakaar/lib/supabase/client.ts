import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseEnv } from './env';

let browserClient: SupabaseClient | undefined;

/** Browser client (anon key only). One shared instance per tab. */
export function createClient(): SupabaseClient {
  if (!browserClient) {
    const { url, anonKey } = getSupabaseEnv();
    browserClient = createBrowserClient(url, anonKey);
  }
  return browserClient;
}
