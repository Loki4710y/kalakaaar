"use client";
import { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '../../services/AuthService';
import { ProfileService } from '../../services/ProfileService';

export type UserRole = 'buyer' | 'artist' | 'admin' | 'super_admin' | 'user';

interface User {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  avatar: string;
  isFirstLogin?: boolean;
  bio?: string;
  location?: string;
  whatsapp?: string;
  instagram?: string;
  website?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ data?: any, error?: any }>;
  signUp: (email: string, password: string, name: string, isArtist: boolean, captchaToken?: string) => Promise<{ data?: any, error?: any }>;
  logout: () => Promise<void>;
  clearFirstLogin: () => void;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string, redirectTo?: string) => Promise<{ error?: any }>;
  updatePassword: (newPassword: string) => Promise<{ data?: any, error?: any }>;
  /** Re-reads the signed-in user's profile so the navbar and every screen show the latest name and photo. */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const syncUserFromSession = useCallback(async (authUser: any) => {
    try {
      const { data: profile } = await ProfileService.getProfile(authUser.id);

      const meta = authUser.user_metadata || {};
      // PHASE 5: profiles.role is the ONLY source of truth for user role
      const rawRole = (profile?.role || meta.role || (meta.is_artist ? 'artist' : 'buyer')) as string;
      const role: UserRole = rawRole === 'user' ? 'buyer' : (rawRole as UserRole);
      
      const formattedUser: User = {
        id: authUser.id,
        name: profile?.display_name || profile?.full_name || meta.display_name || meta.full_name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email,
        role: role,
        avatar: profile?.avatar_url || meta.avatar_url || meta.picture || '/assets/defaults/avatar.svg',
        bio: profile?.bio || meta.bio,
        location: profile?.location || meta.location,
        whatsapp: profile?.whatsapp_number || meta.whatsapp,
        instagram: profile?.instagram_url || profile?.instagram_handle || meta.instagram,
        website: profile?.website_url || profile?.website || meta.website,
      };

      setUser(formattedUser);
    } catch (err) {
      console.error('Failed to sync profile, falling back to auth user metadata:', err);
      const meta = authUser.user_metadata || {};
      const rawRole = (meta.role || (meta.is_artist ? 'artist' : 'buyer')) as string;
      const formattedUser: User = {
        id: authUser.id,
        name: meta.display_name || meta.full_name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email,
        role: rawRole === 'user' ? 'buyer' : (rawRole as UserRole),
        avatar: meta.avatar_url || meta.picture || '/assets/defaults/avatar.svg',
      };
      setUser(formattedUser);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const { data: { session } } = await AuthService.getSession();
        if (session?.user) {
          await syncUserFromSession(session.user);
        } else if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      }
    }

    initAuth();

    const { data: authListener } = AuthService.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await syncUserFromSession(session.user);
      } else if (isMounted) {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [syncUserFromSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await AuthService.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return { error };
    }
    if (data?.user) {
      await syncUserFromSession(data.user);
    }
    setLoading(false);
    return { data, error: null };
  }, [syncUserFromSession]);

  const signUp = useCallback(async (email: string, password: string, name: string, isArtist: boolean, captchaToken?: string) => {
    setLoading(true);
    const role: UserRole = isArtist ? 'artist' : 'buyer';
    const { data, error } = await AuthService.signUp({
      email,
      password,
      options: {
        captchaToken,
        data: {
          display_name: name,
          full_name: name,
          role: role,
          is_artist: isArtist,
        },
      },
    });

    if (error) {
      setLoading(false);
      return { error };
    }

    // The profile row is created by a database trigger. With email confirmation ON there is
    // no session yet, so the user stays signed out until they verify.
    if (data?.session?.user) {
      await syncUserFromSession(data.session.user);
    }

    setLoading(false);
    return { data, error: null };
  }, [syncUserFromSession]);

  const logout = useCallback(async () => {
    setLoading(true);
    await AuthService.signOut();
    setUser(null);
    setLoading(false);
    router.push('/');
  }, [router]);

  const clearFirstLogin = useCallback(() => {
    if (user) {
      setUser({ ...user, isFirstLogin: false });
    }
  }, [user]);

  const signInWithGoogle = useCallback(async () => {
    const res = await AuthService.signInWithGoogle();
    if (res.data?.url) {
      window.location.href = res.data.url;
    } else if (res.error) {
      throw res.error;
    }
  }, []);

  const resetPassword = useCallback(async (email: string, redirectTo?: string) => {
    let redirectUrl = redirectTo;
    if (!redirectUrl && typeof window !== 'undefined') {
      redirectUrl = `${window.location.origin}/auth/reset-password`;
    }
    const res = await AuthService.resetPassword(email, redirectUrl);
    return res;
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const res = await AuthService.updatePassword(newPassword);
    return res;
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data: { session } } = await AuthService.getSession();
      if (session?.user) await syncUserFromSession(session.user);
    } catch {
      /* keep showing what we have */
    }
  }, [syncUserFromSession]);

  const value = useMemo(() => ({
    user,
    loading,
    signIn,
    signUp,
    logout,
    clearFirstLogin,
    signInWithGoogle,
    resetPassword,
    updatePassword,
    refreshUser,
  }), [user, loading, signIn, signUp, logout, clearFirstLogin, signInWithGoogle, resetPassword, updatePassword, refreshUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
