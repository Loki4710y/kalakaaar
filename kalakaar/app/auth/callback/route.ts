import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { safeRedirectPath } from '@/src/lib/safeRedirect';

/**
 * Landing route for every link that comes back from Supabase:
 *  - email confirmation  (token_hash + type=email|signup)  -> next=/auth/verified
 *  - password recovery   (token_hash + type=recovery)      -> next=/auth/reset-password
 *  - OAuth / PKCE        (?code=...)                       -> next=<page the user wanted>
 * Failures always end on the themed /auth/verified?status=error page, never a 404.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');
  const next = safeRedirectPath(searchParams.get('next'), '/explore');

  const fail = () => NextResponse.redirect(`${origin}/auth/verified?status=error`);

  try {
    const supabase = await createClient();
    if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
      if (error) return fail();
    } else if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) return fail();
    } else {
      return fail();
    }
  } catch {
    return fail();
  }

  return NextResponse.redirect(`${origin}${next}`);
}
