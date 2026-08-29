/**
 * Edge Functions intentionally do not allow loopback origins in production.
 * During Vite development, route calls through the local dev server instead,
 * keeping the browser request same-origin while Vite forwards it upstream.
 */
export function resolveEdgeFunctionsUrl({ supabaseUrl, isDevelopment, hostname }) {
  const isLoopback = hostname === 'localhost' || hostname === '127.0.0.1';

  if (isDevelopment && isLoopback) {
    return '/__supabase/functions';
  }

  return `${supabaseUrl}/functions/v1`;
}
