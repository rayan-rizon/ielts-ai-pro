import { useCallback } from 'react';

import { TestSession } from '@/features/testing/shared/services/TestSession';
import { getLearningActivityId } from '@/features/testing/shared/activityContext';

import { buildInitialSpeakingConversation } from '../utils/speakingTestUtils';

export default function useStartSpeakingTest({
  allParts,
  authUser,
  checkCurrentQuota,
  firstQuestionInsertedRef,
  isStartingTestRef,
  pendingGreetingRef,
  session,
  setConversation,
  setCurrentQuestionIndex,
  setSession,
  setTestStarted,
  speakText,
  testId,
}) {
  return useCallback(async () => {
    if (isStartingTestRef.current) return;
    isStartingTestRef.current = true;

    if (authUser?.id) {
      const isAllowed = await checkCurrentQuota();
      if (!isAllowed) {
        isStartingTestRef.current = false;
        return;
      }
    }

    setTestStarted(true);

    if (!session) {
      await createSpeakingSession({
        allParts,
        authUser,
        pendingGreetingRef,
        setSession,
        testId,
      });
    }

    if (pendingGreetingRef.current) {
      playInitialGreeting({
        allParts,
        firstQuestionInsertedRef,
        pendingGreetingRef,
        setConversation,
        setCurrentQuestionIndex,
        setTestStarted,
        speakText,
      });
    }
  }, [
    allParts,
    authUser,
    checkCurrentQuota,
    firstQuestionInsertedRef,
    isStartingTestRef,
    pendingGreetingRef,
    session,
    setConversation,
    setCurrentQuestionIndex,
    setSession,
    setTestStarted,
    speakText,
    testId,
  ]);
}

async function createSpeakingSession({
  allParts,
  authUser,
  pendingGreetingRef,
  setSession,
  testId,
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
      content_data: { passage_id: resolvedPassageId, currentPart: partNumber },
      answers: { conversation: initialConversation, currentQuestionIndex: 0 },
    });
    setSession(newSession);
  } catch (error) {
    console.warn('Failed to create speaking session:', error);
  }
}

function playInitialGreeting({
  allParts,
  firstQuestionInsertedRef,
  pendingGreetingRef,
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

  setConversation(initialConversation.slice(0, 1));
  const greetingPromise = speakText(greeting);
  setTestStarted(true);

  (async () => {
    pendingGreetingRef.current = null;
    await greetingPromise;
    firstQuestionInsertedRef.current = false;

    if (firstQuestionInsertedRef.current) return;

    firstQuestionInsertedRef.current = true;
    const firstQuestion = initialConversation[1]?.text;
    if (!firstQuestion) return;
    setConversation((prev) => [...prev, { speaker: 'ai', text: firstQuestion }]);
    speakText(firstQuestion);
    setCurrentQuestionIndex(0);
  })();
}
