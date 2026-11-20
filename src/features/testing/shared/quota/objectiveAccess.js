import { hasContentAccess } from '@/features/subscription/config/contentAccess';

export function isObjectiveTestLocked(test, user, isAdmin) {
  if (isAdmin) return false;
  const requiredTier =
    test.free_starter === false && test.access_tier === 'free' ? 'pro' : test.access_tier;
  return !hasContentAccess(user, requiredTier);
}
