import { supabase } from '@/lib/supabase';

function unwrapRpc(data, error) {
  if (error) {
    const next = new Error(error.message || 'Grammar Lab request failed');
    next.code = error.code;
    next.details = error.details;
    next.hint = error.hint;
    throw next;
  }
  return data;
}

export async function getGrammarDashboard() {
  const [dashboardResult, resourcesResult, guideProgressResult, completedPracticeResult] =
    await Promise.all([
      supabase.rpc('get_grammar_dashboard'),
      supabase
        .from('grammar_resources')
        .select(
          'id, slug, skill_code, title, summary, content_markdown, estimated_minutes, content_version'
        )
        .eq('publication_status', 'published')
        .order('content_version', { ascending: false }),
      supabase.from('grammar_guide_progress').select('guide_slug, completed_at'),
      supabase
        .from('grammar_attempts')
        .select('target_skills')
        .eq('mode', 'practice')
        .eq('completion_state', 'completed'),
    ]);

  const dashboard = unwrapRpc(dashboardResult.data, dashboardResult.error) || {};
  const guideProgress = guideProgressResult.error
    ? []
    : (guideProgressResult.data || []).map((item) => item.guide_slug);
  if (guideProgressResult.error && guideProgressResult.error.code !== '42P01') {
    console.warn('Grammar guide completion could not be loaded:', guideProgressResult.error);
  }
  if (completedPracticeResult.error) {
    console.warn('Completed Grammar practices could not be loaded:', completedPracticeResult.error);
  }
  const completedPracticeSkillSets = (completedPracticeResult.data || []).map(
    (attempt) => attempt.target_skills || []
  );
  if (resourcesResult.error) {
    console.warn('Grammar guides could not be loaded:', resourcesResult.error);
    return {
      ...dashboard,
      resources: [],
      resourcesUnavailable: true,
      completedGuideSlugs: guideProgress,
      completedPracticeSkillSets,
    };
  }

  const latestBySlug = new Map();
  (resourcesResult.data || []).forEach((resource) => {
    if (!latestBySlug.has(resource.slug)) latestBySlug.set(resource.slug, resource);
  });
  return {
    ...dashboard,
    resources: Array.from(latestBySlug.values()),
    completedGuideSlugs: guideProgress,
    completedPracticeSkillSets,
  };
}

export async function setGrammarGuideCompletion({ userId, guideSlug, completed }) {
  if (!userId || !guideSlug) throw new Error('Choose a guide before updating its completion.');

  if (!completed) {
    const { error } = await supabase
      .from('grammar_guide_progress')
      .delete()
      .eq('user_id', userId)
      .eq('guide_slug', guideSlug);
    if (error) throw error;
    return { guideSlug, completed: false };
  }

  const { error } = await supabase.from('grammar_guide_progress').upsert(
    {
      user_id: userId,
      guide_slug: guideSlug,
      completed_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,guide_slug' }
  );
  if (error) throw error;
  return { guideSlug, completed: true };
}

export async function startGrammarAttempt({
  mode,
  targetSkills,
  questionCount,
  learningPathActivityId,
}) {
  const { data, error } = await supabase.rpc('start_grammar_attempt', {
    p_mode: mode,
    p_target_skills: targetSkills?.length ? targetSkills : null,
    p_question_count: questionCount ?? null,
    p_learning_path_activity_id: learningPathActivityId || null,
  });
  return unwrapRpc(data, error);
}

export async function getGrammarAttempt(attemptId) {
  const { data, error } = await supabase.rpc('get_grammar_attempt', {
    p_attempt_id: attemptId,
  });
  return unwrapRpc(data, error);
}

export async function submitGrammarResponse({ attemptId, itemId, answer }) {
  const { data, error } = await supabase.rpc('submit_grammar_response', {
    p_attempt_id: attemptId,
    p_item_id: itemId,
    p_answer: answer,
  });
  return unwrapRpc(data, error);
}

export async function completeGrammarAttempt(attemptId) {
  const { data, error } = await supabase.rpc('complete_grammar_attempt', {
    p_attempt_id: attemptId,
  });
  return unwrapRpc(data, error);
}
