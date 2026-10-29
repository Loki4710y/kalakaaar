import { BaseRepository, RepositoryResponse } from './BaseRepository';
import { attachContacts, clampLimit, isUuid, sanitizeSearch, pageRange, makePaged, isRangeError, type Paged } from './utils';

export interface UserProfile {
  id: string;
  role?: 'buyer' | 'artist' | 'admin' | 'super_admin' | 'user';
  username: string;
  display_name: string;
  email?: string;
  avatar_url?: string;
  cover_image_url?: string;
  featured_artwork_url?: string;
  bio?: string;
  location?: string;
  city?: string;
  state?: string;
  primary_art_style?: string;
  art_styles?: string[];
  custom_art_style?: string;
  instagram_url?: string;
  website_url?: string;
  behance_url?: string;
  whatsapp_number?: string;
  is_featured?: boolean;
  is_verified?: boolean;
  is_active?: boolean;
  artwork_count?: number;
  collection_count?: number;
  story_count?: number;
  follower_count?: number;
  review_count?: number;
  average_rating?: number;
  created_at?: string;
  updated_at?: string;

  // Compatibility fields for legacy UI components
  full_name?: string;
  is_artist?: boolean;
  instagram_handle?: string;
  website?: string;
}

export interface ArtistStatistics {
  artwork_count: number;
  collection_count: number;
  story_count: number;
  follower_count: number;
  review_count: number;
  average_rating: number;
}

/** DB row -> UI shape (keeps legacy compatibility fields the components still read). */
function mapProfile(row: any): UserProfile {
  return {
    ...row,
    full_name: row.display_name,
    is_artist: row.role === 'artist',
    review_count: row.review_count ?? 0,
    average_rating: row.average_rating ?? 0,
    website: row.website_url ?? undefined,
  } as UserProfile;
}

const PROFILE_EDITABLE = [
  'display_name', 'bio', 'location', 'city', 'state', 'primary_art_style', 'art_styles',
  'custom_art_style', 'avatar_url', 'cover_image_url', 'featured_artwork_url', 'website_url', 'behance_url',
] as const;

/** "+91 98765 43210" -> "919876543210". A bare 10-digit Indian number gets the 91 prefix. */
function normalizeWhatsapp(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  let digits = input.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 10) digits = '91' + digits;
  return digits;
}

/** "https://instagram.com/foo/", "@foo", "foo" -> "foo" */
function extractInstagramHandle(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  let v = input.trim();
  if (!v) return null;
  v = v.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').split(/[/?#]/)[0];
  return v || null;
}

export class ProfileRepository extends BaseRepository {
  private async currentUserId(): Promise<string | null> {
    const { data } = await this.client.auth.getSession();
    return data.session?.user?.id ?? null;
  }

  /** Profile by user id (or username fallback). Own profile includes the full contact settings. */
  public async getProfile(id: string): Promise<RepositoryResponse<UserProfile | null>> {
    if (!id || typeof id !== 'string') return this.handleSuccess<UserProfile | null>(null);
    if (!isUuid(id)) return this.getProfileByUsername(id);
    try {
      const { data, error } = await this.client.from('profiles').select('*').eq('id', id).maybeSingle();
      if (error) return this.handleError<UserProfile | null>(error, 'Failed to load profile');
      if (!data) return this.handleSuccess<UserProfile | null>(null);
      const profile = mapProfile(data);
      await this.mergeContacts(profile);
      return this.handleSuccess<UserProfile | null>(profile);
    } catch (err) {
      return this.handleError<UserProfile | null>(err, 'Failed to load profile');
    }
  }

  public async getCurrentProfile(): Promise<RepositoryResponse<UserProfile | null>> {
    try {
      const uid = await this.currentUserId();
      if (!uid) return this.handleSuccess<UserProfile | null>(null);
      return this.getProfile(uid);
    } catch (err) {
      return this.handleError<UserProfile | null>(err, 'Failed to load profile');
    }
  }

  public async getProfileByUsername(username: string): Promise<RepositoryResponse<UserProfile | null>> {
    const clean = (username || '').trim().toLowerCase();
    if (!clean) return this.handleSuccess<UserProfile | null>(null);
    try {
      const { data, error } = await this.client.from('profiles').select('*').eq('username', clean).maybeSingle();
      if (error) return this.handleError<UserProfile | null>(error, 'Failed to load profile');
      if (!data) return this.handleSuccess<UserProfile | null>(null);
      const profile = mapProfile(data);
      await this.mergeContacts(profile);
      return this.handleSuccess<UserProfile | null>(profile);
    } catch (err) {
      return this.handleError<UserProfile | null>(err, 'Failed to load profile');
    }
  }

  public async checkUsernameExists(username: string): Promise<RepositoryResponse<boolean>> {
    try {
      const { data, error } = await this.client
        .from('profiles').select('id').eq('username', (username || '').trim().toLowerCase()).limit(1);
      if (error) return this.handleError<boolean>(error, 'Failed to check username');
      return this.handleSuccess<boolean>(Array.isArray(data) && data.length > 0);
    } catch (err) {
      return this.handleError<boolean>(err, 'Failed to check username');
    }
  }

  /** Profiles are created by a database trigger at signup; this just returns the existing row. */
  public async createProfile(payload: Record<string, unknown>): Promise<RepositoryResponse<UserProfile>> {
    const id = String(payload?.id || '');
    const res = await this.getProfile(id);
    if (res.success && res.data) return this.handleSuccess<UserProfile>(res.data);
    return this.handleError<UserProfile>(res.error || 'Profile has not been created yet. Please try again in a moment.');
  }

  /**
   * Updates profile fields (allow-listed) and contact settings.
   * Contact fields live in artist_contacts: whatsapp_number, instagram_url|instagram_handle, contact_email.
   */
  public async updateProfile(id: string, updates: Record<string, unknown>): Promise<RepositoryResponse<UserProfile>> {
    try {
      const uid = await this.currentUserId();
      if (!uid || uid !== id) return this.handleError<UserProfile>('You can only edit your own profile.');

      const patch: Record<string, unknown> = {};
      for (const key of PROFILE_EDITABLE) {
        if (updates[key] !== undefined) patch[key] = updates[key] === '' ? null : updates[key];
      }
      if (updates.role === 'artist' || updates.role === 'buyer') patch.role = updates.role;
      if (updates.role === 'user') patch.role = 'buyer';
      // Never let onboarding/settings change an admin's role (the DB guard exempts admins,
      // so without this an admin finishing onboarding would be demoted to buyer).
      if (patch.role !== undefined) {
        const { data: cur } = await this.client.from('profiles').select('role').eq('id', id).maybeSingle();
        if (cur?.role === 'admin' || cur?.role === 'super_admin') delete patch.role;
      }
      if (patch.display_name === null) delete patch.display_name; // required column
      for (const k of ['avatar_url', 'cover_image_url', 'featured_artwork_url'] as const) {
        const v = patch[k];
        if (typeof v === 'string' && !/^https:\/\//i.test(v) && !v.startsWith('/assets/')) delete patch[k]; // no blob:/data:/javascript:
      }
      for (const k of ['website_url', 'behance_url'] as const) {
        const v = patch[k];
        if (typeof v === 'string' && !/^https?:\/\//i.test(v)) {
          return this.handleError<UserProfile>('Links must start with http:// or https://');
        }
      }

      if (Object.keys(patch).length > 0) {
        const { error } = await this.client.from('profiles').update(patch).eq('id', id);
        if (error) return this.handleError<UserProfile>(error, 'Failed to update profile');
      }

      const contact: Record<string, unknown> = {};
      if (updates.whatsapp_number !== undefined || updates.whatsapp !== undefined) {
        const raw = (updates.whatsapp_number ?? updates.whatsapp) as string;
        const wa = normalizeWhatsapp(raw);
        if (raw && String(raw).trim() && (!wa || wa.length < 8 || wa.length > 15)) {
          return this.handleError<UserProfile>('Please enter a valid WhatsApp number.');
        }
        contact.whatsapp_number = wa;
      }
      if (updates.instagram_url !== undefined || updates.instagram_handle !== undefined) {
        const raw = (updates.instagram_url ?? updates.instagram_handle) as string;
        const handle = extractInstagramHandle(raw);
        if (handle && !/^[A-Za-z0-9._]{1,30}$/.test(handle)) {
          return this.handleError<UserProfile>('Please enter a valid Instagram handle.');
        }
        contact.instagram_handle = handle;
      }
      if (updates.contact_email !== undefined) {
        const email = String(updates.contact_email || '').trim();
        if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
          return this.handleError<UserProfile>('Please enter a valid contact email.');
        }
        contact.contact_email = email || null;
      }
      for (const k of ['show_whatsapp', 'show_instagram', 'show_email'] as const) {
        if (typeof updates[k] === 'boolean') contact[k] = updates[k];
      }
      // Contact details are artist-only (RLS enforces it). Buyers just skip this step.
      if (Object.keys(contact).length > 0) {
        let role = patch.role as string | undefined;
        if (!role) {
          const { data: me } = await this.client.from('profiles').select('role').eq('id', id).maybeSingle();
          role = me?.role;
        }
        if (role !== 'artist' && role !== 'admin' && role !== 'super_admin') {
          Object.keys(contact).forEach((k) => delete contact[k]);
        }
      }
      if (Object.keys(contact).length > 0) {
        const { error } = await this.client
          .from('artist_contacts').upsert({ artist_id: id, ...contact }, { onConflict: 'artist_id' });
        if (error) {
          const needsArtist = /row-level security|permission/i.test(error.message || '');
          return this.handleError<UserProfile>(
            error,
            needsArtist ? 'Only artist accounts can add contact details.' : 'Failed to save contact details'
          );
        }
      }

      const fresh = await this.getProfile(id);
      if (!fresh.success || !fresh.data) return this.handleError<UserProfile>(fresh.error || 'Profile not found');
      return this.handleSuccess<UserProfile>(fresh.data);
    } catch (err) {
      return this.handleError<UserProfile>(err, 'Failed to update profile');
    }
  }

  public async updateAvatar(id: string, avatarUrl: string): Promise<RepositoryResponse<UserProfile>> {
    return this.updateProfile(id, { avatar_url: avatarUrl });
  }

  public async searchArtists(query: string, limit = 50): Promise<RepositoryResponse<UserProfile[]>> {
    try {
      const q = sanitizeSearch(query);
      let req = this.client.from('profiles').select('*').eq('role', 'artist');
      if (q) {
        req = req.or(
          `display_name.ilike.%${q}%,username.ilike.%${q}%,bio.ilike.%${q}%,location.ilike.%${q}%,city.ilike.%${q}%,state.ilike.%${q}%`
        );
      }
      const { data, error } = await req.order('follower_count', { ascending: false }).limit(clampLimit(limit, 50, 100));
      if (error) return this.handleError<UserProfile[]>(error, 'Search failed');
      const list = (data || []).map(mapProfile);
      await attachContacts(this.client, list);
      return this.handleSuccess<UserProfile[]>(list);
    } catch (err) {
      return this.handleError<UserProfile[]>(err, 'Search failed');
    }
  }

  private artistPageFilters(q: any, o: { query?: string; style?: string; location?: string; featuredOnly?: boolean }) {
    q = q.eq('role', 'artist');
    if (o.featuredOnly) q = q.eq('is_featured', true);
    const loc = sanitizeSearch(o.location || '');
    if (loc) q = q.or(`location.ilike.%${loc}%,city.ilike.%${loc}%,state.ilike.%${loc}%`);
    const term = sanitizeSearch(o.query || '');
    if (term) {
      q = q.or(
        `display_name.ilike.%${term}%,username.ilike.%${term}%,bio.ilike.%${term}%,location.ilike.%${term}%,city.ilike.%${term}%,state.ilike.%${term}%`
      );
    }
    const style = sanitizeSearch(o.style || '').replace(/[{}]/g, '');
    if (style && style.toUpperCase() !== 'ALL') {
      q = q.or(`primary_art_style.ilike.%${style}%,custom_art_style.ilike.%${style}%,art_styles.cs.{${style}}`);
    }
    return q;
  }

  /** One page of artists with the total number of matches (server-side pagination). */
  public async searchArtistsPage(o: { query?: string; style?: string; location?: string; featuredOnly?: boolean; page?: number; pageSize?: number } = {}): Promise<RepositoryResponse<Paged<UserProfile>>> {
    try {
      const r = pageRange(o.page, o.pageSize ?? 12, 50);
      const { data, error, count } = await this.artistPageFilters(this.client.from('profiles').select('*', { count: 'exact' }), o)
        .order('follower_count', { ascending: false })
        .order('created_at', { ascending: false })
        .order('id', { ascending: true })
        .range(r.from, r.to);
      if (error && isRangeError(error)) {
        const head: any = await this.artistPageFilters(this.client.from('profiles').select('id', { count: 'exact', head: true }), o);
        return this.handleSuccess(makePaged<UserProfile>([], head.count ?? 0, r));
      }
      if (error) return this.handleError<Paged<UserProfile>>(error, 'Search failed');
      const list = (data || []).map(mapProfile);
      await attachContacts(this.client, list);
      return this.handleSuccess(makePaged<UserProfile>(list, count ?? list.length, r));
    } catch (err) {
      return this.handleError<Paged<UserProfile>>(err, 'Search failed');
    }
  }

  /** Featured artists first; if there are fewer than `limit`, fills up with the most active artists. */
  public async getFeaturedArtists(limit = 6): Promise<RepositoryResponse<UserProfile[]>> {
    try {
      const n = clampLimit(limit, 6, 50);
      const { data: featured, error } = await this.client
        .from('profiles').select('*').eq('role', 'artist').eq('is_featured', true)
        .order('featured_since', { ascending: false, nullsFirst: false }).limit(n);
      if (error) return this.handleError<UserProfile[]>(error, 'Failed to load artists');
      let rows = featured || [];
      if (rows.length < n) {
        const have = new Set(rows.map((r: any) => r.id));
        const { data: more } = await this.client
          .from('profiles').select('*').eq('role', 'artist').eq('is_featured', false)
          .order('artwork_count', { ascending: false }).order('created_at', { ascending: false }).limit(n);
        rows = rows.concat((more || []).filter((r: any) => !have.has(r.id))).slice(0, n);
      }
      const list = rows.map(mapProfile);
      await attachContacts(this.client, list);
      return this.handleSuccess<UserProfile[]>(list);
    } catch (err) {
      return this.handleError<UserProfile[]>(err, 'Failed to load artists');
    }
  }

  public async getArtistStatistics(profileId: string): Promise<RepositoryResponse<ArtistStatistics>> {
    try {
      const { data, error } = await this.client
        .from('profiles')
        .select('artwork_count, collection_count, story_count, follower_count')
        .eq('id', profileId).maybeSingle();
      if (error) return this.handleError<ArtistStatistics>(error, 'Failed to load statistics');
      return this.handleSuccess<ArtistStatistics>({
        artwork_count: data?.artwork_count ?? 0,
        collection_count: data?.collection_count ?? 0,
        story_count: data?.story_count ?? 0,
        follower_count: data?.follower_count ?? 0,
        review_count: 0,
        average_rating: 0,
      });
    } catch (err) {
      return this.handleError<ArtistStatistics>(err, 'Failed to load statistics');
    }
  }

  /** Own profile: full contact settings. Anyone else: only channels the artist chose to show. */
  private async mergeContacts(profile: UserProfile): Promise<void> {
    const uid = await this.currentUserId();
    if (uid && uid === profile.id) {
      const { data } = await this.client.from('artist_contacts').select('*').eq('artist_id', uid).maybeSingle();
      if (data) {
        Object.assign(profile, {
          whatsapp_number: data.whatsapp_number ?? undefined,
          instagram_handle: data.instagram_handle ?? undefined,
          contact_email: data.contact_email ?? undefined,
          show_whatsapp: data.show_whatsapp,
          show_instagram: data.show_instagram,
          show_email: data.show_email,
          instagram_url: data.instagram_handle ? `https://instagram.com/${data.instagram_handle}` : undefined,
        });
      }
      return;
    }
    await attachContacts(this.client, [profile]);
  }
}

export const profileRepository = new ProfileRepository();
