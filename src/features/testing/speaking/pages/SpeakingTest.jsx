import { useEffect } from 'react';
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

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SpeakingTest() {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const testId = paramId || searchParams.get('test-id');
  const { userProfile: authUser, loading: authLoading } = useAuth();

  // ─── TTS Hook ──────────────────────────────────────────────────────────
  const { speakText, cancelCurrentAudio, isSpeaking, isTTSLoading, isMuted, setIsMuted } =
    useSpeechSynthesis();

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
    conversationContainerRef,
    transitionCardRef,
    conversationRef,
    questionIndexRef,
    timeLeftRef,
    isProcessingRef,
    pendingTimersRef,
    isMountedRef,
  });

  const saveSessionProgress = useSpeakingSessionPersistence(session?.id, session?.content_data);

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
    conversationLength: conversation.length,
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

  // ─── Audio Recorder Hook ───────────────────────────────────────────────
  const {
    startListening,
    stopListening,
    cancelListening,
    isListening,
    isRecording,
    micError,
    setIsProcessing: setRecorderProcessing,
  } = useAudioRecorder({ processRecording });

  // Keep recorder hook aware of processing state
  useEffect(() => {
    setRecorderProcessing(isProcessing);
  }, [isProcessing, setRecorderProcessing]);

  useEffect(() => {
    if (isTestComplete) {
      cancelListening();
    }
  }, [cancelListening, isTestComplete]);

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
    timerExpiredRef,
  });

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
    setCurrentPartNumber,
    setCurrentQuestionIndex,
    setError,
    setFinalEvaluation,
    setIsLoading,
    setIsPartComplete,
    setIsTestComplete,
    setSession,
    setTestStarted,
    setTestTitle,
    setTimeLeft,
  });

  const handleStartTest = useStartSpeakingTest({
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
  });

  const currentPart = allParts[currentPartNumber];

  const handleStartPart2Speaking = useStartPartTwoSpeaking({
    currentPart,
    setConversation,
    setCueCardTopic,
    setCurrentQuestionIndex,
    setIsPart2Prep,
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
        conversationLength: conversation.length,
        currentPart,
        currentPartNumber,
        exitDialogProps: {
          onOpenChange: setShowExitDialog,
          isExitingRef: isExiting,
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
          isListening,
          isRecording,
          isProcessing,
          isSpeaking,
          isTTSLoading,
          processingStatus,
          micError,
          timerExpiredRef,
          startListening,
          stopListening,
          handleStartTest,
        },
        isTestComplete,
        setShowExitDialog,
        showExitDialog,
        showUpgradeDialog,
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
