export const AUTH_DESTINATION_KEY = 'auth_destination';
const AUTH_DESTINATION_SAVED_AT_KEY = `${AUTH_DESTINATION_KEY}:saved-at`;
const CROSS_TAB_DESTINATION_TTL_MS = 2 * 60 * 60 * 1000;

export function isSafeInternalDestination(destination) {
  return (
    typeof destination === 'string' &&
    destination.startsWith('/') &&
    !destination.startsWith('//') &&
    destination !== '/admin' &&
    !destination.startsWith('/admin/')
  );
}

export function saveRequestedDestination(destination, { crossTab = false } = {}) {
  if (!isSafeInternalDestination(destination)) return false;
  window.sessionStorage.setItem(AUTH_DESTINATION_KEY, destination);
  if (crossTab) {
    window.localStorage.setItem(AUTH_DESTINATION_KEY, destination);
    window.localStorage.setItem(AUTH_DESTINATION_SAVED_AT_KEY, String(Date.now()));
  }
  return true;
}

function readCrossTabDestination(now = Date.now()) {
  const destination = window.localStorage.getItem(AUTH_DESTINATION_KEY);
  const savedAt = Number(window.localStorage.getItem(AUTH_DESTINATION_SAVED_AT_KEY));
  if (
    !isSafeInternalDestination(destination) ||
    !Number.isFinite(savedAt) ||
    now - savedAt > CROSS_TAB_DESTINATION_TTL_MS
  ) {
    window.localStorage.removeItem(AUTH_DESTINATION_KEY);
    window.localStorage.removeItem(AUTH_DESTINATION_SAVED_AT_KEY);
    return null;
  }
  return destination;
}

export function getRequestedDestination(location, fallback = '/dashboard', now = Date.now()) {
  const from = location?.state?.from;
  const stateDestination = from?.pathname
    ? `${from.pathname}${from.search || ''}${from.hash || ''}`
    : null;
  const sessionDestination = window.sessionStorage.getItem(AUTH_DESTINATION_KEY);
  const crossTabDestination = readCrossTabDestination(now);

  if (isSafeInternalDestination(stateDestination)) return stateDestination;
  if (isSafeInternalDestination(sessionDestination)) return sessionDestination;
  if (crossTabDestination) return crossTabDestination;
  return fallback;
}

export function clearRequestedDestination() {
  window.sessionStorage.removeItem(AUTH_DESTINATION_KEY);
  window.localStorage.removeItem(AUTH_DESTINATION_KEY);
  window.localStorage.removeItem(AUTH_DESTINATION_SAVED_AT_KEY);
}
