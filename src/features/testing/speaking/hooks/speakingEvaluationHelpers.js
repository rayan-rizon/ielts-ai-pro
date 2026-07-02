import { toast } from 'sonner';

import { refreshLearningPathAfterTest } from '@/services/adaptiveLearningService';
import { trackAppEvent } from '@/lib/tracking';

// ─── Data helpers ─────────────────────────────────────────────────────────────

export function getConversationsToEvaluate({
  allConversationsData,
  allPartsConversation,
  currentPartNumber,
  conversation,
}) {
  if (allConversationsData) return allConversationsData;
  return {
    ...allPartsConversation,
    [currentPartNumber]: conversation.filter((entry) => !entry.isLoading),
  };
}

export function buildCriteriaScores(evaluation) {
  return {
    fluency: evaluation.fluency ?? null,
    lexicalResource: evaluation.lexical ?? null,
    grammar: evaluation.grammar ?? null,
    pronunciation: evaluation.pronunciation ?? null,
  };
}

// ─── Side-effect helpers ──────────────────────────────────────────────────────

export async function removeSpeakingTestsCache() {
  try {
    const { removeFromCache } = await import('@/lib/apiCache');
    removeFromCache('speaking-tests-list');
  } catch (error) {
    console.warn('[Speaking] Cache invalidation failed:', error);
  }
}

export function refreshLearningPath(session, evaluation) {
  if (!session?.user_id || evaluation.overallBand == null) return;

  refreshLearningPathAfterTest(session.user_id, 'speaking', evaluation.overallBand).catch(
    (error) => {
      if (error?.status !== 403) {
        console.warn('Speaking: learning path refresh failed:', error?.message);
      }
    }
  );
}

export function trackEvaluationSubmitted(session, evaluation) {
  const payload = {
    test_type: 'speaking',
    overall_band: evaluation?.overallBand ?? null,
    session_id: session?.id,
  };
  trackAppEvent('speaking_submitted', payload);
  trackAppEvent('test_completed', payload);
}

// ─── Persistence helpers ──────────────────────────────────────────────────────

export async function persistSuccessfulEvaluation({
  session,
  evaluation,
  conversationsToEvaluate,
  saveSessionProgress,
}) {
  await saveSessionProgress({
    is_completed: true,
    score: evaluation.overallBand ?? null,
    completed_at: new Date().toISOString(),
    content_data: {
      ...session?.content_data,
      finalEvaluation: evaluation,
      allPartsConversation: conversationsToEvaluate,
      criteriaScores: buildCriteriaScores(evaluation),
    },
  });
}

export async function persistPendingEvaluation({
  session,
  conversationsToEvaluate,
  saveSessionProgress,
}) {
  await saveSessionProgress({
    content_data: {
      ...session?.content_data,
      allPartsConversation: conversationsToEvaluate,
      evaluationPending: true,
    },
  });
}

// ─── Error classification ─────────────────────────────────────────────────────

export function isQuotaOrRateLimitError(error) {
  return error.status === 403 || error.status === 429 || error.name === 'RateLimitError';
}

export function isQuotaError(error) {
  return error.status === 403 || error.rateLimitType === 'quota';
}

function isNetworkError(error) {
  const message = error?.userMessage || error?.message || '';
  return error?.isNetworkError || message.toLowerCase().includes('connect');
}

export function resolveEvaluationError(error) {
  if (isNetworkError(error)) {
    return {
      title: 'Connection Issue',
      message: 'Connection issue. Please check your internet and retry.',
      description: 'Please check your internet connection and try generating reports again.',
    };
  }
  return {
    title: 'Evaluation Unavailable',
    message: 'AI evaluation is temporarily unavailable. Please retry.',
    description: 'AI evaluation is temporarily unavailable. Please try again in a moment.',
  };
}

// ─── Orchestration helpers ────────────────────────────────────────────────────

export async function handleEvaluationSuccess({
  response,
  session,
  conversationsToEvaluate,
  saveSessionProgress,
  setFinalEvaluation,
  setEvaluationError,
  awardXP,
}) {
  setFinalEvaluation(response.evaluation);
  setEvaluationError(null);
  await awardXP(response.evaluation);
  trackEvaluationSubmitted(session, response.evaluation);
  await persistSuccessfulEvaluation({
    session,
    evaluation: response.evaluation,
    conversationsToEvaluate,
    saveSessionProgress,
  });
  await removeSpeakingTestsCache();
  refreshLearningPath(session, response.evaluation);
}

export function handleQuotaOrRateLimit({
  evalError,
  setEvaluationError,
  setShowUpgradeDialog,
  setIsTestComplete,
}) {
  if (isQuotaError(evalError)) {
    setEvaluationError(
      'Your plan does not include speaking evaluation. Please upgrade to continue.'
    );
    setShowUpgradeDialog(true);
    setIsTestComplete(true);
    return;
  }
  toast.error('Too many requests', {
    description: 'Please wait a moment and try evaluating again.',
    duration: 4000,
  });
  setEvaluationError('Too many requests. Please wait and retry.');
}

export async function handleGenericEvaluationError({
  evalError,
  session,
  conversationsToEvaluate,
  saveSessionProgress,
  setEvaluationError,
}) {
  const resolvedError = resolveEvaluationError(evalError);
  setEvaluationError(resolvedError.message);
  toast.error(resolvedError.title, {
    description: resolvedError.description,
    duration: 8000,
  });
  await persistPendingEvaluation({ session, conversationsToEvaluate, saveSessionProgress });
}
