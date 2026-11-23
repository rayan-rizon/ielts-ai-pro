import { useEffect, useState } from 'react';

/** Milliseconds left until `end`, re-read every second. */
export function useOfferRemaining(end) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return end - now;
}
