import { useEffect } from 'react';

function shouldRunCountdown({ isLoading, error, timeLeft, isTestComplete, testStarted }) {
  return !isLoading && !error && timeLeft > 0 && !isTestComplete && testStarted;
}

function usePartCountdown({
  isLoading,
  error,
  timeLeft,
  setTimeLeft,
  isTestComplete,
  testStarted,
}) {
  useEffect(() => {
    let timer = null;
    if (shouldRunCountdown({ isLoading, error, timeLeft, isTestComplete, testStarted })) {
      timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isLoading, error, isTestComplete, testStarted, timeLeft, setTimeLeft]);
}

function shouldSaveProgress({ testStarted, isTestComplete, session }) {
  return testStarted && !isTestComplete && !!session?.id;
}

function persistProgressSnapshot({
  session,
  currentPartNumber,
  saveSessionProgress,
  conversationRef,
  questionIndexRef,
  timeLeftRef,
}) {
  if (timeLeftRef.current <= 0) return;

  saveSessionProgress({
    answers: {
      conversation: conversationRef.current,
      currentQuestionIndex: questionIndexRef.current,
      timeLeft: timeLeftRef.current,
    },
    content_data: {
      ...session?.content_data,
      currentPart: currentPartNumber,
    },
  });
}

function usePeriodicProgressSave({
  testStarted,
  isTestComplete,
  session,
  currentPartNumber,
  saveSessionProgress,
  conversationRef,
  questionIndexRef,
  timeLeftRef,
}) {
  useEffect(() => {
    if (!shouldSaveProgress({ testStarted, isTestComplete, session })) return;

    const interval = setInterval(() => {
      persistProgressSnapshot({
        session,
        currentPartNumber,
        saveSessionProgress,
        conversationRef,
        questionIndexRef,
        timeLeftRef,
      });
    }, 15000);

    return () => clearInterval(interval);
  }, [
    testStarted,
    isTestComplete,
    session?.id,
    currentPartNumber,
    saveSessionProgress,
    session?.content_data,
    conversationRef,
    questionIndexRef,
    timeLeftRef,
    session,
  ]);
}

function isPartCompletionBlocked({
  isLoading,
  isTestComplete,
  isPartComplete,
  isProcessingRef,
  isSpeaking,
  timerExpiredRef,
}) {
  return (
    isLoading ||
    isTestComplete ||
    isPartComplete ||
    isProcessingRef.current ||
    isSpeaking ||
    timerExpiredRef.current
  );
}

function shouldAutoCompletePart({
  timeLeft,
  testStarted,
  isLoading,
  isTestComplete,
  isPartComplete,
  isProcessingRef,
  isSpeaking,
  conversationRef,
  timerExpiredRef,
}) {
  if (timeLeft !== 0) return false;
  if (!testStarted) return false;
  if (
    isPartCompletionBlocked({
      isLoading,
      isTestComplete,
      isPartComplete,
      isProcessingRef,
      isSpeaking,
      timerExpiredRef,
    })
  ) {
    return false;
  }
  return conversationRef.current.length > 2;
}

function queuePartCompletion({
  currentPartNumber,
  setConversation,
  pendingTimersRef,
  setIsPartComplete,
  saveSessionProgress,
  session,
}) {
  setConversation((prev) => [
    ...prev,
    {
      speaker: 'ai',
      text: `That's all the time we have for Part ${currentPartNumber}. Let's move on.`,
    },
  ]);
  const timerId = setTimeout(() => {
    pendingTimersRef.current.delete(timerId);
    setIsPartComplete(true);
    saveSessionProgress({
      content_data: {
        ...session?.content_data,
        isPartComplete: true,
      },
    });
  }, 2000);
  pendingTimersRef.current.add(timerId);
}

function useTimerExpiryCompletion({
  timeLeft,
  testStarted,
  isLoading,
  isTestComplete,
  isPartComplete,
  setIsPartComplete,
  isSpeaking,
  currentPartNumber,
  setConversation,
  saveSessionProgress,
  session,
  conversationRef,
  isProcessingRef,
  timerExpiredRef,
  pendingTimersRef,
}) {
  useEffect(() => {
    if (
      !shouldAutoCompletePart({
        timeLeft,
        testStarted,
        isLoading,
        isTestComplete,
        isPartComplete,
        isProcessingRef,
        isSpeaking,
        conversationRef,
        timerExpiredRef,
      })
    ) {
      return;
    }

    timerExpiredRef.current = true;
    queuePartCompletion({
      currentPartNumber,
      setConversation,
      pendingTimersRef,
      setIsPartComplete,
      saveSessionProgress,
      session,
    });
  }, [
    timeLeft,
    testStarted,
    isLoading,
    isTestComplete,
    isPartComplete,
    setIsPartComplete,
    isSpeaking,
    currentPartNumber,
    setConversation,
    saveSessionProgress,
    session?.content_data,
    conversationRef,
    isProcessingRef,
    timerExpiredRef,
    pendingTimersRef,
    session,
  ]);
}

function usePart2PrepCountdown({
  isPart2Prep,
  prepTimeLeft,
  setPrepTimeLeft,
  prepTimerRef,
  handleStartPart2Speaking,
}) {
  useEffect(() => {
    if (isPart2Prep && prepTimeLeft > 0) {
      prepTimerRef.current = setInterval(() => {
        setPrepTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(prepTimerRef.current);
            handleStartPart2Speaking();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (prepTimerRef.current) {
        clearInterval(prepTimerRef.current);
      }
    };
  }, [isPart2Prep, handleStartPart2Speaking, prepTimeLeft, prepTimerRef, setPrepTimeLeft]);
}

function usePartCompleteKeyboardShortcut({
  isPartComplete,
  isProcessing,
  isEvaluating,
  moveToNextPart,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Enter') return;
      if (!isPartComplete) return;
      if (isProcessing) return;
      if (isEvaluating) return;

      e.preventDefault();
      moveToNextPart();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPartComplete, isProcessing, isEvaluating, moveToNextPart]);
}

export default function useSpeakingTimers(options) {
  usePartCountdown(options);
  usePeriodicProgressSave(options);
  useTimerExpiryCompletion(options);
  usePart2PrepCountdown(options);
  usePartCompleteKeyboardShortcut(options);
}
