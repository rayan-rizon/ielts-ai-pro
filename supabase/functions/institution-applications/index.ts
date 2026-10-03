import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  getCorsHeaders,
  handleCorsPrelight,
  validateCsrfProtection,
  checkRateLimit,
  getRateLimitIdentifier,
} from '../_shared/security.ts';
import { validateInstitutionApplication } from '../_shared/institutionApplications.ts';
import { invitationSetup } from '../_shared/institutionInvitationSetup.ts';
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
Deno.serve(async (req) => {
  const headers = getCorsHeaders(req);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  if (req.method === 'OPTIONS') return handleCorsPrelight(req);
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!validateCsrfProtection(req).valid) return json({ error: 'Request validation failed' }, 403);
  if (Number(req.headers.get('content-length') || 0) > 16000)
    return json({ error: 'Request is too large' }, 413);
  const identifier = getRateLimitIdentifier(req);
  try {
    const raw = await req.text();
    if (raw.length > 16000) return json({ error: 'Request is too large' }, 413);
    const body = JSON.parse(raw);
    if (!body.data || typeof body.data !== 'object' || Array.isArray(body.data))
      return json({ error: 'Check the request details' }, 400);
    if (body.action === 'invitation_info' || body.action === 'invitation_setup') {
      if (
        !checkRateLimit(`institution-${body.action}:${identifier}`, {
          maxRequests: body.action === 'invitation_info' ? 60 : 10,
          windowMs: 60000,
        }).allowed
      )
        return json({ error: 'Too many requests. Please try again shortly.' }, 429);
      return json({ data: await invitationSetup(db, body.action, body.data) });
    }
    if (body.action !== 'submit') return json({ error: 'Unknown operation' }, 400);
    if (
      !checkRateLimit(`institution-apply:${identifier}`, { maxRequests: 10, windowMs: 3600000 })
        .allowed
    )
      return json({ error: 'Too many requests. Please try again later.' }, 429);
    if (body.data.website) return json({ data: { received: true } }); // Honeypot, never creates a request.
    const input = validateInstitutionApplication(body.data);
    const hash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(`${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}:${identifier}`)
    );
    const ipHash = Array.from(new Uint8Array(hash), (n) => n.toString(16).padStart(2, '0')).join(
      ''
    );
    const { data, error } = await db.rpc('institution_application_submit', {
      p_data: input,
      p_ip_hash: ipHash,
    });
    if (error) {
      if (error.code === '54000')
        return json({ error: 'Too many requests. Please try again later.' }, 429);
      console.error('[institution-applications] persistence failed', error.code);
      return json({ error: 'We could not save your request. Please try again.' }, 503);
    }
    return json({ data });
  } catch (error) {
    return json(
      {
        error:
          error instanceof SyntaxError
            ? 'Invalid request'
            : error instanceof Error
              ? error.message
              : 'Check the request details',
      },
      400
    );
  }
});
