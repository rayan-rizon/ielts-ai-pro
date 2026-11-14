export const SUBSCRIPTION_STATUS = {
  active: ['Active', 'ok'],
  manual_active: ['Prepaid access', 'accent'],
  past_due: ['Past due', 'fault'],
  unpaid: ['Unpaid', 'fault'],
  incomplete: ['Incomplete', 'warn'],
  paused: ['Paused', 'warn'],
  trialing: ['Trial', 'accent'],
  canceled: ['Canceled', 'neutral'],
  incomplete_expired: ['Expired checkout', 'neutral'],
  unavailable: ['Not verified', 'warn'],
};
export const needsAttention = (row) =>
  ['past_due', 'unpaid', 'incomplete', 'paused'].includes(row.status);
export function matchesSubscription(row, filter, search = '') {
  const matches = {
    current: !['canceled', 'incomplete_expired'].includes(row.status),
    active: ['active', 'manual_active'].includes(row.status),
    attention: needsAttention(row),
    ending: row.status === 'active' && row.cancelAtPeriodEnd,
    all: true,
  };
  return (
    matches[filter] &&
    [row.name, row.email, row.id, row.tier]
      .join(' ')
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );
}
export const periodLabel = (row) => {
  if (row.cancelAtPeriodEnd) return 'Access ends';
  if (row.status === 'manual_active') return 'Prepaid until';
  if (row.status === 'active') return 'Renews';
  return 'Billing period ends';
};
