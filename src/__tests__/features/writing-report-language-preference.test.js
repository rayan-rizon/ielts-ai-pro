import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  readSavedReportLanguage,
  saveReportLanguage,
} from '@/features/testing/writing/report/reportLanguagePreference';

/** Just enough of the Supabase client for one read and one update of `users`. */
function fakeClient({ authId = 'auth-1', settings = null, updateResult } = {}) {
  const calls = { selects: [], updates: [] };
  const client = {
    auth: {
      getUser: async () => ({ data: { user: authId ? { id: authId } : null }, error: null }),
    },
    from(table) {
      expect(table).toBe('users');
      return {
        select: () => ({
          eq: (column, value) => ({
            maybeSingle: async () => {
              calls.selects.push([column, value]);
              return { data: { settings }, error: null };
            },
          }),
        }),
        update: (patch) => ({
          eq: (column, value) => ({
            select: () => ({
              maybeSingle: async () => {
                calls.updates.push({ patch, column, value });
                return updateResult ?? { data: { auth_id: value, ...patch }, error: null };
              },
            }),
          }),
        }),
      };
    },
  };
  return { client, calls };
}

describe('saving the report language', () => {
  const events = [];
  const listener = (event) => events.push(event.detail);
  window.addEventListener('userProfileUpdated', listener);
  afterEach(() => {
    events.length = 0;
    vi.restoreAllMocks();
  });

  it('adds the language to the settings already saved, without dropping any', async () => {
    const { client, calls } = fakeClient({ settings: { default_test_mode: 'exam' } });

    await saveReportLanguage('bn', { client });

    expect(calls.selects).toEqual([['auth_id', 'auth-1']]);
    expect(calls.updates).toHaveLength(1);
    expect(calls.updates[0].column).toBe('auth_id');
    expect(calls.updates[0].value).toBe('auth-1');
    expect(calls.updates[0].patch.settings).toEqual({
      default_test_mode: 'exam',
      report_language: 'bn',
    });
  });

  it('starts a settings object for a learner who never had one', async () => {
    const { client, calls } = fakeClient({ settings: null });

    await saveReportLanguage('ur', { client });

    expect(calls.updates[0].patch.settings).toEqual({ report_language: 'ur' });
  });

  it('stores English rather than an unsupported value', async () => {
    const { client, calls } = fakeClient();

    await saveReportLanguage('klingon', { client });

    expect(calls.updates[0].patch.settings.report_language).toBe('en');
  });

  it('tells the rest of the app about the saved profile', async () => {
    const { client } = fakeClient();

    const saved = await saveReportLanguage('id', { client });

    expect(saved.settings.report_language).toBe('id');
    expect(events).toEqual([expect.objectContaining({ settings: { report_language: 'id' } })]);
  });

  it('fails loudly when nothing was written', async () => {
    const { client } = fakeClient({ updateResult: { data: null, error: null } });

    await expect(saveReportLanguage('hi', { client })).rejects.toThrow(/not saved/i);
    expect(events).toEqual([]);
  });

  it('passes a database error on and announces nothing', async () => {
    const { client } = fakeClient({
      updateResult: { data: null, error: new Error('permission denied') },
    });

    await expect(saveReportLanguage('hi', { client })).rejects.toThrow('permission denied');
    expect(events).toEqual([]);
  });

  it('refuses to write for a signed-out visitor', async () => {
    const { client, calls } = fakeClient({ authId: null });

    await expect(saveReportLanguage('hi', { client })).rejects.toThrow(/sign in/i);
    expect(calls.updates).toEqual([]);
  });
});

describe('reading the saved report language', () => {
  it('reads the stored value fresh from the learner’s own row', async () => {
    const { client, calls } = fakeClient({ settings: { report_language: 'ru' } });
    await expect(readSavedReportLanguage({ client })).resolves.toBe('ru');
    expect(calls.selects).toEqual([['auth_id', 'auth-1']]);
  });

  it('answers null when nothing was chosen', async () => {
    const { client } = fakeClient({ settings: { default_test_mode: 'exam' } });
    await expect(readSavedReportLanguage({ client })).resolves.toBeNull();
  });
});
