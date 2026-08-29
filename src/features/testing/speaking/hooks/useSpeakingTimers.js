import { useEffect } from 'react';

export function getCountdownSeconds(initialSeconds, startedAt, now = Date.now(), isPaused = false) {
  if (isPaused) return initialSeconds;
  const elapsedSeconds = Math.floor(Math.max(0, now - startedAt) / 1000);
  return Math.max(0, initialSeconds - elapsedSeconds);
}

function shouldRunCountdown({ isLoading, error, timeLeft, isTestComplete, testStarted, isPaused }) {
  return !isLoading && !error && timeLeft > 0 && !isTestComplete && testStarted && !isPaused;
}

function usePartCountdown({
  isLoading,
  error,
  timeLeft,
  setTimeLeft,
  isTestComplete,
  testStarted,
  currentPartNumber,
  isPaused,
}) {
  useEffect(() => {
    let timer = null;
    if (
      shouldRunCountdown({
        isLoading,
        error,
        timeLeft,
        isTestComplete,
        testStarted,
        isPaused,
      })
    ) {
      const initialSeconds = timeLeft;
      const startedAt = Date.now();
      const syncCountdown = () => setTimeLeft(getCountdownSeconds(initialSeconds, startedAt));
      timer = setInterval(() => {
        syncCountdown();
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isLoading, error, isTestComplete, testStarted, currentPartNumber, isPaused, setTimeLeft]);
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
  isPartComplete,
  isPart2Intro,
  isPart2Prep,
  prepTimeLeft,
  cueCardTopic,
  allPartsConversation,
  allPartsAcousticMetrics,
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
      isPartComplete,
      isPart2Intro,
      isPart2Prep,
      prepTimeLeft,
      cueCardTopic,
      allPartsConversation,
      allPartsAcousticMetrics,
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
  isPartComplete,
  isPart2Intro,
  isPart2Prep,
  prepTimeLeft,
  cueCardTopic,
  allPartsConversation,
  allPartsAcousticMetrics,
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
        isPartComplete,
        isPart2Intro,
        isPart2Prep,
        prepTimeLeft,
        cueCardTopic,
        allPartsConversation,
        allPartsAcousticMetrics,
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
    isPartComplete,
    isPart2Intro,
    isPart2Prep,
    prepTimeLeft,
    cueCardTopic,
    allPartsConversation,
    allPartsAcousticMetrics,
    session,
  ]);
}

function isPartCompletionBlocked({
  isLoading,
  isTestComplete,
  isPartComplete,
  isProcessingRef,
  isSpeaking,
  isListening,
  timerExpiredRef,
}) {
  return (
    isLoading ||
    isTestComplete ||
    isPartComplete ||
    isProcessingRef.current ||
    isSpeaking ||
    isListening ||
    timerExpiredRef.current
  );
}

export function shouldAutoCompletePart({
  timeLeft,
  testStarted,
  isLoading,
  isTestComplete,
  isPartComplete,
  isProcessingRef,
  isSpeaking,
  isListening,
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
      isListening,
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
  isListening,
  cancelListening,
  currentPartNumber,
  setConversation,
  saveSessionProgress,
  session,
  conversationRef,
  isProcessingRef,
  timerExpiredRef,
  pendingTimersRef,
  serverAuthoritative,
}) {
  useEffect(() => {
    if (serverAuthoritative) return;
    if (timeLeft === 0 && isListening) {
      cancelListening();
      return;
    }

    if (
      !shouldAutoCompletePart({
        timeLeft,
        testStarted,
        isLoading,
        isTestComplete,
        isPartComplete,
        isProcessingRef,
        isSpeaking,
        isListening,
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
    isListening,
    cancelListening,
    currentPartNumber,
    setConversation,
    saveSessionProgress,
    session?.content_data,
    conversationRef,
    isProcessingRef,
    timerExpiredRef,
    pendingTimersRef,
    session,
    serverAuthoritative,
  ]);
}

function usePart2PrepCountdown({
  isPart2Prep,
  prepTimeLeft,
  setPrepTimeLeft,
  prepTimerRef,
  handleStartPart2Speaking,
  currentPartNumber,
}) {
  useEffect(() => {
    if (isPart2Prep && prepTimeLeft > 0) {
      const initialSeconds = prepTimeLeft;
      const startedAt = Date.now();
      prepTimerRef.current = setInterval(() => {
        const remaining = getCountdownSeconds(initialSeconds, startedAt);
        setPrepTimeLeft(remaining);
        if (remaining === 0) {
          clearInterval(prepTimerRef.current);
          handleStartPart2Speaking();
        }
      }, 1000);
    }

    return () => {
      if (prepTimerRef.current) {
        clearInterval(prepTimerRef.current);
      }
    };
  }, [isPart2Prep, handleStartPart2Speaking, currentPartNumber, prepTimerRef, setPrepTimeLeft]);
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
  usePartCountdown({ ...options, isPaused: options.isPaused || options.serverAuthoritative });
  usePeriodicProgressSave(options);
  useTimerExpiryCompletion(options);
  usePart2PrepCountdown(options);
  usePartCompleteKeyboardShortcut(options);
}
