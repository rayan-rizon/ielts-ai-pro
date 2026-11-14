export const BADGE_REFRESH_MS = 60_000;
const MAX_RETRY_MS = 300_000;
const REQUEST_TIMEOUT_MS = 15_000;
export const EMPTY_BADGE_COUNTS = Object.freeze({
  pendingCount: 0,
  stripePaymentCount: 0,
  stripeFailureCount: 0,
  featureRequestCount: 0,
  testReportCount: 0,
  institutionRequestCount: 0,
});

function validSnapshot(data) {
  return (
    data &&
    Number.isFinite(Date.parse(data.observedAt)) &&
    Object.keys(EMPTY_BADGE_COUNTS).every(
      (key) => Number.isInteger(data[key]) && data[key] >= 0 && data[key] <= 100
    )
  );
}

/** One serialized request stream, owned by the mounted admin sidebar. */
export function createAdminBadgeController({ client, onChange }) {
  let disposed = false;
  let started = false;
  let inFlight = false;
  let timer;
  let abortController;
  let snapshot = null;
  let failures = 0;
  let lastSuccessAt = 0;
  let paymentsOpen = false;
  let acknowledgment = null;

  const visible = () => document.visibilityState !== 'hidden' && navigator.onLine !== false;
  const cancelTimer = () => window.clearTimeout(timer);
  const schedule = () => {
    cancelTimer();
    if (!disposed && visible()) {
      timer = window.setTimeout(refresh, Math.min(BADGE_REFRESH_MS * 2 ** failures, MAX_RETRY_MS));
    }
  };

  async function refresh() {
    if (disposed || !started || inFlight || !visible()) return;
    cancelTimer();
    inFlight = true;
    const currentAck = acknowledgment;
    const cutoff = currentAck?.cutoff || null;
    abortController = new AbortController();
    const timeout = window.setTimeout(() => abortController?.abort(), REQUEST_TIMEOUT_MS);
    let succeeded = false;
    try {
      const { data, error } = await client
        .rpc('get_admin_sidebar_badges', { p_payment_seen_through: cutoff })
        .abortSignal(abortController.signal);
      if (disposed) return;
      if (error || !validSnapshot(data)) throw error || new Error('Invalid admin badge response');
      snapshot = data;
      failures = 0;
      lastSuccessAt = Date.now();
      succeeded = true;
      onChange({ ...data, stale: false });
      if (acknowledgment === currentAck) acknowledgment = null;
    } catch {
      if (!disposed) {
        failures = Math.min(failures + 1, 3);
        if (snapshot) onChange({ ...snapshot, stale: true });
      }
    } finally {
      window.clearTimeout(timeout);
      abortController = null;
      inFlight = false;
      if (!disposed) {
        if (succeeded && acknowledgment && visible()) void refresh();
        else schedule();
      }
    }
  }

  const onPaymentsLoaded = (event) => {
    if (!paymentsOpen || !Number.isFinite(Date.parse(event.detail?.observedAt))) return;
    acknowledgment = { cutoff: event.detail.observedAt };
    if (started) void refresh();
  };

  const onVisibility = () => {
    cancelTimer();
    if (visible()) void refresh();
  };
  const onFocus = () => {
    if (Date.now() - lastSuccessAt >= 15_000) void refresh();
  };

  return {
    start() {
      if (started || disposed) return;
      started = true;
      document.addEventListener('visibilitychange', onVisibility);
      window.addEventListener('admin-payments-loaded', onPaymentsLoaded);
      window.addEventListener('online', onVisibility);
      window.addEventListener('offline', onVisibility);
      window.addEventListener('focus', onFocus);
      void refresh();
    },
    setPaymentsOpen(open) {
      if (open === paymentsOpen) return;
      paymentsOpen = open;
      if (!open) acknowledgment = null;
      if (started) void refresh();
    },
    refresh,
    stop() {
      disposed = true;
      cancelTimer();
      abortController?.abort();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('admin-payments-loaded', onPaymentsLoaded);
      window.removeEventListener('online', onVisibility);
      window.removeEventListener('offline', onVisibility);
      window.removeEventListener('focus', onFocus);
    },
  };
}
