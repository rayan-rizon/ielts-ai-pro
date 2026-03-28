import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from "@sentry/react";
import App from '@/App.jsx';
import '@/index.css';
import { RootProviders } from './components/RootProviders';

Sentry.init({
  dsn: "https://c4a03f3938495e11019ede9a4347e941@o4511048158150656.ingest.de.sentry.io/4511048214052944",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Performance Monitoring — sample 15% of transactions in production to balance cost vs visibility
  tracesSampleRate: 0.15,
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  // Disable automatic PII collection (IP addresses) for privacy compliance.
  // User context is still available via Sentry.setUser() when needed.
  sendDefaultPii: false
});

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
