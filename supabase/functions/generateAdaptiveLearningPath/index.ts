// @ts-ignore Deno URL imports are resolved by the Supabase Edge runtime.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  aggregateReadiness,
  buildRoadmap,
  buildSevenDaySchedule,
  fingerprintLearningPathInputs,
  LEARNING_PATH_GENERATOR_VERSION,
  normalizeStudyAvailability,
  summarizeEvidence,
} from '../_shared/learningPathV2.ts';
import {
  checkRateLimit,
  errorResponse,
  finalizeApiUsage,
  getCorsHeaders,
  getRateLimitIdentifier,
  handleCorsPrelight,
  logApiUsage,
  rateLimitedResponse,
  RATE_LIMITS,
  reserveDatabaseQuota,
  validateCsrfProtection,
} from '../_shared/security.ts';

declare const Deno: any;

const MODEL = 'gemini-2.5-flash-lite';
const ALLOWED_TRIGGERS = new Set([
  'first_plan',
  'test_completed',
  'goal_changed',
  'result_recovery',
  'manual_refresh',
]);

const triggerMessage = (trigger: string, module?: string) => {
  if (trigger === 'test_completed') {
    return `A newly completed${module ? ` ${module}` : ''} test changed the evidence used by your plan.`;
  }
  if (trigger === 'goal_changed') {
    return 'Your target, exam date, or weekly availability changed, so the roadmap and capacity were recalculated.';
  }
  if (trigger === 'result_recovery') {
    return 'A result-specific recovery request was fitted into the broader exam roadmap.';
  }
  if (trigger === 'first_plan') {
    return 'This is your first evidence-aware plan. Diagnostic tasks are used where measured evidence is still missing.';
  }
  return 'Your evidence or goals changed since the previous revision.';
};

const localIsoDate = (timezone: string) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
};

const checkpointFor = (readiness: any, roadmap: any[]) => {
  if (readiness.missing_diagnostics.length) {
    const module = readiness.missing_diagnostics[0];
    return {
      type: 'diagnostic',
      module,
      title: `${module.charAt(0).toUpperCase() + module.slice(1)} scored diagnostic`,
      progress_definition:
        'Complete a scored attempt; two recent attempts are required before a module range is treated as sufficient.',
    };
  }
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
      if (merged[day].length < 3 && (capacity === 0 || used + minutes <= capacity)) {
        merged[day].push({ ...task, estimated_time: minutes, is_optional: true });
      }
    });
  });
  return merged;
}

async function buildCoachSummary({
  geminiApiKey,
  supabase,
  authId,
  fingerprint,
  trigger,
  goal,
  evidence,
  readiness,
  checkpoint,
}: any) {
  const metadata = {
    trigger,
    fingerprint,
    model: MODEL,
    generatorVersion: LEARNING_PATH_GENERATOR_VERSION,
    cacheStatus: 'miss',
  };
  const fallback = {
    headline:
      evidence.measured_priorities.length > 0
        ? 'Start with the strongest measured priority, then protect review time.'
        : 'Measure first, then personalize from trustworthy results.',
    explanation: readiness.overall.available
      ? `Your current practice evidence spans Band ${readiness.overall.range[0]}–${readiness.overall.range[1]}. This is an observed range, not a prediction.`
      : readiness.overall.disclaimer,
  };

  if (!geminiApiKey) {
    await logApiUsage(supabase, authId, 'generateAdaptiveLearningPath', false, 0, {
      ...metadata,
      deterministicFallback: true,
      fallbackReason: 'provider_not_configured',
    });
    return { summary: fallback, deterministicFallback: true };
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
    return { summary: fallback, deterministicFallback: true };
  }

  try {
    const prompt = `You are an IELTS coach. Write a concise, conservative plan explanation from aggregate evidence only.
Never predict improvement, promise a score, or call diagnostic/early-signal skills weaknesses.
Return JSON only: {"headline":"max 18 words","explanation":"max 65 words"}.

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
})}
</aggregate_evidence>`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.25,
            maxOutputTokens: 400,
            responseMimeType: 'application/json',
          },
        }),
      }
    );
    if (!response.ok) throw new Error(`Provider returned ${response.status}`);

    const data = await response.json();
    const usage = data.usageMetadata || {};
    const promptTokens = Number(usage.promptTokenCount || 0);
    const outputTokens =
      Number(usage.candidatesTokenCount || 0) + Number(usage.thoughtsTokenCount || 0);
    const tokensUsed = Number(usage.totalTokenCount || promptTokens + outputTokens);
    const parsed = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
    if (typeof parsed.headline !== 'string' || typeof parsed.explanation !== 'string') {
      throw new Error('Malformed coach summary');
    }

    await finalizeApiUsage(supabase, reservation.reservationId, tokensUsed, false, {
      ...metadata,
      promptTokens,
      outputTokens,
      estimatedProviderCostUsd: promptTokens * 0.0000001 + outputTokens * 0.0000004,
      deterministicFallback: false,
    });
    return {
      summary: {
        headline: parsed.headline.trim().slice(0, 180),
        explanation: parsed.explanation.trim().slice(0, 650),
      },
      deterministicFallback: false,
    };
  } catch (error: any) {
    await finalizeApiUsage(
      supabase,
      reservation.reservationId,
      0,
      false,
      {
        ...metadata,
        deterministicFallback: true,
        fallbackReason: error?.message || 'provider_failure',
      },
      'failed'
    );
    return { summary: fallback, deterministicFallback: true };
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
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || serviceKey;
    const authHeader = req.headers.get('Authorization') || '';
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
      .from('users')
      .select(
        'id, subscription_tier, target_band_score, test_date, study_hours_goal, study_availability, weak_area, exam_type'
      )
      .eq('auth_id', authData.user.id)
      .single();
    if (profileError || !profile) return errorResponse('Profile not found', 404, corsHeaders);
    if (!['pro', 'premium'].includes(String(profile.subscription_tier).toLowerCase())) {
      return errorResponse(
        'Pro or Premium subscription required for AI Learning Path',
        403,
        corsHeaders
      );
    }

    const cutoff = new Date(Date.now() - 90 * 86400000).toISOString();
    const [{ data: sessions }, { data: skills }, { data: latestRows }] = await Promise.all([
      supabase
        .from('test_sessions')
        .select('id, test_type, score, completed_at, created_at, is_completed')
        .eq('user_id', profile.id)
        .eq('is_completed', true)
        .gte('completed_at', cutoff)
        .order('completed_at', { ascending: false })
        .limit(120),
      supabase
        .from('skill_proficiency')
        .select(
          'skill_code, module, mastery_probability, confidence_level, practice_count, correct_count, last_practiced_at, next_review_at'
        )
        .eq('user_id', profile.id)
        .limit(120),
      supabase
        .from('learning_paths')
        .select('id, path_data, created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1),
    ]);

    const timezone = String(profile.study_availability?.timezone || body?.timezone || 'UTC');
    const availability = normalizeStudyAvailability(
      profile.study_availability,
      Number(profile.study_hours_goal || 10),
      timezone
    );
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
        completed_at: session.completed_at,
      })),
      skills: (skills || []).map((skill: any) => ({
        code: skill.skill_code,
        mastery: skill.mastery_probability,
        confidence: skill.confidence_level,
        observations: skill.practice_count,
        review: skill.next_review_at,
      })),
    };
    const fingerprint = await fingerprintLearningPathInputs(fingerprintInput);
    const latest = latestRows?.[0];
    if (
      latest?.path_data?.input_fingerprint === fingerprint &&
      latest?.path_data?.generator_version === LEARNING_PATH_GENERATOR_VERSION
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

    const evidence = summarizeEvidence(skills || []);
    const readiness = aggregateReadiness(sessions || []);
    const localToday = localIsoDate(availability.timezone);
    const planningTestDate =
      profile.test_date && new Date(profile.test_date).getTime() >= new Date(localToday).getTime()
        ? profile.test_date
        : null;
    const roadmap = buildRoadmap(planningTestDate, localToday);
    const scheduleData = buildSevenDaySchedule({
      availability,
      evidence,
      readiness,
      testDate: planningTestDate,
      now: localToday,
    });
    scheduleData.schedule = mergeRecoveryTasks(
      scheduleData.schedule,
      latest?.path_data,
      availability
    );
    const checkpoint = checkpointFor(readiness, roadmap);
    const goalSnapshot = {
      target_band: Number(profile.target_band_score || 7),
      test_date: profile.test_date || null,
      exam_type: profile.exam_type || 'academic',
      study_availability: availability,
      weekly_capacity_minutes: scheduleData.weekly_capacity_minutes,
    };
    const coach = await buildCoachSummary({
      geminiApiKey: Deno.env.get('GEMINI_API_KEY'),
      supabase,
      authId: authData.user.id,
      fingerprint,
      trigger: latest ? trigger : 'first_plan',
      goal: goalSnapshot,
      evidence,
      readiness,
      checkpoint,
    });

    const effectiveTrigger = latest ? trigger : 'first_plan';
    const learningPath = {
      version: 2,
      generator_version: LEARNING_PATH_GENERATOR_VERSION,
      input_fingerprint: fingerprint,
      generated_at: new Date().toISOString(),
      generation_trigger: effectiveTrigger,
      goal_snapshot: goalSnapshot,
      evidence_summary: evidence,
      readiness,
      roadmap,
      weekly_schedule: scheduleData.schedule,
      weekly_allocation: scheduleData.allocation,
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
