/**
 * throttledWebStorage
 *
 * A drop-in `StateStorage` for Zustand's `persist` middleware that coalesces
 * bursty writes instead of hitting Web Storage on every `set()`.
 *
 * Why this exists: test stores persist high-frequency fields (a 1Hz countdown,
 * an <audio> `timeupdate` that fires ~4x/sec). Zustand serialises the whole
 * partialized slice and calls `setItem` synchronously on each of those, so a
 * 30-minute listening session produced ~9,000 main-thread JSON.stringify +
 * sessionStorage round-trips. Those fields still need to be persisted — they
 * back resume-where-you-left-off — so we throttle the write rather than drop
 * the data.
 *
 * Guarantees:
 * - Reads are always consistent: `getItem` returns the pending value if a
 *   write has not been flushed yet, so rehydration never sees a stale slice.
 * - The latest value always lands. A trailing flush is scheduled, and we also
 *   flush on `pagehide` / `visibilitychange` (hidden), which are the events
 *   that actually fire on mobile Safari when a tab is discarded. `beforeunload`
 *   is not reliable there, so it is a supplement, not the primary hook.
 * - `removeItem` flushes synchronously and cancels any pending write, so
 *   clearing a session can't be resurrected by an in-flight timer.
 */

const DEFAULT_INTERVAL_MS = 5000;

/**
 * @param {() => Storage} getStorage - lazy accessor, e.g. `() => sessionStorage`
 * @param {{ intervalMs?: number }} [options]
 * @returns {import('zustand/middleware').StateStorage}
 */
export function createThrottledWebStorage(getStorage, options = {}) {
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;

  /** Keys with a write queued but not yet committed. @type {Map<string, string>} */
  const pending = new Map();
  let timer = null;

  const safeStorage = () => {
    try {
      return getStorage();
    } catch {
      // Storage can throw outright in private mode / partitioned contexts.
      return null;
    }
  };

  const commit = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    if (pending.size === 0) return;

    const storage = safeStorage();
    const entries = Array.from(pending.entries());
    pending.clear();

    if (!storage) return;
    for (const [key, value] of entries) {
      try {
        storage.setItem(key, value);
      } catch {
        // Quota or disabled storage: the in-memory store stays authoritative.
      }
    }
  };

  if (typeof window !== 'undefined') {
    const flushIfHidden = () => {
      if (document.visibilityState === 'hidden') commit();
    };
    window.addEventListener('pagehide', commit);
    window.addEventListener('beforeunload', commit);
    document.addEventListener('visibilitychange', flushIfHidden);
  }

  return {
    getItem: (key) => {
      if (pending.has(key)) return pending.get(key);
      const storage = safeStorage();
      if (!storage) return null;
      try {
        return storage.getItem(key);
      } catch {
        return null;
      }
    },

    setItem: (key, value) => {
      pending.set(key, value);
      if (timer === null) {
        timer = setTimeout(commit, intervalMs);
      }
    },

    removeItem: (key) => {
      pending.delete(key);
      if (pending.size === 0 && timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      const storage = safeStorage();
      if (!storage) return;
      try {
        storage.removeItem(key);
      } catch {
        // Nothing actionable — the caller is clearing state that may not exist.
      }
    },

    /** Exposed for tests and for callers that need a synchronous barrier. */
    flush: commit,
  };
}
