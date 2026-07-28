import { useCallback, useEffect, useState } from 'react';

import { callEdgeFunction } from '@/utils/api';
import { supabase } from '@/lib/supabase';

import { buildPartContexts } from '../utils/speakingTestUtils';
import { CURRENT_EVALUATION_VERSION } from '@/features/testing/shared/evaluationVersion';

function canFireDeepDive(testId, sessionId, conversations, isAlreadyGenerating) {
  return Boolean(testId && sessionId && conversations && !isAlreadyGenerating);
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

  if (
    !response.success ||
    !response.detailedAnalysis ||
    response.detailedAnalysis.evaluationVersion !== CURRENT_EVALUATION_VERSION ||
    response.detailedAnalysis.speakingSessionId !== session?.id
  ) {
    throw new Error('Invalid deep dive response format');
  }

  return response.detailedAnalysis;
}

export async function persistDeepDiveAnalysis(session, analysis) {
  const { data: currentSession, error: readError } = await supabase
    .from('test_sessions')
    .select('content_data, evaluation_status, evaluation_version')
    .eq('id', session.id)
    .single();
  if (readError) throw readError;
  if (
    currentSession?.evaluation_status !== 'complete' ||
    currentSession?.evaluation_version !== CURRENT_EVALUATION_VERSION
  ) {
    throw new Error('The current speaking evaluation is not ready for a deep dive.');
  }

  const { data: updatedSession, error: updateError } = await supabase
    .from('test_sessions')
    .update({
      content_data: {
        ...currentSession.content_data,
        detailedFeedback: {
          ...analysis,
          evaluationVersion: CURRENT_EVALUATION_VERSION,
          speakingSessionId: session.id,
        },
      },
    })
    .eq('id', session.id)
    .eq('evaluation_status', 'complete')
    .eq('evaluation_version', CURRENT_EVALUATION_VERSION)
    .select('id')
    .maybeSingle();
  if (updateError) throw updateError;
  if (!updatedSession) throw new Error('The speaking session changed before the deep dive saved.');
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
      await persistDeepDiveAnalysis(session, analysis);
      setDetailedFeedback(analysis);
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

export default function useDeepDive({ testId, session, allParts, isMountedRef }) {
  const [detailedFeedback, setDetailedFeedback] = useState(
    session?.content_data?.detailedFeedback ?? null
  );
  const [isGeneratingDetailed, setIsGeneratingDetailed] = useState(false);
  const [deepDiveError, setDeepDiveError] = useState(null);

  useEffect(() => {
    setDetailedFeedback(session?.content_data?.detailedFeedback ?? null);
    setDeepDiveError(null);
    setIsGeneratingDetailed(false);
  }, [session?.id, session?.content_data?.detailedFeedback]);

  const fireDeepDive = useCallback(
    (conversationsToEvaluate) => {
      if (!canFireDeepDive(testId, session?.id, conversationsToEvaluate, isGeneratingDetailed)) {
        return;
      }
      executeDeepDive({
        testId,
        session,
        conversationsToEvaluate,
        allParts,
        isMountedRef,
        setDetailedFeedback,
        setDeepDiveError,
        setIsGeneratingDetailed,
      });
    },
    [testId, isGeneratingDetailed, session, allParts, isMountedRef]
  );

  return {
    detailedFeedback,
    isGeneratingDetailed,
    deepDiveError,
    fireDeepDive,
  };
}
