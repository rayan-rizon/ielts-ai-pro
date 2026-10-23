import { getAdmittedUser, withTextAiAdmission } from '../_shared/aiAdmission.ts';
// @ts-ignore Deno runtime imports
import { createClient } from 'npm:@supabase/supabase-js@2.112.3';
import { getCorsHeaders, handleCorsPrelight, validateCsrfProtection } from '../_shared/security.ts';
import {
  requestOpenRouterJson,
  requestOpenRouterJsonStream,
  TextAiProviderError,
} from '../_shared/textAiProvider.ts';
import {
  AI_COACH_MAX_INPUT_TOKENS,
  asksForPersonalEvidence,
  claimNumbers,
  mergeCoachMemory,
  normalizeCoachMemoryNotes,
  detectCoachLanguage,
  estimateCoachInputTokens,
  groundedCoachSystemPrompt,
  isCoachLanguage,
  normalizeCoachFollowUps,
  safeCoachFallbackReply,
  validateCoachReply,
  validateCoachSendBody,
} from '../_shared/aiCoach.ts';
import {
  AI_COACH_FALLBACK_MODEL,
  AI_COACH_MAX_OUTPUT_TOKENS,
  AI_COACH_PRIMARY_MODEL,
} from '../_shared/aiModelRegistry.ts';
import { buildLearnerEvidence } from '../_shared/learnerEvidence.ts';
import {
  buildSourceDigest,
  buildSourcePreview,
  shrinkSourceDigest,
  sourceNeedsQuestionRows,
} from '../_shared/coachSourceDigest.ts';
import { CoachAnswerStreamer } from '../_shared/coachStream.ts';

declare const Deno: any;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_ROUTES = new Set([
  '/reading',
  '/writing',
  '/listening',
  '/speaking',
  '/grammar',
  '/vocabulary',
  '/practice-lab',
  '/learning-path',
  '/dashboard',
  '/analytics',
]);

const response = (data: unknown, status: number, headers: Record<string, string>) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const billedCost = (error: unknown) =>
  error instanceof TextAiProviderError ? error.usage?.estimatedProviderCostUsd || 0 : 0;
const billedTokens = (error: unknown) =>
  error instanceof TextAiProviderError ? error.usage?.tokensUsed || 0 : 0;
const hasKnownBilledCost = (error: unknown) =>
  error instanceof TextAiProviderError && typeof error.usage?.estimatedProviderCostUsd === 'number';

function databaseStatus(message: string) {
  if (/not available yet|taking a break/i.test(message)) return 503;
  if (/reset|already being prepared/i.test(message)) return 429;
  if (/not found|identifier/i.test(message)) return 403;
  return 400;
}

function validateActions(actions: any[], context: any, message: string) {
  const eligibleRoutes = new Set(
    (context.eligibleActions || [])
      .filter((action: any) => action.type === 'navigate')
      .map((action: any) => action.payload.route)
  );
  const activityIds = new Set(
    (context.eligibleActions || [])
      .filter((a: any) => a.type === 'reschedule_activity')
      .map((a: any) => a.payload.activityId)
  );
  return actions.filter((action: any) => {
    if (action.type === 'navigate')
      return (
        SAFE_ROUTES.has(String(action.payload?.route || '')) &&
        eligibleRoutes.has(action.payload?.route)
      );
    if (action.type === 'reschedule_activity')
      return (
        activityIds.has(action.payload?.activityId) &&
        /^\d{4}-\d{2}-\d{2}$/.test(String(action.payload?.scheduledDate || ''))
      );
    if (action.type === 'save_vocabulary')
      return (
        /\b(save|remember|add)\b/i.test(message) &&
        typeof action.payload?.word === 'string' &&
        /^[A-Za-z][A-Za-z '\-]{0,59}$/.test(action.payload.word) &&
        typeof action.payload?.definition === 'string' &&
        action.payload.definition.length <= 500
      );
    return false;
  });
}

const EVIDENCE_SKILL_LABELS: Record<string, string> = {
  matching_features: 'Matching Features',
  notes_completion: 'Notes Completion',
  yes_no_not_given: 'Yes/No/Not Given',
  true_false_not_given: 'True/False/Not Given',
};

function evidenceLabel(value: unknown) {
  const original = String(value || 'Learning evidence').trim();
  const raw = original.replace(/[_:]+/g, ' ');
  const skill = original.match(
    /^(reading|writing|listening|speaking|grammar|vocabulary)[_:](.+)$/i
  );
  if (skill) {
    const module = skill[1][0].toUpperCase() + skill[1].slice(1).toLowerCase();
    const skillKey = skill[2].trim().toLowerCase().replace(/\s+/g, '_');
    const name =
      EVIDENCE_SKILL_LABELS[skillKey] ||
      skill[2].trim().replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
    return `${module} · ${name}`;
  }
  return raw.replace(/\b[a-z]/g, (letter) => letter.toUpperCase()).replace(/\bIelts\b/g, 'IELTS');
}

function evidenceDate(value: unknown) {
  if (typeof value !== 'string' || !value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function evidenceClaim(item: any) {
  const label = evidenceLabel(item?.label);
  const value = item?.value && typeof item.value === 'object' ? item.value : {};
  const details: string[] = [];

  const hasNumber = (number: unknown) =>
    number != null && number !== '' && Number.isFinite(Number(number));
  if (item?.category === 'completed_result') {
    if (hasNumber(value.score)) details.push(`score ${Number(value.score)}`);
    if (typeof value.mode === 'string' && value.mode.trim())
      details.push(`${evidenceLabel(value.mode)} mode`);
    const completed = evidenceDate(value.completedAt);
    if (completed) details.push(`completed ${completed}`);
  } else if (item?.category === 'measured_skill' || item?.category === 'early_skill') {
    const mastery = Number(value.mastery);
    if (hasNumber(value.mastery)) {
      const percent = mastery <= 1 ? Math.round(mastery * 100) : Math.round(mastery);
      details.push(
        `${item.category === 'early_skill' ? 'early signal' : 'mastery estimate'} ${percent}%`
      );
    }
    if (hasNumber(value.observations))
      details.push(`${Number(value.observations).toLocaleString('en-US')} practice records`);
  } else if (item?.category === 'comparable_trend') {
    for (const key of ['latest', 'previous', 'delta']) {
      if (hasNumber(value[key]))
        details.push(
          `${key} ${key === 'delta' && Number(value[key]) > 0 ? '+' : ''}${Number(value[key])}`
        );
    }
  } else if (item?.category === 'grammar_practice') {
    if (hasNumber(value.correct) && hasNumber(value.total))
      details.push(`${Number(value.correct)} of ${Number(value.total)} correct`);
    const completed = evidenceDate(item?.observedAt);
    if (completed) details.push(`completed ${completed}`);
  } else if (item?.category === 'coach_practice') {
    if (hasNumber(value.correct) && hasNumber(value.total))
      details.push(`${Number(value.correct)} of ${Number(value.total)} first-try correct`);
    details.push('chat practice, not an official result');
  } else if (item?.category === 'goal') {
    if (typeof item.value === 'number' || typeof item.value === 'string') {
      details.push(
        item.label === 'IELTS test date'
          ? evidenceDate(item.value) || String(item.value)
          : String(item.value)
      );
    } else if (hasNumber(value.weeklyHours)) {
      details.push(`${Number(value.weeklyHours)} hours per week`);
    }
  }

  return [label, ...details].filter(Boolean).join(' · ').slice(0, 180);
}

/**
 * The completed result a learner attached to a question, plus its structured digest.
 * Throws the same learner-facing errors as before for unfinished, exam-mode or foreign
 * sessions. Reading and Listening also pull the reviewed answer key so Ava can explain a
 * specific question; that read is best-effort and the digest degrades without it.
 */
async function loadSource(admin: any, profile: any, sourceReference: any) {
  if (sourceReference?.type !== 'test_session') return { sourceSession: null, digest: null };
  const { data: sourceSession } = await admin
    .from('test_sessions')
    .select(
      'id,test_type,test_mode,score,band_score,is_completed,content_data,evaluation_status,passage_id,user_responses,actual_duration_seconds'
    )
    .eq('id', sourceReference.id)
    .eq('user_id', profile.id)
    .maybeSingle();
  if (!sourceSession) throw new Error('That completed result could not be loaded.');
  if (!sourceSession.is_completed) {
    if (['mock', 'exam'].includes(String(sourceSession.test_mode || '').toLowerCase()))
      throw new Error('AI Coach cannot help with answers during an unfinished Exam-mode test.');
    throw new Error('AI Coach can attach only completed results.');
  }
  let questions: any[] = [];
  if (sourceNeedsQuestionRows(sourceSession) && sourceSession.passage_id) {
    const { data } = await admin
      .from('questions')
      .select(
        'question_number,question_count,question_text,group_instructions,type,options,explanation,explanation_data'
      )
      .eq('passage_id', sourceSession.passage_id)
      .order('question_number')
      .limit(80);
    questions = data || [];
  }
  const digest = buildSourceDigest({
    session: sourceSession,
    questions,
    focusQuestion: sourceReference.questionNumber ?? null,
  });
  return { sourceSession, digest };
}

function liveMemory(items: unknown) {
  return mergeCoachMemory(items, []);
}

async function loadContext(admin: any, profile: any, authId: string, sourceReference: any) {
  const cutoff = new Date(Date.now() - 90 * 86400000).toISOString();
  const requests: any[] = [
    admin
      .from('test_sessions')
      .select(
        'id,test_type,test_mode,score,band_score,completed_at,is_completed,content_data,evaluation_status,evaluation_version'
      )
      .eq('user_id', profile.id)
      .eq('is_completed', true)
      .gte('completed_at', cutoff)
      .order('completed_at', { ascending: false })
      .limit(20),
    admin
      .from('skill_proficiency')
      .select(
        'skill_code,module,mastery_probability,confidence_level,practice_count,correct_count,last_practiced_at,next_review_at,evidence_version'
      )
      .eq('user_id', profile.id)
      .limit(80),
    admin
      .from('grammar_attempts')
      .select('id,target_skills,total_questions,correct_count,completed_at,updated_at')
      .eq('user_id', profile.id)
      .eq('completion_state', 'completed')
      .order('completed_at', { ascending: false })
      .limit(5),
    admin
      .from('vocabulary_items')
      .select('id,next_review_date')
      .eq('user_id', profile.id)
      .limit(200),
    admin
      .from('vocabulary_review_events')
      .select('quality,reviewed_at')
      .eq('user_id', profile.id)
      .gte('reviewed_at', cutoff)
      .order('reviewed_at', { ascending: false })
      .limit(100),
    admin
      .from('learning_path_activities')
      .select('id,title,module,activity_type,skill_targets,scheduled_date,is_completed')
      .eq('user_id', profile.id)
      .eq('is_completed', false)
      .order('scheduled_date', { ascending: true, nullsFirst: false })
      .limit(10),
  ];
  const [results, source, practice, memory] = await Promise.all([
    Promise.all(requests),
    loadSource(admin, profile, sourceReference),
    // Both are best-effort: a missing migration or a transient error must never block a reply.
    Promise.resolve(admin.rpc('ai_coach_practice_summary', { p_auth: authId })).catch(() => ({
      data: null,
    })),
    Promise.resolve(
      admin.from('ai_coach_memory').select('items').eq('user_id', profile.id).maybeSingle()
    ).catch(() => ({ data: null })),
  ]);
  const failed = results.find((item: any) => item.error);
  if (failed) throw new Error('Your latest learning data could not be loaded. Please try again.');
  const context = buildLearnerEvidence({
    profile,
    sessions: results[0].data,
    skills: results[1].data,
    grammarAttempts: results[2].data,
    vocabularyItems: results[3].data,
    vocabularyReviews: results[4].data,
    activities: results[5].data,
    sourceSession: source.sourceSession,
    sourceDigest: source.digest,
    coachPractice: practice?.data || null,
  });
  if (sourceReference?.type === 'test_session' && !context.source)
    throw new Error('That result does not have a valid finalized score yet.');
  return { ...context, memory: liveMemory(memory?.data?.items) };
}

async function handleBootstrap(admin: any, authId: string) {
  const { data: profile } = await admin
    .rpc('get_institution_learner_profile', { p_auth: authId })
    .select('id,subscription_tier,subscription_end_date')
    .eq('auth_id', authId)
    .single();
  if (!profile) throw new Error('Account unavailable');
  const retentionCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { error: retentionError } = await admin
    .from('ai_coach_conversations')
    .delete()
    .eq('user_id', profile.id)
    .lt('last_message_at', retentionCutoff);
  if (retentionError)
    throw new Error('Saved conversations could not be prepared. Please try again.');
  const [{ data: status, error: statusError }, { data: preferences }, { data: conversations }] =
    await Promise.all([
      admin.rpc('ai_coach_status', { p_auth: authId }),
      admin
        .from('ai_coach_preferences')
        .select('explanation_language')
        .eq('user_id', profile.id)
        .maybeSingle(),
      admin
        .from('ai_coach_conversations')
        .select('id,title,explanation_language,last_message_at')
        .eq('user_id', profile.id)
        .order('last_message_at', { ascending: false })
        .limit(20),
    ]);
  if (statusError) throw statusError;
  // Best-effort: the memory table ships in a separate migration, and its absence must not
  // stop the coach from loading.
  const { data: memory } = await Promise.resolve(
    admin.from('ai_coach_memory').select('items').eq('user_id', profile.id).maybeSingle()
  ).catch(() => ({ data: null }));
  return {
    status,
    preferredLanguage: preferences?.explanation_language || 'en',
    conversations: conversations || [],
    memory: liveMemory(memory?.items).map((item) => item.text),
  };
}

async function learnerProfile(admin: any, authId: string) {
  const { data: profile } = await admin
    .rpc('get_institution_learner_profile', { p_auth: authId })
    .select('id')
    .eq('auth_id', authId)
    .maybeSingle();
  if (!profile) throw new Error('Account unavailable');
  return profile;
}

/** A deterministic, AI-free summary of one completed result, plus questions worth asking. */
async function handleSourcePreview(admin: any, authId: string, body: any) {
  if (!UUID.test(String(body.sessionId || ''))) throw new Error('Invalid source reference');
  const profile = await learnerProfile(admin, authId);
  const { digest } = await loadSource(admin, profile, {
    type: 'test_session',
    id: body.sessionId,
    questionNumber: null,
  });
  return { preview: buildSourcePreview(digest) };
}

async function handleMemoryForget(admin: any, authId: string, body: any) {
  const profile = await learnerProfile(admin, authId);
  const { data } = await admin
    .from('ai_coach_memory')
    .select('items')
    .eq('user_id', profile.id)
    .maybeSingle();
  const items = liveMemory(data?.items);
  const index = Number(body.index);
  const next = body.all === true ? [] : items.filter((_item, position) => position !== index);
  const { error } = await admin
    .from('ai_coach_memory')
    .upsert({ user_id: profile.id, items: next, updated_at: new Date().toISOString() });
  if (error) throw error;
  return { memory: next.map((item) => item.text) };
}

async function handleHistory(admin: any, authId: string, body: any) {
  if (!UUID.test(String(body.conversationId || ''))) throw new Error('Invalid conversation');
  const { data: profile } = await admin
    .rpc('get_institution_learner_profile', { p_auth: authId })
    .select('id')
    .eq('auth_id', authId)
    .single();
  const { data: conversation } = await admin
    .from('ai_coach_conversations')
    .select('id,title,explanation_language')
    .eq('id', body.conversationId)
    .eq('user_id', profile?.id)
    .maybeSingle();
  if (!conversation) throw new Error('Conversation not found');
  const before = body.before ? new Date(body.before).toISOString() : new Date().toISOString();
  const { data, error } = await admin
    .from('ai_coach_messages')
    .select(
      'id,role,content,response_language,evidence_refs,exercise,actions,follow_ups,created_at'
    )
    .eq('conversation_id', conversation.id)
    .eq('user_id', profile.id)
    .lt('created_at', before)
    .order('created_at', { ascending: false })
    // Both messages in one coach turn can share Postgres' transaction timestamp.
    // Role is the deterministic tie-breaker so reversing this page keeps the
    // learner question before Ava's answer.
    .order('role', { ascending: true })
    .limit(20);
  if (error) throw error;
  return {
    conversation,
    messages: (data || []).reverse(),
    nextBefore: data?.length === 20 ? data[data.length - 1].created_at : null,
  };
}

async function handleConfirm(admin: any, authId: string, body: any) {
  if (!UUID.test(String(body.proposalId || ''))) throw new Error('Invalid action');
  const { data: profile } = await admin
    .rpc('get_institution_learner_profile', { p_auth: authId })
    .select('id,subscription_tier,subscription_end_date')
    .eq('auth_id', authId)
    .single();
  const { data: proposal, error: claimError } = await admin.rpc('ai_coach_claim_action', {
    p_auth: authId,
    p_proposal_id: body.proposalId,
  });
  if (claimError) throw new Error(claimError.message);
  if (proposal?.status === 'confirmed')
    return {
      status: 'confirmed',
      action: proposal.action_type,
      payload: proposal.payload,
      replayed: true,
    };
  if (!proposal || proposal.status !== 'executing' || proposal.replayed)
    throw new Error('This action is already being handled.');
  let payload = proposal.payload;
  try {
    if (proposal.action_type === 'navigate') {
      if (!SAFE_ROUTES.has(String(payload?.route || '')))
        throw new Error('That destination is unavailable');
      const subscriptionActive =
        !profile.subscription_end_date || new Date(profile.subscription_end_date) > new Date();
      if (
        payload.route === '/learning-path' &&
        !(subscriptionActive && ['pro', 'premium'].includes(profile.subscription_tier))
      )
        throw new Error('Your current plan does not include AI Learning Path.');
      const { data: link, error } = await admin
        .from('ai_coach_activity_links')
        .insert({
          user_id: profile.id,
          conversation_id: proposal.conversation_id,
          proposal_id: proposal.id,
          route: payload.route,
        })
        .select('id')
        .single();
      if (error) throw error;
      payload = { ...payload, coachActivityLinkId: link.id };
    } else if (proposal.action_type === 'save_vocabulary') {
      const word = String(payload?.word || '').trim();
      const { data: existing } = await admin
        .from('vocabulary_items')
        .select('id')
        .eq('user_id', profile.id)
        .ilike('word', word)
        .limit(1)
        .maybeSingle();
      if (existing) payload = { ...payload, vocabularyItemId: existing.id, duplicate: true };
      else {
        const { count } = await admin
          .from('vocabulary_items')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profile.id);
        const subscriptionActive =
          !profile.subscription_end_date || new Date(profile.subscription_end_date) > new Date();
        const tier = subscriptionActive ? profile.subscription_tier : 'free';
        const itemLimit = tier === 'premium' ? Infinity : tier === 'pro' ? 300 : 100;
        if ((count || 0) >= itemLimit)
          throw new Error('Your Vocabulary list is full for your current plan.');
        const { data: item, error } = await admin
          .from('vocabulary_items')
          .insert({
            user_id: profile.id,
            created_by: profile.id,
            word,
            definition: String(payload.definition || '').slice(0, 500),
            example: String(payload.example || '').slice(0, 500) || null,
            source: 'ai_coach',
          })
          .select('id')
          .single();
        if (error) throw error;
        payload = { ...payload, vocabularyItemId: item.id };
      }
    } else if (proposal.action_type === 'reschedule_activity') {
      const { data: activity } = await admin
        .from('learning_path_activities')
        .select('id,user_id,is_completed')
        .eq('id', payload?.activityId)
        .eq('user_id', profile.id)
        .maybeSingle();
      if (!activity || activity.is_completed)
        throw new Error('That activity is no longer available');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(payload?.scheduledDate || '')))
        throw new Error('Choose a valid study date');
      // The authenticated client executes the existing security-invoker RPC so its
      // availability and daily-capacity rules run under the learner's own JWT.
      payload = { ...payload, requiresClientExecution: true };
    }
  } catch (error) {
    await admin
      .from('ai_coach_action_proposals')
      .update({ status: 'failed' })
      .eq('id', proposal.id)
      .eq('status', 'executing');
    throw error;
  }
  await admin
    .from('ai_coach_action_proposals')
    .update({ status: 'confirmed', payload, executed_at: new Date().toISOString() })
    .eq('id', proposal.id)
    .eq('status', 'executing');
  return { status: 'confirmed', action: proposal.action_type, payload };
}

const handleRequest = async (req: Request) => {
  const headers = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return handleCorsPrelight(req);
  if (req.method !== 'POST') return response({ error: 'Use POST' }, 405, headers);
  if (!validateCsrfProtection(req).valid)
    return response({ error: 'Request origin is not allowed' }, 403, headers);
  if (Number(req.headers.get('content-length') || 0) > 32_768)
    return response({ error: 'Request too large' }, 413, headers);
  const admin = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    { auth: { persistSession: false } }
  );
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return response({ error: 'Please sign in' }, 401, headers);
  const {
    data: { user: authUser },
    error: authError,
  } = getAdmittedUser(req)
    ? { data: { user: getAdmittedUser(req) }, error: null }
    : await admin.auth.getUser(token);
  if (authError || !authUser) return response({ error: 'Please sign in' }, 401, headers);
  let body: any;
  try {
    const raw = await req.text();
    if (raw.length > 32_768) throw new Error();
    body = JSON.parse(raw);
  } catch {
    return response({ error: 'Invalid request body' }, 400, headers);
  }

  const chargedAttempts: unknown[] = [];
  let providerAttempted = false;
  let providerCallCount = 0;

  /** Close a reserved operation as failed, charging whatever the provider billed. */
  const recordFailure = async (requestBody: any, error: unknown) => {
    const requestId = String(requestBody?.requestId || '');
    if (!UUID.test(requestId)) return;
    const attempts = chargedAttempts.includes(error)
      ? [...chargedAttempts]
      : [...chargedAttempts, error];
    const cost = attempts.reduce<number>((total, item) => total + billedCost(item), 0);
    const tokens = attempts.reduce<number>((total, item) => total + billedTokens(item), 0);
    const unknownProviderCost =
      providerAttempted && attempts.filter(hasKnownBilledCost).length < providerCallCount;
    await admin.rpc('ai_coach_finish', {
      p_operation_id: requestId,
      p_user_message: '',
      p_response: null,
      p_cost: unknownProviderCost ? null : cost,
      p_tokens: tokens,
      p_model: '',
      p_latency: 0,
      p_ok: false,
    });
  };
  try {
    if (body.operation === 'bootstrap')
      return response(await handleBootstrap(admin, authUser.id), 200, headers);
    if (body.operation === 'history')
      return response(await handleHistory(admin, authUser.id, body), 200, headers);
    if (body.operation === 'confirm_action')
      return response(await handleConfirm(admin, authUser.id, body), 200, headers);
    if (body.operation === 'source_preview')
      return response(await handleSourcePreview(admin, authUser.id, body), 200, headers);
    if (body.operation === 'memory_forget')
      return response(await handleMemoryForget(admin, authUser.id, body), 200, headers);
    if (body.operation === 'check_exercise') {
      if (!UUID.test(String(body.messageId || '')) || !Number.isInteger(body.selectedIndex))
        throw new Error('Invalid exercise answer');
      const { data, error } = await admin.rpc('ai_coach_check_exercise', {
        p_auth: authUser.id,
        p_message_id: body.messageId,
        p_selected_index: body.selectedIndex,
      });
      if (error) throw new Error(error.message);
      return response(data, 200, headers);
    }
    if (body.operation === 'save_preferences') {
      if (!isCoachLanguage(body.explanationLanguage))
        throw new Error('Unsupported explanation language');
      const { data: profile } = await admin
        .rpc('get_institution_learner_profile', { p_auth: authUser.id })
        .select('id')
        .eq('auth_id', authUser.id)
        .maybeSingle();
      if (!profile) throw new Error('Account unavailable');
      const { error } = await admin
        .from('ai_coach_preferences')
        .upsert({ user_id: profile.id, explanation_language: body.explanationLanguage });
      if (error) throw error;
      return response({ explanationLanguage: body.explanationLanguage }, 200, headers);
    }
    if (body.operation === 'delete_conversation') {
      if (!UUID.test(String(body.conversationId || ''))) throw new Error('Invalid conversation');
      const { data: profile } = await admin
        .rpc('get_institution_learner_profile', { p_auth: authUser.id })
        .select('id')
        .eq('auth_id', authUser.id)
        .maybeSingle();
      if (!profile) throw new Error('Account unavailable');
      const { error } = await admin
        .from('ai_coach_conversations')
        .delete()
        .eq('id', body.conversationId)
        .eq('user_id', profile.id);
      if (error) throw error;
      return response({ deleted: true }, 200, headers);
    }

    const input = validateCoachSendBody(body);
    const { data: profile, error: profileError } = await admin
      .rpc('get_institution_learner_profile', { p_auth: authUser.id })
      .select(
        'id,role,subscription_tier,subscription_end_date,target_band_score,test_date,study_hours_goal,study_availability,exam_type,updated_at'
      )
      .eq('auth_id', authUser.id)
      .single();
    if (profileError || !profile) throw new Error('Account unavailable');
    const { data: preference } = await admin
      .from('ai_coach_preferences')
      .select('explanation_language')
      .eq('user_id', profile.id)
      .maybeSingle();
    const preferred = isCoachLanguage(preference?.explanation_language)
      ? preference.explanation_language
      : input.preferredLanguage;
    // Messages the app wrote itself (suggestion chips, "Ask Ava" drafts) are English
    // whatever the learner reads, so they follow the saved language instead of the wording.
    const detected =
      input.languageHint === 'preference'
        ? { language: preferred, source: 'preference' as const, ambiguous: false }
        : detectCoachLanguage(input.message, preferred);
    if ('unsupportedLanguage' in detected) {
      return response(
        {
          error: `${detected.unsupportedLanguage} is not supported yet. Ava currently supports English, Bangla, Hindi, Urdu, Arabic, Nepali, Simplified Chinese, Vietnamese, Spanish, and Turkish.`,
          code: 'unsupported_language',
        },
        422,
        headers
      );
    }
    const language = detected.language;
    const { data: reservation, error: reserveError } = await admin.rpc('ai_coach_reserve', {
      p_auth: authUser.id,
      p_operation_id: input.requestId,
      p_conversation_id: input.conversationId,
      p_language: language,
    });
    if (reserveError)
      return response(
        { error: reserveError.message },
        databaseStatus(reserveError.message),
        headers
      );
    if (reservation.state === 'complete') {
      const { data: currentStatus } = await admin.rpc('ai_coach_status', {
        p_auth: authUser.id,
      });
      return response(
        {
          ...reservation.response,
          remainingDailyReplies: currentStatus?.remainingDailyReplies,
          quotaResetsAt: currentStatus?.quotaResetsAt,
          replayed: true,
        },
        200,
        headers
      );
    }
    if (reservation.state !== 'reserved') throw new Error('This request could not be completed');

    const context = await loadContext(admin, profile, authUser.id, input.sourceReference);
    if (/\b(save|remember|add)\b/i.test(input.message)) {
      context.eligibleActions.push({
        type: 'save_vocabulary',
        label: 'Save a confirmed word to Vocabulary',
        payload: {
          word: 'English word from this request',
          definition: 'Short verified definition',
          example: 'Optional IELTS example',
        },
      });
    }
    const { data: history } = await admin
      .from('ai_coach_messages')
      .select('role,content,follow_ups')
      .eq('conversation_id', reservation.conversationId)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .order('role', { ascending: true })
      .limit(8);
    const systemPrompt = groundedCoachSystemPrompt(language);
    // Key order is deliberate. Providers cache a prompt by its longest unchanged prefix, so
    // the parts that rarely change between turns (evidence, source, memory, actions) come
    // first and the parts that change every turn (history, language decision, the new
    // message) come last.
    const promptData: any = {
      studentEvidence: context.evidence,
      evidenceConfidence: context.evidenceConfidence,
      source: context.source,
      learnerMemory: context.memory.map((item: any) => item.text),
      eligibleActions: context.eligibleActions,
      recentConversation: [...(history || [])].reverse().map(({ role, content }: any) => ({
        role,
        content,
      })),
      recentSuggestedQuestions: (history || [])
        .flatMap((item: any) => item.follow_ups || [])
        .slice(0, 9),
      languageDecision: detected,
      studentMessage: input.message,
    };
    let prompt = JSON.stringify(promptData);
    const inputTokens = () => estimateCoachInputTokens(`${systemPrompt}\n${prompt}`);
    while (inputTokens() > AI_COACH_MAX_INPUT_TOKENS && promptData.recentConversation.length) {
      promptData.recentConversation.shift();
      prompt = JSON.stringify(promptData);
    }
    for (const level of [1, 2] as const) {
      if (inputTokens() > AI_COACH_MAX_INPUT_TOKENS && promptData.source?.digest) {
        promptData.source = {
          ...promptData.source,
          digest: shrinkSourceDigest(context.source?.digest, level),
        };
        prompt = JSON.stringify(promptData);
      }
    }
    while (inputTokens() > AI_COACH_MAX_INPUT_TOKENS && promptData.learnerMemory.length) {
      promptData.learnerMemory.pop();
      prompt = JSON.stringify(promptData);
    }
    while (inputTokens() > AI_COACH_MAX_INPUT_TOKENS && promptData.studentEvidence.length > 4) {
      promptData.studentEvidence.pop();
      prompt = JSON.stringify(promptData);
    }
    if (inputTokens() > AI_COACH_MAX_INPUT_TOKENS)
      throw new Error('This request has too much context. Please ask a shorter question.');
    const evidenceById = new Map(
      context.evidence.map((item: any) => [item.id, item] as [string, any])
    );
    if (context.source)
      evidenceById.set(`source:${context.source.id}`, {
        category: 'completed_result',
        label: `${context.source.testType} completed result`,
        // The digest rides along so a numeric detail Ava quotes from it, a question
        // number or a corrected answer, still counts as present in the cited evidence.
        value: {
          score: context.source.score,
          mode: context.source.testMode,
          digest: context.source.digest,
        },
      });
    const evidenceIds = new Set(evidenceById.keys());
    const personalQuestion = asksForPersonalEvidence(input.message);
    const requiresEvidence = personalQuestion && evidenceIds.size > 0;
    const validate = (value: any) => {
      if (value && typeof value === 'object')
        value.followUps = normalizeCoachFollowUps(value.followUps, [
          input.message,
          ...(history || [])
            .filter((item: any) => item.role === 'user')
            .map((item: any) => item.content),
          ...(history || []).flatMap((item: any) => item.follow_ups || []),
        ]);
      if (!validateCoachReply(value, evidenceIds) || value.responseLanguage !== language)
        return false;
      if (
        requiresEvidence &&
        (value.groundingStatus !== 'supported' || value.evidenceRefs.length === 0)
      )
        return false;
      if (requiresEvidence) {
        const citedText = value.evidenceRefs
          .map((ref: any) => JSON.stringify(evidenceById.get(ref.id) || {}))
          .join(' ');
        const answerNumbers = claimNumbers(value.answer, input.message);
        if (answerNumbers.some((number: string) => !citedText.includes(number))) return false;
      }
      // Never trust model-supplied citation wording. Convert all valid references,
      // including references on general questions, to concise source-derived text.
      value.evidenceRefs = value.evidenceRefs.map((ref: any) => ({
        id: ref.id,
        claim: evidenceClaim(evidenceById.get(ref.id)),
      }));
      if (
        personalQuestion &&
        evidenceIds.size === 0 &&
        (value.groundingStatus !== 'insufficient' ||
          value.evidenceRefs.length > 0 ||
          /\b(?:band|score)\s*[0-9](?:\.[05])?\b/i.test(value.answer))
      )
        return false;
      value.actions = validateActions(value.actions, context, input.message);
      value.memory = normalizeCoachMemoryNotes(value.memory) ?? [];
      return true;
    };

    /**
     * One validated reply: primary model, then one fallback, then an honest error.
     * `emit` is set for streaming requests; the primary call then streams the answer
     * through the sentence-level gate in coachStream.ts. The fallback is never streamed.
     */
    const produce = async (emit?: (event: string, data: unknown) => void) => {
      const apiKey = Deno.env.get('OPENROUTER_API_KEY');
      if (!apiKey) throw new Error('AI Coach provider is not configured');
      const started = Date.now();
      const streamer = emit
        ? new CoachAnswerStreamer(
            { language, evidenceById, personalQuestion, studentMessage: input.message },
            (text) => emit('delta', { text })
          )
        : null;
      let generated: any;
      try {
        providerAttempted = true;
        providerCallCount += 1;
        const primary = {
          apiKey,
          model: AI_COACH_PRIMARY_MODEL,
          prompt,
          systemPrompt,
          maxOutputTokens: AI_COACH_MAX_OUTPUT_TOKENS,
          timeoutMs: 10_000,
          includeUsageAccounting: true,
          disableReasoning: true,
          reasoningEffort: 'low' as const,
          temperature: 0.1,
          validateJson: validate,
        };
        generated = streamer
          ? await requestOpenRouterJsonStream({ ...primary, onText: (text) => streamer.push(text) })
          : await requestOpenRouterJson(primary);
      } catch (error) {
        chargedAttempts.push(error);
        // Whatever was streamed is superseded by the fallback or by an error.
        if (streamer?.emitted) emit?.('reset', {});
        const remainingMs = 20_000 - (Date.now() - started);
        if (remainingMs < 1_000) throw error;
        providerCallCount += 1;
        try {
          generated = await requestOpenRouterJson({
            apiKey,
            model: AI_COACH_FALLBACK_MODEL,
            prompt,
            systemPrompt,
            maxOutputTokens: AI_COACH_MAX_OUTPUT_TOKENS,
            timeoutMs: remainingMs,
            includeUsageAccounting: true,
            disableReasoning: true,
            reasoningEffort: 'none',
            validateJson: validate,
          });
        } catch (fallbackError) {
          chargedAttempts.push(fallbackError);
          // A canned sentence that spends one of the learner's daily replies helps no one.
          // Say what happened; the failed operation does not count toward the quota.
          throw new Error(
            'Ava could not verify an answer to that. Please rephrase or ask something more specific. This did not use one of your daily replies.'
          );
        }
      }
      const memoryNotes = normalizeCoachMemoryNotes(generated.parsed.memory) ?? [];
      delete generated.parsed.memory;
      generated.parsed.actions = validateActions(generated.parsed.actions, context, input.message);
      const failedAttemptCost = chargedAttempts.reduce<number>(
        (total, attempt) => total + billedCost(attempt),
        0
      );
      const measuredCost = generated.usage.estimatedProviderCostUsd + failedAttemptCost;
      const hasUnknownAttemptCost = chargedAttempts.some((attempt) => !hasKnownBilledCost(attempt));
      const cost = hasUnknownAttemptCost
        ? Math.max(Number(reservation.reservedCostUsd || 0), measuredCost)
        : measuredCost;
      const tokens =
        generated.usage.tokensUsed +
        chargedAttempts.reduce<number>((total, attempt) => total + billedTokens(attempt), 0);
      const { data: final, error: finishError } = await admin.rpc('ai_coach_finish', {
        p_operation_id: input.requestId,
        p_user_message: input.message,
        p_response: generated.parsed,
        p_cost: cost,
        p_tokens: tokens,
        p_model: generated.model,
        p_latency: Date.now() - started,
        p_ok: true,
      });
      if (finishError) throw finishError;
      await admin.from('ai_api_usage').insert({
        user_id: profile.id,
        endpoint: 'ai-coach',
        tokens_used: tokens,
        cached: false,
        request_metadata: {
          model: generated.model,
          responseLanguage: language,
          reservationStatus: 'completed',
          estimatedProviderCostUsd: cost,
          cachedPromptTokens: generated.usage.cachedPromptTokens,
          promptTokens: generated.usage.promptTokens,
          fallbackUsed: chargedAttempts.length > 0,
          streamed: Boolean(streamer?.emitted),
          budgetWarning: Boolean(reservation.budgetWarning),
          latencyMs: Date.now() - started,
        },
      });
      if (memoryNotes.length) await rememberAboutLearner(admin, profile.id, memoryNotes);
      return {
        ...final,
        remainingDailyReplies: reservation.remainingDailyReplies,
        quotaResetsAt: reservation.quotaResetsAt,
      };
    };

    if (input.stream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const send = (event: string, data: unknown) => {
            try {
              controller.enqueue(
                encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
              );
            } catch {
              // The learner disconnected. Generation still finishes so billing stays accurate.
            }
          };
          try {
            send('final', await produce(send));
          } catch (error) {
            await recordFailure(body, error);
            const message = errorMessage(error);
            send('error', { error: message, status: errorStatus(message) });
          } finally {
            try {
              controller.close();
            } catch {
              // Already closed by a disconnect.
            }
          }
        },
      });
      return new Response(stream, {
        status: 200,
        headers: {
          ...headers,
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-store, no-transform',
          'X-Accel-Buffering': 'no',
        },
      });
    }
    return response(await produce(), 200, headers);
  } catch (error) {
    await recordFailure(body, error);
    const message = errorMessage(error);
    return response({ error: message }, errorStatus(message), headers);
  }
};

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'AI Coach is temporarily unavailable';
const errorStatus = (message: string) =>
  /could not verify an answer/i.test(message) ? 502 : databaseStatus(message);

/** Merge new learner-stated facts into stored memory. Memory is a convenience, never a blocker. */
async function rememberAboutLearner(admin: any, userId: string, notes: string[]) {
  try {
    const { data } = await admin
      .from('ai_coach_memory')
      .select('items')
      .eq('user_id', userId)
      .maybeSingle();
    await admin.from('ai_coach_memory').upsert({
      user_id: userId,
      items: mergeCoachMemory(data?.items, notes),
      updated_at: new Date().toISOString(),
    });
  } catch {
    console.warn('AI Coach memory could not be saved');
  }
}

Deno.serve(
  withTextAiAdmission('ai-coach', handleRequest, [
    'bootstrap',
    'history',
    'confirm_action',
    'check_exercise',
    'save_preferences',
    'source_preview',
    'memory_forget',
  ])
);
