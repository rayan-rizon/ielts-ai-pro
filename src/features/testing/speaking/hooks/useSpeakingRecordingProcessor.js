import { useCallback, useRef } from 'react';
import { toast } from 'sonner';

import { callEdgeFunction } from '@/utils/api';
import { supabase } from '@/lib/supabase';

import {
  buildConversationHistory,
  buildExpectedExaminerResponse,
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
        const message = "I didn't hear anything. I'll reopen the microphone—please speak clearly.";
        setConversation((prev) => [...prev, { speaker: 'ai', text: message }]);
        Promise.resolve(speakText(message)).finally(() => requestAutoStart?.());
        return;
      }

      setIsProcessing(true);
      setProcessingStatus('Processing your answer...');
      const draftTranscript = String(metadata.liveTranscript || '').trim();
      setConversation((prev) => [
        ...prev,
        {
          speaker: 'user',
          text: draftTranscript,
          isLoading: true,
          isTranscriptDraft: Boolean(draftTranscript),
        },
      ]);

      try {
        const snapshotQuestionIndex = questionIndexRef.current;
        const currentPart = allParts[currentPartNumber];
        const questionLines = getQuestionLines(currentPart?.questions);
        const questionContext = questionLines[snapshotQuestionIndex] || '';
        prefetchExpectedExaminerSpeech({
          currentPartNumber,
          questionLines,
          snapshotQuestionIndex,
        });
        const pronunciationPromise = preparePronunciationAudio({
          acousticMetrics: acousticMetricsRef.current,
          audioBlob,
          durationMs: Number(metadata.duration),
          partNumber: currentPartNumber,
          pronunciationAttemptedParts: pronunciationAttemptedPartsRef.current,
        });

        setProcessingStatus('Uploading your answer...');
        const [audioBase64, pronunciationAudioBase64] = await Promise.all([
          blobToBase64(audioBlob),
          pronunciationPromise,
        ]);

        setProcessingStatus(getTranscriptionStatus(pronunciationAudioBase64));

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
          requestAutoStart,
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
          requestAutoStart,
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
    ]
  );
}

function prefetchExpectedExaminerSpeech({
  currentPartNumber,
  questionLines,
  snapshotQuestionIndex,
}) {
  const isLastQuestion = snapshotQuestionIndex >= questionLines.length - 1;
  const text = buildExpectedExaminerResponse({
    currentPartNumber,
    currentQuestionIndex: snapshotQuestionIndex,
    nextQuestion: isLastQuestion ? null : questionLines[snapshotQuestionIndex + 1],
    isLastQuestion,
  });
  if (!text) return;

  supabase.functions
    .invoke('synthesizeSpeech', {
      body: { text, voice: 'en-GB-Neural2-B' },
    })
    .catch(() => {});
}

function preparePronunciationAudio({
  acousticMetrics,
  audioBlob,
  durationMs,
  partNumber,
  pronunciationAttemptedParts,
}) {
  const shouldPrepare =
    !pronunciationAttemptedParts.has(partNumber) &&
    shouldRequestPronunciationSample({
      partNumber,
      durationMs,
      existingSamples: acousticMetrics,
    });
  if (!shouldPrepare) return Promise.resolve(null);

  // One bounded attempt per eligible part keeps payloads and Azure usage
  // predictable even when the provider is not configured or unavailable.
  pronunciationAttemptedParts.add(partNumber);
  return convertAudioBlobToWav16kMono(audioBlob)
    .then(blobToBase64)
    .catch((error) => {
      console.warn('Pronunciation sample conversion unavailable:', error);
      return null;
    });
}

function getTranscriptionStatus(pronunciationAudioBase64) {
  return pronunciationAudioBase64
    ? 'Transcribing and checking pronunciation...'
    : 'Transcribing your answer...';
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
  const loadingIndex = updated.findLastIndex(
    (entry) => entry.isLoading && entry.speaker === 'user'
  );

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
      conversation: buildPersistedTurnConversation(context, response),
      currentQuestionIndex:
        response.nextQuestionIndex >= 0 ? response.nextQuestionIndex : questionIndexRef.current,
    },
    content_data: {
      ...session?.content_data,
      currentPart: currentPartNumber,
      allPartsPronunciation: acousticMetricsRef.current,
      allPartsAcousticMetrics: acousticMetricsRef.current,
      isPartComplete: !!response.isPartComplete,
    },
  });
}

function buildPersistedTurnConversation(context, response) {
  const conversation = replaceLoadingUserTranscript(
    context.conversationRef?.current || [],
    response.userTranscript
  ).filter((entry) => !entry.isLoading);
  if (!response.examinerResponse) return conversation;

  return [...conversation, { speaker: 'ai', text: response.examinerResponse }];
}

function queueAiReply(message, response, context) {
  const speechPromise = Promise.resolve(context.speakAiMessageFromLoadingState(message));

  if (response.isPartComplete) {
    speechPromise.finally(() => context.setIsPartComplete(true));
    return;
  }

  if (context.timerExpiredRef.current) {
    speechPromise.finally(() => finishExpiredPart(context));
    return;
  }

  speechPromise.finally(() => context.requestAutoStart?.());
}

function finishExpiredPart(context) {
  const message = `That's all the time we have for Part ${context.currentPartNumber}. Let's move on.`;
  Promise.resolve(context.speakAiMessageFromLoadingState(message)).finally(() =>
    context.setIsPartComplete(true)
  );
}

function handlePartCompleteResponse(response, context) {
  const {
    currentPartNumber,
    saveSessionProgress,
    session,
    setConversation,
    speakAiMessageFromLoadingState,
  } = context;

  setConversation((prev) => prev.filter((entry) => !entry.isLoading));
  const farewell = response.message || `That concludes Part ${currentPartNumber}.`;
  Promise.resolve(speakAiMessageFromLoadingState(farewell)).finally(() =>
    context.setIsPartComplete(true)
  );

  saveSessionProgress({
    content_data: {
      ...session?.content_data,
      isPartComplete: true,
    },
  });
}

function handleProcessingError(error, context) {
  const { requestAutoStart, setConversation, setIsProcessing, speakAiMessageFromLoadingState } =
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
    const loadingIndex = updated.findLastIndex(
      (entry) => entry.isLoading && entry.speaker === 'user'
    );
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

  const recoveryMessage =
    "I'm sorry, I didn't quite catch that. Could you please repeat your answer?";
  Promise.resolve(speakAiMessageFromLoadingState(recoveryMessage)).finally(() => {
    setIsProcessing(false);
    requestAutoStart?.();
  });
}
