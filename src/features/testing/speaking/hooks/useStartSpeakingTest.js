import { useCallback } from 'react';
import { toast } from 'sonner';

import { TestSession } from '@/features/testing/shared/services/TestSession';
import { getLearningActivityId } from '@/features/testing/shared/activityContext';
import { callEdgeFunction } from '@/utils/api';

import { buildInitialSpeakingConversation } from '../utils/speakingTestUtils';

export default function useStartSpeakingTest({
  allParts,
  authUser,
  checkCurrentQuota,
  firstQuestionInsertedRef,
  isStartingTestRef,
  pendingGreetingRef,
  requestAutoStart,
  session,
  setConversation,
  setCurrentQuestionIndex,
  setSession,
  setSpeakingV2State,
  setTestStarted,
  speakingMode,
  speakText,
  testId,
  useSpeakingV2 = false,
}) {
  return useCallback(async () => {
    if (isStartingTestRef.current) return;
    isStartingTestRef.current = true;
    try {
      if (authUser?.id) {
        const isAllowed = await checkCurrentQuota();
        if (!isAllowed) return;
      }

      setTestStarted(true);

      let activeSession = session;
      if (!activeSession) {
        activeSession = await createSpeakingSession({
          allParts,
          authUser,
          pendingGreetingRef,
          setSession,
          speakingMode,
          testId,
          useSpeakingV2,
        });
      }

      if (useSpeakingV2 && activeSession?.id) {
        const started = await callEdgeFunction('processSpeakingSessionV2', {
          action: 'start',
          sessionId: activeSession.id,
          mode: speakingMode,
        });
        setSpeakingV2State?.(started.state);
      }

      if (pendingGreetingRef.current) {
        void playInitialGreeting({
          allParts,
          firstQuestionInsertedRef,
          pendingGreetingRef,
          requestAutoStart,
          setConversation,
          setCurrentQuestionIndex,
          setTestStarted,
          speakText,
        });
      }
    } catch (error) {
      setTestStarted(false);
      toast.error('Could not start speaking test', {
        description: error?.userMessage || error?.message || 'Please try again.',
      });
    } finally {
      isStartingTestRef.current = false;
    }
  }, [
    allParts,
    authUser,
    checkCurrentQuota,
    firstQuestionInsertedRef,
    isStartingTestRef,
    pendingGreetingRef,
    requestAutoStart,
    session,
    setConversation,
    setCurrentQuestionIndex,
    setSession,
    setSpeakingV2State,
    setTestStarted,
    speakingMode,
    speakText,
    testId,
    useSpeakingV2,
  ]);
}

async function createSpeakingSession({
  allParts,
  authUser,
  pendingGreetingRef,
  setSession,
  speakingMode,
  testId,
  useSpeakingV2,
}) {
  if (!authUser) return;

  try {
    const resolvedPassageId = pendingGreetingRef.current?.testId || testId;
    const partNumber = pendingGreetingRef.current?.partNumber || 1;
    const initialConversation = buildInitialSpeakingConversation({
      greeting: pendingGreetingRef.current?.greeting,
      currentPart: allParts[partNumber],
    });
    const newSession = await TestSession.create({
      user_id: authUser.id,
      test_type: 'speaking',
      passage_id: resolvedPassageId,
      is_completed: false,
      learning_path_activity_id: getLearningActivityId(),
      evaluation_status: 'not_requested',
      content_data: {
        passage_id: resolvedPassageId,
        currentPart: partNumber,
        ...(useSpeakingV2 ? { speakingVersion: 'v2', speakingMode } : {}),
      },
      answers: { conversation: initialConversation.slice(0, 1), currentQuestionIndex: 0 },
    });
    setSession(newSession);
    return newSession;
  } catch (error) {
    console.warn('Failed to create speaking session:', error);
    throw error;
  }
}

export async function playInitialGreeting({
  allParts,
  firstQuestionInsertedRef,
  pendingGreetingRef,
  requestAutoStart,
  setConversation,
  setCurrentQuestionIndex,
  setTestStarted,
  speakText,
}) {
  const { greeting, partNumber } = pendingGreetingRef.current;
  const initialConversation = buildInitialSpeakingConversation({
    greeting,
    currentPart: allParts[partNumber],
  });

  const firstQuestion = initialConversation[1]?.text;
  // The welcome remains visible in the transcript, but should not delay the
  // first assessable question. Previously we waited for a full greeting and
  // then a full question recording before enabling the microphone.
  setConversation(initialConversation);
  setCurrentQuestionIndex(0);
  setTestStarted(true);
  pendingGreetingRef.current = null;

  if (firstQuestion) {
    firstQuestionInsertedRef.current = true;
    await Promise.resolve(speakText(firstQuestion)).catch(() => {});
  }
  requestAutoStart?.();
}
