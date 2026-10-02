import { fromStripeAmount } from '../../../../supabase/functions/_shared/planPricing.ts';
export const ACTION_LABELS = {
  create: 'Institution created',
  update: 'Institution details updated',
  invite_owner: 'Owner invited',
  pricing: 'Pricing updated',
  grant: 'Free seats granted',
  invite: 'Student invited',
  accept: 'Invitation accepted',
  cancel: 'Invitation cancelled',
  revoke: 'Seat revoked',
  extend: 'Access extended',
  release: 'Waiting seat released',
  correct: 'Student assignment corrected',
  quote: 'Purchase quoted',
  payment: 'Payment received',
  refund: 'Payment refunded',
  reconcile_refund: 'Refund reconciled',
};
export const PRICING_LABELS = {
  default: 'Standard price',
  bulk: 'Bulk price',
  override: 'Institution price',
  package: 'Custom package',
};
export const STATUS_LABELS = {
  available: 'Available',
  invited: 'Invitation sent',
  waiting: 'Waiting',
  active: 'Active',
  expired: 'Expired',
  revoked: 'Revoked',
  paid: 'Paid',
  complimentary: 'Free grant',
  pending: 'Awaiting payment',
  failed: 'Not completed',
  refunded: 'Refunded',
  reconciliation: 'Refund needs review',
  suspended: 'Suspended',
  archived: 'Archived',
};
const FIELDS = {
  name: 'Institution name',
  owner_email: 'Owner email',
  contact_email: 'Contact email',
  contact_phone: 'Contact phone',
  logo_url: 'Logo',
  status: 'Status',
  currency: 'Currency',
  tier: 'Plan',
  kind: 'Pricing type',
  months: 'Access duration',
  access_days: 'Access duration',
  quantity: 'Seats',
  amount: 'Price',
  amount_minor: 'Purchase total',
  refunded_minor: 'Refunded amount',
  enabled: 'Pricing enabled',
  recipient_email: 'Student email',
  recipient_name: 'Student name',
  email: 'Recipient email',
  activation_deadline: 'Accept invitation by',
  access_until: 'Access ends',
  activated_at: 'Access started',
  accepted_at: 'Invitation accepted',
  source: 'Seat source',
};
export const historyDate = (value) => {
  const d = new Date(value);
  return value && !Number.isNaN(d.getTime())
    ? d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : 'Not set';
};
function valueLabel(key, value, record) {
  if (value === undefined || value === null || value === '') return 'Not set';
  if (['amount', 'amount_minor', 'refunded_minor'].includes(key)) {
    const currency = record.currency || 'USD';
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(
      key === 'amount' ? Number(value) : fromStripeAmount(Number(value), currency)
    );
  }
  if (['activation_deadline', 'access_until', 'activated_at', 'accepted_at'].includes(key))
    return historyDate(value);
  if (key === 'months') return `${value} ${Number(value) === 1 ? 'month' : 'months'}`;
  if (key === 'access_days') return `${value} days`;
  if (key === 'enabled') return value ? 'Yes' : 'No';
  if (key === 'tier')
    return value === 'premium' ? 'Premium' : value === 'pro' ? 'Pro' : String(value);
  if (key === 'kind') return PRICING_LABELS[value] || String(value);
  if (key === 'source') return value === 'complimentary' ? 'Free seats' : 'Purchased seats';
  if (key === 'status') return STATUS_LABELS[value] || String(value);
  return typeof value === 'object' ? 'Updated' : String(value);
}
export function historyChanges(entry) {
  const before = entry.before_value || {},
    after = entry.after_value || {};
  return Object.entries(FIELDS)
    .filter(
      ([key]) =>
        Object.hasOwn(after, key) && JSON.stringify(before[key]) !== JSON.stringify(after[key])
    )
    .map(([key, label]) => ({
      key,
      label,
      before: valueLabel(key, before[key], before),
      after: valueLabel(key, after[key], { ...before, ...after }),
      created: !entry.before_value,
    }));
}
export function historySubject(entry, seats = []) {
  const after = entry.after_value || {},
    before = entry.before_value || {};
  const seat = seats.find((s) => s.id === (after.seat_id || after.id));
  return (
    after.recipient_email ||
    after.email ||
    before.recipient_email ||
    seat?.recipient_email ||
    (after.kind === 'owner'
      ? 'Institution owner'
      : after.kind === 'student'
        ? 'Student access'
        : after.tier
          ? `${after.tier === 'premium' ? 'Premium' : 'Pro'}${after.quantity ? ` · ${after.quantity} ${Number(after.quantity) === 1 ? 'seat' : 'seats'}` : ''}`
          : 'Institution')
  );
}
