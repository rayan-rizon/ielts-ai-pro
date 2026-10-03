import { AI_ROUTES } from '../_shared/aiModelRegistry.ts';
import {
  COACH_RESPONSE_SCHEMA,
  isCoachResponse,
  resolveCoachRanking,
} from '../_shared/learningPathCoach.ts';
// @ts-ignore Deno URL imports are resolved by the Supabase Edge runtime.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  aggregateReadiness,
  isLearningPlanExpired,
  isScoredLearningSession,
  studyDateKey,
  buildRoadmap,
  buildSevenDaySchedule,
  findRecurringObjectiveMistakes,
  fingerprintLearningPathInputs,
  LEARNING_PATH_GENERATOR_VERSION,
  normalizeStudyAvailability,
  scheduleRecurringRepair,
  summarizeEvidence,
  summarizeVocabularyEvidence,
} from '../_shared/learningPathV2.ts';
import {
  checkRateLimit,
  errorResponse,
  finalizeApiUsage,
  getFinalizedReservationResult,
  getCorsHeaders,
  getRateLimitIdentifier,
  handleCorsPrelight,
  logApiUsage,
  rateLimitedResponse,
  RATE_LIMITS,
  reserveDatabaseQuota,
  validateCsrfProtection,
} from '../_shared/security.ts';
import {
  DEEPSEEK_TEXT_MODEL,
  GEMINI_TEXT_FALLBACK_MODEL,
  requestJsonWithGeminiFallback,
} from '../_shared/textAiProvider.ts';

declare const Deno: any;

// Provider routing revision: latency-sorted OpenRouter with reasoning disabled.

const MODEL = DEEPSEEK_TEXT_MODEL;
const ALLOWED_TRIGGERS = new Set([
  'first_plan',
  'test_completed',
  'grammar_completed',
  'vocabulary_completed',
  'goal_changed',
  'result_recovery',
  'manual_refresh',
  'schedule_expired',
  'practice_completed',
  'generator_updated',
]);

const triggerMessage = (trigger: string, module?: string) => {
  if (trigger === 'schedule_expired')
    return 'Your previous seven-day plan ended. A new week was scheduled from your latest results and availability.';
  if (trigger === 'practice_completed')
    return 'New practice results changed the skill evidence used by your plan.';
  if (trigger === 'test_completed') {
    return `A newly completed${module ? ` ${module}` : ''} test changed the evidence used by your plan.`;
  }
  if (trigger === 'goal_changed') {
    return 'Your target, exam date, or weekly availability changed, so the roadmap and capacity were recalculated.';
  }
  if (trigger === 'grammar_completed') {
    return 'A completed Grammar Lab activity changed the evidence or transfer outcome used by your plan.';
  }
  if (trigger === 'vocabulary_completed') {
    return 'A completed vocabulary review changed the due-word and retention evidence used by your plan.';
  }
  if (trigger === 'result_recovery') {
    return 'A result-specific recovery request was fitted into the broader exam roadmap.';
  }
  if (trigger === 'first_plan') {
    return 'This is your first plan based on actual test results. Take practice tests in the other subjects to make it more complete.';
  }
  if (trigger === 'generator_updated') {
    return 'The study plan format was improved while keeping your latest results and goals.';
  }
  return 'Your evidence or goals changed since the previous revision.';
};

function isCurrentSkillEvidence(skill: any) {
  const module = String(skill.module || '').toLowerCase();
  const isGeneratedCriterion =
    module === 'writing' ||
    module === 'speaking' ||
    /_(writing|speaking)$/i.test(String(skill.skill_code || ''));
  return !isGeneratedCriterion || skill.evidence_version === '2026-07-29-v5';
}

const checkpointFor = (readiness: any, roadmap: any[], activities: any[] = []) => {
  if (readiness.missing_diagnostics.length) {
    const module = readiness.missing_diagnostics[0];
    const plannedAssessment = activities.find(
      (task: any) =>
        task.module === module &&
        ['diagnostic', 'practice_assessment', 'timed_assessment'].includes(task.activity_type)
    );
    return {
      type: 'diagnostic',
      module,
      title:
        plannedAssessment?.title ||
        `${module.charAt(0).toUpperCase() + module.slice(1)} practice test`,
      progress_definition:
        'Complete a scored attempt; two recent attempts are required before a module range is treated as sufficient.',
    };
  }
  const assessment = activities.find((task: any) =>
    ['exam_assessment', 'practice_assessment'].includes(task.activity_type)
  );
  if (assessment)
    return {
      type: assessment.requested_mode === 'exam' ? 'exam' : 'practice',
      module: assessment.module,
      title: assessment.title,
      progress_definition: assessment.success_criterion,
    };
  const current = roadmap.find((phase) => phase.current) || roadmap[roadmap.length - 1];
  return {
    type: current?.key === 'readiness' ? 'mock' : 'timed_check',
    module: null,
    title: current?.key === 'readiness' ? 'Full IELTS mock' : 'Next phase checkpoint',
    progress_definition:
      current?.checkpoint ||
      'Complete the checkpoint using the stated timing and accuracy criteria.',
  };
};

function collectActivities(schedule: Record<string, any[]>) {
  return Object.values(schedule || {}).flatMap((activities) =>
    (Array.isArray(activities) ? activities : []).map((activity) => ({
      ...activity,
      description: activity.reason,
    }))
  );
}

function applyAiRanking(schedule: Record<string, any[]>, rankedActivityKeys: string[]) {
  const rankByKey = new Map(rankedActivityKeys.map((key, index) => [key, index + 1]));
  return Object.fromEntries(
    Object.entries(schedule).map(([day, tasks]) => [
      day,
      (Array.isArray(tasks) ? tasks : [])
        .map((task: any) => ({
          ...task,
          ai_rank: rankByKey.get(task.activity_key) || null,
        }))
        .sort(
          (first: any, second: any) =>
            Number(first.is_optional) - Number(second.is_optional) ||
            (rankByKey.get(first.activity_key) || 999) - (rankByKey.get(second.activity_key) || 999)
        ),
    ])
  );
}

function mergeRecoveryTasks(schedule: Record<string, any[]>, previousPath: any, availability: any) {
  if (!previousPath?.weekly_schedule && !previousPath?.recovery_backlog) return schedule;
  const merged = Object.fromEntries(
    Object.entries(schedule).map(([day, tasks]) => [day, [...(tasks as any[])]])
  );
  const activeScheduleDates = new Set(
    Object.values(schedule)
      .flat()
      .map((task: any) => task?.scheduled_date)
      .filter(Boolean)
  );
  const recoverySources: Record<string, any[]> = { ...(previousPath.weekly_schedule || {}) };
  (Array.isArray(previousPath.recovery_backlog) ? previousPath.recovery_backlog : []).forEach(
    (task: any) => {
      const day = task?.scheduled_day;
      if (!day) return;
      if (!recoverySources[day]) recoverySources[day] = [];
      recoverySources[day].push(task);
    }
  );
  Object.entries(recoverySources).forEach(([day, tasks]) => {
    const recoveryTasks = (Array.isArray(tasks) ? tasks : []).filter((task: any) =>
      String(task?.activity_key || '').startsWith('result:')
    );
    recoveryTasks.forEach((task: any) => {
      if (task?.scheduled_date && !activeScheduleDates.has(task.scheduled_date)) return;
      if (!merged[day] || merged[day].some((item: any) => item.activity_key === task.activity_key))
        return;
      const capacity = Number(availability?.days?.[day] || 0);
      const used = merged[day].reduce(
        (total: number, item: any) => total + Number(item.estimated_time || 0),
        0
      );
      const minutes = Math.max(20, Math.min(60, Number(task.estimated_time || 30)));
      if (merged[day].length < 3 && capacity > 0 && used + minutes <= capacity) {
        merged[day].push({ ...task, estimated_time: minutes, is_optional: true });
      }
    });
  });
  return merged;
}

async function buildCoachSummary({
  openRouterApiKey,
  deepseekApiKey,
  geminiApiKey,
  supabase,
  authId,
  fingerprint,
  trigger,
  goal,
  evidence,
  readiness,
  checkpoint,
  candidates,
  scheduleOnly = false,
}: any) {
  const metadata = {
    trigger,
    fingerprint,
    model: MODEL,
    fallbackModel: GEMINI_TEXT_FALLBACK_MODEL,
    providerStrategy: 'openrouter-deepseek-first-gemini-fallback',
    generatorVersion: LEARNING_PATH_GENERATOR_VERSION,
    cacheStatus: 'miss',
  };
  const fallback = {
    headline:
      evidence.measured_priorities.length > 0
        ? 'Start with the clearest confirmed focus, then protect review time.'
        : 'Measure first, then personalize from trustworthy results.',
    explanation: readiness.overall.available
      ? `Your current practice evidence spans Band ${readiness.overall.range[0]}–${readiness.overall.range[1]}. This is an observed range, not a prediction.`
      : readiness.overall.disclaimer,
    rankedActivityKeys: (candidates || []).map((candidate: any) => candidate.activity_key),
  };

  if (scheduleOnly) {
    await logApiUsage(supabase, authId, 'generateAdaptiveLearningPath', true, 0, {
      ...metadata,
      cacheStatus: 'schedule_renewal',
      deterministicFallback: false,
    });
    return {
      summary: { headline: 'Your next week is ready', explanation: fallback.explanation },
      rankedActivityKeys: fallback.rankedActivityKeys,
      deterministicFallback: false,
    };
  }

  if (!openRouterApiKey && !deepseekApiKey && !geminiApiKey) {
    await logApiUsage(supabase, authId, 'generateAdaptiveLearningPath', false, 0, {
      ...metadata,
      deterministicFallback: true,
      fallbackReason: 'provider_not_configured',
    });
    return {
      summary: {
        headline: fallback.headline,
        explanation: fallback.explanation,
      },
      rankedActivityKeys: fallback.rankedActivityKeys,
      deterministicFallback: true,
    };
  }

  const reservation = await reserveDatabaseQuota(
    supabase,
    authId,
    'generateAdaptiveLearningPath',
    null,
    `learning-path-v2:${fingerprint}`,
    metadata
  );
  if (!reservation.allowed) {
    await logApiUsage(supabase, authId, 'generateAdaptiveLearningPath', false, 0, {
      ...metadata,
      deterministicFallback: true,
      fallbackReason: 'quota_unavailable',
    });
    return {
      summary: {
        headline: fallback.headline,
        explanation: fallback.explanation,
      },
      rankedActivityKeys: fallback.rankedActivityKeys,
      deterministicFallback: true,
    };
  }
  if (reservation.alreadyReserved) {
    const cachedResponse = await getFinalizedReservationResult<Record<string, unknown>>(
      supabase,
      reservation.reservationId
    );
    if (cachedResponse) return cachedResponse;
    return {
      summary: {
        headline: fallback.headline,
        explanation: fallback.explanation,
      },
      rankedActivityKeys: fallback.rankedActivityKeys,
      deterministicFallback: true,
      fallbackReason: 'duplicate_request',
    };
  }

  try {
    const prompt = `You are an IELTS coach ranking a safe, pre-validated study plan.
Use aggregate evidence only. Never invent activities, keys, evidence, routes, scores, or capacity.
Never predict improvement, promise a score, or call level-check/needs-more-results skills weaknesses.
Choose at most three provided activityIndex values, most useful first. Return JSON only: {"headline":"max 18 words","explanation":"max 65 words","rankedActivityIndices":[0,1,2]}.

<aggregate_evidence>
${JSON.stringify({
  targetBand: goal.target_band,
  examDate: goal.test_date,
  weeklyCapacityMinutes: goal.weekly_capacity_minutes,
  evidenceConfidence: evidence.confidence_label,
  measuredPriorityCount: evidence.measured_priorities.length,
  earlySignalCount: evidence.early_signals.length,
  missingDiagnostics: readiness.missing_diagnostics,
  observedOverallRange: readiness.overall.range,
  nextCheckpoint: checkpoint,
  candidates: (candidates || []).map((candidate: any, activityIndex: number) => ({
    activityIndex,
    module: candidate.module,
    activityType: candidate.activity_type,
    stage: candidate.stage_key,
    priority: candidate.priority,
    evidenceClass: candidate.evidence?.class || null,
    scheduledDate: candidate.scheduled_date,
  })),
})}
</aggregate_evidence>`;

    const providerResult = await requestJsonWithGeminiFallback({
      prompt,
      deepseekApiKey,
      openRouterApiKey,
      geminiApiKey,
      temperature: 0.25,
      maxOutputTokens: AI_ROUTES.find((route) => route.id === 'adaptive-learning-path')!
        .maxOutputTokens!,
      responseSchema: COACH_RESPONSE_SCHEMA,
      validateJson: isCoachResponse,
    });
    const { promptTokens, cachedPromptTokens, outputTokens, tokensUsed } = providerResult.usage;
    const parsed = providerResult.parsed;
    const completeRanking = resolveCoachRanking(
      (candidates || []).map((candidate: any) => candidate.activity_key),
      parsed.rankedActivityIndices
    );

    const responsePayload = {
      summary: {
        headline: parsed.headline.trim().slice(0, 180),
        explanation: parsed.explanation.trim().slice(0, 650),
      },
      rankedActivityKeys: completeRanking,
      deterministicFallback: false,
    };

    await finalizeApiUsage(supabase, reservation.reservationId, tokensUsed, false, {
      ...metadata,
      provider: providerResult.provider,
      model: providerResult.model,
      mode: providerResult.mode,
      fallbackUsed: providerResult.fallbackUsed,
      fallbackReason: providerResult.fallbackReason,
      promptTokens,
      cachedPromptTokens,
      outputTokens,
      estimatedProviderCostUsd: providerResult.usage.estimatedProviderCostUsd,
      deterministicFallback: false,
      response: responsePayload,
    });
    return responsePayload;
  } catch (error: any) {
    await finalizeApiUsage(
      supabase,
      reservation.reservationId,
      0,
      false,
      {
        ...metadata,
        // Record which provider actually failed. Without it the row is
        // unattributable and platform health cannot say whose outage this was.
        provider: error?.provider || 'unknown',
        deterministicFallback: true,
        fallbackReason: error?.message || 'provider_failure',
      },
      'failed'
    );
    return {
      summary: {
        headline: fallback.headline,
        explanation: fallback.explanation,
      },
      rankedActivityKeys: fallback.rankedActivityKeys,
      deterministicFallback: true,
    };
  }
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return handleCorsPrelight(req);

  try {
    const csrf = validateCsrfProtection(req);
    if (!csrf.valid) return errorResponse(csrf.error || 'CSRF validation failed', 403, corsHeaders);

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const authHeader = req.headers.get('Authorization') || '';
    if (!supabaseUrl || !serviceKey || !anonKey) {
      console.error('generateAdaptiveLearningPath is missing required Supabase configuration');
      return errorResponse(
        'Service is temporarily unavailable. Please try again later.',
        503,
        corsHeaders
      );
    }
    const supabase = createClient(supabaseUrl, serviceKey);
    const userSupabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: authData, error: authError } = await supabase.auth.getUser(
      authHeader.replace(/^Bearer\s+/i, '')
    );
    if (authError || !authData.user) return errorResponse('Unauthorized', 401, corsHeaders);

    const rateLimit = checkRateLimit(
      getRateLimitIdentifier(req, authData.user.id),
      RATE_LIMITS.AI_FUNCTION
    );
    if (!rateLimit.allowed) return rateLimitedResponse(rateLimit.resetIn, corsHeaders);

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const requestedTrigger = String(body?.trigger || 'manual_refresh');
    const trigger = ALLOWED_TRIGGERS.has(requestedTrigger) ? requestedTrigger : 'manual_refresh';

    const { data: profile, error: profileError } = await supabase
      .rpc('get_institution_learner_profile', { p_auth: authData.user.id })
      .select(
        'id, subscription_tier, target_band_score, test_date, study_hours_goal, study_availability, weak_area, exam_type'
      )
      .eq('auth_id', authData.user.id)
      .single();
    if (profileError || !profile) return errorResponse('Profile not found', 404, corsHeaders);
    if (!['pro', 'premium'].includes(String(profile.subscription_tier).toLowerCase())) {
      return errorResponse(
        'Pro or Premium subscription required for Learning Path',
        403,
        corsHeaders
      );
    }

    const cutoff = new Date(Date.now() - 90 * 86400000).toISOString();
    const evidenceResults = await Promise.all([
      supabase
        .from('test_sessions')
        .select(
          'id, test_type, test_mode, score, completed_at, created_at, is_completed, actual_duration_seconds, content_data, evaluation_status, evaluation_version'
        )
        .eq('user_id', profile.id)
        .eq('is_completed', true)
        .gte('completed_at', cutoff)
        .order('completed_at', { ascending: false })
        .limit(120),
      supabase
        .from('skill_proficiency')
        .select(
          'skill_code, module, mastery_probability, confidence_level, practice_count, correct_count, last_practiced_at, next_review_at, evidence_version'
        )
        .eq('user_id', profile.id)
        .order('skill_code')
        .limit(120),
      supabase
        .from('grammar_attempts')
        .select(
          'id, mode, target_skills, completion_state, total_questions, correct_count, transfer_evaluation, completed_at, updated_at'
        )
        .eq('user_id', profile.id)
        .eq('completion_state', 'completed')
        .order('completed_at', { ascending: false })
        .limit(80),
      supabase
        .from('vocabulary_items')
        .select('id, next_review_date')
        .eq('user_id', profile.id)
        .order('next_review_date', { ascending: true, nullsFirst: false })
        .limit(500),
      supabase
        .from('vocabulary_review_events')
        .select('quality, reviewed_at')
        .eq('user_id', profile.id)
        .gte('reviewed_at', cutoff)
        .order('reviewed_at', { ascending: false })
        .limit(500),
      supabase
        .from('learning_paths')
        .select('id, path_data, created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1),
    ]);

    // A failed read must not overwrite a good plan with an apparent empty history.
    const failedRead = evidenceResults.find((result: any) => result.error);
    if (failedRead) {
      console.error('Learning Path evidence read failed', failedRead.error);
      return errorResponse(
        'Your latest results could not be loaded. Your saved plan is unchanged. Please retry.',
        503,
        corsHeaders
      );
    }
    const [
      sessionResult,
      skillResult,
      grammarResult,
      vocabularyResult,
      reviewResult,
      latestResult,
    ] = evidenceResults;
    const sessions = (sessionResult.data || []).filter(isScoredLearningSession);
    if (!sessions.length) {
      return new Response(JSON.stringify({ learningPath: null, needsTest: true, cached: false }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const skills = skillResult.data || [];
    const grammarAttempts = grammarResult.data || [];
    const vocabularyItems = vocabularyResult.data || [];
    const vocabularyReviews = reviewResult.data || [];
    const latestRows = latestResult.data || [];
    const timezone = String(profile.study_availability?.timezone || body?.timezone || 'UTC');
    const availability = normalizeStudyAvailability(
      profile.study_availability,
      Number(profile.study_hours_goal || 10),
      timezone
    );
    const currentSkills = (skills || []).filter(isCurrentSkillEvidence);
    const localToday = studyDateKey(new Date(), availability.timezone);
    const evidence = summarizeEvidence(currentSkills);
    const fingerprintInput = {
      generator_version: LEARNING_PATH_GENERATOR_VERSION,
      goal: {
        target_band: Number(profile.target_band_score || 7),
        test_date: profile.test_date || null,
        exam_type: profile.exam_type || 'academic',
        study_availability: availability,
      },
      sessions: (sessions || []).map((session: any) => ({
        id: session.id,
        module: session.test_type,
        score: session.score,
        test_mode: session.test_mode || 'practice',
        completed_at: session.completed_at,
        type_stats: session.content_data?.typeStats || null,
        time_metrics: session.content_data?.timeMetrics || null,
      })),
      skills: currentSkills.map((skill: any) => ({
        code: skill.skill_code,
        mastery: skill.mastery_probability,
        confidence: skill.confidence_level,
        observations: skill.practice_count,
        review: skill.next_review_at,
        evidence_version: skill.evidence_version || null,
      })),
      grammar_attempts: (grammarAttempts || []).map((attempt: any) => ({
        id: attempt.id,
        mode: attempt.mode,
        target_skills: attempt.target_skills,
        total_questions: attempt.total_questions,
        correct_count: attempt.correct_count,
        transfer_outcome: attempt.transfer_evaluation?.outcome || null,
        completed_at: attempt.completed_at || attempt.updated_at,
      })),
      due_skills: evidence.due_reviews.map((skill: any) => skill.skill_code),
      vocabulary: summarizeVocabularyEvidence(vocabularyItems || [], vocabularyReviews || []),
    };
    const fingerprint = await fingerprintLearningPathInputs(fingerprintInput);
    const latest = latestRows?.[0];
    if (
      latest?.path_data?.input_fingerprint === fingerprint &&
      latest?.path_data?.generator_version === LEARNING_PATH_GENERATOR_VERSION &&
      !isLearningPlanExpired(latest.path_data)
    ) {
      await logApiUsage(supabase, authData.user.id, 'generateAdaptiveLearningPath', true, 0, {
        trigger,
        fingerprint,
        model: MODEL,
        generatorVersion: LEARNING_PATH_GENERATOR_VERSION,
        cacheStatus: 'fingerprint_hit',
        deterministicFallback: false,
      });
      return new Response(
        JSON.stringify({ learningPath: latest.path_data, pathId: latest.id, cached: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const readiness = aggregateReadiness(sessions || []);
    const vocabularyEvidence = summarizeVocabularyEvidence(
      vocabularyItems || [],
      vocabularyReviews || []
    );
    const recurringMistakes = findRecurringObjectiveMistakes(sessions || []);
    const planningTestDate =
      profile.test_date && new Date(profile.test_date).getTime() >= new Date(localToday).getTime()
        ? profile.test_date
        : null;
    const roadmap = buildRoadmap(planningTestDate, localToday);
    const scheduleData = buildSevenDaySchedule({
      availability,
      evidence,
      readiness,
      vocabularyEvidence,
      testDate: planningTestDate,
      targetBand: Number(profile.target_band_score || 7),
      now: localToday,
    });
    scheduleData.schedule = mergeRecoveryTasks(
      scheduleData.schedule,
      latest?.path_data,
      availability
    );
    scheduleData.schedule = scheduleRecurringRepair(
      scheduleData.schedule,
      recurringMistakes[0] || null
    );
    const finalActivities = collectActivities(scheduleData.schedule);
    scheduleData.weekly_planned_minutes = finalActivities.reduce(
      (total: number, task: any) => total + task.estimated_time,
      0
    );
    scheduleData.grammar_minutes = finalActivities
      .filter((task: any) => task.module === 'grammar')
      .reduce((total: number, task: any) => total + task.estimated_time, 0);
    scheduleData.vocabulary_minutes = finalActivities
      .filter((task: any) => task.module === 'vocabulary')
      .reduce((total: number, task: any) => total + task.estimated_time, 0);
    const checkpoint = checkpointFor(readiness, roadmap, finalActivities);
    const goalSnapshot = {
      target_band: Number(profile.target_band_score || 7),
      test_date: profile.test_date || null,
      exam_type: profile.exam_type || 'academic',
      study_availability: availability,
      weekly_capacity_minutes: scheduleData.weekly_capacity_minutes,
      weekly_planned_minutes: scheduleData.weekly_planned_minutes,
      availability_source: profile.study_availability ? 'confirmed' : 'default',
    };
    const candidateActivities = collectActivities(scheduleData.schedule).slice(0, 18);
    const coach = await buildCoachSummary({
      openRouterApiKey: Deno.env.get('OPENROUTER_API_KEY'),
      deepseekApiKey: Deno.env.get('DEEPSEEK_API_KEY'),
      geminiApiKey: Deno.env.get('GEMINI_API_KEY'),
      supabase,
      authId: authData.user.id,
      fingerprint,
      trigger: latest ? trigger : 'first_plan',
      goal: goalSnapshot,
      evidence,
      readiness,
      checkpoint,
      candidates: candidateActivities,
      scheduleOnly:
        latest?.path_data?.input_fingerprint === fingerprint || trigger === 'generator_updated',
    });
    scheduleData.schedule = applyAiRanking(scheduleData.schedule, coach.rankedActivityKeys || []);

    const effectiveTrigger = latest ? trigger : 'first_plan';
    const learningPath = {
      version: 2,
      generator_version: LEARNING_PATH_GENERATOR_VERSION,
      input_fingerprint: fingerprint,
      generated_at: new Date().toISOString(),
      schedule_start_date: localToday,
      generation_trigger: effectiveTrigger,
      goal_snapshot: goalSnapshot,
      evidence_summary: evidence,
      readiness,
      roadmap,
      weekly_schedule: scheduleData.schedule,
      weekly_allocation: scheduleData.allocation,
      grammar_allocation: {
        minutes: scheduleData.grammar_minutes,
        cap_minutes: scheduleData.grammar_cap_minutes,
        share:
          scheduleData.weekly_planned_minutes > 0
            ? scheduleData.grammar_minutes / scheduleData.weekly_planned_minutes
            : 0,
      },
      vocabulary_allocation: {
        minutes: scheduleData.vocabulary_minutes,
        cap_minutes: scheduleData.vocabulary_cap_minutes,
        share:
          scheduleData.weekly_planned_minutes > 0
            ? scheduleData.vocabulary_minutes / scheduleData.weekly_planned_minutes
            : 0,
      },
      support_evidence: {
        grammar: {
          recent_attempt_count: (grammarAttempts || []).length,
          due_review_count: evidence.due_reviews.filter(
            (signal: any) => signal.module === 'grammar'
          ).length,
        },
        vocabulary: vocabularyEvidence,
      },
      ai_ranking: {
        activity_keys: coach.rankedActivityKeys || [],
        constrained_to_candidates: true,
      },
      grammar_evidence: {
        recent_attempts: (grammarAttempts || []).map((attempt: any) => ({
          id: attempt.id,
          mode: attempt.mode,
          target_skills: attempt.target_skills,
          correct_count: attempt.correct_count,
          total_questions: attempt.total_questions,
          transfer_outcome: attempt.transfer_evaluation?.outcome || null,
          completed_at: attempt.completed_at || attempt.updated_at,
        })),
        due_reviews: evidence.due_reviews.filter((signal: any) => signal.module === 'grammar'),
        criterion_signals: evidence.criterion_signals,
      },
      recurring_mistakes: recurringMistakes,
      coach_summary: coach.summary,
      why_plan_changed: triggerMessage(effectiveTrigger, body?.module),
      next_checkpoint: checkpoint,
      deterministic_fallback: coach.deterministicFallback,
      recovery_source_session_id:
        latest?.path_data?.source_session_id ||
        latest?.path_data?.recovery_source_session_id ||
        null,
      current_focus:
        evidence.measured_priorities[0]?.module ||
        readiness.missing_diagnostics[0] ||
        'balanced practice',
      target_level: goalSnapshot.target_band,
      completion_percentage: 0,
    };
    const activities = collectActivities(scheduleData.schedule);
    const { data: saved, error: saveError } = await userSupabase.rpc('save_learning_path_v2', {
      p_path_data: learningPath,
      p_activities: activities,
    });
    if (saveError) return errorResponse(saveError.message, 500, corsHeaders);

    return new Response(
      JSON.stringify({
        learningPath,
        pathId: saved?.path_id,
        cached: false,
        deterministicFallback: coach.deterministicFallback,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return errorResponse(error?.message || 'Unknown learning path error', 500, getCorsHeaders(req));
  }
});
