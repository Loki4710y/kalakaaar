import { accountRepository } from '../src/repositories/AccountRepository';

export interface AccountResult { success: boolean; error?: string | null }

export class AccountService {
  /** Permanently deletes the signed-in user's account, files and content. */
  static async deleteMyAccount(userId: string): Promise<AccountResult> {
    const res = await accountRepository.deleteMyAccount(userId);
    return res.success ? { success: true, error: null } : { success: false, error: res.error || 'Could not delete your account.' };
  }
}
