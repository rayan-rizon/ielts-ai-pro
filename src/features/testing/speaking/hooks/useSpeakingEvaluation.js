import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { User } from '@/features/auth/services/User';
import { UserPoints } from '@/features/gamification/services/UserPoints';
import { refreshLearningPathAfterTest } from '@/services/adaptiveLearningService';
import { trackAppEvent } from '@/lib/tracking';
import { callEdgeFunction } from '@/utils/api';

import { buildPartContexts } from '../utils/speakingTestUtils';

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function getConversationsToEvaluate({
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

function buildCriteriaScores(evaluation) {
  return {
    fluency: evaluation.fluency ?? null,
    lexicalResource: evaluation.lexical ?? null,
    grammar: evaluation.grammar ?? null,
    pronunciation: evaluation.pronunciation ?? null,
  };
}

async function removeSpeakingTestsCache() {
  try {
    const { removeFromCache } = await import('@/lib/apiCache');
    removeFromCache('speaking-tests-list');
  } catch (error) {
    console.warn('[Speaking] Cache invalidation failed:', error);
  }
}

function refreshLearningPath(session, evaluation) {
  if (!session?.user_id || evaluation.overallBand == null) return;

  refreshLearningPathAfterTest(session.user_id, 'speaking', evaluation.overallBand).catch(
    (error) => {
      if (error?.status !== 403) {
        console.warn('Speaking: learning path refresh failed:', error?.message);
      }
    }
  );
}

function trackEvaluationSubmitted(session, evaluation) {
  const payload = {
    test_type: 'speaking',
    overall_band: evaluation?.overallBand ?? null,
    session_id: session?.id,
  };
  trackAppEvent('speaking_submitted', payload);
  trackAppEvent('test_completed', payload);
}

async function persistSuccessfulEvaluation({
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

async function persistPendingEvaluation({ session, conversationsToEvaluate, saveSessionProgress }) {
  await saveSessionProgress({
    content_data: {
      ...session?.content_data,
      allPartsConversation: conversationsToEvaluate,
      evaluationPending: true,
    },
  });
}

function isQuotaOrRateLimitError(error) {
  return error.status === 403 || error.status === 429 || error.name === 'RateLimitError';
}

function isQuotaError(error) {
  return error.status === 403 || error.rateLimitType === 'quota';
}

function isNetworkError(error) {
  const message = error?.userMessage || error?.message || '';
  return error?.isNetworkError || message.toLowerCase().includes('connect');
}

function resolveEvaluationError(error) {
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

async function handleEvaluationSuccess({
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

function handleQuotaOrRateLimit({
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

async function handleGenericEvaluationError({
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

// ─── Sub-hook: XP rewards ─────────────────────────────────────────────────────

function useXPRewards(pendingTimersRef) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showXPNotification, setShowXPNotification] = useState(false);
  const [earnedXP, setEarnedXP] = useState({ xp: 0, bonus: 0, streak: 0 });

  const awardXP = useCallback(
    async (evaluation) => {
      try {
        const userProfile = await User.me();
        if (!userProfile?.id || !evaluation.overallBand) return;

        const xpAmount = 100 + Math.round(evaluation.overallBand * 20);
        await UserPoints.addPoints(userProfile.id, xpAmount);
        const streakData = await UserPoints.updateStreak(userProfile.id);

        setEarnedXP({
          xp: xpAmount,
          bonus: 0,
          streak: streakData?.current_streak || 0,
        });
        setShowConfetti(true);

        const xpTimerId = setTimeout(() => {
          pendingTimersRef.current.delete(xpTimerId);
          setShowXPNotification(true);
        }, 500);
        pendingTimersRef.current.add(xpTimerId);
      } catch (xpError) {
        console.warn('Could not award XP:', xpError);
      }
    },
    [pendingTimersRef]
  );

  return { showConfetti, setShowConfetti, showXPNotification, setShowXPNotification, earnedXP, awardXP };
}

// ─── Sub-hook: Deep Dive feedback ─────────────────────────────────────────────

function useDeepDive({ testId, session, allParts, saveSessionProgress, isMountedRef }) {
  const [detailedFeedback, setDetailedFeedback] = useState(
    session?.content_data?.detailedFeedback || null
  );
  const [isGeneratingDetailed, setIsGeneratingDetailed] = useState(false);
  const [deepDiveError, setDeepDiveError] = useState(null);

  const fireDeepDive = useCallback(
    async (conversationsToEvaluate) => {
      if (!testId || !conversationsToEvaluate || isGeneratingDetailed) return;

      setIsGeneratingDetailed(true);
      setDeepDiveError(null);
      try {
        const response = await callEdgeFunction('generateDetailedSpeakingFeedback', {
          testId,
          speakingSessionId: session?.id,
          allPartsConversation: conversationsToEvaluate,
          partContexts: buildPartContexts(allParts),
        });
        if (!isMountedRef.current) return;

        if (!response.success || !response.detailedAnalysis) {
          throw new Error('Invalid deep dive response format');
        }

        setDetailedFeedback(response.detailedAnalysis);
        saveSessionProgress({
          content_data: {
            ...session?.content_data,
            detailedFeedback: response.detailedAnalysis,
          },
        });
      } catch (error) {
        if (!isMountedRef.current) return;
        console.error('[Speaking] Deep dive failed:', error);
        setDeepDiveError(error?.userMessage || error?.message || 'Deep dive failed');
      } finally {
        if (isMountedRef.current) setIsGeneratingDetailed(false);
      }
    },
    [testId, isGeneratingDetailed, session, saveSessionProgress, allParts, isMountedRef]
  );

  return { detailedFeedback, isGeneratingDetailed, deepDiveError, fireDeepDive };
}

// ─── Sub-hook: Final evaluation request ───────────────────────────────────────

function useFinalEvaluation({
  testId,
  session,
  allParts,
  allPartsConversation,
  currentPartNumber,
  conversation,
  acousticMetricsRef,
  saveSessionProgress,
  awardXP,
  setIsTestComplete,
  setShowUpgradeDialog,
  setProcessingStatus,
}) {
  const [loadingMessage, setLoadingMessage] = useState('Analyzing Performance...');
  const [finalEvaluation, setFinalEvaluation] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState(null);

  const requestFinalEvaluation = useCallback(
    async (allConversationsData) => {
      setIsEvaluating(true);
      setIsTestComplete(true);
      setEvaluationError(null);

      const conversationsToEvaluate = getConversationsToEvaluate({
        allConversationsData,
        allPartsConversation,
        currentPartNumber,
        conversation,
      });

      try {
        setLoadingMessage('AI is analyzing your response...');
        setProcessingStatus('AI is analyzing your response...');

        const response = await callEdgeFunction('evaluateSpeakingTest', {
          testId,
          speakingSessionId: session?.id,
          allPartsConversation: conversationsToEvaluate,
          allPartsPronunciation: acousticMetricsRef.current,
          partContexts: buildPartContexts(allParts),
        });

        if (response.success && response.evaluation) {
          await handleEvaluationSuccess({
            response,
            session,
            conversationsToEvaluate,
            saveSessionProgress,
            setFinalEvaluation,
            setEvaluationError,
            awardXP,
          });
          return;
        }

        console.warn('Evaluation returned success:false:', response);
        setEvaluationError(
          response.message || 'AI evaluation could not be processed. Please retry.'
        );
        await persistPendingEvaluation({ session, conversationsToEvaluate, saveSessionProgress });
      } catch (evalError) {
        console.error('Error getting final evaluation:', evalError);

        if (isQuotaOrRateLimitError(evalError)) {
          handleQuotaOrRateLimit({ evalError, setEvaluationError, setShowUpgradeDialog, setIsTestComplete });
          return;
        }

        await handleGenericEvaluationError({
          evalError,
          session,
          conversationsToEvaluate,
          saveSessionProgress,
          setEvaluationError,
        });
      } finally {
        setIsEvaluating(false);
      }
    },
    [
      testId,
      allPartsConversation,
      currentPartNumber,
      conversation,
      session,
      allParts,
      awardXP,
      saveSessionProgress,
      acousticMetricsRef,
      setIsTestComplete,
      setShowUpgradeDialog,
      setProcessingStatus,
    ]
  );

  return { loadingMessage, finalEvaluation, setFinalEvaluation, isEvaluating, evaluationError, setEvaluationError, requestFinalEvaluation };
}

// ─── Main hook (composition only) ─────────────────────────────────────────────

export default function useSpeakingEvaluation({
  testId,
  session,
  allParts,
  allPartsConversation,
  currentPartNumber,
  conversation,
  acousticMetricsRef,
  saveSessionProgress,
  isMountedRef,
  pendingTimersRef,
  setIsTestComplete,
  setShowUpgradeDialog,
  setProcessingStatus,
}) {
  const xpRewards = useXPRewards(pendingTimersRef);

  const deepDive = useDeepDive({ testId, session, allParts, saveSessionProgress, isMountedRef });

  const evaluation = useFinalEvaluation({
    testId,
    session,
    allParts,
    allPartsConversation,
    currentPartNumber,
    conversation,
    acousticMetricsRef,
    saveSessionProgress,
    awardXP: xpRewards.awardXP,
    setIsTestComplete,
    setShowUpgradeDialog,
    setProcessingStatus,
  });

  return {
    loadingMessage: evaluation.loadingMessage,
    finalEvaluation: evaluation.finalEvaluation,
    setFinalEvaluation: evaluation.setFinalEvaluation,
    isEvaluating: evaluation.isEvaluating,
    evaluationError: evaluation.evaluationError,
    setEvaluationError: evaluation.setEvaluationError,
    detailedFeedback: deepDive.detailedFeedback,
    isGeneratingDetailed: deepDive.isGeneratingDetailed,
    deepDiveError: deepDive.deepDiveError,
    showConfetti: xpRewards.showConfetti,
    setShowConfetti: xpRewards.setShowConfetti,
    showXPNotification: xpRewards.showXPNotification,
    setShowXPNotification: xpRewards.setShowXPNotification,
    earnedXP: xpRewards.earnedXP,
    requestFinalEvaluation: evaluation.requestFinalEvaluation,
    fireDeepDive: deepDive.fireDeepDive,
  };
}
