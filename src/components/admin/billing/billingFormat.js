/**
 * Display rules for refund evidence. The database decides the verdict
 * (get_payment_refund_evidence); this file only says how to show it.
 */

export const VERDICTS = {
  eligible: {
    label: 'Eligible',
    tone: 'ok',
    title: 'Eligible for the 7-day refund',
    detail: 'First purchase, inside the window, and nothing used since payment.',
  },
  review: {
    label: 'Review',
    tone: 'warn',
    title: 'Needs your judgement',
    detail: 'No AI result was delivered, but something else happened after payment.',
  },
  used: {
    label: 'Used',
    tone: 'fault',
    title: 'Used after purchase',
    detail: 'At least one AI result was delivered, so the unused-purchase offer no longer applies.',
  },
  window_expired: {
    label: 'Window closed',
    tone: 'neutral',
    title: 'Seven-day window has closed',
    detail: 'The unused-purchase offer is only open for seven days after activation.',
  },
  not_first_purchase: {
    label: 'Not first',
    tone: 'neutral',
    title: 'Not the first purchase',
    detail: 'The unused-purchase offer only covers an account’s first paid purchase.',
  },
  refunded: {
    label: 'Refunded',
    tone: 'accent',
    title: 'Already refunded',
    detail: 'This payment has been refunded in full.',
  },
  not_paid: {
    label: 'Not paid',
    tone: 'neutral',
    title: 'Not a settled payment',
    detail: 'Only approved payments can be refunded.',
  },
};

export const verdictMeta = (verdict) => VERDICTS[verdict] || VERDICTS.not_paid;

/** Verdicts where "unused purchase" is a truthful refund reason. */
export const UNUSED_PURCHASE_VERDICTS = new Set(['eligible', 'review']);

const PROVIDER_LABELS = { stripe: 'Stripe', bkash: 'bKash', nagad: 'Nagad', rocket: 'Rocket' };
export const providerLabel = (provider) =>
  PROVIDER_LABELS[String(provider || '').toLowerCase()] || String(provider || 'Manual');

const CURRENCY_SYMBOL = { USD: '$', BDT: '৳' };
export const formatMoney = (amount, currency = 'USD') => {
  const code = String(currency || 'USD').toUpperCase();
  const value = Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: code === 'BDT' ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return CURRENCY_SYMBOL[code] ? `${CURRENCY_SYMBOL[code]}${value}` : `${code} ${value}`;
};

export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

export const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

/** "63m", "5h 12m", "2d 4h" — how long after payment something happened. */
export const formatElapsed = (minutes) => {
  if (minutes === null || minutes === undefined) return '—';
  const total = Math.max(0, Math.round(Number(minutes)));
  if (total < 60) return `${total}m`;
  if (total < 1440) return `${Math.floor(total / 60)}h ${total % 60}m`;
  return `${Math.floor(total / 1440)}d ${Math.floor((total % 1440) / 60)}h`;
};

/** Time left in the refund window, or null once it has closed. */
export const windowRemaining = (windowEndsAt, now = Date.now()) => {
  if (!windowEndsAt) return null;
  const minutes = (new Date(windowEndsAt).getTime() - now) / 60000;
  return minutes > 0 ? formatElapsed(minutes) : null;
};

export const REFUND_STATUS_TONE = {
  pending: 'warn',
  succeeded: 'ok',
  failed: 'fault',
  canceled: 'neutral',
};

export const refundStatusLabel = (refund) => {
  if (refund.kind === 'chargeback') {
    return (
      {
        pending: 'Dispute open',
        succeeded: 'Dispute lost',
        canceled: 'Dispute won',
        failed: 'Dispute failed',
      }[refund.status] || refund.status
    );
  }
  return refund.status;
};

const ENDPOINT_LABELS = {
  'reading-assistant': 'Reading assistant',
  'ai-coach': 'AI coach',
  generateDetailedFeedback: 'Writing feedback',
  evaluateSpeakingTest: 'Speaking evaluation',
  generateDetailedSpeakingFeedback: 'Speaking deep-dive',
  processSpeakingSession: 'Speaking turn',
  processSpeakingSession_start: 'Speaking session start',
  synthesizeSpeech: 'Examiner voice',
  transcribeAudio: 'Transcription',
  generateAdaptiveLearningPath: 'Learning path (auto)',
  generateStudyRecommendations: 'Study recommendations (auto)',
};
export const endpointLabel = (endpoint) => ENDPOINT_LABELS[endpoint] || endpoint;
