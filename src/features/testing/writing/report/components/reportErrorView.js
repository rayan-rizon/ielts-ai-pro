/** What the error screen says for each way a review can fail to arrive. */
const DUPLICATE = /duplicate_request|already being (generated|processed)/i;
const PENDING = /feedback is still being prepared/i;
const QUOTA = /task review|allowance|Upgrade/;

const DUPLICATE_COPY =
  'A review was already requested for this answer. Check whether the result is ready; if it is still being prepared, come back in a moment.';

function wording({ duplicate, pending, message }) {
  if (duplicate)
    return {
      pill: 'Review already requested',
      title: 'Check your saved review',
      explanation: DUPLICATE_COPY,
    };
  if (pending)
    return {
      pill: 'Review in progress',
      title: 'Your review is being prepared',
      explanation: 'Check again shortly to see your review here.',
    };
  return {
    pill: 'Review interrupted',
    title: 'The review did not finish',
    explanation: message || 'The marking service is temporarily unavailable.',
  };
}

/** The tone and icon: an existing review is not a fault, and a quota is a warning. */
function mood({ existing, quota }) {
  if (existing) return { icon: 'refresh', tone: quota ? 'warn' : 'accent' };
  return quota ? { icon: 'lock', tone: 'warn' } : { icon: 'alert', tone: 'fault' };
}

export function reportErrorView(feedbackError) {
  const message = typeof feedbackError === 'string' ? feedbackError : '';
  const duplicate = DUPLICATE.test(message);
  const pending = PENDING.test(message);
  const existing = duplicate || pending;
  const quota = QUOTA.test(message);
  const copy = wording({ duplicate, pending, message: feedbackError });
  return {
    ...copy,
    ...mood({ existing, quota }),
    pill: quota ? 'Allowance limit' : copy.pill,
    quota,
    action: existing ? 'Check for saved review' : 'Try again',
  };
}
