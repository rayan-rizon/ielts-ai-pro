import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({ client: null }));
vi.mock('@/lib/supabase', () => ({
  get supabase() {
    return db.client;
  },
  getSupabaseClient: async () => db.client,
}));

import { User } from '@/features/auth/services/User';
import { mergeOwnSettings, readOwnSettings } from '@/features/auth/services/userSettings';

/** One learner row. Writes land after a tick, so racing saves can overlap. */
function fakeClient({ settings = {}, rpcFails = false, updateError = null } = {}) {
  const row = { id: 'u1', auth_id: 'auth-1', email: 'a@b.test', settings };
  const calls = { rpc: [], updates: [] };
  const tick = () => new Promise((resolve) => setTimeout(resolve, 5));
  const client = {
    row,
    calls,
    auth: {
      getUser: async () => ({ data: { user: { id: 'auth-1', email: 'a@b.test' } } }),
      updateUser: async () => ({}),
    },
    rpc: async (name, args) => {
      calls.rpc.push({ name, args });
      if (rpcFails) return { data: null, error: { message: 'down' } };
      // Like production: the RPC never writes `settings`.
      const { settings: _ignored, ...fields } = args.p_updates;
      Object.assign(row, fields);
      return { data: structuredClone(row), error: null };
    },
    from: () => {
      let change = null;
      const query = {
        select: () => query,
        eq: () => query,
        update: (value) => {
          change = value;
          return query;
        },
        maybeSingle: async () => {
          if (!change) {
            const snapshot = structuredClone(row);
            await tick();
            return { data: snapshot, error: null };
          }
          await tick();
          if (updateError) return { data: null, error: updateError };
          calls.updates.push(change);
          Object.assign(row, change);
          return { data: structuredClone(row), error: null };
        },
      };
      return query;
    },
  };
  return client;
}

beforeEach(() => {
  db.client = fakeClient({ settings: { report_language: 'bn', theme: 'dark' } });
});

describe('mergeOwnSettings', () => {
  it('changes only the keys it is given', async () => {
    await mergeOwnSettings({ default_test_mode: 'exam' });
    expect(db.client.row.settings).toEqual({
      report_language: 'bn',
      theme: 'dark',
      default_test_mode: 'exam',
    });
  });

  it('keeps both changes when two saves start together', async () => {
    await Promise.all([
      mergeOwnSettings({ default_test_mode: 'exam' }),
      mergeOwnSettings({ report_language: 'hi' }),
    ]);
    expect(db.client.row.settings).toMatchObject({
      default_test_mode: 'exam',
      report_language: 'hi',
    });
  });

  it('can compute the change from the stored settings', async () => {
    await mergeOwnSettings((stored) => ({ theme: `${stored.theme}-2` }));
    expect(db.client.row.settings.theme).toBe('dark-2');
  });

  it('reports a failed save and still lets the next one through', async () => {
    db.client = fakeClient({ updateError: { message: 'offline' } });
    await expect(mergeOwnSettings({ a: 1 })).rejects.toMatchObject({ message: 'offline' });
    db.client = fakeClient();
    await mergeOwnSettings({ a: 2 });
    expect(db.client.row.settings).toEqual({ a: 2 });
  });

  it('reads an empty object when nothing is stored', async () => {
    db.client = fakeClient({ settings: null });
    await expect(readOwnSettings()).resolves.toEqual({});
  });
});

describe('User.updateMyUserData with settings', () => {
  it('saves the default test mode, which the profile RPC ignores', async () => {
    const saved = await User.updateMyUserData({
      full_name: 'A',
      settings: { default_test_mode: 'exam' },
    });
    expect(db.client.calls.rpc[0].args.p_updates).toEqual({ full_name: 'A' });
    expect(db.client.row.settings).toEqual({
      report_language: 'bn',
      theme: 'dark',
      default_test_mode: 'exam',
    });
    expect(saved.settings.default_test_mode).toBe('exam');
  });

  it('never writes a whole settings object in the fallback update either', async () => {
    db.client = fakeClient({ settings: { report_language: 'bn' }, rpcFails: true });
    await User.updateMyUserData({ full_name: 'A', settings: { default_test_mode: 'exam' } });
    expect(db.client.calls.updates[0]).not.toHaveProperty('settings');
    expect(db.client.row.settings).toEqual({
      report_language: 'bn',
      default_test_mode: 'exam',
    });
  });

  it('leaves settings alone when a caller sends none', async () => {
    await User.updateMyUserData({ full_name: 'B' });
    expect(db.client.calls.updates).toHaveLength(0);
  });
});
