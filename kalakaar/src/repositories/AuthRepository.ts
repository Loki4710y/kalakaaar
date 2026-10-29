import { BaseRepository, RepositoryResponse } from './BaseRepository';
import type { User, Session, AuthChangeEvent, Provider } from '@supabase/supabase-js';
export type { User, Session, AuthChangeEvent, Provider };

export interface SignUpOptions {
  data?: {
    display_name?: string;
    full_name?: string;
    role?: 'buyer' | 'artist' | 'admin' | 'super_admin' | 'user';
    is_artist?: boolean;
    [key: string]: unknown;
  };
  emailRedirectTo?: string;
  /** Cloudflare Turnstile token (only when bot protection is enabled). */
  captchaToken?: string;
}

export interface SignUpParams {
  email: string;
  password: string;
  options?: SignUpOptions;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface AuthDataResult {
  user: User | null;
  session: Session | null;
}

export interface OAuthResult {
  provider: Provider;
  url: string | null;
}

function siteOrigin(): string {
  return typeof window !== 'undefined' ? window.location.origin : '';
}

function callbackUrl(next: string): string {
  return `${siteOrigin()}/auth/callback?next=${encodeURIComponent(next)}`;
}

export class AuthRepository extends BaseRepository {
  /** Register a new user. The profile row is created by a database trigger. */
  public async signUp(params: SignUpParams): Promise<RepositoryResponse<AuthDataResult>> {
    try {
      const { data, error } = await this.client.auth.signUp({
        email: params.email,
        password: params.password,
        options: {
          data: params.options?.data,
          emailRedirectTo: callbackUrl('/auth/verified'),
          ...(params.options?.captchaToken ? { captchaToken: params.options.captchaToken } : {}),
        },
      });
      if (error) return this.handleError<AuthDataResult>(error, 'Sign up failed');
      // Supabase returns a user with no identities (and no error) when the email already exists.
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        return this.handleError<AuthDataResult>('An account with this email already exists. Please sign in.');
      }
      return this.handleSuccess<AuthDataResult>({ user: data.user, session: data.session });
    } catch (err) {
      return this.handleError<AuthDataResult>(err, 'Sign up failed');
    }
  }

  public async signIn(params: SignInParams): Promise<RepositoryResponse<AuthDataResult>> {
    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email: params.email,
        password: params.password,
      });
      if (error) return this.handleError<AuthDataResult>(error, 'Invalid email or password');
      return this.handleSuccess<AuthDataResult>({ user: data.user, session: data.session });
    } catch (err) {
      return this.handleError<AuthDataResult>(err, 'Sign in failed');
    }
  }

  public async signOut(): Promise<RepositoryResponse<boolean>> {
    try {
      const { error } = await this.client.auth.signOut();
      if (error) return this.handleError<boolean>(error, 'Sign out failed');
      return this.handleSuccess(true);
    } catch (err) {
      return this.handleError<boolean>(err, 'Sign out failed');
    }
  }

  /** Verified with the Auth server (not just the local cookie). */
  public async getCurrentUser(): Promise<RepositoryResponse<User | null>> {
    try {
      const { data, error } = await this.client.auth.getUser();
      if (error) return this.handleSuccess<User | null>(null); // no session = not an error
      return this.handleSuccess<User | null>(data.user ?? null);
    } catch (err) {
      return this.handleError<User | null>(err, 'Failed to load user');
    }
  }

  public async getCurrentSession(): Promise<RepositoryResponse<Session | null>> {
    try {
      const { data, error } = await this.client.auth.getSession();
      if (error) return this.handleSuccess<Session | null>(null);
      return this.handleSuccess<Session | null>(data.session ?? null);
    } catch (err) {
      return this.handleError<Session | null>(err, 'Failed to load session');
    }
  }

  public async refreshSession(): Promise<RepositoryResponse<Session | null>> {
    try {
      const { data, error } = await this.client.auth.refreshSession();
      if (error) return this.handleError<Session | null>(error, 'Failed to refresh session');
      return this.handleSuccess<Session | null>(data.session ?? null);
    } catch (err) {
      return this.handleError<Session | null>(err, 'Failed to refresh session');
    }
  }

  /** The redirect always goes through /auth/callback, whatever the caller passes. */
  public async resetPassword(email: string, _redirectTo?: string): Promise<RepositoryResponse<boolean>> {
    try {
      const { error } = await this.client.auth.resetPasswordForEmail(email, {
        redirectTo: callbackUrl('/auth/reset-password'),
      });
      if (error) return this.handleError<boolean>(error, 'Failed to send reset email');
      return this.handleSuccess(true);
    } catch (err) {
      return this.handleError<boolean>(err, 'Failed to send reset email');
    }
  }

  public async updatePassword(newPassword: string): Promise<RepositoryResponse<User | null>> {
    try {
      const { data, error } = await this.client.auth.updateUser({ password: newPassword });
      if (error) return this.handleError<User | null>(error, 'Failed to update password');
      return this.handleSuccess<User | null>(data.user ?? null);
    } catch (err) {
      return this.handleError<User | null>(err, 'Failed to update password');
    }
  }

  public async resendVerificationEmail(email: string): Promise<RepositoryResponse<boolean>> {
    try {
      const { error } = await this.client.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: callbackUrl('/auth/verified') },
      });
      if (error) return this.handleError<boolean>(error, 'Failed to resend verification email');
      return this.handleSuccess(true);
    } catch (err) {
      return this.handleError<boolean>(err, 'Failed to resend verification email');
    }
  }

  /** Returns the provider URL; the caller navigates to it. */
  public async signInWithOAuth(provider: Provider, redirectTo?: string): Promise<RepositoryResponse<OAuthResult>> {
    try {
      const next = redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/explore';
      const { data, error } = await this.client.auth.signInWithOAuth({
        provider,
        options: { redirectTo: callbackUrl(next), skipBrowserRedirect: true },
      });
      if (error) return this.handleError<OAuthResult>(error, 'OAuth sign-in failed');
      return this.handleSuccess<OAuthResult>({ provider: data.provider, url: data.url });
    } catch (err) {
      return this.handleError<OAuthResult>(err, 'OAuth sign-in failed');
    }
  }

  public async signInWithGoogle(redirectTo?: string): Promise<RepositoryResponse<OAuthResult>> {
    return this.signInWithOAuth('google', redirectTo);
  }

  public async signInWithGithub(redirectTo?: string): Promise<RepositoryResponse<OAuthResult>> {
    return this.signInWithOAuth('github', redirectTo);
  }

  public onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this.client.auth.onAuthStateChange(callback);
  }
}

export const authRepository = new AuthRepository();
