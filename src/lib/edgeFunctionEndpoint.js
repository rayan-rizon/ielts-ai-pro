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

/**
 * Rewrites only Edge Function requests through Vite's same-origin proxy while
 * developing locally. Direct `supabase.functions.invoke()` calls use the
 * Supabase project's absolute functions URL, so they need this rewrite just
 * as much as the fetch-based helper in `utils/api`.
 */
export function rewriteEdgeFunctionRequest(input, { supabaseUrl, isDevelopment, hostname }) {
  const functionsUrl = resolveEdgeFunctionsUrl({ supabaseUrl, isDevelopment, hostname });

  if (functionsUrl !== '/__supabase/functions') return input;

  const requestUrl =
    typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const upstreamPrefix = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/`;

  if (!requestUrl.startsWith(upstreamPrefix)) return input;

  return `${functionsUrl}/${requestUrl.slice(upstreamPrefix.length)}`;
}
