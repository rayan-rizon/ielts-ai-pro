import React from 'react';

/**
 * Route-level provider seam retained for lazy route composition. App-wide
 * providers, including React Query, live in RootProviders so every route uses
 * one client and one cache.
 */
export default function RouteProviders({ children }) {
  return children;
}
