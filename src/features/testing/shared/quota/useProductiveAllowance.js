import { hasPaidAccess } from '@/features/subscription/config/contentAccess';
import {
  describeProductiveQuota,
  useProductiveAllowanceQueries,
} from './productiveAllowanceQueries';

export { describeProductiveQuota };

export function useProductiveAllowance(skill, user, isAdmin) {
  const { data } = useProductiveAllowanceQueries(skill, user);
  return {
    usage: data?.usage,
    libraryLimit: data?.libraryLimit,
    canUpgrade: !isAdmin && !hasPaidAccess(user),
  };
}

export function markAllowanceUpgrade(tests, allowance) {
  if (!allowance?.canUpgrade) return tests;
  const limit = allowance.libraryLimit;
  const exhausted = allowance.usage?.blocked;
  if (limit == null && !exhausted) return tests;
  return tests.map((test, index) => ({
    ...test,
    upgradeForAllowance: isUpgradeRequired(test, index, limit, exhausted),
  }));
}

function isUpgradeRequired(test, index, limit, exhausted) {
  return (
    exhausted || (Number.isFinite(limit) && index >= limit) || Boolean(test.upgradeForAllowance)
  );
}
