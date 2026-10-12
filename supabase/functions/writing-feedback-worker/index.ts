import { createClient } from 'npm:@supabase/supabase-js@2.112.3';
import { processWritingJob } from '../_shared/writingJobsWorkflow.ts';
declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response(null, { status: 405 });
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  if (token.length !== 64) return new Response(null, { status: 401 });
  const db = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    {
      auth: { persistSession: false },
    }
  );
  const { data: verified, error } = await db.rpc('verify_writing_worker', { p_token: token });
  if (error || !verified) return new Response(null, { status: 401 });
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!/^[0-9a-f-]{36}$/i.test(body?.slotToken || '')) return new Response(null, { status: 400 });
  // pg_net receives an immediate acknowledgement. The persisted message is
  // still leased until processing and DB acknowledgement both finish.
  EdgeRuntime.waitUntil(
    processWritingJob(db, body.slotToken).catch((e) =>
      console.error('Writing worker interrupted', e.message)
    )
  );
  return new Response(JSON.stringify({ accepted: true }), {
    status: 202,
    headers: { 'Content-Type': 'application/json' },
  });
});
