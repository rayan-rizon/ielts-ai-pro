import { createClient } from 'npm:@supabase/supabase-js@2.112.3';
import {
  checkRateLimit,
  getCorsHeaders,
  logApiUsage,
  validateCsrfProtection,
} from '../_shared/security.ts';
import { generateAiReadingDraft } from '../_shared/aiReadingProvider.ts';
import { createAiReadingHandler } from './handler.ts';

declare const Deno: any;
const db = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);
const handler = createAiReadingHandler({
  headers: getCorsHeaders,
  authenticate: async (req) => {
    if (!validateCsrfProtection(req).valid) return null;
    const token = req.headers.get('Authorization')!.slice(7);
    const { data, error } = await db.auth.getUser(token);
    if (error || !data.user) return null;
    const { data: profile, error: profileError } = await db
      .from('users')
      .select('role')
      .eq('auth_id', data.user.id)
      .single();
    if (profileError || profile?.role !== 'admin') return null;
    // Use the existing admin gate under this caller's JWT, including MFA and
    // recovery-session requirements; a profile role alone is insufficient.
    const caller = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false },
      }
    );
    const { data: isAdmin, error: adminError } = await caller.rpc('is_admin');
    return !adminError && isAdmin === true ? { authId: data.user.id } : null;
  },
  admit: (authId) =>
    checkRateLimit(`admin-reading-draft:${authId}`, { maxRequests: 4, windowMs: 60000 }).allowed,
  generate: (input) => generateAiReadingDraft(input, Deno.env.get('OPENROUTER_API_KEY') || ''),
  recordUsage: (authId, usage) =>
    logApiUsage(db, authId, 'admin-reading-draft', false, usage.tokensUsed, {
      serviceName: 'admin-reading-draft',
      ...usage,
    }),
});

if ((globalThis as any).__registerLocalEdgeHandler)
  (globalThis as any).__registerLocalEdgeHandler(handler);
else Deno.serve(handler);
