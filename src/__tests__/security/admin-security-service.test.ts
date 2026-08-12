import { beforeEach, describe, expect, it, vi } from 'vitest';

const testState = vi.hoisted(() => ({
  rpc: vi.fn(),
  listFactors: vi.fn(),
  listPasskeys: vi.fn(),
  registerPasskey: vi.fn(),
  from: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: testState.rpc,
    auth: {
      registerPasskey: testState.registerPasskey,
      mfa: { listFactors: testState.listFactors },
      passkey: { list: testState.listPasskeys },
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
      throw new Error(`Unexpected RPC: ${name}`);
    });
    testState.listFactors.mockResolvedValue({ data: { totp: [factor], phone: [] }, error: null });
    testState.listPasskeys.mockResolvedValue({
      data: null,
      error: { message: 'Passkeys are disabled', code: 'passkey_disabled' },
    });
    testState.from.mockImplementation((table: string) =>
      queryResult(table === 'admin_security_sessions' ? [session] : [])
    );

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
});
