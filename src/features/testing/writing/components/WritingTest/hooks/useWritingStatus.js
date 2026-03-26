import { useState, useEffect, useRef } from 'react';
import { useWritingTestStore } from '@/features/testing/writing/store/useWritingTestStore';

/**
 * useWritingStatus
 *
 * Manages UI-only status updates and side-effects:
 * - Word Count calculation (debounced/throttled)
 * - Timer monitoring
 * - Analysis loading message rotation
 */
export function useWritingStatus() {
  const [loadingMessage, setLoadingMessage] = useState('Initializing analysis...');
  // Check if we need to expose these setters or if they are internal
  const setShowTimeUpDialog = useWritingTestStore((state) => state.setShowTimeUpDialog);
  const isAnalyzing = useWritingTestStore((state) => state.isAnalyzing);
  const activeType = useWritingTestStore((state) => state.activeType);

  // 1. Word Count Subscription
  useEffect(() => {
    let wordCountTimeoutId;
    const unsubscribe = useWritingTestStore.subscribe(
      (state) => state.drafts[state.activeType] || '',
      (writing) => {
        if (wordCountTimeoutId) clearTimeout(wordCountTimeoutId);
        wordCountTimeoutId = setTimeout(() => {
          // Simple robust word count
          const words = writing.replace(/<[^>]*>?/gm, ' ').match(/\S+/g) || [];
          useWritingTestStore.getState().setWordCount(words.length);
        }, 150);
      }
    );
    return () => {
      if (wordCountTimeoutId) clearTimeout(wordCountTimeoutId);
      unsubscribe();
    };
  }, []);

  // 2. Timer Monitor
  useEffect(() => {
    const unsubscribe = useWritingTestStore.subscribe(
      (state) => state.timeRemaining,
      (timeRemaining, prevTimeRemaining) => {
        const state = useWritingTestStore.getState();
        if (prevTimeRemaining > 0 && timeRemaining <= 0 && !state.isCompleted && !state.isLoading) {
          state.setShowTimeUpDialog(true);
        }
      }
    );
    return unsubscribe;
  }, []);

  // 3. Analysis Loading Messages
  useEffect(() => {
    let intervalId;
    const stop = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = undefined;
    };

    if (isAnalyzing) {
      const messages = [
        'Checking grammar and spelling...',
        'Analyzing vocabulary usage...',
        'Evaluating coherence and cohesion...',
        'Assessing task achievement...',
        'Calculating band score...',
      ];
      let i = 0;
      setLoadingMessage(messages[0]);
      intervalId = setInterval(() => {
        i = (i + 1) % messages.length;
        setLoadingMessage(messages[i]);
      }, 2500);
    } else {
      stop();
    }

    return stop;
    // We depend on isAnalyzing. When it changes, this effect re-runs.
  }, [isAnalyzing]);

  return {
    loadingMessage,
  };
}
