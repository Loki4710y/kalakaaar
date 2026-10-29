import { authRepository } from '../src/repositories/AuthRepository';
import type { AuthChangeEvent, Session } from '../src/repositories/AuthRepository';

export interface SignUpServiceParams {
  email: string;
  password: string;
  options?: {
    data?: {
      display_name?: string;
      full_name?: string;
      role?: 'buyer' | 'artist' | 'admin' | 'super_admin' | 'user';
      is_artist?: boolean;
    };
    emailRedirectTo?: string;
    captchaToken?: string;
  };
}

export interface SignInServiceParams {
  email: string;
  password: string;
}

export class AuthService {
  /**
   * Register a new user with business validation and role defaulting
   */
  static async signUp({
    email,
    password,
    options,
  }: SignUpServiceParams) {
    // Business Logic: Email & Password Validation
    const trimmedEmail = (email || '').trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return {
        data: { user: null, session: null },
        error: new Error('Please enter a valid email address'),
      };
    }

    if (!password || password.length < 6) {
      return {
        data: { user: null, session: null },
        error: new Error('Password must be at least 6 characters long'),
      };
    }

    // Business Logic: Sanitize display metadata
    const displayName = (options?.data?.display_name || options?.data?.full_name || trimmedEmail.split('@')[0]).trim();
    const isArtist = Boolean(options?.data?.is_artist || options?.data?.role === 'artist');
    const role: 'buyer' | 'artist' | 'admin' | 'super_admin' | 'user' = isArtist ? 'artist' : (options?.data?.role || 'buyer');

    const sanitizedOptions = {
      ...options,
      data: {
        ...options?.data,
        display_name: displayName,
        full_name: displayName,
        role,
        is_artist: isArtist,
      },
    };

    // Delegate data access to AuthRepository
    const repoResponse = await authRepository.signUp({
      email: trimmedEmail,
      password,
      options: sanitizedOptions,
    });

    if (!repoResponse.success) {
      return {
        data: { user: null, session: null },
        error: new Error(repoResponse.error || 'Registration failed'),
      };
    }

    return {
      data: {
        user: repoResponse.data?.user || null,
        session: repoResponse.data?.session || null,
      },
      error: null,
    };
  }

  /**
   * Authenticate existing user with credentials validation
   */
  static async signInWithPassword({
    email,
    password,
  }: SignInServiceParams) {
    // Business Logic: Credential Validation
    const trimmedEmail = (email || '').trim().toLowerCase();
    if (!trimmedEmail || !password) {
      return {
        data: { user: null, session: null },
        error: new Error('Email and password are required'),
      };
    }

    // Delegate data access to AuthRepository
    const repoResponse = await authRepository.signIn({
      email: trimmedEmail,
      password,
    });

    if (!repoResponse.success) {
      return {
        data: { user: null, session: null },
        error: new Error(repoResponse.error || 'Invalid credentials'),
      };
    }

    return {
      data: {
        user: repoResponse.data?.user || null,
        session: repoResponse.data?.session || null,
      },
      error: null,
    };
  }

  /**
   * Initiate Google OAuth authentication
   */
  static async signInWithGoogle(redirectTo?: string) {
    const repoResponse = await authRepository.signInWithGoogle(redirectTo);
    
    if (!repoResponse.success) {
      return {
        data: null,
        error: new Error(repoResponse.error || 'Google sign-in failed'),
      };
    }

    return {
      data: repoResponse.data,
      error: null,
    };
  }

  /**
   * Sign out current user
   */
  static async signOut() {
    const repoResponse = await authRepository.signOut();
    if (!repoResponse.success) {
      return {
        error: new Error(repoResponse.error || 'Sign out failed'),
      };
    }
    return { error: null };
  }

  /**
   * Fetch current active session
   */
  static async getSession() {
    const repoResponse = await authRepository.getCurrentSession();
    if (!repoResponse.success) {
      return {
        data: { session: null },
        error: new Error(repoResponse.error || 'Failed to retrieve session'),
      };
    }
    return {
      data: { session: repoResponse.data || null },
      error: null,
    };
  }

  /**
   * Fetch current authenticated user
   */
  static async getUser() {
    const repoResponse = await authRepository.getCurrentUser();
    if (!repoResponse.success) {
      return {
        data: { user: null },
        error: new Error(repoResponse.error || 'Failed to retrieve user'),
      };
    }
    return {
      data: { user: repoResponse.data || null },
      error: null,
    };
  }

  /**
   * Request password reset link
   */
  static async resetPassword(email: string, redirectTo?: string) {
    const trimmedEmail = (email || '').trim().toLowerCase();
    if (!trimmedEmail) {
      return { error: new Error('Email address is required') };
    }
    const repoResponse = await authRepository.resetPassword(trimmedEmail, redirectTo);
    if (!repoResponse.success) {
      return { error: new Error(repoResponse.error || 'Password reset request failed') };
    }
    return { error: null };
  }

  /**
   * Update current user password
   */
  static async updatePassword(newPassword: string) {
    if (!newPassword || newPassword.length < 6) {
      return { error: new Error('Password must be at least 6 characters long') };
    }
    const repoResponse = await authRepository.updatePassword(newPassword);
    if (!repoResponse.success) {
      return { error: new Error(repoResponse.error || 'Password update failed') };
    }
    return { data: { user: repoResponse.data || null }, error: null };
  }

  /**
   * Subscribe to auth state changes
   */
  static onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return authRepository.onAuthStateChange(callback);
  }
}
