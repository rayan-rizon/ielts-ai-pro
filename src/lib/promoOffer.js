const STORAGE_KEY = 'pending_promo_code';

/** Same shape `redeem_promo_code` accepts. Must match the check in index.html. */
const PROMO_CODE = /^[A-Z0-9-]{6,64}$/;

const isBrowser = () => typeof window !== 'undefined';

/**
 * Offer code an ad or email link brought the visitor in with.
 *
 * index.html captures `?promo=` on first paint, before the router rewrites the
 * URL, and keeps it here until it is actually redeemed. That persistence is the
 * point: an ad click lands logged out and only reaches pricing after signing
 * up, so the code has to outlive the whole registration flow.
 */
export const getPendingPromoCode = () => {
  if (!isBrowser()) return null;
  try {
    const code = window.localStorage.getItem(STORAGE_KEY);
    return PROMO_CODE.test(code || '') ? code : null;
  } catch {
    return null;
  }
};

/**
 * Drop the stored code.
 *
 * Call this once the offer has been resolved for good — redeemed, or rejected
 * by the server as invalid/expired/already-used. Never clear it merely because
 * nobody is signed in yet; that is the normal state for an ad visitor who has
 * not registered, and clearing there is what silently lost the discount.
 */
export const clearPendingPromoCode = () => {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* private mode can reject writes; a stale code is harmless */
  }
};

/**
 * Capture a code seen at runtime (e.g. a client-side route change that carries
 * `?promo=`). First paint is still handled in index.html.
 */
export const capturePromoCode = (rawCode) => {
  if (!isBrowser() || !rawCode) return null;
  const code = String(rawCode).trim().toUpperCase();
  if (!PROMO_CODE.test(code)) return null;
  try {
    window.localStorage.setItem(STORAGE_KEY, code);
  } catch {
    /* fall through: the caller still gets the code for this page view */
  }
  return code;
};
