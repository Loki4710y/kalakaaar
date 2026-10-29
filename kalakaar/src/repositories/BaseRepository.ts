import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { reportError } from '@/src/lib/monitoring';

export interface RepositoryResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

const NO_BACKEND_MESSAGE = 'No backend is connected. This action is unavailable.';

/**
 * Repository base. Repositories that are not wired to Supabase yet keep their
 * public signatures but return empty results (reads) or NO_BACKEND_MESSAGE (writes).
 */
export abstract class BaseRepository {
  /** Browser Supabase client (anon key). Created lazily so importing a repository never touches env. */
  protected get client(): SupabaseClient {
    return this.clientOverride ?? createClient();
  }

  /** Server pages pass a cookie-free anonymous client here so they can render public data for crawlers. */
  constructor(private readonly clientOverride?: SupabaseClient) {}

  protected handleSuccess<T>(data: T): RepositoryResponse<T> {
    return { success: true, data };
  }

  protected handleError<T = never>(
    error: unknown,
    defaultMessage = 'An unexpected error occurred'
  ): RepositoryResponse<T> {
    this.logError(this.constructor.name, error);
    // Plain strings are our own validation messages; only real errors go to monitoring.
    if (error && typeof error === 'object') reportError(error, { repository: this.constructor.name });
    return { success: false, error: this.normalizeError(error, defaultMessage) };
  }

  protected notConnected<T = never>(): RepositoryResponse<T> {
    return { success: false, error: NO_BACKEND_MESSAGE };
  }

  protected normalizeError(error: unknown, defaultMessage = 'An unexpected error occurred'): string {
    if (!error) return defaultMessage;
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (typeof error === 'object' && error !== null) {
      const errObj = error as Record<string, unknown>;
      if (typeof errObj.message === 'string') return errObj.message;
    }
    return defaultMessage;
  }

  protected logError(context: string, error: unknown): void {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[Repository Error - ${context}]:`, error);
    }
  }
}
