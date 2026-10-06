/**
 * Returns true only for stale dynamic-import failures after a deployment.
 *
 * Do not treat a generic runtime TypeError as a chunk failure. Reloading on
 * every application error hides the actual problem and can create a reload
 * loop while a route is trying to render.
 */
export function isChunkLoadError(error) {
  const errorString = String(error?.message || error?.reason?.message || error || '');

  return (
    errorString.includes('Failed to fetch dynamically imported module') ||
    errorString.includes('Importing a module script failed') ||
    errorString.includes('error loading dynamically imported module') ||
    errorString.includes('Unable to preload CSS for')
  );
}

export const FORCE_REFRESH_KEY = 'page-has-been-force-refreshed';

/**
 * A reload that has not yet produced a working page within this window is
 * treated as having failed, so the next chunk error shows the error page
 * instead of reloading forever.
 */
export const RELOAD_LOOP_WINDOW_MS = 30 * 1000;

let reloadPending = false;

const readLastReload = (storage) => {
  try {
    const value = Number(storage?.getItem(FORCE_REFRESH_KEY));
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
};

/**
 * Recover from a tab that is still running the previous deployment.
 *
 * A route needs several code chunks at once, and after a deploy every one of
 * them fails. The first failure schedules a single reload; every failure after
 * it, in the same page load, reports that the reload is already on its way, so
 * nothing renders the error page in the meantime. A reload that happened in the
 * last 30 seconds is not repeated: if the fresh page still cannot load a chunk,
 * the deployment itself is broken and the error page is the honest answer.
 *
 * Returns true when the caller should render nothing (or a loading state)
 * because a reload is pending, false when the error is real.
 */
export function recoverFromChunkLoadError(
  error,
  {
    storage = typeof window !== 'undefined' ? window.sessionStorage : null,
    reload = () => window.location.reload(),
    now = Date.now(),
  } = {}
) {
  if (!isChunkLoadError(error)) return false;
  if (reloadPending) return true;

  if (now - readLastReload(storage) < RELOAD_LOOP_WINDOW_MS) return false;

  reloadPending = true;
  try {
    storage?.setItem(FORCE_REFRESH_KEY, String(now));
  } catch {
    // Without storage the loop guard is gone, but one reload is still right.
  }
  console.warn('[ChunkRecovery] This tab is running an older deployment. Reloading…', error);
  reload();
  return true;
}

/**
 * True once a reload has been scheduled in this page load. The page is about to
 * be replaced, so any error rendered from here on (including the knock-on
 * errors of chunks that never arrived) is noise, not something to show.
 */
export function isChunkReloadPending() {
  return reloadPending;
}

/** Test seam: forget a reload scheduled earlier in this module instance. */
export function resetChunkRecoveryForTests() {
  reloadPending = false;
}
