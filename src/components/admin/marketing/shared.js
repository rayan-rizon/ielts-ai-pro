/**
 * Vocabulary shared across the Marketing hub panels and dialogs.
 *
 * Everything here is presentation-only: the labels an operator reads, the tone
 * a status maps to, and the translation from stored segment rules back into a
 * sentence. Keeping it in one place is what stops "paid_conversion" appearing
 * as three different strings across five panels.
 */

export const OBJECTIVES = [
  ['paid_conversion', 'Paid conversion'],
  ['activation', 'Activation'],
  ['retention', 'Retention'],
  ['referral', 'Referral'],
  ['announcement', 'Announcement'],
];

export const CHANNELS = [
  ['in_app', 'In-app notification'],
  ['banner', 'Dashboard banner'],
  ['email', 'Marketing email'],
];

export const CHANNEL_SHORT = {
  in_app: 'in-app',
  banner: 'banner',
  email: 'email',
};

export const STATUS_TONE = {
  active: 'ok',
  scheduled: 'accent',
  paused: 'warn',
  completed: 'neutral',
  cancelled: 'fault',
  draft: 'neutral',
};

/**
 * The filter rail above the campaign grid. `draft` deliberately groups drafts
 * and schedules together — from the operator's side both mean "written, not
 * sending yet", and splitting them produced two near-empty buckets.
 */
export const CAMPAIGN_FILTERS = [
  ['all', 'All', () => true],
  ['live', 'Live', (c) => c.status === 'active'],
  ['staged', 'Staged', (c) => c.status === 'draft' || c.status === 'scheduled'],
  ['paused', 'Paused', (c) => c.status === 'paused'],
  ['ended', 'Ended', (c) => c.status === 'completed' || c.status === 'cancelled'],
];

export const titleCase = (value) =>
  String(value || '')
    .replaceAll('_', ' ')
    .replace(/^./, (character) => character.toUpperCase());

export const toLocalDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export const toIso = (value) => (value ? new Date(value).toISOString() : null);

export const arrayToggle = (items, value) =>
  items.includes(value) ? items.filter((item) => item !== value) : [...items, value];

/**
 * Turn a stored segment rule object into short readable chips.
 *
 * Segments used to render as a raw `key: value · key: value` mono dump, which
 * meant the one thing an operator actually needs from a segment card — who is
 * in it — was the least legible part of the card. Each rule becomes a phrase
 * an operator can check at a glance, and an empty rule set is stated plainly
 * rather than silently reading as "no audience".
 */
export const describeRules = (rules) => {
  const source = rules || {};
  const chips = [];

  if (source.subscription_tiers?.length)
    chips.push(`Tier: ${source.subscription_tiers.join(', ')}`);
  if (source.signup_channels?.length)
    chips.push(
      `From: ${source.signup_channels.map((value) => value.replaceAll('_', ' ')).join(', ')}`
    );
  if (source.quota_states?.length) chips.push(`Quota: ${source.quota_states.join(', ')}`);
  if (source.onboarding_completed !== undefined)
    chips.push(source.onboarding_completed ? 'Onboarded' : 'Not onboarded');
  if (source.has_completed_test !== undefined)
    chips.push(source.has_completed_test ? 'Has practised' : 'Never practised');
  if (source.inactive_days_min !== undefined)
    chips.push(`Inactive ${source.inactive_days_min}+ days`);
  if (source.referral_expiry_days_max !== undefined)
    chips.push(`Referral expires in ≤${source.referral_expiry_days_max}d`);
  if (source.test_date_days_max !== undefined)
    chips.push(`Exam within ${source.test_date_days_max}d`);
  if (source.payment_failed) chips.push('Payment failed');
  if (source.cancel_at_period_end) chips.push('Cancellation scheduled');

  return chips;
};

/**
 * What an operator should do with this campaign next. Every campaign card
 * shows exactly one primary button, and it comes from here — the old card
 * offered six equally-weighted buttons, so the actual next step was never
 * obvious.
 */
export const primaryAction = (campaign) => {
  if (campaign.status === 'active') return 'dispatch';
  if (['draft', 'paused', 'scheduled'].includes(campaign.status)) return 'activate';
  return null;
};

/** Campaigns that are written but cannot send — the hub surfaces these first. */
export const blockingIssue = (campaign) => {
  if (!campaign.segment_id) return 'No audience selected';
  if (!campaign.channels?.length) return 'No delivery channel';
  if (campaign.channels.includes('email') && !campaign.subject && !campaign.title)
    return 'Email has no subject';
  return null;
};
