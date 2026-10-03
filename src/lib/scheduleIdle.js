/** Schedule deferred work without the recursive idle API in Google's iOS webview. */
export function scheduleIdle(callback, { timeout = 3000, fallbackDelay = 2000 } = {}) {
  const userAgent = window.navigator.userAgent;
  const isGoogleIos = /GSA\//i.test(userAgent) && /iPhone|iPad|iPod/i.test(userAgent);

  if (!isGoogleIos && typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(callback, { timeout });
    return () => window.cancelIdleCallback?.(id);
  }

  const id = window.setTimeout(callback, Math.min(timeout, fallbackDelay));
  return () => window.clearTimeout(id);
}
