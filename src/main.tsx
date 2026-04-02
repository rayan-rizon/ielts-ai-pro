import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App.jsx';
import '@/index.css';
import { RootProviders } from './components/RootProviders';

// PERFORMANCE: Defer Sentry initialization to idle time.
// browserTracingIntegration and replayIntegration are heavy modules (~100-150ms).
// Using requestIdleCallback ensures they load after First Contentful Paint.
const initSentry = () => {
  import("@sentry/react").then((Sentry) => {
    const isProduction = !['localhost', '127.0.0.1', '0.0.0.0'].includes(
      window.location.hostname
    );

    Sentry.init({
      dsn: "https://c4a03f3938495e11019ede9a4347e941@o4511048158150656.ingest.de.sentry.io/4511048214052944",
      environment: isProduction ? 'production' : 'development',
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      tracesSampleRate: isProduction ? 0.15 : 0,
      replaysSessionSampleRate: isProduction ? 0.1 : 0,
      replaysOnErrorSampleRate: isProduction ? 1.0 : 0,
      sendDefaultPii: false,
      beforeSend(event, hint) {
        // Don't send events from local development
        if (!isProduction) {
          return null;
        }

        const error = hint.originalException;
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Filter out "Java object is gone" and other third-party noise
        // related to in-app browsers like Instagram/Facebook on Android.
        const noiseKeywords = [
          'Java object is gone',
          'postMessage',
          'enableButtonsClickedMetaDataLogging',
          '__show__deepen',
          'atomic_css'
        ];

        if (noiseKeywords.some(keyword => errorMessage.includes(keyword))) {
          return null;
        }

        return event;
      },
    });
  });
};

if ('requestIdleCallback' in window) {
  (window as any).requestIdleCallback(initSentry, { timeout: 3000 });
} else {
  setTimeout(initSentry, 2000);
}

// Lazy-load telemetry to keep it off the critical path
const SpeedInsights = lazy(() =>
  import('@vercel/speed-insights/react').then(m => ({ default: m.SpeedInsights }))
);

const Analytics = lazy(() =>
  import('@vercel/analytics/react').then(m => ({ default: m.Analytics }))
);

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
    <Suspense fallback={null}>
      <SpeedInsights data-oid="e6n:l6p" />
    </Suspense>
    <Suspense fallback={null}>
      <Analytics />
    </Suspense>
  </RootProviders>
);
