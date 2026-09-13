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
 * Bug fixes in this version:
 *  - Audio now STOPS immediately when the component unmounts (navigating away).
 *  - Web Speech fallback no longer fires when Google TTS explicitly signals fallback.
 *  - Stale response guards correctly prevent race conditions.
 *  - Safari/iOS: playback goes through one element unlocked on the learner's
 *    first interaction, because WebKit rejects play() once the awaited TTS
 *    request has consumed the page's user activation (see utils/speechPlayback).
 *
 * Public API also exposes the exact active utterance and playback state so the
 * conversation UI never has to guess which queued message is being spoken.
 */

// ── Chrome 15-second utterance bug fix ────────────────────────────────────────
// Chrome silently stops SpeechSynthesisUtterance after ~15s.
// Splitting at sentence boundaries prevents this.
function splitIntoSentences(text) {
  const chunks = text.match(/[^.!?]+[.!?]+/g) || [text];
  return chunks.map((c) => c.trim()).filter(Boolean);
}

// ── Web Speech API fallback ───────────────────────────────────────────────────
function getOptimalWebVoice() {
  if (!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find(
      (v) =>
        v.lang.startsWith('en-GB') &&
        (v.name.includes('Natural') ||
          v.name.includes('Premium') ||
          v.name.includes('Enhanced') ||
          v.name.includes('Neural'))
    ) ||
    voices.find(
      (v) =>
        v.lang.startsWith('en-GB') &&
        (v.name.includes('Daniel') ||
          v.name.includes('Serena') ||
          v.name.includes('Martha') ||
          v.name.includes('George'))
    ) ||
    voices.find((v) => v.lang.startsWith('en-GB')) ||
    voices.find((v) => v.lang.startsWith('en-US')) ||
    voices.find((v) => v.lang.startsWith('en'))
  );
}

/**
 * Speaks chunks via Web Speech API, respecting an isMounted flag.
 * Returns true if completed, false if bailed out early.
 */
async function speakChunksViaWebSpeech(chunks, selectedVoice, isMountedRef, onProgress) {
  if (!('speechSynthesis' in window)) return false;
  window.speechSynthesis.cancel();

  const totalWords = chunks.join(' ').trim().split(/\s+/).filter(Boolean).length || 1;
  let spokenWords = 0;
  for (const chunk of chunks) {
    // Bail immediately if the component has unmounted
    if (!isMountedRef.current) {
      window.speechSynthesis.cancel();
      return false;
    }
    const chunkWords = chunk.trim().split(/\s+/).filter(Boolean);
    await new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = 'en-GB';
      utterance.rate = 0.92;
      utterance.pitch = 1.0;
      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.onstart = () => onProgress?.(Math.min(1, (spokenWords + 1) / totalWords));
      utterance.onboundary = (event) => {
        if (event.name !== 'word') return;
        const wordsThroughBoundary = chunk
          .slice(0, event.charIndex)
          .trim()
          .split(/\s+/)
          .filter(Boolean).length;
        onProgress?.(Math.min(1, (spokenWords + wordsThroughBoundary + 1) / totalWords));
      };
      utterance.onend = () => {
        spokenWords += chunkWords.length;
        onProgress?.(Math.min(1, spokenWords / totalWords));
        resolve();
      };
      utterance.onerror = resolve;
      window.speechSynthesis.speak(utterance);
    });
  }
  return true;
}

/**
 * Playback progress is consumed as a *word index* — the live examiner transcript
 * renders `ceil(progress * words.length)` words. The rAF loop below samples at
 * the display refresh rate (60Hz, 120Hz on ProMotion), but the rendered output
 * only has as many distinct states as there are words in the sentence. Pushing
 * every raw sample into React state re-rendered the whole SpeakingTest tree
 * ~120x/sec to produce the same frame.
 *
 * Snapping to 1/100ths collapses that to at most 100 state updates per
 * utterance while staying exact for any sentence up to 100 words (longer
 * sentences are chunked before they reach here), so the transcript reveals on
 * precisely the same word at precisely the same time.
 */
const PROGRESS_STEPS = 100;
const quantizeProgress = (value) => Math.round(value * PROGRESS_STEPS) / PROGRESS_STEPS;

// ── Main hook ─────────────────────────────────────────────────────────────────
export default function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTTSLoading, setIsTTSLoading] = useState(false);
  const [activeSpeechText, setActiveSpeechText] = useState('');
  const [isPlaybackActive, setIsPlaybackActive] = useState(false);
  const [speechProgress, setSpeechProgress] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  // Refs to track in-flight audio + prevent race conditions
  const currentAudioRef = useRef(null);
  // Mirrors the last value pushed to `speechProgress` so the rAF loop can skip
  // no-op setState calls without having to read state it doesn't depend on.
  const lastProgressRef = useRef(null);
  const isMutedRef = useRef(false);
  const webVoiceRef = useRef(null);
  // isMountedRef: flipped to false on unmount so async loops stop immediately
  const isMountedRef = useRef(true);
  // Tracks the current request so stale completions don't update state
  const requestIdRef = useRef(0);
  const playbackFrameRef = useRef(null);

  const stopProgressTracking = useCallback(() => {
    if (playbackFrameRef.current !== null) {
      cancelAnimationFrame(playbackFrameRef.current);
      playbackFrameRef.current = null;
    }
  }, []);

  // Keep muted ref in sync
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Preload Web Speech voices (Chrome race condition fix)
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
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
  }, []);

  // ── Safari: unlock playback on the learner's first interaction ────────────
  // WebKit only grants playback to an element that has already played from
  // inside a gesture. Every later utterance arrives after an awaited fetch,
  // by which point the activation is gone — so unlock eagerly, once.
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

  // ── CRITICAL: Stop ALL audio immediately on unmount (e.g. navigating away) ──
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      // Signal all async loops to stop
      isMountedRef.current = false;
      // Invalidate all in-flight requests
      requestIdRef.current += 1;
      stopProgressTracking();
      // Stop any playing HTML Audio element
      if (currentAudioRef.current) {
        releasePlaybackAudio();
        currentAudioRef.current = null;
      }
      // Stop Web Speech API
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [stopProgressTracking]);

  /**
   * Cancel any in-flight audio and clear state.
   * Exposed publicly so SpeakingTest can call it on exit/navigation.
   */
  const cancelCurrentAudio = useCallback(() => {
    requestIdRef.current += 1;
    stopProgressTracking();
    if (currentAudioRef.current) {
      releasePlaybackAudio();
      currentAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsTTSLoading(false);
    setIsPlaybackActive(false);
    setActiveSpeechText('');
    lastProgressRef.current = null;
    setSpeechProgress(null);
  }, [stopProgressTracking]);

  /**
   * Main speakText function.
   *
   * 1. Calls Google Cloud TTS Neural2 via the synthesizeSpeech Edge Function
   * 2. Plays the returned MP3 URL with `new Audio(url)`
   * 3. Falls back to chunked Web Speech API ONLY if the edge function is
   *    truly unavailable (network error) — NOT when the edge function
   *    explicitly signals a graceful fallback.
   *
   * Returns a Promise that resolves when audio playback finishes.
   */
  const speakText = useCallback(
    async (text, options = { cancel: true }) => {
      if (!text || isMutedRef.current || !isMountedRef.current) return;

      // Claim this turn before awaiting an autoplay unlock. Without this stamp,
      // two queued prompts could both resume after one learner gesture and the
      // older prompt would briefly take over the live transcript.
      const myRequestId = ++requestIdRef.current;

      // Resuming a session speaks the examiner's last question while the page
      // is still loading, before the learner has touched anything — so no
      // playback permission exists yet and the audio was simply discarded.
      // Wait for the first interaction instead of losing the turn, which is
      // why the examiner only found its voice after the learner spoke.
      if (!isSpeechPlaybackUnlocked()) {
        await new Promise((resolve) => {
          onSpeechPlaybackUnlocked(resolve);
        });
        if (!isMountedRef.current || isMutedRef.current || requestIdRef.current !== myRequestId) {
          return;
        }
      }

      // Cancel previous audio if requested
      if (options.cancel) {
        stopProgressTracking();
        if (currentAudioRef.current) {
          releasePlaybackAudio();
          currentAudioRef.current = null;
        }
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      }

      // Clean text for speech (handle IELTS-specific notation)
      const cleanText = normalizeSpeakingTtsText(text);

      // ── 1. Show loading state ──────────────────────────────────────────────
      setActiveSpeechText(String(text).trim());
      setIsPlaybackActive(false);
      lastProgressRef.current = null;
      setSpeechProgress(null);
      setIsTTSLoading(true);
      setIsSpeaking(true);

      // Track what actually played so we decide on fallback
      let googleTTSSucceeded = false;
      let shouldUseFallback = false; // only true for real errors, not graceful fallbacks

      try {
        const { data, error } = await requestSpeakingTts(cleanText);

        // Bail if superseded or unmounted
        if (requestIdRef.current !== myRequestId || !isMountedRef.current) return;

        setIsTTSLoading(false);

        if (!error && data?.success && data?.audioUrl) {
          // ── 2a. Play Google TTS audio ──────────────────────────────────────
          googleTTSSucceeded = true;
          await new Promise((resolve, reject) => {
            // Reuse the gesture-unlocked element. Constructing a new Audio()
            // here would be blocked by WebKit, because awaiting the edge
            // function above already consumed the user activation.
            const audio = getPlaybackAudio();
            if (!audio) {
              reject(new Error('audio-element-error'));
              return;
            }
            audio.src = data.audioUrl;
            audio.currentTime = 0;
            currentAudioRef.current = audio;

            audio.onplay = () => {
              if (requestIdRef.current === myRequestId) {
                lastProgressRef.current = 0;
                setSpeechProgress(0);
                setIsPlaybackActive(true);
                options.onPlayStart?.();
                const updateProgress = () => {
                  if (
                    requestIdRef.current !== myRequestId ||
                    !isMountedRef.current ||
                    audio.paused
                  ) {
                    return;
                  }
                  if (Number.isFinite(audio.duration) && audio.duration > 0) {
                    const next = quantizeProgress(Math.min(1, audio.currentTime / audio.duration));
                    if (next !== lastProgressRef.current) {
                      lastProgressRef.current = next;
                      setSpeechProgress(next);
                    }
                  }
                  playbackFrameRef.current = requestAnimationFrame(updateProgress);
                };
                stopProgressTracking();
                playbackFrameRef.current = requestAnimationFrame(updateProgress);
              }
            };
            audio.ontimeupdate = () => {
              if (
                requestIdRef.current === myRequestId &&
                Number.isFinite(audio.duration) &&
                audio.duration > 0
              ) {
                const next = quantizeProgress(Math.min(1, audio.currentTime / audio.duration));
                if (next !== lastProgressRef.current) {
                  lastProgressRef.current = next;
                  setSpeechProgress(next);
                }
              }
            };
            audio.onended = () => {
              if (requestIdRef.current === myRequestId) {
                stopProgressTracking();
                currentAudioRef.current = null;
                lastProgressRef.current = 1;
                setSpeechProgress(1);
                setIsPlaybackActive(false);
              }
              resolve();
            };
            audio.onerror = (e) => {
              console.warn('[TTS] Audio element error, will use fallback:', e);
              if (requestIdRef.current === myRequestId) {
                stopProgressTracking();
                currentAudioRef.current = null;
              }
              // Audio element failed — DO fall back
              reject(new Error('audio-element-error'));
            };

            // Always reassign — the element is shared, so a previously muted
            // utterance would otherwise leave every later one silent.
            audio.volume = isMutedRef.current ? 0 : 1;
            audio.play().catch(reject);
          });
        } else if (data?.fallback) {
          // ── 2b. Server explicitly signalled graceful fallback ──────────────
          // This means the TTS pipeline had an issue on the server side.
          // Fall through to Web Speech, but log it clearly.
          console.info('[TTS] Edge function signalled fallback:', data?.error);
          shouldUseFallback = true;
          setIsTTSLoading(false);
        } else if (error) {
          // ── 2c. Network / invocation error ────────────────────────────────
          console.warn('[TTS] Edge function invocation error:', error);
          shouldUseFallback = true;
          setIsTTSLoading(false);
        }
      } catch (err) {
        if (requestIdRef.current !== myRequestId || !isMountedRef.current) return;
        console.warn('[TTS] Error:', err?.message);
        setIsTTSLoading(false);
        // Only use fallback if this was an audio element error or a real fetch error
        // (not a deliberate cancellation/abort)
        if (err?.message !== 'audio-element-error') {
          // Real error — fall back
          shouldUseFallback = !googleTTSSucceeded;
        } else {
          shouldUseFallback = true;
        }
      }

      // ── 3. Web Speech API fallback (only if truly needed) ─────────────────
      if (
        shouldUseFallback &&
        !isMutedRef.current &&
        requestIdRef.current === myRequestId &&
        isMountedRef.current
      ) {
        if (options.onPlayStart) {
          options.onPlayStart();
        }
        lastProgressRef.current = null;
        setSpeechProgress(null);
        setIsPlaybackActive(true);
        const sentences = splitIntoSentences(cleanText);
        await speakChunksViaWebSpeech(sentences, webVoiceRef.current, isMountedRef, (progress) => {
          if (requestIdRef.current === myRequestId && isMountedRef.current) {
            const next = quantizeProgress(progress);
            if (next !== lastProgressRef.current) {
              lastProgressRef.current = next;
              setSpeechProgress(next);
            }
          }
        });
      }

      // ── Cleanup ────────────────────────────────────────────────────────────
      if (requestIdRef.current === myRequestId && isMountedRef.current) {
        setIsSpeaking(false);
        setIsTTSLoading(false);
        setIsPlaybackActive(false);
        setActiveSpeechText('');
        lastProgressRef.current = null;
        setSpeechProgress(null);
      }
    },
    [cancelCurrentAudio, stopProgressTracking]
  );

  return {
    speakText,
    cancelCurrentAudio,
    unlockSpeechPlayback,
    isSpeaking,
    isTTSLoading,
    activeSpeechText,
    isPlaybackActive,
    speechProgress,
    isMuted,
    setIsMuted,
  };
}
