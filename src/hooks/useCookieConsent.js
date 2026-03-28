import { useState, useEffect } from 'react';
import { CONSENT_STORAGE_KEY } from '@/components/shared/CookieConsent';

export function useCookieConsent() {
  const [consent, setConsent] = useState(null);

  useEffect(() => {
    const syncConsent = () => {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (!stored) {
        setConsent(null);
        return;
      }

      try {
        setConsent(JSON.parse(stored));
      } catch {
        setConsent(null);
      }
    };

    syncConsent();
    window.addEventListener('storage', syncConsent);
    window.addEventListener('cookie-consent-updated', syncConsent);

    return () => {
      window.removeEventListener('storage', syncConsent);
      window.removeEventListener('cookie-consent-updated', syncConsent);
    };
  }, []);

  const hasConsent = (type) => consent?.[type] === true;

  return { consent, hasConsent };
}
