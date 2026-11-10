import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { callEdgeFunction, callEdgeFunctionMultipart } from '@/utils/api';

import {
  buildConversationHistory,
  buildExpectedExaminerResponse,
  formatIeltsQuestion,
  getQuestionLines,
  isSilentSpeechMetadata,
  isTranscriptError,
} from '../utils/speakingTestUtils';
import {
  blobToBase64,
  convertAudioBlobToWav16kMono,
  shouldRequestPronunciationSample,
} from '../utils/audioProcessing';
import { prefetchSpeakingTts } from '../utils/speakingTtsPrefetch';

const NO_AUDIO_MESSAGE =
  "I couldn't capture that answer. The microphone is still open—please try once more.";
const MIN_USABLE_AUDIO_BYTES = 1024;

export function replacePendingWithAudioRecovery(conversation) {
  const settled = conversation.filter((entry) => !entry.isLoading);
  if (settled.at(-1)?.code === 'audio-capture-recovery') return settled;
  return [...settled, { speaker: 'ai', text: NO_AUDIO_MESSAGE, code: 'audio-capture-recovery' }];
}

export async function recoverSpeakingV2Conflict({ error, sessionId }) {
  if (error?.status !== 409 || !sessionId) return null;
  if (error.state) return error.state;
  const recovered = await callEdgeFunction('processSpeakingSessionV2', {
    action: 'resume',
    sessionId,
  });
  return recovered?.state || null;
}

export function getAverageBrowserSpeechConfidence(values) {
  const confidenceValues = (Array.isArray(values) ? values : [])
    .map((value) => Number(typeof value === 'object' ? value?.confidence : value))
    .filter(Number.isFinite);
  if (confidenceValues.length === 0) return 0;
  return (
    confidenceValues.reduce((sum, confidence) => sum + confidence, 0) / confidenceValues.length
  );
}

export async function submitSpeakingV2TurnWithConflictRecovery(params) {
  const idempotencyKey = params.idempotencyKey || crypto.randomUUID();
  try {
    return await processSpeakingV2Turn({ ...params, idempotencyKey });
  } catch (error) {
    if (!isRecoverableConflict(error)) throw error;
    const recoveredState = await recoverSpeakingV2Conflict({
      error,
      sessionId: params.sessionId,
    });
    if (!recoveredState || recoveredState.status !== 'active') throw error;
    return processSpeakingV2Turn({
      ...params,
      speakingV2State: recoveredState,
      idempotencyKey,
    });
  }
}

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
  setError,
  setTestStarted,
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
  useSpeakingV2 = false,
}) {
  const pronunciationAttemptedPartsRef = useRef(new Set());
  const processingRequestIdRef = useRef(0);
  // Consecutive answers that were not heard (silence, noise, transcription
  // failure). Hands-free stops re-opening the mic after a few in a row, so a
  // learner who stepped away does not trigger an endless retry loop.
  const unheardStreakRef = useRef(0);

  useEffect(() => {
    return () => {
      processingRequestIdRef.current += 1;
    };
  }, []);

  return useCallback(
    async (audioBlob, metadata = {}) => {
      const requestId = ++processingRequestIdRef.current;
      const isCurrentRequest = () =>
        processingRequestIdRef.current === requestId && isMountedRef?.current !== false;
      const restartAfterTurn = (unheard) => {
        unheardStreakRef.current = unheard ? unheardStreakRef.current + 1 : 0;
        if (unheardStreakRef.current >= MAX_UNHEARD_AUTO_RESTARTS) {
          toast.info("We couldn't hear an answer", {
            description: 'Press Start now when you are ready to answer.',
            duration: 5000,
          });
          return;
        }
        requestAutoStart?.();
      };
      if (metadata.error === 'too_short') {
        toast.warning('Recording too short', {
          description: 'Please speak for at least a few seconds.',
          duration: 3000,
        });
        return;
      }

      if (!audioBlob || audioBlob.size < MIN_USABLE_AUDIO_BYTES) {
        setConversation(replacePendingWithAudioRecovery);
        Promise.resolve(speakText(NO_AUDIO_MESSAGE)).finally(() => restartAfterTurn(true));
        return;
      }

      // A silent/noise-only recording can still be a large, valid media blob.
      // Stop before upload so a transcription provider cannot hallucinate an
      // answer. The Edge Function enforces the same rule as a backstop.
      if (isSilentSpeechMetadata(metadata)) {
        setConversation(replacePendingWithAudioRecovery);
        Promise.resolve(speakText(NO_AUDIO_MESSAGE)).finally(() => restartAfterTurn(true));
        return;
      }

      // Keep the answer's length with its transcript so the report can measure
      // answer length against each part's target without re-deriving it.
      const answerDurationMs = Number(metadata.duration);
      if (Number.isFinite(answerDurationMs) && answerDurationMs > 0) {
        setConversation((prev) => tagPendingAnswerDuration(prev, answerDurationMs));
      }

      setIsProcessing(true);
      setProcessingStatus('Processing your answer...');

      try {
        const snapshotQuestionIndex = questionIndexRef.current;
        const currentPart = allParts[currentPartNumber];
        const questionLines = getQuestionLines(currentPart?.questions);
        const questionContext = questionLines[snapshotQuestionIndex] || '';
        if (!useSpeakingV2) {
          prefetchExpectedExaminerSpeech({
            currentPartNumber,
            questionLines,
            snapshotQuestionIndex,
          });
        }
        const pronunciationPromise = preparePronunciationAudio({
          acousticMetrics: acousticMetricsRef.current,
          audioBlob,
          durationMs: Number(metadata.duration),
          partNumber: currentPartNumber,
          pronunciationAttemptedParts: pronunciationAttemptedPartsRef.current,
        });

        setProcessingStatus('Uploading your answer...');
        const [audioBase64, pronunciationAudio] = await Promise.all([
          useSpeakingV2 ? Promise.resolve(null) : blobToBase64(audioBlob),
          pronunciationPromise,
        ]);
        if (!isCurrentRequest()) return;

        setProcessingStatus(getTranscriptionStatus(pronunciationAudio));

        const response = useSpeakingV2
          ? await submitSpeakingV2TurnWithConflictRecovery({
              audioBlob,
              audioDurationMs: Number(metadata.duration) || 0,
              browserTranscript: metadata.liveTranscript,
              sessionId: session?.id,
              speakingV2State,
              speechConfidence: metadata.speechConfidence,
              speechDetected: metadata.speechDetected,
              pronunciationAudio,
            })
          : await processSpeakingTurn({
              audioBase64,
              audioMimeType: audioBlob.type || 'audio/webm',
              audioDurationMs: Number(metadata.duration) || null,
              conversationHistory: buildConversationHistory(conversationRef.current),
              currentPartNumber,
              questionContext,
              sessionId: session?.id,
              snapshotQuestionIndex,
              speechConfidence: metadata.speechConfidence || null,
              speechDetected: metadata.speechDetected ?? null,
              pronunciationAudioBase64: pronunciationAudio
                ? await blobToBase64(pronunciationAudio)
                : null,
              pronunciationDurationMs: pronunciationAudio ? Number(metadata.duration) : null,
              requestPronunciation: Boolean(pronunciationAudio),
              testId,
            });
        if (!isCurrentRequest()) return;

        if (!response) {
          setConversation((prev) => prev.filter((entry) => !entry.isLoading));
          return;
        }

        setConversation((prev) => replaceLoadingUserTranscript(prev, response.userTranscript));
        if (response.state) setSpeakingV2State?.(response.state);
        await handleSpeakingResponse(response, {
          acousticMetricsRef,
          allParts,
          conversationRef,
          currentPartNumber,
          pendingTimersRef,
          questionIndexRef,
          requestAutoStart: () =>
            restartAfterTurn(
              Boolean(response.transcriptStatus) && response.transcriptStatus !== 'ready'
            ),
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
        if (!isCurrentRequest()) return;
        if (useSpeakingV2 && (error?.status === 410 || error?.state?.status === 'expired')) {
          setConversation((prev) => prev.filter((entry) => !entry.isLoading));
          setTestStarted?.(false);
          setError?.('This speaking session has expired. Return to Speaking and restart the test.');
          return;
        }
        if (useSpeakingV2 && error?.status === 409) {
          const recoveredState = await recoverSpeakingV2Conflict({
            error,
            sessionId: session?.id,
          });
          if (!isCurrentRequest()) return;
          if (recoveredState) setSpeakingV2State?.(recoveredState);
          setConversation((prev) => prev.filter((entry) => !entry.isLoading));
          toast.info('Speaking session refreshed', {
            description: 'Your place is safe. Please answer the current question once more.',
            duration: 3500,
          });
          restartAfterConflict(error, requestAutoStart);
          return;
        }
        const shouldRestart = await handleProcessingError(error, {
          pendingTimersRef,
          setConversation,
          speakAiMessageFromLoadingState,
          setShowUpgradeDialog,
        });
        if (shouldRestart) restartAfterTurn(true);
      } finally {
        if (isCurrentRequest()) {
          setIsProcessing(false);
          setProcessingStatus('');
        }
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
      setError,
      setTestStarted,
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

  prefetchSpeakingTts(text);
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
  return convertAudioBlobToWav16kMono(audioBlob).catch((error) => {
    console.warn('Pronunciation sample conversion unavailable:', error);
    return null;
  });
}

export async function processSpeakingV2Turn({
  audioBlob,
  audioDurationMs,
  browserTranscript,
  sessionId,
  speakingV2State,
  speechConfidence,
  speechDetected,
  pronunciationAudio,
  idempotencyKey = crypto.randomUUID(),
}) {
  if (!sessionId || speakingV2State?.revision == null) {
    throw new Error('The speaking session is not ready. Please restart the test.');
  }
  const confidence = getAverageBrowserSpeechConfidence(speechConfidence);
  const formData = new FormData();
  formData.append('sessionId', sessionId);
  formData.append('expectedRevision', String(speakingV2State.revision));
  formData.append('idempotencyKey', idempotencyKey);
  formData.append('audio', audioBlob, `speaking-${Date.now()}.webm`);
  formData.append('mimeType', audioBlob.type || 'audio/webm');
  formData.append('audioDurationMs', String(audioDurationMs));
  formData.append('speechDetected', String(speechDetected !== false));
  if (browserTranscript) {
    formData.append(
      'browserSpeechHint',
      JSON.stringify({ transcript: browserTranscript, confidence })
    );
  }
  if (pronunciationAudio) {
    formData.append('pronunciationAudio', pronunciationAudio, `pronunciation-${Date.now()}.wav`);
  }
  return callEdgeFunctionMultipart('processSpeakingSessionV2', formData);
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
  conversationHistory,
  currentPartNumber,
  questionContext,
  sessionId,
  snapshotQuestionIndex,
  speechConfidence,
  speechDetected,
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
      speechDetected,
      pronunciationAudioBase64,
      pronunciationDurationMs,
      requestPronunciation,
    });
  } catch (error) {
    console.error('Edge Function failed:', error);

    if (isAccessOrRateLimitError(error)) {
      throw error;
    }

    toast.error('Processing Error', {
      description:
        error?.userMessage || 'Failed to process your response. Please try recording again.',
      duration: 5000,
    });
    return null;
  }
}

function tagPendingAnswerDuration(conversation, durationMs) {
  const loadingIndex = conversation.findLastIndex(
    (entry) => entry.isLoading && entry.speaker === 'user'
  );
  if (loadingIndex === -1) return conversation;
  const updated = [...conversation];
  updated[loadingIndex] = { ...updated[loadingIndex], durationMs };
  return updated;
}

function replaceLoadingUserTranscript(conversation, transcript) {
  const updated = [...conversation];
  const loadingIndex = updated.findLastIndex(
    (entry) => entry.isLoading && entry.speaker === 'user'
  );

  if (loadingIndex !== -1) {
    const { durationMs } = updated[loadingIndex];
    updated[loadingIndex] = {
      speaker: 'user',
      text: transcript || '(Unable to transcribe - please try again)',
      isLoading: false,
      isTranscript: !isTranscriptError(transcript),
      error: isTranscriptError(transcript),
      ...(Number.isFinite(durationMs) ? { durationMs } : {}),
    };
  } else {
    updated.push({
      speaker: 'user',
      text: transcript || '(Unable to transcribe - please try again)',
      isLoading: false,
      isTranscript: !isTranscriptError(transcript),
      error: isTranscriptError(transcript),
    });
  }

  return updated;
}

const MAX_UNHEARD_AUTO_RESTARTS = 2;

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
      ...(response.state ? { speakingV2State: response.state } : {}),
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

function isRecoverableConflict(error) {
  return error?.status === 409 && error.retryable !== false;
}

function restartAfterConflict(error, restart) {
  if (error.retryable !== false) restart?.();
}

function isAccessOrRateLimitError(error) {
  return error.status === 429 || error.status === 403 || error.name === 'RateLimitError';
}

async function handleProcessingError(error, context) {
  const { setConversation, speakAiMessageFromLoadingState } = context;

  console.error('Error processing recording:', error);

  if (error.operationId) {
    setConversation((prev) => prev.filter((entry) => !entry.isLoading));
    toast.error('Answer could not be saved', {
      description: `${error.userMessage || error.message} Reference: ${error.operationId}`,
      duration: 6000,
    });
    return false;
  }

  if (isAccessOrRateLimitError(error)) {
    setConversation((prev) => prev.filter((entry) => !entry.isLoading));
    if (error.rateLimitType === 'speaking_turn') {
      toast.info('This test attempt is complete', {
        description:
          error.userMessage ||
          'This test has reached its response limit. Start a new attempt to continue.',
        duration: 5000,
      });
    } else if (error.rateLimitType === 'quota' || error.status === 403) {
      context.setShowUpgradeDialog?.(true);
    } else {
      toast.error('Too many requests', {
        description: 'Please wait a moment before continuing.',
        duration: 4000,
      });
    }
    return false;
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
    } else {
      updated.push({
        speaker: 'user',
        text: '(Failed to transcribe)',
        isLoading: false,
        error: true,
      });
    }
    return updated;
  });

  const recoveryMessage =
    "I'm sorry, I didn't quite catch that. Could you please repeat your answer?";
  await Promise.resolve(speakAiMessageFromLoadingState(recoveryMessage));
  return true;
}
