import {
  profileRepository,
  UserProfile,
  ArtistStatistics,
} from '../src/repositories/ProfileRepository';
import { memoryCache } from '../src/lib/cache';

export type { UserProfile, ArtistStatistics };

function isValidHttpsUrl(urlStr: string | undefined): boolean {
  if (!urlStr || urlStr.trim() === '') return true;
  try {
    const parsed = new URL(urlStr.trim());
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export class ProfileService {
  /**
   * Check if a username is available in the system
   * Never returns available: true if a database or network error occurs
   */
  static async checkUsernameAvailability(username: string): Promise<{ available: boolean; error: Error | null }> {
    if (!username || username.trim() === '') {
      return { available: false, error: new Error('Username is empty') };
    }
    const cleanUsername = username.trim().toLowerCase();
    
    // Check regex pattern: 3-30 chars, lowercase letters, numbers, underscores
    if (cleanUsername.length < 3 || cleanUsername.length > 30 || !/^[a-z0-9_]+$/.test(cleanUsername)) {
      return {
        available: false,
        error: new Error('Invalid username format. Must be 3-30 characters with only lowercase letters, numbers, and underscores.'),
      };
    }

    const repoResponse = await profileRepository.checkUsernameExists(cleanUsername);
    if (!repoResponse.success) {
      return { available: false, error: new Error(repoResponse.error || 'Database error while checking username') };
    }

    return { available: !repoResponse.data, error: null };
  }

  /**
   * Generates a unique username from a display name or email
   * e.g. "John Doe" -> "john_doe" or "john_doe_4821" if taken
   */
  static async generateUniqueUsername(displayName: string, email?: string): Promise<string> {
    const rawName = displayName || (email ? email.split('@')[0] : 'user');
    const base = rawName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

    let cleanBase = base.length > 0 ? base.substring(0, 20) : 'user';
    if (cleanBase.length < 3) {
      cleanBase = `user_${cleanBase}`;
    }

    const { available } = await this.checkUsernameAvailability(cleanBase);
    if (available) {
      return cleanBase;
    }

    for (let i = 0; i < 5; i++) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const candidate = `${cleanBase}_${randomSuffix}`;
      const res = await this.checkUsernameAvailability(candidate);
      if (res.available) {
        return candidate;
      }
    }

    return `${cleanBase}_${Date.now().toString().slice(-4)}`;
  }

  /**
   * Create a new profile record
   */
  static async createProfile(profileData: Partial<UserProfile>): Promise<{ data: UserProfile | null; error: Error | null }> {
    try {
      const displayName = profileData.display_name || profileData.full_name || (profileData.email ? profileData.email.split('@')[0] : 'User');
      
      // Auto-generate username if not present
      let username = profileData.username;
      if (!username) {
        username = await this.generateUniqueUsername(displayName, profileData.email);
      }

      // Validations & sanitization
      const validatedDisplayName = displayName.slice(0, 60);
      const validatedBio = profileData.bio ? profileData.bio.slice(0, 500) : undefined;
      const validatedLocation = profileData.location ? profileData.location.slice(0, 100) : undefined;
      const validatedArtStyles = profileData.art_styles ? profileData.art_styles.slice(0, 5) : [];
      const validatedCustomArtStyle = profileData.custom_art_style ? profileData.custom_art_style.slice(0, 50) : undefined;

      // Validate URL fields
      const instagramUrl = profileData.instagram_url || profileData.instagram_handle;
      const websiteUrl = profileData.website_url || profileData.website;
      const behanceUrl = profileData.behance_url;

      if (!isValidHttpsUrl(instagramUrl)) {
        return { data: null, error: new Error('instagram_url must be a valid HTTPS URL (e.g. https://instagram.com/handle)') };
      }
      if (!isValidHttpsUrl(websiteUrl)) {
        return { data: null, error: new Error('website_url must be a valid HTTPS URL (e.g. https://example.com)') };
      }
      if (!isValidHttpsUrl(behanceUrl)) {
        return { data: null, error: new Error('behance_url must be a valid HTTPS URL (e.g. https://behance.net/artist)') };
      }

      // Role check
      const rawRole = profileData.role || (profileData.is_artist ? 'artist' : 'buyer');
      const validRole = (rawRole === 'artist' || rawRole === 'admin' || rawRole === 'super_admin' || rawRole === 'buyer' || rawRole === 'user') ? rawRole : 'buyer';

      const payload = {
        id: profileData.id,
        email: profileData.email || '',
        display_name: validatedDisplayName,
        username: username,
        role: validRole,
        avatar_url: profileData.avatar_url || '/assets/defaults/avatar.svg',
        cover_image_url: profileData.cover_image_url,
        bio: validatedBio,
        location: validatedLocation,
        art_styles: validatedArtStyles,
        custom_art_style: validatedCustomArtStyle,
        instagram_url: instagramUrl,
        website_url: websiteUrl,
        behance_url: behanceUrl,
        is_featured: profileData.is_featured ?? false,
        is_active: profileData.is_active ?? true,
        artwork_count: 0,
        collection_count: 0,
        story_count: 0,
        follower_count: 0,
        review_count: 0,
        average_rating: 0,
      };

      const repoResponse = await profileRepository.createProfile(payload);

      if (!repoResponse.success || !repoResponse.data) {
        const fallback: UserProfile = {
          ...(payload as UserProfile),
          full_name: payload.display_name,
        };
        return { data: fallback, error: new Error(repoResponse.error || 'Failed to create profile') };
      }

      memoryCache.invalidate();
      const result: UserProfile = {
        ...repoResponse.data,
        full_name: repoResponse.data.display_name,
      };
      return { data: result, error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unexpected error during profile creation';
      return { data: null, error: new Error(errorMessage) };
    }
  }

  /**
   * Fetch profile by User ID
   */
  static async getProfile(userId: string): Promise<{ data: UserProfile | null; error: Error | null }> {
    if (!userId || userId.trim() === '') {
      return { data: null, error: new Error('User ID is required') };
    }

    const repoResponse = await profileRepository.getProfile(userId);
    if (!repoResponse.success || !repoResponse.data) {
      return { data: null, error: repoResponse.error ? new Error(repoResponse.error) : null };
    }

    const result: UserProfile = {
      ...repoResponse.data,
      full_name: repoResponse.data.display_name || repoResponse.data.full_name,
    };

    return { data: result, error: null };
  }

  /**
   * Fetch current authenticated user's profile
   */
  static async getCurrentProfile(): Promise<{ data: UserProfile | null; error: Error | null }> {
    const repoResponse = await profileRepository.getCurrentProfile();
    if (!repoResponse.success || !repoResponse.data) {
      return { data: null, error: repoResponse.error ? new Error(repoResponse.error) : null };
    }

    const result: UserProfile = {
      ...repoResponse.data,
      full_name: repoResponse.data.display_name || repoResponse.data.full_name,
    };

    return { data: result, error: null };
  }

  /**
   * Fetch public active profile by username
   */
  static async getPublicProfile(username: string): Promise<{ data: UserProfile | null; error: Error | null }> {
    if (!username || username.trim() === '') {
      return { data: null, error: new Error('Username is required') };
    }

    const repoResponse = await profileRepository.getProfileByUsername(username);
    if (!repoResponse.success || !repoResponse.data) {
      return { data: null, error: repoResponse.error ? new Error(repoResponse.error) : null };
    }

    const result: UserProfile = {
      ...repoResponse.data,
      full_name: repoResponse.data.display_name || repoResponse.data.full_name,
    };

    return { data: result, error: null };
  }

  /**
   * Update profile fields with strict field validations and restrictions
   */
  static async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<{ data: UserProfile | null; error: Error | null }> {
    if (!userId || userId.trim() === '') {
      return { data: null, error: new Error('User ID is required') };
    }

    const allowedUpdates: Record<string, unknown> = {};

    if (updates.display_name !== undefined || updates.full_name !== undefined) {
      const val = updates.display_name || updates.full_name || '';
      allowedUpdates.display_name = val.slice(0, 60);
    }
    if (updates.bio !== undefined) {
      allowedUpdates.bio = updates.bio.slice(0, 2000);
    }
    if (updates.location !== undefined) {
      allowedUpdates.location = updates.location.slice(0, 100);
    }
    if (updates.art_styles !== undefined) {
      allowedUpdates.art_styles = updates.art_styles.slice(0, 5);
    }
    if (updates.custom_art_style !== undefined) {
      allowedUpdates.custom_art_style = updates.custom_art_style.slice(0, 50);
    }
    if (updates.avatar_url !== undefined) {
      allowedUpdates.avatar_url = updates.avatar_url;
    }
    if (updates.cover_image_url !== undefined) {
      allowedUpdates.cover_image_url = updates.cover_image_url;
    }

    if (updates.instagram_url !== undefined || updates.instagram_handle !== undefined) {
      const url = updates.instagram_url || updates.instagram_handle;
      if (!isValidHttpsUrl(url)) {
        return { data: null, error: new Error('instagram_url must be a valid HTTPS URL') };
      }
      allowedUpdates.instagram_url = url;
    }

    if (updates.website_url !== undefined || updates.website !== undefined) {
      const url = updates.website_url || updates.website;
      if (!isValidHttpsUrl(url)) {
        return { data: null, error: new Error('website_url must be a valid HTTPS URL') };
      }
      allowedUpdates.website_url = url;
    }

    if (updates.behance_url !== undefined) {
      if (!isValidHttpsUrl(updates.behance_url)) {
        return { data: null, error: new Error('behance_url must be a valid HTTPS URL') };
      }
      allowedUpdates.behance_url = updates.behance_url;
    }

    for (const key of ['city', 'state', 'primary_art_style'] as const) {
      const v = (updates as Record<string, unknown>)[key];
      if (typeof v === 'string') allowedUpdates[key] = v.slice(0, 80);
    }
    if (updates.role === 'artist' || updates.role === 'buyer' || (updates.role as string) === 'user') {
      allowedUpdates.role = updates.role; // the database only allows buyer <-> artist for normal users
    }
    const anyUpdates = updates as Record<string, unknown>;
    if (anyUpdates.whatsapp_number !== undefined || anyUpdates.whatsapp !== undefined) {
      allowedUpdates.whatsapp_number = anyUpdates.whatsapp_number ?? anyUpdates.whatsapp;
    }
    if (anyUpdates.contact_email !== undefined) allowedUpdates.contact_email = anyUpdates.contact_email;
    for (const key of ['show_whatsapp', 'show_instagram', 'show_email']) {
      if (typeof anyUpdates[key] === 'boolean') allowedUpdates[key] = anyUpdates[key];
    }

    const repoResponse = await profileRepository.updateProfile(userId, allowedUpdates);
    if (!repoResponse.success || !repoResponse.data) {
      return { data: null, error: new Error(repoResponse.error || 'Failed to update profile') };
    }

    memoryCache.invalidate();
    const result: UserProfile = {
      ...repoResponse.data,
      full_name: repoResponse.data.display_name || repoResponse.data.full_name,
    };

    return { data: result, error: null };
  }

  /**
   * Update profile avatar URL
   */
  static async updateAvatar(userId: string, avatarUrl: string): Promise<{ data: UserProfile | null; error: Error | null }> {
    if (!isValidHttpsUrl(avatarUrl) && !avatarUrl.startsWith('/assets/')) {
      return { data: null, error: new Error('Avatar URL must be a valid HTTPS or asset URL') };
    }

    const repoResponse = await profileRepository.updateAvatar(userId, avatarUrl);
    if (!repoResponse.success || !repoResponse.data) {
      return { data: null, error: new Error(repoResponse.error || 'Failed to update avatar') };
    }

    memoryCache.invalidate();
    const result: UserProfile = {
      ...repoResponse.data,
      full_name: repoResponse.data.display_name || repoResponse.data.full_name,
    };

    return { data: result, error: null };
  }

  /**
   * Search artist profiles
   */
  static async searchArtists(query: string, limit = 20): Promise<{ data: UserProfile[] | null; error: Error | null }> {
    const repoResponse = await profileRepository.searchArtists(query, limit);
    if (!repoResponse.success || !repoResponse.data) {
      return { data: null, error: new Error(repoResponse.error || 'Failed to search artists') };
    }
    return { data: repoResponse.data, error: null };
  }

  /**
   * Fetch featured artist profiles
   */
  static async getFeaturedArtists(limit = 6): Promise<{ data: UserProfile[] | null; error: Error | null }> {
    const cacheKey = `featured_artists_${limit}`;
    const cached = memoryCache.get<UserProfile[]>(cacheKey);
    if (cached) return { data: cached, error: null };

    const repoResponse = await profileRepository.getFeaturedArtists(limit);
    if (!repoResponse.success || !repoResponse.data) {
      return { data: null, error: new Error(repoResponse.error || 'Failed to fetch featured artists') };
    }
    memoryCache.set(cacheKey, repoResponse.data, 60000);
    return { data: repoResponse.data, error: null };
  }

  /**
   * Fetch artist profile statistics
   */
  static async getArtistStatistics(profileId: string): Promise<{ data: ArtistStatistics | null; error: Error | null }> {
    const repoResponse = await profileRepository.getArtistStatistics(profileId);
    if (!repoResponse.success || !repoResponse.data) {
      return { data: null, error: new Error(repoResponse.error || 'Failed to fetch artist statistics') };
    }
    return { data: repoResponse.data, error: null };
  }
}
