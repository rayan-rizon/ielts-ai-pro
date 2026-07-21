import { useCallback, useRef } from 'react';
import { toast } from 'sonner';

import { callEdgeFunction } from '@/utils/api';

import {
  buildConversationHistory,
  buildLocalDevSpeakingResponse,
  formatIeltsQuestion,
  getQuestionLines,
  isTranscriptError,
} from '../utils/speakingTestUtils';
import {
  blobToBase64,
  convertAudioBlobToWav16kMono,
  shouldRequestPronunciationSample,
} from '../utils/audioProcessing';

export default function useSpeakingRecordingProcessor({
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
}) {
  const pronunciationAttemptedPartsRef = useRef(new Set());

  return useCallback(
    async (audioBlob, metadata = {}) => {
      if (metadata.error === 'too_short') {
        toast.warning('Recording too short', {
          description: 'Please speak for at least a few seconds.',
          duration: 3000,
        });
        return;
      }

      if (!audioBlob || audioBlob.size < 5000) {
        setConversation((prev) => prev.filter((entry) => !entry.isLoading));
        const message = "I didn't hear anything. Please click the microphone and speak clearly.";
        setConversation((prev) => [...prev, { speaker: 'ai', text: message }]);
        speakText(message);
        return;
      }

      setIsProcessing(true);
      setProcessingStatus('Processing your answer...');
      setConversation((prev) => [...prev, { speaker: 'user', text: '...', isLoading: true }]);

      try {
        const audioBase64 = await blobToBase64(audioBlob);

        const snapshotQuestionIndex = questionIndexRef.current;
        const currentPart = allParts[currentPartNumber];
        const questionLines = getQuestionLines(currentPart?.questions);
        const questionContext = questionLines[snapshotQuestionIndex] || '';

        setProcessingStatus('Transcribing your answer...');

        let pronunciationAudioBase64 = null;
        const partSampleAlreadyAttempted =
          pronunciationAttemptedPartsRef.current.has(currentPartNumber);
        const requestPronunciation =
          !partSampleAlreadyAttempted &&
          shouldRequestPronunciationSample({
            partNumber: currentPartNumber,
            durationMs: Number(metadata.duration),
            existingSamples: acousticMetricsRef.current,
          });

        if (requestPronunciation) {
          // One bounded attempt per eligible part keeps payloads and Azure usage
          // predictable even when the provider is not configured or unavailable.
          pronunciationAttemptedPartsRef.current.add(currentPartNumber);
          try {
            setProcessingStatus('Checking pronunciation...');
            const pronunciationBlob = await convertAudioBlobToWav16kMono(audioBlob);
            pronunciationAudioBase64 = await blobToBase64(pronunciationBlob);
          } catch (error) {
            console.warn('Pronunciation sample conversion unavailable:', error);
          }
        }

        const response = await processSpeakingTurn({
          audioBase64,
          audioMimeType: audioBlob.type || 'audio/webm',
          audioDurationMs: Number(metadata.duration) || null,
          allParts,
          conversationHistory: buildConversationHistory(conversationRef.current),
          currentPartNumber,
          questionContext,
          sessionId: session?.id,
          snapshotQuestionIndex,
          speechConfidence: metadata.speechConfidence || null,
          pronunciationAudioBase64,
          pronunciationDurationMs: pronunciationAudioBase64 ? Number(metadata.duration) : null,
          requestPronunciation: Boolean(pronunciationAudioBase64),
          testId,
        });

        if (!response) {
          setConversation((prev) => prev.filter((entry) => !entry.isLoading));
          return;
        }

        setConversation((prev) => replaceLoadingUserTranscript(prev, response.userTranscript));
        await handleSpeakingResponse(response, {
          acousticMetricsRef,
          allParts,
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
          setShowUpgradeDialog,
          speakAiMessageFromLoadingState,
          timerExpiredRef,
        });
      } catch (error) {
        handleProcessingError(error, {
          pendingTimersRef,
          setConversation,
          setIsProcessing,
          speakAiMessageFromLoadingState,
          setShowUpgradeDialog,
        });
      } finally {
        setIsProcessing(false);
        setProcessingStatus('');
      }
    },
    [
      acousticMetricsRef,
      allParts,
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
    ]
  );
}

async function processSpeakingTurn({
  audioBase64,
  audioMimeType,
  audioDurationMs,
  allParts,
  conversationHistory,
  currentPartNumber,
  questionContext,
  sessionId,
  snapshotQuestionIndex,
  speechConfidence,
  pronunciationAudioBase64,
  pronunciationDurationMs,
  requestPronunciation,
  testId,
}) {
  try {
    return await callEdgeFunction('processSpeakingSession', {
      testId,
      speakingSessionId: sessionId,
      turnId: crypto.randomUUID(),
      partNumber: currentPartNumber,
      audioBase64,
      audioMimeType,
      audioDurationMs,
      conversationHistory,
      currentQuestionIndex: snapshotQuestionIndex,
      questionContext,
      speechConfidence,
      pronunciationAudioBase64,
      pronunciationDurationMs,
      requestPronunciation,
    });
  } catch (error) {
    console.error('Edge Function failed:', error);

    if (error.status === 429 || error.status === 403 || error.name === 'RateLimitError') {
      throw error;
    }

    if (import.meta.env.DEV) {
      return buildLocalDevSpeakingResponse({
        currentPart: allParts[currentPartNumber],
        currentPartNumber,
        currentQuestionIndex: snapshotQuestionIndex,
      });
    }

    toast.error('Processing Error', {
      description:
        error?.userMessage || 'Failed to process your response. Please try recording again.',
      duration: 5000,
    });
    return null;
  }
}

function replaceLoadingUserTranscript(conversation, transcript) {
  const updated = [...conversation];
  const loadingIndex = updated.findIndex((entry) => entry.isLoading);

  if (loadingIndex !== -1) {
    updated[loadingIndex] = {
      speaker: 'user',
      text: transcript || '(Unable to transcribe - please try again)',
      isLoading: false,
      error: isTranscriptError(transcript),
    };
  }

  return updated;
}

async function handleSpeakingResponse(response, context) {
  if (!response) {
    context.setConversation((prev) => prev.filter((entry) => !entry.isLoading));
    return;
  }

  if (response.success) {
    handleSuccessfulTurn(response, context);
    return;
  }

  if (response.isPartComplete) {
    handlePartCompleteResponse(response, context);
    return;
  }

  throw new Error(response.error || 'Failed to process response');
}

function handleSuccessfulTurn(response, context) {
  const {
    acousticMetricsRef,
    currentPartNumber,
    questionIndexRef,
    saveSessionProgress,
    session,
    setAllPartsAcousticMetrics,
    setCurrentQuestionIndex,
  } = context;

  const cleanExaminerResponse = formatIeltsQuestion(
    response.examinerResponse
      ?.replace(/\*\*(.*?)\*\*/g, '$1')
      ?.replace(/\*(.*?)\*/g, '$1')
      ?.replace(/#{1,6}\s/g, '')
      ?.trim()
  );

  if (cleanExaminerResponse) {
    queueAiReply(cleanExaminerResponse, response, context);
  } else if (response.isPartComplete) {
    context.setIsPartComplete(true);
  }

  if (response.nextQuestionIndex >= 0) {
    setCurrentQuestionIndex(response.nextQuestionIndex);
  }

  if (response.pronunciationData) {
    const partKey = String(currentPartNumber);
    acousticMetricsRef.current[partKey] = acousticMetricsRef.current[partKey] || [];
    acousticMetricsRef.current[partKey].push(response.pronunciationData);
    setAllPartsAcousticMetrics({ ...acousticMetricsRef.current });
  }

  saveSessionProgress({
    answers: {
      conversation: [
        ...(context.conversationRef?.current || []),
        { speaker: 'user', text: response.userTranscript, isLoading: false },
        ...(response.examinerResponse ? [{ speaker: 'ai', text: response.examinerResponse }] : []),
      ],
      currentQuestionIndex:
        response.nextQuestionIndex >= 0 ? response.nextQuestionIndex : questionIndexRef.current,
    },
    content_data: {
      ...session?.content_data,
      currentPart: currentPartNumber,
      allPartsPronunciation: acousticMetricsRef.current,
      isPartComplete: !!response.isPartComplete,
    },
  });
}

function queueAiReply(message, response, context) {
  const { currentPartNumber, pendingTimersRef, setConversation, speakAiMessageFromLoadingState } =
    context;

  const responseTimerId = setTimeout(() => {
    pendingTimersRef.current.delete(responseTimerId);
    setConversation((prev) => [...prev, { speaker: 'ai', text: '...', isLoading: true }]);
    speakAiMessageFromLoadingState(message);

    if (response.isPartComplete) {
      const partCompleteTimerId = setTimeout(() => {
        pendingTimersRef.current.delete(partCompleteTimerId);
        context.setIsPartComplete(true);
      }, 3000);
      pendingTimersRef.current.add(partCompleteTimerId);
    } else if (context.timerExpiredRef.current) {
      const timerForceCompleteId = setTimeout(() => {
        pendingTimersRef.current.delete(timerForceCompleteId);
        setConversation((prev) => [
          ...prev,
          {
            speaker: 'ai',
            text: `That's all the time we have for Part ${currentPartNumber}. Let's move on.`,
          },
        ]);
        const finalTimerId = setTimeout(() => {
          pendingTimersRef.current.delete(finalTimerId);
          context.setIsPartComplete(true);
        }, 1500);
        pendingTimersRef.current.add(finalTimerId);
      }, 2000);
      pendingTimersRef.current.add(timerForceCompleteId);
    }
  }, 500);
  pendingTimersRef.current.add(responseTimerId);
}

function handlePartCompleteResponse(response, context) {
  const {
    currentPartNumber,
    pendingTimersRef,
    saveSessionProgress,
    session,
    setConversation,
    speakAiMessageFromLoadingState,
  } = context;

  setConversation((prev) => prev.filter((entry) => !entry.isLoading));
  const farewell = response.message || `That concludes Part ${currentPartNumber}.`;
  setConversation((prev) => [...prev, { speaker: 'ai', text: '...', isLoading: true }]);
  speakAiMessageFromLoadingState(farewell);

  const completeTimerId = setTimeout(() => {
    pendingTimersRef.current.delete(completeTimerId);
    context.setIsPartComplete(true);
  }, 2500);
  pendingTimersRef.current.add(completeTimerId);

  saveSessionProgress({
    content_data: {
      ...session?.content_data,
      isPartComplete: true,
    },
  });
}

function handleProcessingError(error, context) {
  const { pendingTimersRef, setConversation, setIsProcessing, speakAiMessageFromLoadingState } =
    context;

  console.error('Error processing recording:', error);

  if (error.status === 429 || error.status === 403 || error.name === 'RateLimitError') {
    setConversation((prev) => prev.filter((entry) => !entry.isLoading));
    if (error.rateLimitType === 'quota' || error.status === 403) {
      context.setShowUpgradeDialog?.(true);
    } else {
      toast.error('Too many requests', {
        description: 'Please wait a moment before continuing.',
        duration: 4000,
      });
    }
    return;
  }

  setConversation((prev) => {
    const updated = [...prev];
    const loadingIndex = updated.findIndex((entry) => entry.isLoading);
    if (loadingIndex !== -1) {
      updated[loadingIndex] = {
        speaker: 'user',
        text: '(Failed to transcribe)',
        isLoading: false,
        error: true,
      };
    }
    return updated;
  });

  const errorRecoveryTimerId = setTimeout(() => {
    pendingTimersRef.current.delete(errorRecoveryTimerId);
    const recoveryMessage =
      "I'm sorry, I didn't quite catch that. Could you please repeat your answer?";
    setConversation((prev) => [...prev, { speaker: 'ai', text: '...', isLoading: true }]);
    speakAiMessageFromLoadingState(recoveryMessage);
    setIsProcessing(false);
  }, 1000);
  pendingTimersRef.current.add(errorRecoveryTimerId);
}
