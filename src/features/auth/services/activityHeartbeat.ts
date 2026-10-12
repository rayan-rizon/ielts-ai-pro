const GAP_MS = 5 * 60 * 1000;
const inFlight = new Map<string, Promise<boolean>>();
const lastRecorded = new Map<string, number>();
const day = (timestamp: number) => Math.floor((timestamp + 6 * 60 * 60 * 1000) / 86400000);
const key = (authId: string) => `activity_heartbeat:${authId}`;

/** Browser coordination is advisory; the ownership-checked RPC also throttles. */
export function recordActivityHeartbeat(
  authId: string,
  send: () => Promise<boolean>,
  { force = false } = {}
): Promise<boolean> {
  const pending = inFlight.get(authId);
  if (pending) {
    return force
      ? pending.then(() => recordActivityHeartbeat(authId, send, { force: true }))
      : pending;
  }
  const now = Date.now();
  let previous = lastRecorded.get(authId) || 0;
  try {
    previous = Math.max(previous, Number(localStorage.getItem(key(authId))) || 0);
  } catch {
    // Storage denial does not disable activity recording.
  }
  if (!force && previous <= now && now - previous < GAP_MS && day(previous) === day(now)) {
    return Promise.resolve(true);
  }
  const request = send()
    .then((success) => {
      if (success) {
        // Use request start so slow requests never suppress a new calendar day.
        lastRecorded.set(authId, now);
        try {
          localStorage.setItem(key(authId), String(now));
        } catch {
          // Same-tab throttling remains available.
        }
      }
      return success;
    })
    .finally(() => inFlight.delete(authId));
  inFlight.set(authId, request);
  return request;
}
