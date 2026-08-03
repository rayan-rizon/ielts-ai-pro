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
import useStartPartTwoSpeaking from '../hooks/useStartPartTwoSpeaking';
import useStartSpeakingTest from '../hooks/useStartSpeakingTest';
import { shouldAutomaticallyFinalizeSpeaking } from '../utils/autoFinalEvaluation';
import { canAutoStartSpeakingAnswer } from '../utils/speakingCaptureUtils';

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
    firstQuestionInsertedRef,
    isExiting,
    isLoading,
    isMountedRef,
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
    setAllParts,
    setAllPartsAcousticMetrics,
    setAllPartsConversation,
    setConversation,
    setCueCardTopic,
    setCurrentPartNumber,
    setCurrentQuestionIndex,
    setError,
    setIsLoading,
    setIsPart2Prep,
    setIsPartComplete,
    setIsProcessing,
    setIsTestComplete,
    setPrepTimeLeft,
    setProcessingStatus,
    setSession,
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
  });

  const saveSessionProgress = useSpeakingSessionPersistence(session?.id, session?.content_data);

  const flushCurrentSession = useCallback(() => {
    if (!session?.id || !testStarted || isTestComplete) return Promise.resolve();

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
    isPart2Prep,
    isPartComplete,
    isTestComplete,
    prepTimeLeft,
    questionIndexRef,
    saveSessionProgress,
    session,
    testStarted,
    timeLeftRef,
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
    speakAiMessageFromLoadingState,
    speakText,
    testId,
    timerExpiredRef,
  });

  const recorder = useAudioRecorder({
    processRecording,
    partNumber: currentPartNumber,
    handsFreeEnabled,
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
      handsFreeEnabled,
      testStarted,
      isProcessing,
      isSpeaking,
      isTTSLoading,
      isListening,
      isPartComplete,
      isPart2Prep,
      isTestComplete,
    });
    if (!canStartAutomatically) return;

    autoStartRequestedRef.current = false;
    startListening();
  }, [
    autoStartRequestVersion,
    isListening,
    handsFreeEnabled,
    isPart2Prep,
    isPartComplete,
    isProcessing,
    isSpeaking,
    isTTSLoading,
    isTestComplete,
    startListening,
    testStarted,
  ]);

  useEffect(() => {
    if (isTestComplete) {
      cancelListening();
    }
  }, [cancelListening, isTestComplete]);

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
          isListening,
          isPartComplete,
          isPart2Prep,
          isTestComplete,
        })
      ) {
        requestAutoStart();
      }
    },
    [
      isListening,
      isPart2Prep,
      isPartComplete,
      isProcessing,
      isSpeaking,
      isTTSLoading,
      isTestComplete,
      requestAutoStart,
      testStarted,
    ]
  );

  const moveToNextPart = useMoveToNextSpeakingPart({
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
    setIsPart2Prep,
    setIsPartComplete,
    setPrepTimeLeft,
    setTimeLeft,
    speakText,
    requestAutoStart,
    timerExpiredRef,
  });

  useEffect(() => {
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
    setFinalEvaluation,
    setIsLoading,
    setIsPart2Prep,
    setIsPartComplete,
    setIsTestComplete,
    setSession,
    setPrepTimeLeft,
    setTestStarted,
    setTestTitle,
    setTimeLeft,
    requestAutoStart,
    speakText,
  });

  const handleStartTest = useStartSpeakingTest({
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
    requestAutoStart,
    speakText,
    testId,
  });

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
  });

  return (
    <SpeakingTestPageView
      error={error}
      isLoading={isLoading}
      isTestComplete={isTestComplete}
      navigate={navigate}
      reportProps={{
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
          conversationContainerRef,
          isPart2Prep,
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
          handsFreeEnabled,
          timerExpiredRef,
          handleStartTest,
        },
        isTestComplete,
        handsFreeEnabled,
        setHandsFreeEnabled: handleHandsFreeChange,
        setShowExitDialog,
        showExitDialog,
        showUpgradeDialog,
        testStarted,
        testTitle,
        totalParts: Object.keys(allParts).length,
        upgradeDialogProps: {
          onOpenChange: setShowUpgradeDialog,
          isExitingRef: isExiting,
        },
      }}
    />
  );
}
