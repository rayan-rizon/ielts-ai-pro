import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { ThemeProvider } from './theme-provider';
import { queryClient } from '@/lib/queryClient';

/**
 * RootProviders component to centralize all context providers.
 * Moving them here decouples main.tsx from large libraries like TanStack Query
 * and react-helmet-async, allowing for better code organization.
 */
export function RootProviders({ children }) {
  return (
    <HelmetProvider data-oid="-hc4_k5">
      <QueryClientProvider client={queryClient} data-oid="g9o1r5r">
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme" data-oid="l8hji09">
          <AuthProvider data-oid="9.0.ip1">{children}</AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
