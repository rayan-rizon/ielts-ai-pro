import { describe, expect, it } from 'vitest';
import {
  hasRecentAuthenticatorVerification,
  mfaEnforcementLabel,
  PASSKEY_STEP_UP_MAX_AGE_MS,
} from '@/features/admin/utils/adminSecurityState';

const now = Date.UTC(2026, 7, 12, 13, 45, 0);

describe('admin security state', () => {
  it('reuses a recent AAL2 authenticator verification in the same session', () => {
    expect(
      hasRecentAuthenticatorVerification(
        {
          aal: 'aal2',
          mfa_required: false,
          recovery_session_expires_at: null,
          session_id: 'session-1',
          authentication_methods: [
            { method: 'password', timestamp: now / 1000 - 600 },
            { method: 'totp', timestamp: now / 1000 - 300 },
          ],
        },
        now
      )
    ).toBe(true);
  });

  it('requires a new step-up when the authenticator proof is old or absent', () => {
    const base = {
      aal: 'aal2' as const,
      mfa_required: false,
      recovery_session_expires_at: null,
      session_id: 'session-1',
    };
    expect(
      hasRecentAuthenticatorVerification(
        {
          ...base,
          authentication_methods: [
            { method: 'totp', timestamp: (now - PASSKEY_STEP_UP_MAX_AGE_MS - 1) / 1000 },
          ],
        },
        now
      )
    ).toBe(false);
    expect(
      hasRecentAuthenticatorVerification(
        { ...base, authentication_methods: [{ method: 'password', timestamp: now / 1000 }] },
        now
      )
    ).toBe(false);
  });

  it('describes completed setup separately from enforcement', () => {
    expect(mfaEnforcementLabel(false, 1)).toBe('Ready, not enforced');
    expect(mfaEnforcementLabel(false, 0)).toBe('Setup required');
    expect(mfaEnforcementLabel(true, 1)).toBe('Required for admin work');
  });
});
