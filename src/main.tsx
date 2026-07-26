import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App.jsx';
import '@/index.css';
import { RootProviders } from './components/RootProviders';

const isLocalHost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);
const isLiveProduction = import.meta.env.PROD && !isLocalHost;

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

// New Relic Initialization
const initNewRelic = () => {
  import('@newrelic/browser-agent/loaders/browser-agent')
    .then(({ BrowserAgent }) => {
      const options = {
        info: {
          applicationID: String(import.meta.env.VITE_NEWRELIC_APP_ID || ''),
          beacon: 'bam.nr-data.net',
          errorBeacon: 'bam.nr-data.net',
          licenseKey: String(import.meta.env.VITE_NEWRELIC_LICENSE_KEY || ''),
          sa: 1,
        },
        init: {
          ajax: { deny_list: ['bam.nr-data.net'] },
          browser_consent_mode: { enabled: false },
          distributed_tracing: { enabled: true },
          performance: { capture_detail: false, capture_marks: false, capture_measures: true },
          privacy: { cookies_enabled: true },
        },
        loader_config: {
          accountID: String(import.meta.env.VITE_NEWRELIC_ACCOUNT_ID || ''),
          agentID: String(import.meta.env.VITE_NEWRELIC_AGENT_ID || ''),
          applicationID: String(import.meta.env.VITE_NEWRELIC_APP_ID || ''),
          licenseKey: String(import.meta.env.VITE_NEWRELIC_LICENSE_KEY || ''),
          trustKey: String(import.meta.env.VITE_NEWRELIC_TRUST_KEY || ''),
        },
      };

      try {
        // Clear NREUM if it's set to a primitive (like false) to prevent 'Cannot create property NREUM on boolean false' during HMR or re-initialization
        if (typeof (window as any).NREUM !== 'object') {
          delete (window as any).NREUM;
        }
        const agent = new BrowserAgent(options);
        console.log('[New Relic] Browser agent initialized successfully');
      } catch (err) {
        console.error('[New Relic] Failed to create browser agent instance', err);
      }
    })
    .catch((err) => {
      console.error('[New Relic] Failed to load browser agent module', err);
    });
};

if (isLiveProduction && typeof window !== 'undefined') {
  scheduleDeferredTelemetry(initNewRelic);
}

// PERFORMANCE: Defer Sentry initialization to idle time.
// Browser tracing, replay, and profiling are heavy modules (~100-150ms).
// Using requestIdleCallback ensures they load after First Contentful Paint.
const initSentry = () => {
  import('@sentry/react').then((Sentry) => {
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
      sendDefaultPii: true,
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

if (import.meta.env.DEV) {
  // In development, initialize Sentry immediately so testing works instantly.
  initSentry();
} else if (isLiveProduction) {
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
