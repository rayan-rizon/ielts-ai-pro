// @ts-ignore Deno runtime import
import { createClient } from 'npm:@supabase/supabase-js@2.112.3';
declare const Deno: any;
Deno.serve(async (req: Request) => {
  const secret = Deno.env.get('SKILL_LAB_CLEANUP_SECRET');
  if (req.method !== 'POST' || !secret || req.headers.get('Authorization') !== `Bearer ${secret}`)
    return new Response('Unauthorized', { status: 401 });
  const client = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  );
  const { data, error } = await client.rpc('skill_lab_audio_cleanup', { p_action: 'list' });
  if (error) return new Response('Cleanup lookup failed', { status: 500 });
  let removed = 0;
  for (const path of data || []) {
    const result = await client.storage.from('skill-lab-audio').remove([path]);
    if (result.error) return new Response('Cleanup incomplete; retry required', { status: 500 });
    const done = await client.rpc('skill_lab_audio_cleanup', { p_action: 'done', p_path: path });
    if (done.error) return new Response('Cleanup receipt failed', { status: 500 });
    removed++;
  }
  return Response.json({ removed });
});
