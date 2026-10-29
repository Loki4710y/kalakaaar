import { describe, it, expect, vi, beforeEach } from 'vitest';

// Regression test: a BUYER finishing onboarding with a WhatsApp number must not
// try to write artist_contacts (RLS only allows artists) and must not error.
const calls: { table: string; op: string; payload?: unknown }[] = [];
let role = 'buyer';

function builder(table: string) {
  const b: any = {
    select: () => b,
    eq: () => b,
    update: (payload: unknown) => { calls.push({ table, op: 'update', payload }); return b; },
    upsert: (payload: unknown) => { calls.push({ table, op: 'upsert', payload }); return Promise.resolve({ error: null }); },
    maybeSingle: () => Promise.resolve({ data: { id: 'u1', role, display_name: 'Lucky', is_active: true, username: 'lucky' }, error: null }),
    single: () => b.maybeSingle(),
    then: (res: any) => Promise.resolve({ data: null, error: null }).then(res),
  };
  return b;
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }), getSession: async () => ({ data: { session: { user: { id: 'u1' } } } }) },
    from: (t: string) => builder(t),
  }),
}));

import { ProfileRepository } from '../src/repositories/ProfileRepository';

describe('ProfileRepository.updateProfile contact handling', () => {
  beforeEach(() => { calls.length = 0; });

  it('skips artist_contacts for a buyer', async () => {
    role = 'buyer';
    const repo: any = new (ProfileRepository as any)();
    const res = await repo.updateProfile('u1', { display_name: 'Lucky', role: 'buyer', whatsapp_number: '8178120693' });
    expect(res.error).toBeUndefined();
    expect(calls.some((c) => c.table === 'artist_contacts')).toBe(false);
  });

  it('writes artist_contacts for an artist', async () => {
    role = 'artist';
    const repo: any = new (ProfileRepository as any)();
    await repo.updateProfile('u1', { role: 'artist', whatsapp_number: '8178120693' });
    const up = calls.find((c) => c.table === 'artist_contacts' && c.op === 'upsert');
    expect(up).toBeTruthy();
    expect((up!.payload as any).whatsapp_number).toBe('918178120693');
  });

  it('never changes the role of an admin (onboarding must not demote them)', async () => {
    role = 'super_admin';
    const repo: any = new (ProfileRepository as any)();
    await repo.updateProfile('u1', { display_name: 'Lucky', role: 'buyer' });
    const upd = calls.filter((c) => c.table === 'profiles' && c.op === 'update');
    expect(upd.every((c) => !('role' in (c.payload as object)))).toBe(true);
  });

  it('rejects an invalid WhatsApp number', async () => {
    role = 'artist';
    const repo: any = new (ProfileRepository as any)();
    const res = await repo.updateProfile('u1', { whatsapp_number: '12' });
    expect(res.success).toBe(false);
  });
});
