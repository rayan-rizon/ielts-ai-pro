import { useCallback, useEffect, useRef, useState } from 'react';

import { setSpeakingTtsProfile, setSpeakingTtsVoice } from '../utils/speakingTtsPrefetch';

export default function useSpeakingTestState() {
  const [session, setSession] = useState(null);
  const [currentPartNumber, setCurrentPartNumber] = useState(1);
  const [allParts, setAllParts] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [testTitle, setTestTitle] = useState('');
  const [speakingMode, setSpeakingMode] = useState('practice');
  const [examinerVoice, setExaminerVoice] = useState('british-female');
  const [speakingV2State, setSpeakingV2State] = useState(null);

  // Keep the active voice route aligned with the selected Speaking mode.
  // Reset on unmount so no other page inherits the current profile.
  useEffect(() => {
    setSpeakingTtsProfile(speakingMode);
  }, [speakingMode]);
  useEffect(() => {
    setSpeakingTtsVoice(examinerVoice);
  }, [examinerVoice]);
  useEffect(() => () => setSpeakingTtsProfile('exam'), []);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  const [conversation, setConversationRaw] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const conversationContainerRef = useRef(null);
  const transitionCardRef = useRef(null);
  const conversationRef = useRef([]);
  const questionIndexRef = useRef(0);

  const stampTimestamp = useCallback((entry) => {
    if (entry && typeof entry === 'object' && !entry.timestamp && !entry.isLoading) {
      return {
        ...entry,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }
    return entry;
  }, []);

  const setConversation = useCallback(
    (valueOrUpdater) => {
      if (typeof valueOrUpdater === 'function') {
        setConversationRaw((prev) => {
          const result = valueOrUpdater(prev);
          return Array.isArray(result) ? result.map(stampTimestamp) : result;
        });
      } else if (Array.isArray(valueOrUpdater)) {
        setConversationRaw(valueOrUpdater.map(stampTimestamp));
      } else {
        setConversationRaw(valueOrUpdater);
      }
    },
    [stampTimestamp]
  );

  const [allPartsConversation, setAllPartsConversation] = useState(
    session?.content_data?.allPartsConversation || {}
  );
  const [isPartComplete, setIsPartComplete] = useState(false);
  const [isTestComplete, setIsTestComplete] = useState(false);

  const acousticMetricsRef = useRef(session?.content_data?.allPartsAcousticMetrics || {});
  const [allPartsAcousticMetrics, setAllPartsAcousticMetrics] = useState(
    session?.content_data?.allPartsAcousticMetrics || {}
  );

  const [testStarted, setTestStarted] = useState(false);
  const pendingGreetingRef = useRef(null);
  const [isPart2Intro, setIsPart2Intro] = useState(false);
  const [isPart2Prep, setIsPart2Prep] = useState(false);
  const [prepTimeLeft, setPrepTimeLeft] = useState(60);
  const [cueCardTopic, setCueCardTopic] = useState(null);
  const prepTimerRef = useRef(null);

  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const firstQuestionInsertedRef = useRef(false);
  const isStartingTestRef = useRef(false);
  const isProcessingRef = useRef(false);
  const pendingTimersRef = useRef(new Set());
  const isExiting = useRef(false);
  const timerExpiredRef = useRef(false);
  const timeLeftRef = useRef(0);
  const isMountedRef = useRef(true);

  return {
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
  };
}
