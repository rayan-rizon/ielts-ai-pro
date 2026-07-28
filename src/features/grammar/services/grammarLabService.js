import { supabase } from '@/lib/supabase';
import { getCsrfHeaders } from '@/lib/csrf';

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
  const [dashboardResult, resourcesResult] = await Promise.all([
    supabase.rpc('get_grammar_dashboard'),
    supabase
      .from('grammar_resources')
      .select(
        'id, slug, skill_code, title, summary, content_markdown, estimated_minutes, content_version'
      )
      .eq('publication_status', 'published')
      .order('skill_code'),
  ]);

  const dashboard = unwrapRpc(dashboardResult.data, dashboardResult.error) || {};
  if (resourcesResult.error) throw resourcesResult.error;
  return { ...dashboard, resources: resourcesResult.data || [] };
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

export async function getRecentSpeakingTransfers(userId) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('test_sessions')
    .select('id, completed_at, created_at, passage:passages(title, cambridge_title)')
    .eq('user_id', userId)
    .eq('test_type', 'speaking')
    .eq('is_completed', true)
    .order('completed_at', { ascending: false })
    .limit(8);
  if (error) throw error;
  return data || [];
}

export async function evaluateGrammarTransfer(payload) {
  const { data, error } = await supabase.functions.invoke('evaluateGrammarTransfer', {
    body: payload,
    headers: getCsrfHeaders(),
  });
  if (error) {
    const next = new Error(
      data?.error || error?.context?.body?.error || error.message || 'Transfer evaluation failed'
    );
    next.status = error?.context?.status;
    next.rateLimitType = data?.rateLimitType;
    throw next;
  }
  if (!data?.success) throw new Error(data?.error || 'Transfer evaluation failed');
  return data.data;
}
