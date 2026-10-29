import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseEnv } from './env';

/** Pages that require a signed-in user. Public pages never redirect (no redirect loops). */
const PROTECTED_PREFIXES = [
  '/artist-portal',
  '/settings',
  '/wishlist',
  '/profile',
  '/notifications',
  '/welcome',
  '/stories/new',
  '/commissions',
  '/kalakaar-admin',
];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

/**
 * Refreshes the auth session cookie on every request and redirects
 * signed-out visitors away from protected pages.
 * NOTE: this is a UX guard only. Real security is Row Level Security in the database.
 */
export async function updateSession(request: NextRequest) {
  // Public pages never need a server-side auth check. Skipping it saves a round trip to the
  // Auth server on every page view (the browser keeps its own session fresh). Only protected
  // pages pay for the check, which is what makes thousands of visitors cheap.
  if (!isProtected(request.nextUrl.pathname)) {
    return NextResponse.next({ request });
  }

  let env: { url: string; anonKey: string };
  try {
    env = getSupabaseEnv();
  } catch (err) {
    return new NextResponse((err as Error).message, { status: 500 });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser() validates the token with the Auth server (getSession() alone is not trustworthy).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  if (!user && isProtected(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth';
    url.search = '';
    url.searchParams.set('mode', 'signin');
    url.searchParams.set('redirect', pathname + search);
    return NextResponse.redirect(url);
  }

  return response;
}
