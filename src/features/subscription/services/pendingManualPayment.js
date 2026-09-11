/**
 * Durable queue for manual (bKash/Nagad) payment submissions.
 *
 * In the manual flow the learner has ALREADY sent the money before they submit
 * the transaction ID. If the insert fails because our backend is unreachable,
 * dropping that submission means real money with no record of it. So the
 * payload is written to localStorage and replayed on the next successful
 * session, and the UI tells the learner their reference is held safely.
 *
 * Deliberately kept to localStorage: it survives a reload and a browser
 * restart, which is the window an outage actually spans.
 */

const STORAGE_KEY = 'pending_manual_payment_requests';
const MAX_QUEUED = 5;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const readQueue = () => {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    const cutoff = Date.now() - MAX_AGE_MS;
    return parsed.filter((entry) => entry?.payload && (entry.queuedAt ?? 0) > cutoff);
  } catch {
    return [];
  }
};

const writeQueue = (entries) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_QUEUED)));
  } catch {
    // A blocked or full localStorage must not break the payment UI.
  }
};

/** Identity of a submission, so a replay can never double-insert. */
const signatureOf = (payload) =>
  `${payload?.auth_id || ''}:${payload?.transaction_id || ''}:${payload?.payment_method || ''}`;

export const getPendingManualPaymentCount = () => readQueue().length;

/**
 * Hold a submission that could not reach the backend.
 * @returns {boolean} true when it was stored and can be replayed later.
 */
export const savePendingManualPayment = (payload) => {
  if (!payload?.transaction_id) return false;
  const queue = readQueue();
  const signature = signatureOf(payload);
  if (queue.some((entry) => signatureOf(entry.payload) === signature)) return true;
  writeQueue([...queue, { payload, queuedAt: Date.now() }]);
  return readQueue().some((entry) => signatureOf(entry.payload) === signature);
};

/**
 * Replay every held submission. Safe to call on every app load: the database's
 * own uniqueness on transaction_id is the final guard against duplicates, and a
 * conflict is treated as "already recorded" rather than an error.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns {Promise<{ flushed: number, remaining: number }>}
 */
export const flushPendingManualPayments = async (supabase) => {
  const queue = readQueue();
  if (queue.length === 0) return { flushed: 0, remaining: 0 };

  const remaining = [];
  let flushed = 0;

  for (const entry of queue) {
    try {
      const { error } = await supabase.from('payment_requests').insert(entry.payload);
      if (!error) {
        flushed += 1;
        continue;
      }
      // 23505 = unique violation: the row already landed on an earlier attempt.
      if (error.code === '23505') {
        flushed += 1;
        continue;
      }
      remaining.push(entry);
    } catch {
      remaining.push(entry);
    }
  }

  writeQueue(remaining);
  return { flushed, remaining: remaining.length };
};
