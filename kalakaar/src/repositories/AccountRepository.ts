import { BaseRepository, RepositoryResponse } from './BaseRepository';
import { isUuid } from './utils';

const BUCKETS = ['avatars', 'artworks', 'stories', 'collections'] as const;

/**
 * Self-service account deletion.
 * 1) The user's own image files are removed through the Storage API (the policies only allow their own folder).
 * 2) The database function delete_my_account() deletes the login, which cascades to the profile and all content.
 * No service_role key is involved anywhere.
 */
export class AccountRepository extends BaseRepository {
  /** Deletes every file under <bucket>/<prefix>/ (including one or two levels of sub-folders). Best effort. */
  private async removeFolder(bucket: string, prefix: string, depth = 0): Promise<void> {
    const storage = this.client.storage.from(bucket);
    for (let round = 0; round < 50; round++) {
      const { data, error } = await storage.list(prefix, { limit: 100, offset: 0 });
      if (error || !data || data.length === 0) return;
      const files = data.filter((o: any) => o.id).map((o: any) => `${prefix}/${o.name}`);
      const folders = data.filter((o: any) => !o.id).map((o: any) => `${prefix}/${o.name}`);
      if (depth < 3) for (const f of folders) await this.removeFolder(bucket, f, depth + 1);
      if (files.length === 0) return;
      const { error: rmError } = await storage.remove(files);
      if (rmError) return;
      if (data.length < 100) return;
    }
  }

  public async deleteMyAccount(userId: string): Promise<RepositoryResponse<boolean>> {
    try {
      if (!isUuid(userId)) return this.handleError<boolean>('Invalid account');
      const { data: sessionData } = await this.client.auth.getSession();
      if (sessionData.session?.user?.id !== userId) return this.handleError<boolean>('Please sign in again to delete your account.');

      for (const bucket of BUCKETS) {
        try { await this.removeFolder(bucket, userId); } catch { /* files are best effort; the account must still be deletable */ }
      }

      const { error } = await this.client.rpc('delete_my_account');
      if (error) return this.handleError<boolean>(error, 'Could not delete your account. Please try again or contact us.');
      return this.handleSuccess<boolean>(true);
    } catch (err) {
      return this.handleError<boolean>(err, 'Could not delete your account. Please try again or contact us.');
    }
  }
}

export const accountRepository = new AccountRepository();
