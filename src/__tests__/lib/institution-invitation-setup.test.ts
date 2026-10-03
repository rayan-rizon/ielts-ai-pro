import { describe, it, expect, vi } from 'vitest';
import {
  invitationSetup,
  validateSetupInvitation,
} from '../../../supabase/functions/_shared/institutionInvitationSetup';
const invite = {
  id: 'invite',
  institution_id: 'school',
  email: 'owner@example.test',
  kind: 'owner',
  expires_at: '2099-01-01T00:00:00Z',
  accepted_at: null,
  cancelled_at: null,
};
const institution = { name: 'Approved Centre', status: 'active', owner_email: invite.email };
function client(overrides = {}, error = null) {
  const createUser = vi.fn().mockResolvedValue({ error });
  const db = {
    from: vi.fn((table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data:
              table === 'institution_invitations'
                ? { ...invite, ...overrides }
                : table === 'institutions'
                  ? institution
                  : { value: true },
            error: null,
          }),
        }),
      }),
    })),
    auth: { admin: { createUser } },
  };
  return { db, createUser };
}
const token = '11111111-1111-4111-8111-11111111111122222222-2222-4222-8222-222222222222';
describe('invitation-only account setup', () => {
  it.each([
    null,
    { ...invite, cancelled_at: '2026-01-01' },
    { ...invite, accepted_at: '2026-01-01' },
    { ...invite, expires_at: '2020-01-01' },
    { ...invite, expires_at: 'invalid' },
  ])('rejects unavailable invitation %j', (value) => {
    expect(() => validateSetupInvitation(value, institution)).toThrow(/unavailable/);
  });
  it.each(['suspended', 'archived'])('rejects %s institutions', (status) => {
    expect(() => validateSetupInvitation(invite, { ...institution, status })).toThrow();
  });
  it('rejects superseded owner emails', () => {
    expect(() =>
      validateSetupInvitation(invite, { ...institution, owner_email: 'new@example.test' })
    ).toThrow();
  });
  it('checks invitation without creating accounts', async () => {
    const { db, createUser } = client();
    expect(await invitationSetup(db as never, 'invitation_info', { token })).toEqual({
      email: invite.email,
      kind: 'owner',
      institution_name: institution.name,
    });
    expect(createUser).not.toHaveBeenCalled();
  });
  it('creates only the invited email, ignores client-supplied identity and role, and leaves ownership to acceptance', async () => {
    const { db, createUser } = client();
    await invitationSetup(db as never, 'invitation_setup', {
      token,
      password: 'StrongPassword123!',
      email: 'attacker@example.test',
      role: 'admin',
    });
    expect(createUser).toHaveBeenCalledWith({
      email: invite.email,
      password: 'StrongPassword123!',
      email_confirm: true,
    });
    expect(db.from.mock.calls.map((call) => call[0])).toEqual([
      'institution_invitations',
      'institutions',
      'system_settings',
    ]);
  });
  it('never updates existing accounts and returns the sign-in requirement', async () => {
    const { db, createUser } = client({}, { code: 'email_exists' });
    expect(
      await invitationSetup(db as never, 'invitation_setup', {
        token,
        password: 'StrongPassword123!',
      })
    ).toMatchObject({ existing_account: true });
    expect(createUser).toHaveBeenCalledOnce();
  });
  it('does not call auth for invalid tokens', async () => {
    const { db, createUser } = client();
    await expect(
      invitationSetup(db as never, 'invitation_setup', {
        token: 'guess',
        password: 'StrongPassword123!',
      })
    ).rejects.toThrow();
    expect(createUser).not.toHaveBeenCalled();
    expect(db.from).not.toHaveBeenCalled();
  });
  it('does not create an account after cancellation', async () => {
    const { db, createUser } = client({ cancelled_at: '2026-10-03' });
    await expect(
      invitationSetup(db as never, 'invitation_setup', { token, password: 'StrongPassword123!' })
    ).rejects.toThrow();
    expect(createUser).not.toHaveBeenCalled();
  });
  it.each([
    'short',
    'alllowercase123',
    'NOLOWERCASE123',
    'NoNumbersHere',
    'LongPassword1'.repeat(20),
  ])('rejects weak or overlong passwords', async (password) => {
    const { db, createUser } = client();
    await expect(
      invitationSetup(db as never, 'invitation_setup', { token, password })
    ).rejects.toThrow();
    expect(createUser).not.toHaveBeenCalled();
  });
});
