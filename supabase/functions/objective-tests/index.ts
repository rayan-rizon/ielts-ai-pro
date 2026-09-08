import { createClient } from 'npm:@supabase/supabase-js@2.112.3';
import { getCorsHeaders, handleCorsPrelight, validateCsrfProtection } from '../_shared/security.ts';
import {
  prepareSnapshot,
  prepareObjectiveSnapshot,
  gradeSnapshot,
  withoutSolutions,
  validateAnswers,
} from '../_shared/objective-scoring/paired.js';

// Staged endpoint: clients switch only after the all-library audit and UI rollout.
Deno.serve(async (req: Request) => {
  const headers = {
    ...getCorsHeaders(req),
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  };
  const reply = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers });
  if (req.method === 'OPTIONS') return handleCorsPrelight(req);
  if (req.method !== 'POST') return reply({ error: 'Use POST' }, 405);
  if (!validateCsrfProtection(req).valid)
    return reply({ error: 'Request origin is not allowed' }, 403);
  const client = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  );
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return reply({ error: 'Please sign in' }, 401);
  const {
    data: { user },
    error,
  } = await client.auth.getUser(token);
  if (error || !user) return reply({ error: 'Please sign in' }, 401);
  try {
    const raw = await req.text();
    if (raw.length > 80000) return reply({ error: 'Request too large' }, 413);
    const body = JSON.parse(raw);
    if (!['load', 'save', 'submit'].includes(body.action))
      return reply({ error: 'Unknown action' }, 400);
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuid.test(body.sessionId || body.passageId || ''))
      return reply({ error: 'Invalid test identifier' }, 400);
    const state = async (action: string, data: unknown = {}) => {
      const { data: result, error } = await client.rpc('objective_test_state', {
        p_auth: user.id,
        p_action: action,
        p_session: body.sessionId || null,
        p_data: data,
      });
      if (error) throw new Error(error.message);
      return result;
    };
    const authorization = await state('authorize', { passage_id: body.passageId || null });
    let attempt = authorization.attempt;
    const legacyReview = !attempt && authorization.session?.is_completed;
    if (legacyReview && body.action !== 'load') throw new Error('This test is already complete');
    let snapshot = attempt?.snapshot;
    if (!snapshot) {
      const [{ data: passage, error: passageError }, { data: questions, error: questionsError }] =
        await Promise.all([
          client.from('passages').select('*').eq('id', authorization.passage_id).single(),
          client
            .from('questions')
            .select('*')
            .eq('passage_id', authorization.passage_id)
            .order('question_number'),
        ]);
      if (passageError || questionsError) throw new Error('Test content is unavailable');
      snapshot = legacyReview
        ? prepareObjectiveSnapshot(passage, questions)
        : prepareSnapshot(passage, questions);
      const check = gradeSnapshot(snapshot, {}) as {
        correctAnswersMap?: Record<string, { correctAnswer?: unknown }>;
        answersMap?: Record<string, { correctAnswer?: unknown }>;
      };
      if (
        !legacyReview &&
        Object.values(check.correctAnswersMap || check.answersMap || {}).some(
          (entry) =>
            entry.correctAnswer == null ||
            !String(entry.correctAnswer).trim() ||
            entry.correctAnswer === '—'
        )
      )
        throw new Error('The original answer key needs review');
      attempt = body.sessionId && !legacyReview ? await state('load', { snapshot }) : null;
      if (attempt) snapshot = attempt.snapshot;
    }
    if (['save', 'submit'].includes(body.action)) {
      if (!attempt) throw new Error('Start this test before submitting');
      validateAnswers(body.answers);
      if (!attempt.completed_at)
        attempt = await state(body.action, {
          answers: body.answers,
          result: body.action === 'submit' ? gradeSnapshot(snapshot, body.answers) : undefined,
          metadata: body.metadata || {},
          expected_revision: body.expectedRevision,
          request_id: body.requestId,
        });
    }
    const safe = withoutSolutions(snapshot);
    if (snapshot.testData.test_type === 'reading') safe.testData.content = '';
    return reply({
      snapshot: attempt?.completed_at || legacyReview ? snapshot : safe,
      result: attempt?.result || null,
      answers: attempt?.answers || null,
      revision: attempt?.revision ?? 0,
      completedNow: attempt?.completed_now === true,
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('This test changed in another tab'))
      return reply(
        {
          error:
            'This test changed in another tab. Keep a copy of your current answers, then reload the saved test.',
          code: 'revision_conflict',
        },
        409
      );
    return reply(
      {
        error:
          'This test could not be loaded or saved. Your existing answers have not been changed.',
      },
      409
    );
  }
});
