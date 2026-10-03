import type { SupabaseClient } from '@supabase/supabase-js';

type Invitation = {
  id: string;
  institution_id: string;
  kind: string;
  email: string;
  expires_at: string;
  accepted_at: string | null;
  cancelled_at: string | null;
};

type Institution = { name: string; status: string; owner_email: string };

function isInviteExpired(expiresAt: string, now: number): boolean {
  const expiresMs = Date.parse(expiresAt);
  return !Number.isFinite(expiresMs) || expiresMs <= now;
}

function isOwnerEmailMismatch(invite: Invitation, institution: Institution): boolean {
  if (invite.kind !== 'owner') return false;
  return invite.email.toLowerCase() !== institution.owner_email.toLowerCase();
}

function isInvitationAvailable(
  invite: Invitation | null,
  institution: Institution | null,
  now: number
): boolean {
  if (!invite || !institution) return false;
  if (invite.accepted_at || invite.cancelled_at) return false;
  if (institution.status !== 'active') return false;
  if (isInviteExpired(invite.expires_at, now)) return false;
  if (isOwnerEmailMismatch(invite, institution)) return false;
  return true;
}

export function validateSetupInvitation(
  invite: Invitation | null,
  institution: Institution | null,
  now = Date.now()
) {
  if (!isInvitationAvailable(invite, institution, now)) {
    throw new Error(
      'This invitation is unavailable. Ask your institution contact for a new invitation.'
    );
  }
  return { email: invite!.email, kind: invite!.kind, institution_name: institution!.name };
}

function assertValidToken(token: unknown): asserts token is string {
  if (typeof token !== 'string' || !/^[a-f0-9-]{72}$/i.test(token)) {
    throw new Error('A valid institution invitation is required.');
  }
}

async function hashToken(token: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
}

function isValidPassword(password: unknown): password is string {
  if (typeof password !== 'string') return false;
  if (password.length < 8 || password.length > 128) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  return hasUpper && hasLower && hasDigit;
}

function assertValidPassword(password: unknown): asserts password is string {
  if (!isValidPassword(password)) {
    throw new Error('Use 8–128 characters with an uppercase letter, lowercase letter, and number.');
  }
}

async function fetchInvitationData(db: SupabaseClient, tokenHash: string) {
  const { data: invite, error } = await db
    .from('institution_invitations')
    .select('id,institution_id,kind,email,expires_at,accepted_at,cancelled_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();
  if (error) throw new Error('Unable to check your invitation. Please try again.');
  if (!invite) return { invite: null, institution: null };

  const { data: institution, error: institutionError } = await db
    .from('institutions')
    .select('name,status,owner_email')
    .eq('id', invite.institution_id)
    .maybeSingle();
  if (institutionError) throw new Error('Unable to check your invitation. Please try again.');

  return { invite, institution };
}

async function assertInstitutionEnabled(db: SupabaseClient): Promise<void> {
  const { data: flag, error } = await db
    .from('system_settings')
    .select('value')
    .eq('key', 'institution_enabled')
    .maybeSingle();
  if (error || flag?.value !== true) {
    throw new Error('Institution access is not enabled.');
  }
}

async function createInvitedUser(
  db: SupabaseClient,
  email: string,
  password: string
): Promise<{ existing_account: boolean }> {
  // Create only; an invitation must never replace an existing account's password or verification state.
  const { error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (!error) return { existing_account: false };
  if (['email_exists', 'user_already_exists'].includes(error.code || '')) {
    return { existing_account: true };
  }
  throw new Error(
    'We could not finish account setup. Try again, or sign in if you already have an account.'
  );
}

export async function invitationSetup(
  db: SupabaseClient,
  action: string,
  input: Record<string, unknown>
) {
  // The invitation is the email-possession proof. Never accept a recipient or role from the client.
  assertValidToken(input.token);
  const tokenHash = await hashToken(input.token);
  const { invite, institution } = await fetchInvitationData(db, tokenHash);
  const details = validateSetupInvitation(invite, institution);
  if (action === 'invitation_info') return details;

  await assertInstitutionEnabled(db);
  assertValidPassword(input.password);

  const accountStatus = await createInvitedUser(db, details.email, input.password);
  // Ownership/seat assignment still requires the verified acceptance transaction in `institutions`.
  return { ...details, ...accountStatus };
}
