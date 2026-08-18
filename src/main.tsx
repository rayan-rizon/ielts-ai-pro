import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App.jsx';
import { RootProviders } from './components/RootProviders';

const isLocalHost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);
const isLiveProduction = import.meta.env.PROD && !isLocalHost;
const SENTRY_INITIALIZED_KEY = '__ieltsAiProSentryInitialized__';
const isSentryEnabled =
  isLiveProduction || import.meta.env.VITE_SENTRY_ENABLE_DEVELOPMENT === 'true';

const scheduleIdle = (callback: () => void, timeout = 3000) => {
  if ('requestIdleCallback' in window) {
    const id = (window as any).requestIdleCallback(callback, { timeout });
    return () => (window as any).cancelIdleCallback?.(id);
  }

  const id = (window as any).setTimeout(callback, Math.min(timeout, 2000));
  return () => (window as any).clearTimeout(id);
};

const scheduleDeferredTelemetry = (callback: () => void, delay = 8000) => {
  let started = false;
  let timer: number | undefined;

  const start = () => {
    if (started) return;
    started = true;
    if (timer) window.clearTimeout(timer);
    window.removeEventListener('pointerdown', start);
    window.removeEventListener('keydown', start);
    scheduleIdle(callback, 4000);
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
      dsn:
        import.meta.env.VITE_SENTRY_DSN ||
        'https://03ed8b4e6214256395735d17f027f8f4@o4511451727331328.ingest.us.sentry.io/4511452061040640',
      environment: isLiveProduction ? 'production' : 'development',
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.browserProfilingIntegration(),
        Sentry.replayIntegration(),
      ],
      tracesSampleRate: isLiveProduction ? 0.15 : 0,
      // The browser-profile decision is made once per session. Keep production
      // sampling below tracing to control profiling volume and overhead.
      profileSessionSampleRate: isLiveProduction ? 0.1 : 0,
      replaysSessionSampleRate: isLiveProduction ? 0.1 : 0,
      replaysOnErrorSampleRate: isLiveProduction ? 1.0 : 0,
      sendDefaultPii: false,
      beforeSend(event, hint) {
        // Temporarily commented out to allow testing and verification in local development
        /*
        if (!isProduction) {
          return null;
        }
        */

        const error = hint.originalException;
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Filter out "Java object is gone" and other third-party noise
        // related to in-app browsers like Instagram/Facebook on Android.
        const noiseKeywords = [
          'Java object is gone',
          'postMessage',
          'enableButtonsClickedMetaDataLogging',
          '__show__deepen',
          'atomic_css',
        ];

        if (noiseKeywords.some((keyword) => errorMessage.includes(keyword))) {
          return null;
        }

        return event;
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

// Lazy-load telemetry to keep it off the critical path
const SpeedInsights = lazy(() =>
  import('@vercel/speed-insights/react').then((m) => ({ default: m.SpeedInsights }))
);

const Analytics = lazy(() =>
  import('@vercel/analytics/react').then((m) => ({ default: m.Analytics }))
);

const IdleTelemetry = () => {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if (!isLiveProduction) return undefined;
    scheduleDeferredTelemetry(() => setReady(true));
    return undefined;
  }, []);

  if (!ready) return null;

  return (
    <>
      <Suspense fallback={null}>
        <SpeedInsights data-oid="e6n:l6p" />
      </Suspense>
      <Suspense fallback={null}>
        <Analytics />
      </Suspense>
    </>
  );
};

/**
 * Global error listeners to catch chunk load failures early.
 * This handles stale cache issues after deployments where old script hashes
 * are no longer available on the server.
 */
if (typeof window !== 'undefined') {
  const handleChunkError = (error: any) => {
    const errorString = error?.message || error?.reason?.message || '';
    const isChunkError =
      errorString.includes('Failed to fetch dynamically imported module') ||
      errorString.includes('Importing a module script failed') ||
      errorString.includes('error loading dynamically imported module');

    if (isChunkError) {
      const pageHasAlreadyBeenForceRefreshed = JSON.parse(
        window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
      );

      if (!pageHasAlreadyBeenForceRefreshed) {
        console.warn('[GlobalListener] Chunk load failure detected. Refreshing...', errorString);
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        window.location.reload();
      }
    }
  };

  window.addEventListener('error', (event) => handleChunkError(event), true);
  window.addEventListener('unhandledrejection', (event) => handleChunkError(event));
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <RootProviders data-oid="root-providers">
    <App data-oid="5:8tvi2" />
    <IdleTelemetry />
  </RootProviders>
);
