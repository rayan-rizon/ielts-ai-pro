import { useCallback } from 'react';

import { TestSession } from '@/features/testing/shared/services/TestSession';

import { formatIeltsQuestion, getQuestionLines } from '../utils/speakingTestUtils';

export default function useStartSpeakingTest({
  allParts,
  authUser,
  checkCurrentQuota,
  conversation,
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
        authUser,
        conversation,
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
    conversation,
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
  authUser,
  conversation,
  pendingGreetingRef,
  setSession,
  testId,
}) {
  if (!authUser) return;

  try {
    const resolvedPassageId = pendingGreetingRef.current?.testId || testId;
    const newSession = await TestSession.create({
      user_id: authUser.id,
      test_type: 'speaking',
      passage_id: resolvedPassageId,
      is_completed: false,
      content_data: { passage_id: resolvedPassageId, currentPart: 1 },
      answers: { conversation, currentQuestionIndex: -1 },
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

  setConversation([{ speaker: 'ai', text: greeting }]);
  const greetingPromise = speakText(greeting);
  setTestStarted(true);

  (async () => {
    pendingGreetingRef.current = null;
    await greetingPromise;
    firstQuestionInsertedRef.current = false;

    const currentPart = allParts[partNumber];
    if (!currentPart?.questions) return;

    const questionLines = getQuestionLines(currentPart.questions);
    const firstQuestion = questionLines[0] || "Let's begin. Can you tell me about yourself?";

    if (firstQuestionInsertedRef.current) return;

    firstQuestionInsertedRef.current = true;
    const cleanedFirstQuestion = formatIeltsQuestion(firstQuestion);
    setConversation((prev) => [...prev, { speaker: 'ai', text: cleanedFirstQuestion }]);
    speakText(cleanedFirstQuestion);
    setCurrentQuestionIndex(0);
  })();
}
