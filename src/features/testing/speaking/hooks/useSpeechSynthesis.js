import { useState, useEffect, useRef, useCallback } from 'react';

import {
  getPlaybackAudio,
  isSpeechPlaybackUnlocked,
  onSpeechPlaybackUnlocked,
  releasePlaybackAudio,
  unlockSpeechPlayback,
} from '../utils/speechPlayback';
import { normalizeSpeakingTtsText, requestSpeakingTts } from '../utils/speakingTtsPrefetch';

/**
 * useSpeechSynthesis
 *
 * Speaking TTS hook using Google Cloud TTS Neural2 (en-GB-Neural2-C) via a
 * Supabase Edge Function with content-addressed Supabase Storage caching.
 *
 * Key guarantees:
 *  - Audio stops immediately when component unmounts.
 *  - Web Speech fallback fires only when needed (network/audio failure or server fallback flag).
 *  - Stale response guards prevent race conditions when rapid speech requests occur.
 *  - Safari/iOS gesture unlock integration reuses one unlocked audio element.
 *  - Progress quantization caps state re-renders to display-relevant updates.
 */

// ── Chrome 15-second utterance bug fix ────────────────────────────────────────
function splitIntoSentences(text) {
  const chunks = text.match(/[^.!?]+[.!?]+/g) || [text];
  return chunks.map((c) => c.trim()).filter(Boolean);
}

function countWords(str) {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

function hasSpeechSynthesis() {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window;
}

// ── Web Speech API voice matching ─────────────────────────────────────────────
const HIGH_QUALITY_VOICE_KEYWORDS = ['Natural', 'Premium', 'Enhanced', 'Neural'];
const POPULAR_VOICE_NAMES = ['Daniel', 'Serena', 'Martha', 'George'];

function hasMatchingKeyword(name, keywords) {
  return keywords.some((keyword) => name.includes(keyword));
}

function isHighQualityEnGb(voice) {
  if (!voice.lang.startsWith('en-GB')) return false;
  return hasMatchingKeyword(voice.name, HIGH_QUALITY_VOICE_KEYWORDS);
}

function isPopularEnGb(voice) {
  if (!voice.lang.startsWith('en-GB')) return false;
  return hasMatchingKeyword(voice.name, POPULAR_VOICE_NAMES);
}

function isEnGb(voice) {
  return voice.lang.startsWith('en-GB');
}

function isEnUs(voice) {
  return voice.lang.startsWith('en-US');
}

function isAnyEnglish(voice) {
  return voice.lang.startsWith('en');
}

const VOICE_FINDERS = [isHighQualityEnGb, isPopularEnGb, isEnGb, isEnUs, isAnyEnglish];

function findBestVoice(voices) {
  for (const finder of VOICE_FINDERS) {
    const match = voices.find(finder);
    if (match) return match;
  }
  return null;
}

function getOptimalWebVoice() {
  if (!hasSpeechSynthesis()) return null;
  const voices = window.speechSynthesis.getVoices();
  return findBestVoice(voices || []);
}

// ── Web Speech utterance runner ───────────────────────────────────────────────
function calculateProgress(spokenWords, wordsInCurrentChunk, totalWords) {
  return Math.min(1, (spokenWords + wordsInCurrentChunk) / totalWords);
}

function speakSingleChunk({ chunk, selectedVoice, spokenWords, totalWords, onProgress }) {
  return new Promise((resolve) => {
    const chunkWords = countWords(chunk);
    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.lang = 'en-GB';
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      onProgress?.(calculateProgress(spokenWords, 1, totalWords));
    };

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const wordsThroughBoundary = countWords(chunk.slice(0, event.charIndex));
        onProgress?.(calculateProgress(spokenWords, wordsThroughBoundary + 1, totalWords));
      }
    };

    utterance.onend = () => {
      const nextSpoken = spokenWords + chunkWords;
      onProgress?.(calculateProgress(spokenWords, chunkWords, totalWords));
      resolve(nextSpoken);
    };

    utterance.onerror = () => {
      resolve(spokenWords + chunkWords);
    };

    window.speechSynthesis.speak(utterance);
  });
}

async function speakChunksViaWebSpeech(chunks, selectedVoice, isMountedRef, onProgress) {
  if (!hasSpeechSynthesis()) return false;
  window.speechSynthesis.cancel();

  const totalWords = countWords(chunks.join(' ')) || 1;
  let spokenWords = 0;

  for (const chunk of chunks) {
    if (!isMountedRef.current) {
      window.speechSynthesis.cancel();
      return false;
    }
    spokenWords = await speakSingleChunk({
      chunk,
      selectedVoice,
      spokenWords,
      totalWords,
      onProgress,
    });
  }
  return true;
}

// ── Playback Progress Quantization ────────────────────────────────────────────
const PROGRESS_STEPS = 100;
const quantizeProgress = (value) => Math.round(value * PROGRESS_STEPS) / PROGRESS_STEPS;

function getAudioProgressRatio(audio) {
  if (!Number.isFinite(audio.duration)) return null;
  if (audio.duration <= 0) return null;
  return Math.min(1, audio.currentTime / audio.duration);
}

function hasValidTtsAudio(data, error) {
  if (error) return false;
  if (!data?.success) return false;
  return Boolean(data?.audioUrl);
}

function shouldFallbackAfterError(err, googleTTSSucceeded) {
  if (err?.message === 'audio-element-error') return true;
  return !googleTTSSucceeded;
}

function isTurnActive(myRequestId, requestIdRef, isMountedRef) {
  if (!isMountedRef.current) return false;
  return requestIdRef.current === myRequestId;
}

function canExecuteFallback({ shouldUseFallback, isMuted, isTurnCurrent }) {
  if (!shouldUseFallback) return false;
  if (isMuted) return false;
  return isTurnCurrent;
}

function cancelPlaybackFrame(playbackFrameRef) {
  if (playbackFrameRef.current !== null) {
    cancelAnimationFrame(playbackFrameRef.current);
    playbackFrameRef.current = null;
  }
}

function stopAudioSources(currentAudioRef, stopProgressTracking) {
  stopProgressTracking();
  if (currentAudioRef.current) {
    releasePlaybackAudio();
    currentAudioRef.current = null;
  }
  if (hasSpeechSynthesis()) {
    window.speechSynthesis.cancel();
  }
}

// ── HTML Audio Element Runner ─────────────────────────────────────────────────
function playAudioElement({
  audio,
  audioUrl,
  isMuted,
  isTurnActive,
  onPlayStart,
  onPlaybackActive,
  onProgress,
  onPlaybackEnded,
  onPlaybackError,
  stopProgressTracking,
  setPlaybackFrame,
}) {
  return new Promise((resolve, reject) => {
    audio.src = audioUrl;
    audio.currentTime = 0;
    audio.volume = isMuted ? 0 : 1;

    const tickProgress = () => {
      if (!isTurnActive()) return;
      if (audio.paused) return;

      const progressRatio = getAudioProgressRatio(audio);
      if (progressRatio !== null) {
        onProgress(progressRatio);
      }
      setPlaybackFrame(requestAnimationFrame(tickProgress));
    };

    audio.onplay = () => {
      if (!isTurnActive()) return;
      onPlaybackActive();
      onPlayStart?.();
      stopProgressTracking();
      setPlaybackFrame(requestAnimationFrame(tickProgress));
    };

    audio.ontimeupdate = () => {
      if (!isTurnActive()) return;
      const progressRatio = getAudioProgressRatio(audio);
      if (progressRatio !== null) {
        onProgress(progressRatio);
      }
    };

    audio.onended = () => {
      if (isTurnActive()) {
        stopProgressTracking();
        onPlaybackEnded();
      }
      resolve();
    };

    audio.onerror = (e) => {
      console.warn('[TTS] Audio element error, will use fallback:', e);
      if (isTurnActive()) {
        stopProgressTracking();
        onPlaybackError();
      }
      reject(new Error('audio-element-error'));
    };

    audio.play().catch(reject);
  });
}

async function playGoogleTtsAudio({
  audioUrl,
  isMuted,
  isTurnActiveFn,
  onPlayStart,
  onPlaybackActive,
  updateProgress,
  onPlaybackEnded,
  onPlaybackError,
  stopProgressTracking,
  setPlaybackFrame,
}) {
  const audio = getPlaybackAudio();
  if (!audio) {
    throw new Error('audio-element-error');
  }
  await playAudioElement({
    audio,
    audioUrl,
    isMuted,
    isTurnActive: isTurnActiveFn,
    onPlayStart,
    onPlaybackActive,
    onProgress: updateProgress,
    onPlaybackEnded,
    onPlaybackError,
    stopProgressTracking,
    setPlaybackFrame,
  });
  return audio;
}

function evaluateTtsResponse(data, error) {
  if (hasValidTtsAudio(data, error)) {
    return { status: 'success', audioUrl: data.audioUrl };
  }
  if (data?.fallback) {
    console.info('[TTS] Edge function signalled fallback:', data?.error);
    return { status: 'fallback' };
  }
  if (error) {
    console.warn('[TTS] Edge function invocation error:', error);
    return { status: 'fallback' };
  }
  return { status: 'none' };
}

// ── Google TTS & Fallback Orchestration ───────────────────────────────────────
async function requestAndPlayGoogleTts({
  cleanText,
  myRequestId,
  requestIdRef,
  isMountedRef,
  isMutedRef,
  currentAudioRef,
  options,
  stopProgressTracking,
  setPlaybackFrame,
  updateProgress,
  onPlaybackActive,
  onPlaybackEnded,
}) {
  const { data, error } = await requestSpeakingTts(cleanText);

  if (!isTurnActive(myRequestId, requestIdRef, isMountedRef)) {
    return { played: false, shouldUseFallback: false };
  }

  const evaluated = evaluateTtsResponse(data, error);
  if (evaluated.status === 'success') {
    const audio = await playGoogleTtsAudio({
      audioUrl: evaluated.audioUrl,
      isMuted: isMutedRef.current,
      isTurnActiveFn: () => isTurnActive(myRequestId, requestIdRef, isMountedRef),
      onPlayStart: options?.onPlayStart,
      onPlaybackActive,
      updateProgress,
      onPlaybackEnded,
      onPlaybackError: () => {
        currentAudioRef.current = null;
      },
      stopProgressTracking,
      setPlaybackFrame,
    });
    currentAudioRef.current = audio;
    return { played: true, shouldUseFallback: false };
  }

  return { played: false, shouldUseFallback: evaluated.status === 'fallback' };
}

async function runSpeechTurn({
  cleanText,
  myRequestId,
  requestIdRef,
  isMountedRef,
  isMutedRef,
  webVoiceRef,
  currentAudioRef,
  options,
  stopProgressTracking,
  setPlaybackFrame,
  setIsTTSLoading,
  updateProgress,
  onPlaybackActive,
  onPlaybackEnded,
  onFallbackStart,
}) {
  let googleTTSSucceeded = false;
  let shouldUseFallback = false;

  try {
    const result = await requestAndPlayGoogleTts({
      cleanText,
      myRequestId,
      requestIdRef,
      isMountedRef,
      isMutedRef,
      currentAudioRef,
      options,
      stopProgressTracking,
      setPlaybackFrame,
      updateProgress,
      onPlaybackActive,
      onPlaybackEnded,
    });
    googleTTSSucceeded = result.played;
    shouldUseFallback = result.shouldUseFallback;
  } catch (err) {
    if (!isTurnActive(myRequestId, requestIdRef, isMountedRef)) return;
    console.warn('[TTS] Error:', err?.message);
    shouldUseFallback = shouldFallbackAfterError(err, googleTTSSucceeded);
  } finally {
    setIsTTSLoading(false);
  }

  const canRunFallback = canExecuteFallback({
    shouldUseFallback,
    isMuted: isMutedRef.current,
    isTurnCurrent: isTurnActive(myRequestId, requestIdRef, isMountedRef),
  });

  if (canRunFallback) {
    onFallbackStart();
    options?.onPlayStart?.();

    const sentences = splitIntoSentences(cleanText);
    await speakChunksViaWebSpeech(sentences, webVoiceRef.current, isMountedRef, (progress) => {
      if (isTurnActive(myRequestId, requestIdRef, isMountedRef)) {
        updateProgress(progress);
      }
    });
  }
}

async function prepareSpeechTurn({ text, myRequestId, requestIdRef, isMountedRef, isMutedRef }) {
  if (!text) return false;
  if (isMutedRef.current) return false;
  if (!isMountedRef.current) return false;

  if (!isSpeechPlaybackUnlocked()) {
    await new Promise((resolve) => {
      onSpeechPlaybackUnlocked(resolve);
    });
    if (!isTurnActive(myRequestId, requestIdRef, isMountedRef)) return false;
    if (isMutedRef.current) return false;
  }

  return true;
}

function executeTurnWithState({
  text,
  myRequestId,
  requestIdRef,
  isMountedRef,
  webVoiceRef,
  currentAudioRef,
  options,
  stopProgressTracking,
  playbackFrameRef,
  state,
}) {
  return runSpeechTurn({
    cleanText: normalizeSpeakingTtsText(text),
    myRequestId,
    requestIdRef,
    isMountedRef,
    isMutedRef: state.isMutedRef,
    webVoiceRef,
    currentAudioRef,
    options,
    stopProgressTracking,
    setPlaybackFrame: (frameId) => {
      playbackFrameRef.current = frameId;
    },
    setIsTTSLoading: state.setIsTTSLoading,
    updateProgress: state.updateProgressIfChanged,
    onPlaybackActive: state.onPlaybackActive,
    onPlaybackEnded: () => {
      currentAudioRef.current = null;
      state.onPlaybackEnded();
    },
    onFallbackStart: state.onFallbackStart,
  });
}

// ── Lifecycle & State Hooks ───────────────────────────────────────────────────
function useVoicePreloader(webVoiceRef) {
  useEffect(() => {
    if (!hasSpeechSynthesis()) return;
    const load = () => {
      if (!webVoiceRef.current) {
        webVoiceRef.current = getOptimalWebVoice();
      }
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [webVoiceRef]);
}

function useSafariGestureUnlock() {
  useEffect(() => {
    const unlock = () => unlockSpeechPlayback();
    const events = ['pointerdown', 'touchend', 'keydown'];
    events.forEach((event) =>
      window.addEventListener(event, unlock, { capture: true, once: true, passive: true })
    );
    return () => {
      events.forEach((event) => window.removeEventListener(event, unlock, { capture: true }));
    };
  }, []);
}

function useSpeechState() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTTSLoading, setIsTTSLoading] = useState(false);
  const [activeSpeechText, setActiveSpeechText] = useState('');
  const [isPlaybackActive, setIsPlaybackActive] = useState(false);
  const [speechProgress, setSpeechProgress] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  const lastProgressRef = useRef(null);
  const isMutedRef = useRef(false);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const resetPlaybackState = useCallback(() => {
    setIsSpeaking(false);
    setIsTTSLoading(false);
    setIsPlaybackActive(false);
    setActiveSpeechText('');
    lastProgressRef.current = null;
    setSpeechProgress(null);
  }, []);

  const startPlaybackState = useCallback((text) => {
    setActiveSpeechText(String(text).trim());
    setIsPlaybackActive(false);
    lastProgressRef.current = null;
    setSpeechProgress(null);
    setIsTTSLoading(true);
    setIsSpeaking(true);
  }, []);

  const updateProgressIfChanged = useCallback((nextRaw) => {
    const next = quantizeProgress(nextRaw);
    if (next !== lastProgressRef.current) {
      lastProgressRef.current = next;
      setSpeechProgress(next);
    }
  }, []);

  const onPlaybackActive = useCallback(() => {
    lastProgressRef.current = 0;
    setSpeechProgress(0);
    setIsPlaybackActive(true);
  }, []);

  const onPlaybackEnded = useCallback(() => {
    updateProgressIfChanged(1);
    setIsPlaybackActive(false);
  }, [updateProgressIfChanged]);

  const onFallbackStart = useCallback(() => {
    lastProgressRef.current = null;
    setSpeechProgress(null);
    setIsPlaybackActive(true);
  }, []);

  return {
    isSpeaking,
    isTTSLoading,
    setIsTTSLoading,
    activeSpeechText,
    isPlaybackActive,
    speechProgress,
    isMuted,
    setIsMuted,
    isMutedRef,
    resetPlaybackState,
    startPlaybackState,
    updateProgressIfChanged,
    onPlaybackActive,
    onPlaybackEnded,
    onFallbackStart,
  };
}

function useSpeechPlaybackLifecycle({ stopProgressTracking, currentAudioRef, requestIdRef }) {
  const isMountedRef = useRef(true);
  const stopActiveAudioSources = useCallback(() => {
    stopAudioSources(currentAudioRef, stopProgressTracking);
  }, [currentAudioRef, stopProgressTracking]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      requestIdRef.current += 1;
      stopActiveAudioSources();
    };
  }, [requestIdRef, stopActiveAudioSources]);

  return { isMountedRef, stopActiveAudioSources };
}

// ── Main Hook ─────────────────────────────────────────────────────────────────
export default function useSpeechSynthesis() {
  const state = useSpeechState();
  const currentAudioRef = useRef(null);
  const webVoiceRef = useRef(null);
  const requestIdRef = useRef(0);
  const playbackFrameRef = useRef(null);

  const stopProgressTracking = useCallback(() => {
    cancelPlaybackFrame(playbackFrameRef);
  }, []);

  const { isMountedRef, stopActiveAudioSources } = useSpeechPlaybackLifecycle({
    stopProgressTracking,
    currentAudioRef,
    requestIdRef,
  });

  useVoicePreloader(webVoiceRef);
  useSafariGestureUnlock();

  const cancelCurrentAudio = useCallback(() => {
    requestIdRef.current += 1;
    stopActiveAudioSources();
    state.resetPlaybackState();
  }, [stopActiveAudioSources, state]);

  const speakText = useCallback(
    async (text, options = { cancel: true }) => {
      const myRequestId = ++requestIdRef.current;
      const canProceed = await prepareSpeechTurn({
        text,
        myRequestId,
        requestIdRef,
        isMountedRef,
        isMutedRef: state.isMutedRef,
      });
      if (!canProceed) return;

      if (options?.cancel) {
        stopActiveAudioSources();
      }

      state.startPlaybackState(text);
      await executeTurnWithState({
        text,
        myRequestId,
        requestIdRef,
        isMountedRef,
        webVoiceRef,
        currentAudioRef,
        options,
        stopProgressTracking,
        playbackFrameRef,
        state,
      });

      if (isTurnActive(myRequestId, requestIdRef, isMountedRef)) {
        state.resetPlaybackState();
      }
    },
    [state, stopActiveAudioSources, stopProgressTracking, isMountedRef]
  );

  return {
    speakText,
    cancelCurrentAudio,
    unlockSpeechPlayback,
    isSpeaking: state.isSpeaking,
    isTTSLoading: state.isTTSLoading,
    activeSpeechText: state.activeSpeechText,
    isPlaybackActive: state.isPlaybackActive,
    speechProgress: state.speechProgress,
    isMuted: state.isMuted,
    setIsMuted: state.setIsMuted,
  };
}
