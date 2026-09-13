// Version 2 invalidates pending markers created by the old eager queue. Existing
// learners therefore do not receive one last stale automatic tour after release.
const TOUR_VERSION = '2';
export const PRODUCT_TOUR_OPEN_EVENT = 'ieltsai:open-product-tour';

const tourKey = (kind, userId) => `dashboardV3:productTour:${TOUR_VERSION}:${kind}:${userId}`;

export function queueProductTour(userId) {
  if (typeof window === 'undefined' || !userId) return false;
  if (window.localStorage.getItem(tourKey('complete', userId)) === '1') return false;
  window.localStorage.setItem(tourKey('pending', userId), '1');
  return true;
}

export function queueFirstRunProductTour(user) {
  if (!user?.id || user.onboarding_completed !== false) return false;
  return queueProductTour(user.id);
}

export function hasQueuedProductTour(userId) {
  if (typeof window === 'undefined' || !userId) return false;
  return (
    window.localStorage.getItem(tourKey('pending', userId)) === '1' &&
    window.localStorage.getItem(tourKey('complete', userId)) !== '1'
  );
}

export function completeProductTour(userId) {
  if (typeof window === 'undefined' || !userId) return;
  window.localStorage.setItem(tourKey('complete', userId), '1');
  window.localStorage.removeItem(tourKey('pending', userId));
}

const sessionKey = (userId) => `dashboardV3:productTour:${TOUR_VERSION}:session:${userId}`;

export function readProductTourSession(userId) {
  if (typeof window === 'undefined' || !userId) return null;
  try {
    return JSON.parse(window.sessionStorage.getItem(sessionKey(userId)) || 'null');
  } catch {
    return null;
  }
}

export function writeProductTourSession(userId, state) {
  if (typeof window === 'undefined' || !userId) return;
  window.sessionStorage.setItem(sessionKey(userId), JSON.stringify(state));
}

export function clearProductTourSession(userId) {
  if (typeof window === 'undefined' || !userId) return;
  window.sessionStorage.removeItem(sessionKey(userId));
}

export function requestProductTour() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PRODUCT_TOUR_OPEN_EVENT));
}
