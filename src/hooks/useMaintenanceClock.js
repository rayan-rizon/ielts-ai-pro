import { useEffect, useState } from 'react';

// Settings can remain identical across polls. Re-evaluate at the actual window
// boundaries instead of relying on a settings change to cause another render.
export default function useMaintenanceClock(config) {
  const [tick, setTick] = useState(0);
  const { enabled, starts_at, ends_at, auto_resume } = config;

  useEffect(() => {
    const update = () => setTick((value) => value + 1);
    const boundaries = enabled
      ? [starts_at, auto_resume && ends_at]
          .filter(Boolean)
          .map((value) => new Date(value).getTime())
      : [];
    const next = boundaries.filter((at) => at > Date.now()).sort((a, b) => a - b)[0];
    const timer = next
      ? window.setTimeout(update, Math.min(next - Date.now() + 1, 2_147_483_647))
      : null;
    const onVisible = () => {
      if (document.visibilityState === 'visible') update();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      if (timer !== null) window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled, starts_at, ends_at, auto_resume, tick]);

  return Date.now();
}
