import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook encapsulating all Text-to-Speech (TTS) logic.
 * Handles voice loading, speech synthesis, mute/unmute, and isSpeaking state.
 *
 * @returns {{ speakText: Function, isSpeaking: boolean, isMuted: boolean, setIsMuted: Function }}
 */
export default function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // TTS voice loading refs — fixes Chrome race condition
  const voicesLoadedRef = useRef(false);
  const speechQueueRef = useRef([]);
  const selectedVoiceRef = useRef(null);

  // Internal TTS function — actually speaks the text
  const speakTextInternal = useCallback((text, options = { cancel: true }) => {
    if (!('speechSynthesis' in window)) return Promise.resolve();

    // Only cancel if explicitly requested (usually for a new examiner turn)
    if (options.cancel) {
      window.speechSynthesis.cancel();
    }

    // Clean text for speech: replace [Why/Why not?] with "Why or why not?"
    const cleanText = text
      .replace(/\[\s*Why\s*\/\s*Why\s*not\s*\?*\]/gi, 'Why, or why not?')
      .replace(/\(\s*Why\s*\/\s*Why\s*not\s*\?*\)/gi, 'Why, or why not?')
      .replace(/Why\s*\/\s*Why\s*not/gi, 'Why or why not');

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'en-GB'; // Default to British English for IELTS standard

      // Voice selection strategy
      const getOptimalVoice = () => {
        const voices = window.speechSynthesis.getVoices();

        // 1. Try to find high-quality British English voices (Natural/Premium)
        const premiumBritish = voices.find(
          (v) =>
            v.lang.startsWith('en-GB') &&
            (v.name.includes('Natural') ||
              v.name.includes('Premium') ||
              v.name.includes('Enhanced') ||
              v.name.includes('Neural'))
        );
        if (premiumBritish) return premiumBritish;

        // 2. Try named British voices (Daniel, Serena, etc.)
        const namedBritish = voices.find(
          (v) =>
            v.lang.startsWith('en-GB') &&
            (v.name.includes('Daniel') ||
              v.name.includes('Serena') ||
              v.name.includes('Martha') ||
              v.name.includes('George'))
        );
        if (namedBritish) return namedBritish;

        // 3. Any British English voice
        const anyBritish = voices.find((v) => v.lang.startsWith('en-GB'));
        if (anyBritish) return anyBritish;

        // 4. US English (fallback)
        const usEnglish = voices.find((v) => v.lang.startsWith('en-US'));
        if (usEnglish) return usEnglish;

        // 5. Any English voice
        return voices.find((v) => v.lang.startsWith('en'));
      };

      // Use cached voice or find optimal
      if (!selectedVoiceRef.current) {
        selectedVoiceRef.current = getOptimalVoice();
      }

      if (selectedVoiceRef.current) {
        utterance.voice = selectedVoiceRef.current;
      }

      // Refined speech parameters for IELTS examiner voice
      utterance.rate = 0.92;
      utterance.pitch = 1.0;

      // Track speaking state to block user recording
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = (event) => {
        if (event.error !== 'canceled') {
          console.warn('Speech error:', event.error);
        }
        setIsSpeaking(false);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }, []);

  // Preload voices early — required before first TTS call (Chrome lazily loads)
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0 && !voicesLoadedRef.current) {
        voicesLoadedRef.current = true;

        // Process any queued speech
        if (speechQueueRef.current.length > 0) {
          const queued = speechQueueRef.current;
          speechQueueRef.current = [];
          queued.forEach((text) => speakTextInternal(text));
        }
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [speakTextInternal]);

  // Cancel speech on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Public speakText — queues if voices not loaded, respects mute
  const speakText = useCallback(
    (text, options = { cancel: true }) => {
      if (!('speechSynthesis' in window) || isMuted) return Promise.resolve();

      if (voicesLoadedRef.current) {
        return speakTextInternal(text, options);
      } else {
        speechQueueRef.current.push(text);
        return Promise.resolve();
      }
    },
    [isMuted, speakTextInternal]
  );

  return { speakText, isSpeaking, isMuted, setIsMuted };
}
