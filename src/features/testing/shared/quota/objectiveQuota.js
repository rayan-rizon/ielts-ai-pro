/**
 * Pure helpers for the free Reading / Listening test allowance.
 *
 * The server owns the rules (`start_objective_test`, `get_objective_test_quotas`):
 * a status row is `{ limit, used }` for one skill, counted over the life of the
 * account, where a limit of -1 means unlimited and 0 means no free tests.
 * Everything here only reads that row so the library, the start screen and the
 * paywall all describe the same state.
 */

/**
 * @param {{ limit?: number, used?: number } | null | undefined} raw one skill's status
 */
export function summariseObjectiveQuota(raw) {
  const limit = Number(raw?.limit);
  if (!Number.isFinite(limit) || limit < 0) {
    return { limited: false, exhausted: false, limit: -1, used: 0, remaining: Infinity };
  }
  const used = Math.max(0, Number(raw?.used) || 0);
  return {
    limited: true,
    exhausted: used >= limit,
    limit,
    used,
    remaining: Math.max(0, limit - used),
  };
}

export const TEST_TYPE_LABEL = { reading: 'Reading', listening: 'Listening' };

/** "2 of 5", never overshooting the limit. */
export function describeUsage(quota) {
  return quota?.limited ? `${Math.min(quota.used, quota.limit)} of ${quota.limit}` : '';
}

/** "1 free Reading test" / "5 free Reading tests". */
export function freeTestsPhrase(count, label) {
  return `${count} free ${label} ${count === 1 ? 'test' : 'tests'}`;
}

/**
 * What the library strip says for each state: nothing left to start, the last
 * one, plenty, or a plan with no free tests at all.
 */
export function describeAllowance(quota, label) {
  const { exhausted, remaining, limit } = quota;
  const lastOne = !exhausted && remaining === 1;
  let title = `${freeTestsPhrase(remaining, label)} left`;
  if (limit === 0) title = `${label} tests need Pro`;
  else if (exhausted) title = `Free ${label} tests used`;
  else if (lastOne) title = `Last free ${label} test`;
  return {
    title,
    detail: limit === 0 ? 'Included with Pro' : 'Resuming a test never uses one',
    tone: exhausted || lastOne ? 'warn' : 'accent',
  };
}

/** The paywall dialog opens for one skill, and only while its tests are used up. */
export function isPaywallRequested(request, testType, quota) {
  if (!request || !quota.exhausted) return false;
  return request.testType === testType;
}
