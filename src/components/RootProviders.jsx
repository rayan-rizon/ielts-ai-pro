import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { queryClient } from '@/lib/queryClient';
import { ThemeProvider } from './theme-provider';

/**
 * RootProviders component to centralize app-wide context providers.
 * Query context must wrap the router as well as route content: route-level
 * boundaries and layouts can render query-powered UI before RouteProviders is
 * mounted.
 */
export function RootProviders({ children }) {
  return (
    <HelmetProvider data-oid="-hc4_k5">
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme" data-oid="l8hji09">
          <AuthProvider data-oid="9.0.ip1">{children}</AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
