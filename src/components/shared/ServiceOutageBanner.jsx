import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requirePublicEnv } from '@/lib/publicEnv';
import {
  OUTAGE_COPY,
  getServiceOutageState,
  reportServiceRecovered,
  subscribeToServiceOutage,
} from '@/lib/serviceOutage';

const SUPABASE_URL = requirePublicEnv('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = requirePublicEnv('VITE_SUPABASE_ANON_KEY');

// Backoff schedule for the automatic health probe. Deliberately widening: a
// service that is down does not benefit from every browser retrying each second.
const PROBE_BACKOFF_MS = [5000, 10000, 20000, 30000, 60000];
const PROBE_TIMEOUT_MS = 6000;
const RECOVERED_VISIBLE_MS = 4000;

/** Lightweight reachability check against Supabase Auth. */
const probeBackend = async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      method: 'GET',
      headers: { apikey: SUPABASE_ANON_KEY },
      cache: 'no-store',
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * App-wide banner shown while our backend is unreachable.
 *
 * Sits alongside OfflineBanner: that one covers "your internet is gone", this
 * one covers "our servers are gone". They never show at the same time because
 * `classifyServiceError` returns OFFLINE when `navigator.onLine` is false.
 */
export function ServiceOutageBanner() {
  const [outage, setOutage] = React.useState(() => getServiceOutageState().since !== null);
  const [justRecovered, setJustRecovered] = React.useState(false);
  const [isChecking, setIsChecking] = React.useState(false);
  const attemptRef = React.useRef(0);

  React.useEffect(() => {
    setOutage(getServiceOutageState().since !== null);
    return subscribeToServiceOutage((next) => {
      const isDown = next.since !== null;
      setOutage((wasDown) => {
        if (wasDown && !isDown) {
          setJustRecovered(true);
          attemptRef.current = 0;
        }
        return isDown;
      });
    });
  }, []);

  // Hide the "back to normal" confirmation after a moment.
  React.useEffect(() => {
    if (!justRecovered) return undefined;
    const id = window.setTimeout(() => setJustRecovered(false), RECOVERED_VISIBLE_MS);
    return () => window.clearTimeout(id);
  }, [justRecovered]);

  // Automatic recovery probe with widening backoff.
  React.useEffect(() => {
    if (!outage) return undefined;
    let cancelled = false;
    let timerId = null;

    const schedule = () => {
      const delay = PROBE_BACKOFF_MS[Math.min(attemptRef.current, PROBE_BACKOFF_MS.length - 1)];
      attemptRef.current += 1;
      timerId = window.setTimeout(async () => {
        if (cancelled) return;
        const healthy = await probeBackend();
        if (cancelled) return;
        if (healthy) {
          reportServiceRecovered();
          return;
        }
        schedule();
      }, delay);
    };

    schedule();
    return () => {
      cancelled = true;
      if (timerId) window.clearTimeout(timerId);
    };
  }, [outage]);

  const handleRetry = async () => {
    setIsChecking(true);
    const healthy = await probeBackend();
    setIsChecking(false);
    if (healthy) {
      reportServiceRecovered();
      // Re-run the data fetches that failed while the backend was unreachable.
      window.location.reload();
    }
  };

  return (
    <AnimatePresence>
      {outage && (
        <motion.div
          key="service-outage"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          role="status"
          aria-live="polite"
          className="w-full shrink-0 overflow-hidden border-b border-amber-200 bg-linear-to-r/srgb from-amber-50/95 to-orange-50/95 dark:border-amber-500/20 dark:from-[#171208] dark:to-[#150f07]"
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1.5 px-4 py-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-amber-500/25 bg-amber-500/8 text-amber-600 dark:border-amber-400/30 dark:bg-amber-400/[0.14] dark:text-amber-300">
              <CloudOff className="h-3.5 w-3.5" strokeWidth={2.25} />
            </span>
            <p className="min-w-0 text-xs leading-snug sm:text-[13px]">
              <span className="mr-1.5 font-black tracking-tight text-amber-950 dark:text-amber-50">
                {OUTAGE_COPY.bannerTitle}
              </span>
              <span className="font-medium text-amber-800 dark:text-amber-200/90">
                {OUTAGE_COPY.bannerBody}
              </span>
            </p>
            <Button
              onClick={handleRetry}
              disabled={isChecking}
              size="sm"
              variant="outline"
              className="h-7 shrink-0 rounded-full border-amber-500/30 bg-amber-500/8 px-3 text-[11px] font-extrabold text-amber-700 hover:bg-amber-600 hover:text-white dark:border-amber-400/30 dark:bg-amber-400/[0.14] dark:text-amber-300 dark:hover:bg-amber-400 dark:hover:text-[#0b0c10]"
            >
              <RefreshCw className={`mr-1.5 h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
              {isChecking ? 'Checking' : 'Try again'}
            </Button>
          </div>
        </motion.div>
      )}

      {!outage && justRecovered && (
        <motion.div
          key="service-recovered"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          role="status"
          aria-live="polite"
          className="w-full shrink-0 overflow-hidden border-b border-emerald-200 bg-linear-to-r/srgb from-emerald-50/90 to-teal-50/90 dark:border-emerald-500/20 dark:from-[#0a1813] dark:to-[#091511]"
        >
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-4 py-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/8 text-emerald-600 dark:border-emerald-400/30 dark:bg-emerald-400/[0.14] dark:text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.25} />
            </span>
            <p className="text-xs leading-snug sm:text-[13px]">
              <span className="mr-1.5 font-black tracking-tight text-emerald-950 dark:text-emerald-50">
                Back to normal
              </span>
              <span className="font-medium text-emerald-800 dark:text-emerald-200/90">
                Everything is working again.
              </span>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ServiceOutageBanner;
