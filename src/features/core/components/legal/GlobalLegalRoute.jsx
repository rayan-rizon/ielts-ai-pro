import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { detectLocation } from '@/lib/pricingUtils';

const BANGLADESH_ROUTES = {
  privacy: '/bd/privacy',
  terms: '/bd/terms',
  refund: '/bd/refund-cancellation',
};

/** Keep the Stripe/global legal documents on their own route family. */
export default function GlobalLegalRoute({ documentType, children }) {
  const [country, setCountry] = useState(null);
  const bangladeshRoute = BANGLADESH_ROUTES[documentType];

  useEffect(() => {
    let cancelled = false;
    detectLocation()
      .then((detectedCountry) => {
        if (!cancelled) setCountry((detectedCountry || '').toUpperCase());
      })
      .catch(() => {
        if (!cancelled) setCountry('');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (country === null) {
    return (
      <main className="min-h-screen bg-[#fcfdff] px-5 pt-28 text-center dark:bg-[#08080a]">
        <p role="status" className="text-sm text-muted-foreground">
          Checking regional availability…
        </p>
      </main>
    );
  }

  if (country === 'BD' && bangladeshRoute) {
    return <Navigate to={bangladeshRoute} replace />;
  }

  return children;
}
