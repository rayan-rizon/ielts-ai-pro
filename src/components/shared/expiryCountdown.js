const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatExpiryCountdown(expiresAt, now = Date.now()) {
  const expires = new Date(expiresAt).getTime();
  if (!Number.isFinite(expires)) return null;
  const remaining = Math.max(0, expires - now);
  if (remaining <= 0) return { label: 'Ended', expired: true };

  if (remaining >= DAY) {
    const days = Math.floor(remaining / DAY);
    const hours = Math.floor((remaining % DAY) / HOUR);
    const minutes = Math.floor((remaining % HOUR) / MINUTE);
    return {
      label: `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m left`,
      expired: false,
    };
  }

  const hours = Math.floor(remaining / HOUR);
  const minutes = Math.floor((remaining % HOUR) / MINUTE);
  const seconds = Math.floor((remaining % MINUTE) / SECOND);
  return {
    label: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} left`,
    expired: false,
  };
}
