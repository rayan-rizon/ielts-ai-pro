import { useCallback, useState } from 'react';

import { callEdgeFunction } from '@/utils/api';

import { buildPartContexts } from '../utils/speakingTestUtils';

function canFireDeepDive(testId, conversations, isAlreadyGenerating) {
  return Boolean(testId && conversations && !isAlreadyGenerating);
}

function extractDeepDiveError(error) {
  return error?.userMessage || error?.message || 'Deep dive failed';
}

async function fetchDeepDiveAnalysis({ testId, session, conversationsToEvaluate, allParts }) {
  const response = await callEdgeFunction('generateDetailedSpeakingFeedback', {
    testId,
    speakingSessionId: session?.id,
    allPartsConversation: conversationsToEvaluate,
    partContexts: buildPartContexts(allParts),
  });

  if (!response.success || !response.detailedAnalysis) {
    throw new Error('Invalid deep dive response format');
  }

  return response.detailedAnalysis;
}

async function executeDeepDive({
  testId,
  session,
  conversationsToEvaluate,
  allParts,
  isMountedRef,
  setDetailedFeedback,
  setDeepDiveError,
  setIsGeneratingDetailed,
  saveSessionProgress,
}) {
  setIsGeneratingDetailed(true);
  setDeepDiveError(null);
  try {
    const analysis = await fetchDeepDiveAnalysis({
      testId,
      session,
      conversationsToEvaluate,
      allParts,
    });
    if (isMountedRef.current) {
      setDetailedFeedback(analysis);
      saveSessionProgress({
        content_data: { ...session?.content_data, detailedFeedback: analysis },
      });
    }
  } catch (error) {
    if (isMountedRef.current) {
      console.error('[Speaking] Deep dive failed:', error);
      setDeepDiveError(extractDeepDiveError(error));
    }
  } finally {
    if (isMountedRef.current) setIsGeneratingDetailed(false);
  }
}

export default function useDeepDive({
  testId,
  session,
  allParts,
  saveSessionProgress,
  isMountedRef,
}) {
  const [detailedFeedback, setDetailedFeedback] = useState(
    session?.content_data?.detailedFeedback ?? null
  );
  const [isGeneratingDetailed, setIsGeneratingDetailed] = useState(false);
  const [deepDiveError, setDeepDiveError] = useState(null);

  const fireDeepDive = useCallback(
    (conversationsToEvaluate) => {
      if (!canFireDeepDive(testId, conversationsToEvaluate, isGeneratingDetailed)) return;
      executeDeepDive({
        testId,
        session,
        conversationsToEvaluate,
        allParts,
        isMountedRef,
        setDetailedFeedback,
        setDeepDiveError,
        setIsGeneratingDetailed,
        saveSessionProgress,
      });
    },
    [testId, isGeneratingDetailed, session, saveSessionProgress, allParts, isMountedRef]
  );

  return {
    detailedFeedback,
    isGeneratingDetailed,
    deepDiveError,
    fireDeepDive,
  };
}
