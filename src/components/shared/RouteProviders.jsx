import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

/**
 * Data-query context is required by application routes, not the public landing
 * page. Keeping it route-scoped avoids shipping the query runtime before the
 * landing hero has painted.
 */
export default function RouteProviders({ children }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
