import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { getCorsHeaders } from '../_shared/security.ts';

// Retired route for older clients. All current Speaking audio uses the cached
// Gemini route. Keep this endpoint so a stale client fails without a paid call.
serve((req) => {
  const headers = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers });

  return new Response(
    JSON.stringify({
      success: false,
      fallback: true,
      code: 'tts_route_retired',
      error: 'This speech endpoint is retired. Update the app to continue.',
    }),
    { status: 410, headers: { ...headers, 'Content-Type': 'application/json' } }
  );
});
