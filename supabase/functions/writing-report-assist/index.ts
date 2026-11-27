// @ts-ignore Deno runtime imports
import { createClient } from 'npm:@supabase/supabase-js@2.112.3';
import { checkSharedRateLimit } from '../_shared/aiAdmission.ts';
import {
  finalizeApiUsage,
  getCorsHeaders,
  handleCorsPrelight,
  reserveDatabaseQuota,
  validateCsrfProtection,
} from '../_shared/security.ts';
import { CREDIT_ENDPOINT } from '../_shared/writingReportCredit.ts';
import { createReportGenerator, handleReportAssist } from '../_shared/writingReportAssist.ts';

declare const Deno: any;

// Deliberately not wrapped in `withTextAiAdmission`: its eight leases are shared
// with essay marking, and reading a report must never delay a score. New
// generations are bounded by the per-learner and global limits in the handler.
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return handleCorsPrelight(req);
  const headers = {
    ...getCorsHeaders(req),
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  };
  const respond = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), { status, headers });

  if (req.method !== 'POST') return respond({ error: 'Use POST' }, 405);
  if (!validateCsrfProtection(req).valid)
    return respond({ error: 'Request origin is not allowed' }, 403);

  const db = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    { auth: { persistSession: false } }
  );
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return respond({ error: 'Please sign in' }, 401);
  const { data: auth, error: authError } = await db.auth.getUser(token);
  if (authError || !auth.user) return respond({ error: 'Please sign in' }, 401);

  const raw = await req.text();
  if (raw.length > 2_048) return respond({ error: 'Request too large' }, 413);
  let body: unknown = null;
  try {
    body = JSON.parse(raw);
  } catch {
    // The handler answers a missing body with 400.
  }

  const result = await handleReportAssist(body, auth.user, {
    db,
    allow: async (key, maxRequests, windowMs) =>
      (await checkSharedRateLimit(db, key, { maxRequests, windowMs })).allowed,
    credits: {
      reserve: (authId, key, metadata) =>
        reserveDatabaseQuota(db, authId, CREDIT_ENDPOINT, 'writing', key, metadata),
      // The provider cost stays in the translation cache, so it is not counted twice.
      finalize: (reservationId, succeeded, metadata) =>
        finalizeApiUsage(db, reservationId, 0, false, metadata, succeeded ? 'completed' : 'failed'),
    },
    generate: createReportGenerator({
      openRouterKey: Deno.env.get('OPENROUTER_API_KEY'),
      geminiKey: Deno.env.get('GEMINI_API_KEY'),
    }),
  });
  return respond(result.body, result.status);
});
