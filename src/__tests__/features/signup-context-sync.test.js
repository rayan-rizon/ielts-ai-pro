import { beforeEach, describe, expect, it, vi } from 'vitest';
const { database, query } = vi.hoisted(() => {
  const query = Object.fromEntries(
    ['update', 'upsert', 'eq', 'is', 'or', 'select', 'maybeSingle'].map((method) => [
      method,
      vi.fn(),
    ])
  );
  return {
    query,
    database: {
      from: vi.fn(),
      rpc: vi.fn(),
      auth: { signUp: vi.fn(), getSession: vi.fn(), signInWithIdToken: vi.fn() },
    },
  };
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
  for (const method of ['update', 'upsert', 'eq', 'is', 'or', 'select'])
    query[method].mockReturnValue(query);
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
  const signupSession = { user: { id: 'auth-new', email: 'learner@example.test' } };

  it('rejects a failed profile insert instead of returning a learner without a database id', async () => {
    database.auth.getSession.mockResolvedValue({ data: { session: signupSession } });
    query.maybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'insert unavailable', code: '42501' },
      });
    await expect(User.personalProfile()).rejects.toThrow(/profile/i);
  });

  it('does not report Google login as ready when profile loading fails', async () => {
    database.auth.signInWithIdToken.mockResolvedValue({
      data: { session: signupSession, user: signupSession.user },
      error: null,
    });
    const loader = vi.spyOn(User, 'me').mockRejectedValue(new Error('Learner profile unavailable'));
    try {
      await expect(User.signInWithGoogle('credential')).rejects.toThrow(
        'Learner profile unavailable'
      );
    } finally {
      loader.mockRestore();
    }
  });

  it('keeps registration measurement and referrals when the backend creates a new Google profile', async () => {
    database.auth.getSession.mockResolvedValue({ data: { session: signupSession } });
    const profile = {
      id: 'backend-profile',
      auth_id: 'auth-new',
      created_at: new Date().toISOString(),
      signup_attribution_recorded_at: new Date().toISOString(),
    };
    query.maybeSingle.mockResolvedValue({ data: profile, error: null });
    database.rpc.mockResolvedValue({ data: {}, error: null });
    const { trackSignupCompleted } = await import('@/lib/tracking');
    expect(await User.personalProfile('FRIEND')).toMatchObject({ id: 'backend-profile' });
    expect(trackSignupCompleted).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'backend-profile' })
    );
    expect(database.rpc).toHaveBeenCalledWith('process_referral', {
      p_new_user_id: 'backend-profile',
      p_referral_code: 'FRIEND',
    });
  });

  it('fills the country of a newly server-provisioned profile without overwriting an existing country', async () => {
    const { resolveSignupCountry } = await import('@/lib/geo');
    resolveSignupCountry.mockResolvedValue('BD');
    const profile = {
      id: 'backend-profile',
      created_at: new Date().toISOString(),
      signup_attribution_recorded_at: new Date().toISOString(),
      country: null,
    };
    query.maybeSingle.mockResolvedValue({ data: { ...profile, country: 'BD' }, error: null });
    expect(await User.syncSignupContext(profile)).toMatchObject({ country: 'BD' });
    query.update.mockClear();
    expect(await User.syncSignupContext({ ...profile, country: 'US' })).toMatchObject({
      country: 'US',
    });
    expect(query.update).not.toHaveBeenCalled();
    resolveSignupCountry.mockResolvedValue(undefined);
  });

  it('returns the actual profile when another profile loader wins the insert race', async () => {
    database.auth.getSession.mockResolvedValue({ data: { session: signupSession } });
    const winner = {
      id: 'winner',
      auth_id: 'auth-new',
      email: 'learner@example.test',
      subscription_tier: 'pro',
    };
    query.maybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: winner, error: null });
    expect(await User.personalProfile()).toMatchObject(winner);
    expect(query.update).not.toHaveBeenCalled();
    expect(query.eq).toHaveBeenLastCalledWith('auth_id', 'auth-new');
  });

  it('uses the Auth-trigger profile and still processes its referral without another insert', async () => {
    database.auth.signUp.mockResolvedValue({ data: { session: signupSession }, error: null });
    query.maybeSingle.mockResolvedValue({ data: { id: 'profile-existing' }, error: null });
    database.rpc.mockResolvedValue({ data: {}, error: null });
    await User.signUp('learner@example.test', 'StrongPass123!', 'Learner', 'FRIEND');
    expect(query.upsert).not.toHaveBeenCalled();
    expect(database.rpc).toHaveBeenCalledWith('process_referral', {
      p_new_user_id: 'profile-existing',
      p_referral_code: 'FRIEND',
    });
  });

  it('recovers the winning profile when a session listener creates it during signup', async () => {
    database.auth.signUp.mockResolvedValue({ data: { session: signupSession }, error: null });
    query.maybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: { id: 'winner', subscription_tier: 'pro' }, error: null });
    database.rpc.mockResolvedValue({ data: {}, error: null });
    await User.signUp('learner@example.test', 'StrongPass123!', 'Learner', 'FRIEND');
    expect(query.upsert).toHaveBeenCalledWith(expect.objectContaining({ auth_id: 'auth-new' }), {
      onConflict: 'email',
      ignoreDuplicates: true,
    });
    expect(query.update).not.toHaveBeenCalled();
    expect(query.eq).toHaveBeenLastCalledWith('auth_id', 'auth-new');
    expect(database.rpc).toHaveBeenCalledWith('process_referral', {
      p_new_user_id: 'winner',
      p_referral_code: 'FRIEND',
    });
  });

  it('does not create a profile before email confirmation', async () => {
    database.auth.signUp.mockResolvedValue({
      data: { session: null, user: { id: 'auth-new' } },
      error: null,
    });
    await User.signUp('learner@example.test', 'StrongPass123!', 'Learner');
    expect(database.from).not.toHaveBeenCalled();
  });
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
