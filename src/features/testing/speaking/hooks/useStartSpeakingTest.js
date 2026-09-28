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
          speakingMode,
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
      greeting: resolveGreeting(pendingGreetingRef.current, speakingMode),
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

/** Practice mode opens as a coach, not as an examiner. */
function resolveGreeting(pending, speakingMode) {
  if (!pending) return undefined;
  return speakingMode === 'practice' && pending.practiceGreeting
    ? pending.practiceGreeting
    : pending.greeting;
}

export async function playInitialGreeting({
  allParts,
  firstQuestionInsertedRef,
  pendingGreetingRef,
  requestAutoStart,
  setConversation,
  setCurrentQuestionIndex,
  setTestStarted,
  speakingMode,
  speakText,
}) {
  const { partNumber } = pendingGreetingRef.current;
  const greeting = resolveGreeting(pendingGreetingRef.current, speakingMode);
  const initialConversation = buildInitialSpeakingConversation({
    greeting,
    currentPart: allParts[partNumber],
  });

  const questionEntry = initialConversation[initialConversation.length - 1];
  const firstQuestion = questionEntry?.text;
  // The greeting plays first and the first question appears only when it is
  // asked, so the learner never sees a question the examiner has not reached.
  // Both utterances were prefetched during initialization, so these sequential
  // playback calls reuse the same cached promises instead of making duplicate
  // synthesis requests.
  setConversation(greeting ? initialConversation.slice(0, -1) : initialConversation);
  setCurrentQuestionIndex(0);
  setTestStarted(true);
  pendingGreetingRef.current = null;

  if (greeting) {
    await Promise.resolve(speakText(greeting)).catch(() => {});
    if (questionEntry) setConversation((prev) => [...prev, questionEntry]);
  }
  if (firstQuestion) {
    firstQuestionInsertedRef.current = true;
    await Promise.resolve(speakText(firstQuestion)).catch(() => {});
  }
  requestAutoStart?.();
}
