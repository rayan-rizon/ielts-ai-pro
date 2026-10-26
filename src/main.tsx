import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App.jsx';
import { RootProviders } from './components/RootProviders';
import { optionalPublicEnv } from '@/lib/publicEnv';
import { shouldDropSentryEvent } from '@/lib/sentryFilters';
import { scheduleIdle } from '@/lib/scheduleIdle';
import { recoverFromChunkLoadError } from '@/lib/chunkLoadRecovery';
import { installDomMutationGuard } from '@/lib/domMutationGuard';

installDomMutationGuard();

const isLiveProduction =
  import.meta.env.PROD && ['ieltsai.pro', 'www.ieltsai.pro'].includes(window.location.hostname);
const SENTRY_INITIALIZED_KEY = '__ieltsAiProSentryInitialized__';
const sentryDsn = optionalPublicEnv('VITE_SENTRY_DSN');
const isSentryEnabled =
  Boolean(sentryDsn) &&
  (isLiveProduction || import.meta.env.VITE_SENTRY_ENABLE_DEVELOPMENT === 'true');

const scheduleDeferredTelemetry = (callback: () => void, delay = 8000) => {
  let started = false;
  let timer: number | undefined;

  const start = () => {
    if (started) return;
    started = true;
    if (timer) window.clearTimeout(timer);
    window.removeEventListener('pointerdown', start);
    window.removeEventListener('keydown', start);
    scheduleIdle(callback, { timeout: 4000 });
  };

  const schedule = () => {
    timer = window.setTimeout(start, delay);
    window.addEventListener('pointerdown', start, { once: true, passive: true });
    window.addEventListener('keydown', start, { once: true });
  };

  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
};

// PERFORMANCE: Defer Sentry initialization to idle time.
// Browser tracing, replay, and profiling are heavy modules (~100-150ms).
// Using requestIdleCallback ensures they load after First Contentful Paint.
const initSentry = () => {
  import('@sentry/react').then((Sentry) => {
    // Vite HMR can re-evaluate this entry module without recreating `window`.
    // Keep this marker on the page so Replay is never registered twice.
    if ((window as any)[SENTRY_INITIALIZED_KEY]) return;

    // A hot reload may introduce this guard after an earlier version of this
    // module has already initialized Sentry. Reusing that client is safer than
    // registering Replay a second time.
    if (Sentry.getClient()) {
      (window as any)[SENTRY_INITIALIZED_KEY] = true;
      return;
    }

    (window as any)[SENTRY_INITIALIZED_KEY] = true;

    Sentry.init({
      dsn: sentryDsn,
      environment: isLiveProduction ? 'production' : 'development',
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.browserProfilingIntegration(),
        Sentry.replayIntegration({
          // Replay can observe learner essays, payment fields, and admin
          // screens. Keep the privacy contract explicit instead of relying on
          // SDK defaults, and allow a future sensitive surface to opt in.
          maskAllText: true,
          maskAllInputs: true,
          blockAllMedia: true,
          mask: ['[data-ielts-sensitive]'],
        }),
      ],
      tracesSampleRate: isLiveProduction ? 0.15 : 0,
      // The browser-profile decision is made once per session. Keep production
      // sampling below tracing to control profiling volume and overhead.
      profileSessionSampleRate: isLiveProduction ? 0.1 : 0,
      replaysSessionSampleRate: isLiveProduction ? 0.1 : 0,
      replaysOnErrorSampleRate: isLiveProduction ? 1.0 : 0,
      sendDefaultPii: false,
      beforeSend(event, hint) {
        return shouldDropSentryEvent(event, hint) ? null : event;
      },
    });
  });
};

if (import.meta.env.DEV && isSentryEnabled) {
  // Development reporting is opt-in to keep local HMR errors out of production triage.
  initSentry();
} else if (isSentryEnabled) {
  scheduleDeferredTelemetry(initSentry);
}

/**
 * Global error listeners to catch chunk load failures early.
 * This handles stale cache issues after deployments where old script hashes
 * are no longer available on the server.
 */
if (typeof window !== 'undefined') {
  // Vite reports a failed lazy-route import here first. Schedule the reload but
  // never preventDefault: a cancelled preloadError makes Vite resolve the
  // import with `undefined`, which React then reports as an unrelated
  // "reading 'default'" TypeError instead of the chunk failure it is.
  window.addEventListener('vite:preloadError', (event: any) => {
    recoverFromChunkLoadError(event?.payload);
  });
  window.addEventListener('unhandledrejection', (event) => {
    if (recoverFromChunkLoadError(event.reason)) event.preventDefault();
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <RootProviders data-oid="root-providers">
    <App data-oid="5:8tvi2" />
  </RootProviders>
);
