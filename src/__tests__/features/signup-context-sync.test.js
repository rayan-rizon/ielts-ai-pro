import { beforeEach, describe, expect, it, vi } from 'vitest';
const { database, query } = vi.hoisted(() => {
  const query = Object.fromEntries(
    ['update', 'eq', 'is', 'or', 'select', 'maybeSingle'].map((method) => [method, vi.fn()])
  );
  return { query, database: { from: vi.fn(), auth: { signUp: vi.fn() } } };
});
vi.mock('@/lib/supabase', () => ({ supabase: database }));
vi.mock('@/lib/tracking', () => ({ trackSignupCompleted: vi.fn(), pushUserIdentity: vi.fn() }));
vi.mock('@/lib/geo', () => ({ resolveSignupCountry: vi.fn() }));
import { User } from '@/features/auth/services/User';

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  delete window.__signupAttribution;
  database.from.mockReturnValue(query);
  for (const method of ['update', 'eq', 'is', 'or', 'select']) query[method].mockReturnValue(query);
  query.maybeSingle.mockResolvedValue({ data: null, error: null });
  window.localStorage.setItem(
    'attribution_first_touch',
    JSON.stringify({
      referrer: 'https://claude.ai/',
      landing_page: '/blog',
      captured_at: new Date().toISOString(),
    })
  );
});

describe('signup attribution persistence', () => {
  it('sends AI evidence and the finalization marker through email Auth metadata', async () => {
    database.auth.signUp.mockResolvedValue({
      data: { session: null, user: { id: 'new-user' } },
      error: null,
    });
    await User.signUp('learner@example.test', 'StrongPass123!', 'Learner');
    expect(database.auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          data: expect.objectContaining({
            signup_channel: 'ai_referral',
            signup_utm_source: 'Claude',
            signup_attribution_recorded_at: expect.any(String),
          }),
        }),
      })
    );
  });

  it('fills an OAuth-trigger profile using a conditional one-time update', async () => {
    const profile = {
      id: 'profile',
      created_at: new Date().toISOString(),
      signup_channel: 'direct',
    };
    query.maybeSingle.mockResolvedValue({
      data: { ...profile, signup_channel: 'ai_referral' },
      error: null,
    });
    expect((await User.syncSignupContext(profile)).signup_channel).toBe('ai_referral');
    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({
        signup_channel: 'ai_referral',
        signup_attribution_recorded_at: expect.any(String),
      })
    );
    expect(query.is).toHaveBeenCalledWith('signup_attribution_recorded_at', null);
    expect(query.or).toHaveBeenCalledWith(
      'signup_channel.is.null,signup_channel.in.(direct,unknown)'
    );
  });

  it('does not issue writes for old or finalized no-signal accounts', async () => {
    await User.syncSignupContext({ id: 'old', created_at: '2020-01-01', signup_channel: 'direct' });
    await User.syncSignupContext({
      id: 'done',
      created_at: new Date().toISOString(),
      signup_channel: 'direct',
      signup_attribution_recorded_at: new Date().toISOString(),
    });
    expect(database.from).not.toHaveBeenCalled();
  });

  it('does not pretend a failed persistence attempt was saved', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const profile = {
      id: 'profile',
      created_at: new Date().toISOString(),
      signup_channel: 'direct',
    };
    query.maybeSingle.mockResolvedValue({ data: null, error: { message: 'temporary failure' } });
    expect(await User.syncSignupContext(profile)).toEqual(profile);
    expect(profile.signup_attribution_recorded_at).toBeUndefined();
    vi.restoreAllMocks();
  });
});
