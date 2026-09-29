import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';

// Local components
import SpeakingTestPageView from '../components/SpeakingTestPageView';

// Custom hooks
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';
import useAudioRecorder from '../hooks/useAudioRecorder';
import useMoveToNextSpeakingPart from '../hooks/useMoveToNextSpeakingPart';
import useSpeakAiMessageFromLoadingState from '../hooks/useSpeakAiMessageFromLoadingState';
import useSpeakingEvaluation from '../hooks/useSpeakingEvaluation';
import useSpeakingNavigationBlocker from '../hooks/useSpeakingNavigationBlocker';
import useSpeakingQuotaCheck from '../hooks/useSpeakingQuotaCheck';
import useSpeakingRecordingProcessor from '../hooks/useSpeakingRecordingProcessor';
import useSpeakingSessionEffects from '../hooks/useSpeakingSessionEffects';
import useSpeakingSessionPersistence from '../hooks/useSpeakingSessionPersistence';
import useSpeakingTestInitialization from '../hooks/useSpeakingTestInitialization';
import useSpeakingTestState from '../hooks/useSpeakingTestState';
import useSpeakingTimers from '../hooks/useSpeakingTimers';
import useExaminerVoiceSelection from '../hooks/useExaminerVoiceSelection';
import useStartPartTwoSpeaking from '../hooks/useStartPartTwoSpeaking';
import useStartSpeakingTest from '../hooks/useStartSpeakingTest';
import usePracticeBargeIn from '../hooks/usePracticeBargeIn';
import { shouldAutomaticallyFinalizeSpeaking } from '../utils/autoFinalEvaluation';
import { canAutoStartSpeakingAnswer } from '../utils/speakingCaptureUtils';
import { createSpeakingPartTransitionGuard } from '../utils/speakingPartTransitionGuard';
import { isSpeakingV2Available } from '../utils/speakingV2';
import { advanceSpeakingV2Part } from '../utils/speakingV2Transition';
import { callEdgeFunction } from '@/utils/api';
import { toast } from 'sonner';

const HANDS_FREE_STORAGE_KEY = 'ielts-speaking-hands-free';

function getInitialHandsFreePreference() {
  try {
    return window.localStorage.getItem(HANDS_FREE_STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SpeakingTest() {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const testId = paramId || searchParams.get('test-id');
  const { userProfile: authUser, loading: authLoading } = useAuth();
  const [handsFreeEnabled, setHandsFreeEnabled] = useState(getInitialHandsFreePreference);
  const handsFreeEnabledRef = useRef(handsFreeEnabled);
  handsFreeEnabledRef.current = handsFreeEnabled;
  const autoStartRequestedRef = useRef(false);
  const autoFinalEvaluationRequestedRef = useRef(false);
  const serverFinishRequestedRef = useRef(false);
  const partTransitionGuardRef = useRef(createSpeakingPartTransitionGuard());
  const [isPartTransitioning, setIsPartTransitioning] = useState(false);
  const [autoStartRequestVersion, setAutoStartRequestVersion] = useState(0);
  const requestAutoStart = useCallback(() => {
    if (!handsFreeEnabledRef.current) return;
    autoStartRequestedRef.current = true;
    setAutoStartRequestVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(HANDS_FREE_STORAGE_KEY, String(handsFreeEnabled));
    } catch {
      // The preference remains active for this session when storage is unavailable.
    }
    if (!handsFreeEnabled) autoStartRequestedRef.current = false;
  }, [handsFreeEnabled]);

  // ─── TTS Hook ──────────────────────────────────────────────────────────
  const {
    speakText,
    cancelCurrentAudio,
    interruptCurrentAudio,
    isSpeaking,
    isTTSLoading,
    activeSpeechText,
    isPlaybackActive,
    speechProgress,
    isMuted,
    setIsMuted,
  } = useSpeechSynthesis();

  const {
    acousticMetricsRef,
    allParts,
    allPartsAcousticMetrics,
    allPartsConversation,
    conversation,
    conversationContainerRef,
    conversationRef,
    cueCardTopic,
    currentPartNumber,
    currentQuestionIndex,
    error,
    examinerVoice,
    firstQuestionInsertedRef,
    isExiting,
    isLoading,
    isMountedRef,
    isPart2Intro,
    isPart2Prep,
    isPartComplete,
    isProcessing,
    isProcessingRef,
    isStartingTestRef,
    isTestComplete,
    pendingGreetingRef,
    pendingTimersRef,
    prepTimeLeft,
    prepTimerRef,
    processingStatus,
    questionIndexRef,
    session,
    speakingMode,
    speakingV2State,
    setAllParts,
    setAllPartsAcousticMetrics,
    setAllPartsConversation,
    setConversation,
    setCueCardTopic,
    setCurrentPartNumber,
    setCurrentQuestionIndex,
    setError,
    setExaminerVoice,
    setIsLoading,
    setIsPart2Intro,
    setIsPart2Prep,
    setIsPartComplete,
    setIsProcessing,
    setIsTestComplete,
    setPrepTimeLeft,
    setProcessingStatus,
    setSession,
    setSpeakingMode,
    setSpeakingV2State,
    setShowExitDialog,
    setShowUpgradeDialog,
    setTestStarted,
    setTestTitle,
    setTimeLeft,
    showExitDialog,
    showUpgradeDialog,
    testStarted,
    testTitle,
    timeLeft,
    timeLeftRef,
    timerExpiredRef,
    transitionCardRef,
  } = useSpeakingTestState();

  const {
    handleExaminerVoiceChange,
    handleSpeakingModeChange,
    handleVoicePreview,
    previewVoice,
    stopVoicePreview,
  } = useExaminerVoiceSelection({
    cancelCurrentAudio,
    isMuted,
    setExaminerVoice,
    setSpeakingMode,
    speakText,
  });
  const speakingV2Available = isSpeakingV2Available(authUser);
  // All active Speaking sessions now run through the server-authoritative flow.
  // Legacy sessions are intentionally not resumed; initialization starts a clean V2 attempt.
  const useSpeakingV2 = speakingV2Available;

  useEffect(() => {
    if (!useSpeakingV2 || speakingMode !== 'practice' || !testStarted || !session?.id) return;
    const sendHeartbeat = () => {
      callEdgeFunction('processSpeakingSessionV2', {
        action: 'heartbeat',
        sessionId: session.id,
      })
        .then((result) => setSpeakingV2State(result.state))
        .catch((heartbeatError) =>
          console.warn('Speaking Practice heartbeat failed:', heartbeatError?.message)
        );
    };
    const heartbeat = window.setInterval(sendHeartbeat, 15_000);
    return () => window.clearInterval(heartbeat);
  }, [session?.id, setSpeakingV2State, speakingMode, testStarted, useSpeakingV2]);

  useEffect(() => {
    if (!useSpeakingV2 || speakingMode !== 'exam' || !speakingV2State?.expiresAt) return;
    const syncExamClock = () => {
      const remaining = Math.max(
        0,
        Math.ceil((new Date(speakingV2State.expiresAt).getTime() - Date.now()) / 1000)
      );
      setTimeLeft(remaining);
    };
    syncExamClock();
    const clock = window.setInterval(syncExamClock, 1_000);
    return () => window.clearInterval(clock);
  }, [setTimeLeft, speakingMode, speakingV2State?.expiresAt, useSpeakingV2]);

  useEffect(() => {
    if (
      !useSpeakingV2 ||
      speakingMode !== 'practice' ||
      speakingV2State?.remainingActiveSeconds == null
    ) {
      return;
    }
    setTimeLeft(speakingV2State.remainingActiveSeconds);
  }, [setTimeLeft, speakingMode, speakingV2State?.remainingActiveSeconds, useSpeakingV2]);

  useSpeakingSessionEffects({
    testId,
    cancelCurrentAudio,
    conversation,
    currentQuestionIndex,
    timeLeft,
    isProcessing,
    isPartComplete,
    transitionCardRef,
    conversationRef,
    questionIndexRef,
    timeLeftRef,
    isProcessingRef,
    pendingTimersRef,
    isMountedRef,
    useSpeakingV2,
  });

  const saveSessionProgress = useSpeakingSessionPersistence(session?.id, session?.content_data);

  const flushCurrentSession = useCallback(async () => {
    if (!session?.id || !testStarted || isTestComplete) return Promise.resolve();

    if (useSpeakingV2 && speakingMode === 'practice') {
      await callEdgeFunction('processSpeakingSessionV2', {
        action: 'pause',
        sessionId: session.id,
      }).catch(() => {});
    }

    return saveSessionProgress({
      answers: {
        ...session.answers,
        conversation: conversationRef.current,
        currentQuestionIndex: questionIndexRef.current,
        timeLeft: timeLeftRef.current,
      },
      content_data: {
        ...session.content_data,
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
  }, [
    allPartsAcousticMetrics,
    allPartsConversation,
    cueCardTopic,
    currentPartNumber,
    conversationRef,
    isPart2Intro,
    isPart2Prep,
    isPartComplete,
    isTestComplete,
    prepTimeLeft,
    questionIndexRef,
    saveSessionProgress,
    session,
    testStarted,
    timeLeftRef,
    speakingMode,
    useSpeakingV2,
  ]);

  const {
    loadingMessage,
    finalEvaluation,
    setFinalEvaluation,
    isEvaluating,
    evaluationError,
    setEvaluationError,
    detailedFeedback,
    isGeneratingDetailed,
    deepDiveError,
    showConfetti,
    setShowConfetti,
    showXPNotification,
    setShowXPNotification,
    earnedXP,
    requestFinalEvaluation,
    fireDeepDive,
  } = useSpeakingEvaluation({
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
  });

  useEffect(() => {
    if (!useSpeakingV2 || !session?.id) return;
    if (
      speakingMode === 'exam' &&
      timeLeft === 0 &&
      speakingV2State?.status === 'active' &&
      !serverFinishRequestedRef.current
    ) {
      serverFinishRequestedRef.current = true;
      callEdgeFunction('processSpeakingSessionV2', {
        action: 'finish_exam',
        sessionId: session.id,
      })
        .then((result) => setSpeakingV2State(result.state))
        .catch((finishError) => {
          serverFinishRequestedRef.current = false;
          console.warn('Could not finish expired Speaking exam:', finishError?.message);
        });
      return;
    }
    if (
      speakingV2State?.status === 'ready_for_evaluation' &&
      !isSpeaking &&
      !isTTSLoading &&
      !isProcessing &&
      !isEvaluating &&
      !autoFinalEvaluationRequestedRef.current
    ) {
      autoFinalEvaluationRequestedRef.current = true;
      requestFinalEvaluation();
    }
  }, [
    isEvaluating,
    isProcessing,
    isSpeaking,
    isTTSLoading,
    requestFinalEvaluation,
    session?.id,
    setSpeakingV2State,
    speakingMode,
    speakingV2State?.status,
    testStarted,
    timeLeft,
    useSpeakingV2,
  ]);

  // ─── Navigation Blocker ────────────────────────────────────────────────
  const blocker = useSpeakingNavigationBlocker({
    isTestComplete,
    isExiting,
    evaluationError,
    showUpgradeDialog,
    testStarted,
    setShowExitDialog,
  });

  const checkCurrentQuota = useSpeakingQuotaCheck({ authUser, setShowUpgradeDialog });

  const speakAiMessageFromLoadingState = useSpeakAiMessageFromLoadingState({
    setConversation,
    speakText,
  });

  const processRecording = useSpeakingRecordingProcessor({
    setError,
    setTestStarted,
    allParts,
    acousticMetricsRef,
    conversationRef,
    currentPartNumber,
    pendingTimersRef,
    questionIndexRef,
    requestAutoStart,
    saveSessionProgress,
    session,
    setAllPartsAcousticMetrics,
    setConversation,
    setCurrentQuestionIndex,
    setIsPartComplete,
    setIsProcessing,
    setProcessingStatus,
    setShowUpgradeDialog,
    setSpeakingV2State,
    speakingV2State,
    speakAiMessageFromLoadingState,
    speakText,
    testId,
    timerExpiredRef,
    isMountedRef,
    useSpeakingV2,
  });

  // Practice mode is always hands-free: the coach listens after it speaks and
  // sends after a natural pause. The learner can still pause auto-sending.
  const isHandsFree = handsFreeEnabled || speakingMode === 'practice';
  handsFreeEnabledRef.current = isHandsFree;

  const recorder = useAudioRecorder({
    processRecording,
    partNumber: currentPartNumber,
    handsFreeEnabled: isHandsFree,
  });
  const {
    cancelListening,
    isListening,
    setIsProcessing: setRecorderProcessing,
    startListening,
  } = recorder;

  // Keep recorder hook aware of processing state
  useEffect(() => {
    setRecorderProcessing(isProcessing);
  }, [isProcessing, setRecorderProcessing]);

  useEffect(() => {
    const canStartAutomatically = canAutoStartSpeakingAnswer({
      requested: autoStartRequestedRef.current,
      handsFreeEnabled: isHandsFree,
      testStarted,
      isProcessing,
      isSpeaking,
      isTTSLoading,
      isPlaybackActive,
      isListening,
      isPartComplete,
      isPart2Intro,
      isPart2Prep,
      isTestComplete,
    });
    if (!canStartAutomatically) return;

    autoStartRequestedRef.current = false;
    startListening();
  }, [
    autoStartRequestVersion,
    isListening,
    isHandsFree,
    isPart2Intro,
    isPart2Prep,
    isPartComplete,
    isProcessing,
    isSpeaking,
    isTTSLoading,
    isPlaybackActive,
    isTestComplete,
    startListening,
    testStarted,
  ]);

  useEffect(() => {
    if (isTestComplete) {
      cancelListening();
      cancelCurrentAudio();
    }
  }, [cancelCurrentAudio, cancelListening, isTestComplete]);

  // Practice barge-in: when the learner starts talking over the coach, the
  // coach stops mid-sentence and the answer recorder takes over the mic.
  const handleInterruptSpeech = useCallback(() => {
    interruptCurrentAudio();
    requestAutoStart();
  }, [interruptCurrentAudio, requestAutoStart]);
  const canInterruptSpeech =
    speakingMode === 'practice' &&
    testStarted &&
    !isProcessing &&
    !isListening &&
    !isPartComplete &&
    !isPart2Intro &&
    !isPart2Prep &&
    !isTestComplete;
  usePracticeBargeIn({
    enabled: canInterruptSpeech,
    isPlaybackActive,
    onBargeIn: handleInterruptSpeech,
  });

  const handleHandsFreeChange = useCallback(
    (enabled) => {
      setHandsFreeEnabled(enabled);
      if (
        enabled &&
        canAutoStartSpeakingAnswer({
          requested: true,
          handsFreeEnabled: true,
          testStarted,
          isProcessing,
          isSpeaking,
          isTTSLoading,
          isPlaybackActive,
          isListening,
          isPartComplete,
          isPart2Intro,
          isPart2Prep,
          isTestComplete,
        })
      ) {
        requestAutoStart();
      }
    },
    [
      isListening,
      isPart2Intro,
      isPart2Prep,
      isPartComplete,
      isProcessing,
      isSpeaking,
      isTTSLoading,
      isPlaybackActive,
      isTestComplete,
      requestAutoStart,
      testStarted,
    ]
  );

  const moveToNextPartLegacy = useMoveToNextSpeakingPart({
    allParts,
    allPartsConversation,
    conversation,
    currentPartNumber,
    requestFinalEvaluation,
    saveSessionProgress,
    session,
    setAllPartsConversation,
    setConversation,
    setCueCardTopic,
    setCurrentPartNumber,
    setCurrentQuestionIndex,
    setIsPart2Intro,
    setIsPart2Prep,
    setIsPartComplete,
    setPrepTimeLeft,
    setTimeLeft,
    speakText,
    requestAutoStart,
    timerExpiredRef,
    isMountedRef,
  });
  const moveToNextPart = useCallback(async () => {
    if (!partTransitionGuardRef.current.acquire()) return;
    setIsPartTransitioning(true);
    try {
      if (useSpeakingV2 && allParts[currentPartNumber + 1]) {
        const result = await advanceSpeakingV2Part({
          callEdgeFunction,
          sessionId: session?.id,
          expectedRevision: speakingV2State?.revision,
          currentPartNumber,
        });
        setSpeakingV2State(result.state);
      }
      return await moveToNextPartLegacy();
    } catch (error) {
      toast.error(`Could not open Part ${currentPartNumber + 1}`, {
        description: error?.userMessage || error?.message || 'Please try again.',
      });
      return undefined;
    } finally {
      partTransitionGuardRef.current.release();
      setIsPartTransitioning(false);
    }
  }, [
    allParts,
    currentPartNumber,
    moveToNextPartLegacy,
    session?.id,
    setSpeakingV2State,
    speakingV2State?.revision,
    useSpeakingV2,
  ]);

  useEffect(() => {
    if (useSpeakingV2) return;
    const isFinalPart = Object.keys(allParts).length > 0 && !allParts[currentPartNumber + 1];
    if (!isPartComplete || !isFinalPart) {
      autoFinalEvaluationRequestedRef.current = false;
    }

    if (
      !shouldAutomaticallyFinalizeSpeaking({
        allParts,
        currentPartNumber,
        isPartComplete,
        isTestComplete,
        isEvaluating,
        evaluationStatus: session?.evaluation_status,
        evaluationPending: session?.content_data?.evaluationPending,
        alreadyRequested: autoFinalEvaluationRequestedRef.current,
      })
    ) {
      return;
    }

    autoFinalEvaluationRequestedRef.current = true;
    moveToNextPart();
  }, [
    allParts,
    currentPartNumber,
    isEvaluating,
    isPartComplete,
    isTestComplete,
    moveToNextPart,
    session?.content_data?.evaluationPending,
    session?.evaluation_status,
    useSpeakingV2,
  ]);

  useSpeakingTestInitialization({
    testId,
    authLoading,
    authUser,
    acousticMetricsRef,
    pendingGreetingRef,
    checkCurrentQuota,
    requestFinalEvaluation,
    setAllParts,
    setAllPartsAcousticMetrics,
    setAllPartsConversation,
    setConversation,
    setCueCardTopic,
    setCurrentPartNumber,
    setCurrentQuestionIndex,
    setError,
    setExaminerVoice,
    setFinalEvaluation,
    setIsLoading,
    setIsPart2Intro,
    setIsPart2Prep,
    setIsPartComplete,
    setIsTestComplete,
    setSession,
    setSpeakingMode,
    setSpeakingV2State,
    setPrepTimeLeft,
    setTestStarted,
    setTestTitle,
    setTimeLeft,
    requestAutoStart,
    speakText,
    isMountedRef,
  });

  const handleStartTest = useStartSpeakingTest({
    allParts,
    authUser,
    examinerVoice,
    checkCurrentQuota,
    firstQuestionInsertedRef,
    isStartingTestRef,
    pendingGreetingRef,
    session,
    setConversation,
    setCurrentQuestionIndex,
    setSession,
    setSpeakingV2State,
    setTestStarted,
    speakingMode,
    requestAutoStart,
    speakText,
    testId,
    useSpeakingV2,
  });

  const handleBeginTest = useCallback(() => {
    stopVoicePreview();
    handleStartTest();
  }, [handleStartTest, stopVoicePreview]);

  const currentPart = allParts[currentPartNumber];

  const handleStartPart2Speaking = useStartPartTwoSpeaking({
    currentPart,
    setConversation,
    setCueCardTopic,
    setCurrentQuestionIndex,
    setIsPart2Prep,
    saveSessionProgress,
    session,
    requestAutoStart,
    speakText,
  });

  // ─── Timer Effects ─────────────────────────────────────────────────────
  useSpeakingTimers({
    isLoading,
    error,
    timeLeft,
    setTimeLeft,
    isTestComplete,
    testStarted,
    session,
    currentPartNumber,
    saveSessionProgress,
    isPartComplete,
    setIsPartComplete,
    isSpeaking,
    isListening,
    cancelListening,
    setConversation,
    handleStartPart2Speaking,
    isPart2Intro,
    isPart2Prep,
    prepTimeLeft,
    setPrepTimeLeft,
    prepTimerRef,
    isProcessing,
    isEvaluating,
    moveToNextPart,
    conversationRef,
    questionIndexRef,
    timeLeftRef,
    isProcessingRef,
    timerExpiredRef,
    pendingTimersRef,
    cueCardTopic,
    allPartsConversation,
    allPartsAcousticMetrics,
    isPaused: recorder.autoSubmitPaused || isPart2Intro,
    serverAuthoritative: useSpeakingV2,
  });

  return (
    <SpeakingTestPageView
      error={error}
      isLoading={isLoading}
      isTestComplete={isTestComplete}
      navigate={navigate}
      reportProps={{
        testDate: session?.completed_at || session?.created_at,
        finalEvaluation,
        isEvaluating,
        evaluationError,
        testTitle,
        loadingMessage,
        allPartsPronunciation: allPartsAcousticMetrics,
        onRetryEvaluation: () => {
          setEvaluationError(null);
          requestFinalEvaluation();
        },
        showConfetti,
        onConfettiComplete: () => setShowConfetti(false),
        showXPNotification,
        earnedXP,
        onXPComplete: () => setShowXPNotification(false),
        isExitingRef: isExiting,
        testId,
        allPartsConversation,
        detailedFeedback,
        isGeneratingDetailed,
        deepDiveError,
        onRetryDeepDive: () => fireDeepDive(allPartsConversation),
      }}
      shellProps={{
        allParts,
        authUser,
        blocker,
        currentPart,
        currentPartNumber,
        exitDialogProps: {
          onOpenChange: setShowExitDialog,
          isExitingRef: isExiting,
          onBeforeExit: flushCurrentSession,
        },
        headerProps: {
          currentQuestionIndex,
          timeLeft,
          isMuted,
          setIsMuted,
        },
        conversationPanelProps: {
          conversation,
          testStarted,
          isPartComplete,
          moveToNextPart,
          isPartTransitioning,
          conversationContainerRef,
          isPart2Prep,
          isPart2Intro,
          cueCardTopic,
          prepTimeLeft,
          handleStartPart2Speaking,
          ...recorder,
          isProcessing,
          isSpeaking,
          isTTSLoading,
          activeSpeechText,
          isPlaybackActive,
          speechProgress,
          processingStatus,
          handsFreeEnabled: isHandsFree,
          onInterruptSpeech: canInterruptSpeech ? handleInterruptSpeech : undefined,
          timeExpired: testStarted && timeLeft === 0,
          timerExpiredRef,
          handleStartTest: handleBeginTest,
          speakingMode,
          setSpeakingMode: handleSpeakingModeChange,
          examinerVoice,
          onExaminerVoiceChange: handleExaminerVoiceChange,
          onVoicePreview: handleVoicePreview,
          previewVoice,
          speakingV2Available,
        },
        isTestComplete,
        handsFreeEnabled: isHandsFree,
        setHandsFreeEnabled: handleHandsFreeChange,
        setShowExitDialog,
        showExitDialog,
        showUpgradeDialog,
        testStarted,
        testTitle,
        totalParts: Object.keys(allParts).length,
        speakingMode,
        speakingV2State,
        upgradeDialogProps: {
          onOpenChange: setShowUpgradeDialog,
          isExitingRef: isExiting,
        },
      }}
    />
  );
}
