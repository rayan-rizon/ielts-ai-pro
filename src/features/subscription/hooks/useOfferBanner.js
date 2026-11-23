import { useCallback, useEffect, useState } from 'react';
import { getAppliedPromo } from '@/features/subscription/services/signupOffer';

// The banner needs a clock, so a code without a deadline gets none.
function toOffer(valid, code) {
  if (valid?.code !== code || !valid.expires_at) return null;
  const percent = valid.discount_type === 'percentage' ? Number(valid.discount_value) : null;
  return { code, percent, expiresAt: valid.expires_at };
}

/**
 * The offer to show a learner who has a promo applied: the code, its percentage and
 * its real deadline, read from the server so a stale or ended code never shows.
 * `dismiss` drops it when the clock reaches zero.
 */
export function useOfferBanner(promoDiscount, { load = getAppliedPromo } = {}) {
  const [offer, setOffer] = useState(null);
  const code = promoDiscount?.code || null;

  useEffect(() => {
    setOffer(null);
    if (!code) return undefined;
    let active = true;
    load()
      .then((valid) => active && setOffer(toOffer(valid, code)))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [code, load]);

  const dismiss = useCallback(() => setOffer(null), []);
  return { offer, dismiss };
}
