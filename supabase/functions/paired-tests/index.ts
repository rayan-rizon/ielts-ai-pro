import { createClient } from 'npm:@supabase/supabase-js@2.112.3';
import { parseBuffer } from 'npm:music-metadata@11.15.0';
import { isAllowedOrigin } from '../_shared/originValidation.ts';
import { isAllowedPairedRequestOrigin } from '../_shared/pairedRequestOrigin.ts';
import { publicRoom } from '../_shared/objective-scoring/publicRoom.js';
import {
  prepareSnapshot,
  gradeSnapshot,
  comparisonSummary,
  validateAnswers,
} from '../_shared/objective-scoring/paired.js';

const allowed = new Set([
  'create',
  'preview',
  'join',
  'list',
  'get',
  'ready',
  'start',
  'save',
  'submit',
  'leave',
  'interrupted',
  'review',
]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function audioDuration(src: string) {
  const url = new URL(src);
  const storage = new URL(Deno.env.get('SUPABASE_URL')!).hostname;
  if (
    url.protocol !== 'https:' ||
    ![storage, 'media.ieltsai.pro'].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.port
  )
    throw new Error('Unsupported audio source');
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(20000) });
  if (!response.ok || !response.body) throw new Error('Audio unavailable');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 32 * 1024 * 1024) throw new Error('Audio exceeds paired-test limit');
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  const metadata = await parseBuffer(
    bytes,
    { mimeType: response.headers.get('content-type') || undefined },
    { duration: true, skipCovers: true }
  );
  const seconds = Math.ceil(metadata.format.duration || 0);
  if (seconds < 1 || seconds > 3600) throw new Error('Audio duration unavailable');
  return seconds;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  const cors: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    ...(isAllowedOrigin(origin) ? { 'Access-Control-Allow-Origin': origin } : {}),
  };
  const reply = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
  if (Deno.env.get('PAIRED_TESTS_ENABLED') !== 'true')
    return reply({ error: 'Paired practice is not available yet' }, 503);
  if (!isAllowedPairedRequestOrigin(req.headers))
    return reply({ error: 'Invalid request origin' }, 403);
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return reply({ error: 'Sign in to continue' }, 401);
  const auth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
  const {
    data: { user },
    error: authError,
  } = await auth.auth.getUser(token);
  if (authError || !user) return reply({ error: 'Sign in to continue' }, 401);
  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  );
  const action = async (
    name: string,
    room: string | null,
    data: unknown = {},
    authId = user.id
  ) => {
    const { data: result, error } = await db.rpc('paired_test_action', {
      p_auth: authId,
      p_action: name,
      p_room: room,
      p_data: data,
    });
    if (error) throw new Error(error.message);
    if (result?.error) throw new Error(result.error);
    return result;
  };
  try {
    const raw = await req.text();
    if (raw.length > 128000) return reply({ error: 'Request too large' }, 413);
    const body = JSON.parse(raw);
    const name = body.action;
    if (!allowed.has(name)) return reply({ error: 'Invalid operation' }, 400);
    if (body.room && !uuid.test(body.room)) return reply({ error: 'Invalid room' }, 400);
    let payload = body.data || {};
    if (['save', 'submit'].includes(name)) {
      payload = { answers: validateAnswers(payload.answers), revision: payload.revision };
      if (!Number.isSafeInteger(payload.revision) || payload.revision < 0)
        throw new Error('Invalid revision');
    }
    if (['join', 'preview'].includes(name) && !uuid.test(payload.token))
      throw new Error('Invitation unavailable');
    if (name === 'create') {
      if (!uuid.test(payload.passage_id)) throw new Error('Invalid test');
      // Validate entitlement/rate limit before expensive media probes.
      await action('authorize', null, { passage_id: payload.passage_id });
      const [p, q] = await Promise.all([
        db.from('passages').select('*').eq('id', payload.passage_id).single(),
        db
          .from('questions')
          .select('*')
          .eq('passage_id', payload.passage_id)
          .order('question_number')
          .limit(200),
      ]);
      if (p.error || q.error) throw new Error('Test unavailable');
      if (payload.consent !== true) throw new Error('Accept score sharing to create a room');
      const snapshot = prepareSnapshot(p.data, q.data);
      const durations: number[] = [];
      if (p.data.test_type === 'listening')
        for (const part of snapshot.testData.content)
          durations.push(await audioDuration(part.audio_url || part.audioUrl));
      const digest = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(JSON.stringify(snapshot))
      );
      payload = {
        passage_id: p.data.id,
        test_type: p.data.test_type,
        title: p.data.title,
        snapshot,
        consent: true,
        content_version: Array.from(new Uint8Array(digest), (b) =>
          b.toString(16).padStart(2, '0')
        ).join(''),
        duration_seconds: durations.length ? durations.reduce((a, b) => a + b, 0) + 120 : 3600,
        audio_durations: durations,
      };
    }
    let room = await action(name, body.room || null, payload);
    // Recover any locked, ungraded attempts, including after a function interruption.
    if (room.members) {
      for (const member of room.state === 'grading' ? room.members : [])
        if (member.submitted_at && !member.summary) {
          const result = gradeSnapshot(room.snapshot, member.answers) as {
            correctAnswersMap?: unknown;
            answersMap?: unknown;
          };
          const summary = comparisonSummary(result);
          await action(
            'grade',
            room.id,
            {
              summary,
              result: {
                ...result,
                correctAnswersMap: result.correctAnswersMap || result.answersMap,
              },
            },
            member.auth_id
          );
        }
      room = await action('get', room.id);
    }
    return reply(publicRoom(room, body.data?.include_snapshot === true));
  } catch (error) {
    // No request payload, invitation, or answer logging.
    return reply({ error: error instanceof Error ? error.message : 'Unable to update room' }, 400);
  }
});
