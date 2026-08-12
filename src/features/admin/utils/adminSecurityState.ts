import type { AdminSecurityStatus } from '@/features/admin/services/AdminSecurityService';

export const PASSKEY_STEP_UP_MAX_AGE_MS = 15 * 60 * 1000;

const methodName = (entry: AdminSecurityStatus['authentication_methods'][number]) =>
  typeof entry === 'string' ? entry : entry?.method;

const methodTimestamp = (entry: AdminSecurityStatus['authentication_methods'][number]) =>
  typeof entry === 'string' ? undefined : entry?.timestamp;

export const hasRecentAuthenticatorVerification = (
  status: AdminSecurityStatus | null | undefined,
  now = Date.now()
) => {
  if (status?.aal !== 'aal2') return false;

  const authenticator = (status.authentication_methods || []).find((entry) => {
    const method = methodName(entry)?.trim().toLowerCase();
    return method === 'totp' || method === 'phone';
  });
  if (!authenticator) return false;

  const timestamp = methodTimestamp(authenticator);
  // Older Auth tokens can omit AMR timestamps. AAL2 plus an authenticator AMR
  // still proves this exact session completed the second factor.
  if (!timestamp) return true;

  const verifiedAt = timestamp > 1e12 ? timestamp : timestamp * 1000;
  return now - verifiedAt <= PASSKEY_STEP_UP_MAX_AGE_MS;
};

export const mfaEnforcementLabel = (required: boolean, verifiedFactorCount: number) => {
  if (required) return 'Required for admin work';
  if (verifiedFactorCount > 0) return 'Ready, not enforced';
  return 'Setup required';
};
