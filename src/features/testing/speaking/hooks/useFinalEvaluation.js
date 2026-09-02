import { useCallback, useEffect, useState } from 'react';

import { callEdgeFunction } from '@/utils/api';

import {
  buildAverageSpeakingEvaluation,
  buildLegacySpeakingEvaluation,
  buildPartContexts,
} from '../utils/speakingTestUtils';
import {
  claimSpeakingEvaluation,
  getConversationsToEvaluate,
  handleEvaluationSuccess,
  handleQuotaOrRateLimit,
  handleGenericEvaluationError,
  isQuotaOrRateLimitError,
  persistPendingEvaluation,
} from './speakingEvaluationHelpers';

async function fetchEvaluation({
  testId,
  session,
  conversationsToEvaluate,
  acousticMetricsRef,
  allParts,
}) {
  return callEdgeFunction('evaluateSpeakingTest', {
    testId,
    speakingSessionId: session?.id,
    allPartsConversation: conversationsToEvaluate,
    allPartsPronunciation: acousticMetricsRef.current,
    partContexts: buildPartContexts(allParts),
  });
}

async function handleFailedResponse({
  response,
  session,
  conversationsToEvaluate,
  saveSessionProgress,
  setEvaluationError,
}) {
  console.warn('Evaluation returned success:false:', response);
  setEvaluationError(response.message || 'AI evaluation could not be processed. Please retry.');
  await persistPendingEvaluation({ session, conversationsToEvaluate, saveSessionProgress });
  await saveSessionProgress({ evaluation_status: 'failed' });
}

async function handleEvaluationCatchError({ evalError, ctx }) {
  console.error('Error getting final evaluation:', evalError);

  if (isQuotaOrRateLimitError(evalError)) {
    handleQuotaOrRateLimit({
      evalError,
      setEvaluationError: ctx.setEvaluationError,
      setShowUpgradeDialog: ctx.setShowUpgradeDialog,
      setIsTestComplete: ctx.setIsTestComplete,
    });
    await ctx.saveSessionProgress({ evaluation_status: 'failed' });
    return;
  }

  return handleGenericEvaluationError({
    evalError,
    session: ctx.session,
    conversationsToEvaluate: ctx.conversationsToEvaluate,
    saveSessionProgress: ctx.saveSessionProgress,
    setEvaluationError: ctx.setEvaluationError,
  });
}

export default function useFinalEvaluation({
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

  useEffect(() => {
    const saved = session?.content_data?.finalEvaluation;
    const averaged = session?.content_data?.allEvaluations
      ? buildAverageSpeakingEvaluation(session.content_data.allEvaluations)
      : null;
    const legacy =
      !saved && !averaged && session?.score != null
        ? buildLegacySpeakingEvaluation(session.score)
        : null;
    setFinalEvaluation(saved || averaged || legacy || null);
    setEvaluationError(null);
    setIsEvaluating(false);
  }, [session?.id]);

  const requestFinalEvaluation = useCallback(
    async (allConversationsData) => {
      setIsEvaluating(true);
      setIsTestComplete(true);
      setEvaluationError(null);
      setLoadingMessage('AI is analyzing your response...');
      setProcessingStatus('AI is analyzing your response...');

      const conversationsToEvaluate = getConversationsToEvaluate({
        allConversationsData,
        allPartsConversation,
        currentPartNumber,
        conversation,
      });

      try {
        const claimed = await claimSpeakingEvaluation(session);
        if (!claimed) {
          setEvaluationError('This response is already being analyzed or has feedback.');
          return;
        }
        const response = await fetchEvaluation({
          testId,
          session,
          conversationsToEvaluate,
          acousticMetricsRef,
          allParts,
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

        await handleFailedResponse({
          response,
          session,
          conversationsToEvaluate,
          saveSessionProgress,
          setEvaluationError,
        });
      } catch (evalError) {
        await handleEvaluationCatchError({
          evalError,
          ctx: {
            session,
            conversationsToEvaluate,
            saveSessionProgress,
            setEvaluationError,
            setShowUpgradeDialog,
            setIsTestComplete,
          },
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

  return {
    loadingMessage,
    finalEvaluation,
    setFinalEvaluation,
    isEvaluating,
    evaluationError,
    setEvaluationError,
    requestFinalEvaluation,
  };
}
