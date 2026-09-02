import { beforeEach, describe, expect, it, vi } from 'vitest';

const testState = vi.hoisted(() => ({
  rpc: vi.fn(),
  listFactors: vi.fn(),
  listPasskeys: vi.fn(),
  registerPasskey: vi.fn(),
  startPasskeyRegistration: vi.fn(),
  verifyPasskeyRegistration: vi.fn(),
  challengeAndVerify: vi.fn(),
  getAssuranceLevel: vi.fn(),
  from: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: testState.rpc,
    auth: {
      registerPasskey: testState.registerPasskey,
      mfa: {
        listFactors: testState.listFactors,
        challengeAndVerify: testState.challengeAndVerify,
        getAuthenticatorAssuranceLevel: testState.getAssuranceLevel,
      },
      passkey: {
        list: testState.listPasskeys,
        startRegistration: testState.startPasskeyRegistration,
        verifyRegistration: testState.verifyPasskeyRegistration,
      },
    },
    from: testState.from,
  },
}));

import { AdminSecurityService } from '@/features/admin/services/AdminSecurityService';

const queryResult = (data: unknown[]) => ({
  select: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue({ data, error: null }),
});

describe('AdminSecurityService.getSnapshot', () => {
  beforeEach(() => {
    testState.rpc.mockReset();
    testState.listFactors.mockReset();
    testState.listPasskeys.mockReset();
    testState.registerPasskey.mockReset();
    testState.startPasskeyRegistration.mockReset();
    testState.verifyPasskeyRegistration.mockReset();
    testState.challengeAndVerify.mockReset();
    testState.getAssuranceLevel.mockReset();
    testState.from.mockReset();
  });

  it('keeps verified MFA and session data visible when passkeys are disabled', async () => {
    const status = {
      mfa_required: false,
      recovery_session_expires_at: null,
      session_id: 'session-1',
      aal: 'aal2',
      authentication_methods: [{ method: 'password', timestamp: 1 }],
    };
    const factor = {
      id: 'factor-1',
      factor_type: 'totp',
      friendly_name: 'My Passcode',
      status: 'verified',
      created_at: '2026-08-12T09:49:47Z',
    };
    const session = {
      session_id: 'session-1',
      first_seen_at: '2026-08-12T11:25:56Z',
      last_seen_at: '2026-08-12T11:26:19Z',
      last_event: 'admin_session_observed',
      authentication_methods: [{ method: 'totp', timestamp: 1 }],
      user_agent: 'Test browser',
      revoked_at: null,
    };

    testState.rpc.mockImplementation((name: string) => {
      if (name === 'record_admin_security_event') return Promise.resolve({ error: null });
      if (name === 'get_admin_security_status') {
        return Promise.resolve({ data: status, error: null });
      }
      if (name === 'get_admin_security_factors') {
        return Promise.resolve({ data: [factor], error: null });
      }
      if (name === 'get_admin_active_security_sessions') {
        return Promise.resolve({ data: [session], error: null });
      }
      throw new Error(`Unexpected RPC: ${name}`);
    });
    testState.listFactors.mockResolvedValue({ data: { totp: [factor], phone: [] }, error: null });
    testState.listPasskeys.mockResolvedValue({
      data: null,
      error: { message: 'Passkeys are disabled', code: 'passkey_disabled' },
    });
    testState.from.mockImplementation(() => queryResult([]));

    const snapshot = await AdminSecurityService.getSnapshot();

    expect(snapshot.status).toEqual(status);
    expect(snapshot.factors).toEqual([factor]);
    expect(snapshot.sessions).toEqual([session]);
    expect(snapshot.passkeys).toEqual([]);
    expect(snapshot.passkeysAvailable).toBe(false);
    expect(snapshot.passkeysError).toBe('Passkeys are disabled');
  });

  it('uses the AAL2-protected revocation RPC for an individual device', async () => {
    testState.rpc.mockResolvedValue({ error: null });

    await AdminSecurityService.signOutSession('device-session');

    expect(testState.rpc).toHaveBeenCalledWith('revoke_admin_security_session', {
      p_session_id: 'device-session',
    });
  });

  it('starts the passkey ceremony only while the document is focused', async () => {
    vi.spyOn(window, 'focus').mockImplementation(() => {});
    vi.spyOn(document, 'hasFocus').mockReturnValue(true);
    testState.registerPasskey.mockResolvedValue({ data: { id: 'passkey-1' }, error: null });
    testState.rpc.mockResolvedValue({ error: null });

    await AdminSecurityService.registerPasskey();

    expect(testState.registerPasskey).toHaveBeenCalledOnce();
  });

  it('prepares a passkey challenge before the focused browser ceremony', async () => {
    const registration = {
      challenge_id: 'challenge-1',
      options: {
        challenge: 'AQ',
        rp: { name: 'IELTS Ai Pro', id: 'ieltsai.pro' },
        user: { id: 'Ag', name: 'admin@example.com', displayName: 'Admin' },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      },
      expires_at: Date.now() + 60_000,
    };
    testState.startPasskeyRegistration.mockResolvedValue({ data: registration, error: null });

    await expect(AdminSecurityService.preparePasskeyRegistration()).resolves.toEqual(registration);
    expect(testState.startPasskeyRegistration).toHaveBeenCalledOnce();
  });

  it('opens the native registration prompt before verifying the prepared challenge', async () => {
    const createCredential = vi.fn().mockResolvedValue({
      id: 'credential-1',
      type: 'public-key',
      response: {
        attestationObject: new Uint8Array([1, 2]).buffer,
        clientDataJSON: new Uint8Array([3, 4]).buffer,
      },
      getClientExtensionResults: () => ({}),
    });
    const previousCredentials = navigator.credentials;
    Object.defineProperty(navigator, 'credentials', {
      configurable: true,
      value: { create: createCredential },
    });
    vi.spyOn(document, 'hasFocus').mockReturnValue(true);
    testState.verifyPasskeyRegistration.mockResolvedValue({
      data: { id: 'passkey-1' },
      error: null,
    });
    testState.rpc.mockResolvedValue({ error: null });

    try {
      await AdminSecurityService.registerPreparedPasskey({
        challenge_id: 'challenge-1',
        options: {
          challenge: 'AQ',
          rp: { name: 'IELTS Ai Pro', id: 'ieltsai.pro' },
          user: { id: 'Ag', name: 'admin@example.com', displayName: 'Admin' },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        },
        expires_at: Date.now() + 60_000,
      });
    } finally {
      Object.defineProperty(navigator, 'credentials', {
        configurable: true,
        value: previousCredentials,
      });
    }

    expect(createCredential).toHaveBeenCalledOnce();
    expect(testState.verifyPasskeyRegistration).toHaveBeenCalledWith(
      expect.objectContaining({ challengeId: 'challenge-1' })
    );
  });

  it('reverifies a sensitive action in the current session without signing in again', async () => {
    testState.challengeAndVerify.mockResolvedValue({
      data: { access_token: 'aal2-token', refresh_token: 'refresh-token' },
      error: null,
    });
    testState.getAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal2', nextLevel: 'aal2' },
      error: null,
    });
    testState.rpc.mockResolvedValue({ error: null });

    await AdminSecurityService.verifySensitiveAction('factor-1', '123456');

    expect(testState.challengeAndVerify).toHaveBeenCalledWith({
      factorId: 'factor-1',
      code: '123456',
    });
  });
});
