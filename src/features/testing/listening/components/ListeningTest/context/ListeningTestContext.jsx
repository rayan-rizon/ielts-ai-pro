/**
 * ListeningTestContext - Zustand Adapter
 *
 * This file provides backward compatibility for existing code that uses the Context API.
 * Internally, it now delegates to the Zustand store for state management.
 *
 * MIGRATION NOTE:
 * - All existing hooks (useListeningTestState, useListeningTestDispatch, etc.) continue to work
 * - The Provider component is now a thin wrapper
 * - dispatch() calls are automatically converted to Zustand actions
 * - Timer and autosave logic is preserved but uses Zustand state
 */
import React, { createContext, useContext, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useListeningTestStore } from '@/features/testing/listening/store/useListeningTestStore';
import { computeQuestionNumbers } from '../utils/questionProcessing';
import { useAutosave } from '@/hooks/useAutosave';
import {
  dispatchListeningAction,
  LISTENING_ACTIONS,
} from '@/features/testing/listening/store/listeningTestDispatcher';

// ============ ACTIONS CONSTANT (for dispatch compatibility) ============
// Re-exporting from helper to maintain local reference if needed, but preferably use imported one
const ACTIONS = LISTENING_ACTIONS;

// ============ CONTEXTS (for Provider compatibility) ============
const ListeningTestStateContext = createContext(null);
const ListeningTestTimerContext = createContext(null);
const ListeningTestDispatchContext = createContext(null);

/**
 * ListeningTestProvider
 *
 * Maintains the same API but now acts as a thin wrapper.
 * Timer and autosave logic runs here, using Zustand state.
 */
export function ListeningTestProvider({ children }) {
  // Get Zustand store reference
  const store = useListeningTestStore;

  // Subscribe to what we need for effects
  const session = useListeningTestStore((s) => s.session);
  const isFinished = useListeningTestStore((s) => s.isFinished);
  const showResults = useListeningTestStore((s) => s.showResults);
  const timeRemaining = useListeningTestStore((s) => s.timeRemaining);
  const activePart = useListeningTestStore((s) => s.activePart);
  const answers = useListeningTestStore((s) => s.answers);

  // Refs for audio time
  const audioTimeRef = useRef(0);

  // Timer Logic (countdown)
  const timerShouldRun = !!session && !isFinished && !showResults && timeRemaining > 0;

  useEffect(() => {
    if (!timerShouldRun) return;

    const timer = setInterval(() => {
      store.getState().tickTimer();
    }, 1000);

    return () => clearInterval(timer);
  }, [timerShouldRun]);

  // Robust Autosave with Retry - using shared hook
  const getAnswers = useCallback(() => store.getState().answers, [store]);
  const getExtraData = useCallback(
    () => ({
      audio_current_time: audioTimeRef.current,
      time_remaining: store.getState().timeRemaining,
    }),
    [store]
  );
  const onSaveSuccess = useCallback(() => {
    // Optional: Could update UI indicator here
  }, []);
  const onSaveError = useCallback((err) => {
    console.error('[ListeningTest] Autosave ultimately failed:', err);
  }, []);

  const { saveNow, isSaving, lastSaved } = useAutosave({
    session,
    getAnswers,
    getExtraData,
    isFinished,
    onSaveSuccess,
    onSaveError,
  });

  // Sync internal autosave state to store
  useEffect(() => {
    store.getState().setSaving(isSaving);
  }, [isSaving]);

  useEffect(() => {
    if (lastSaved) {
      store.getState().setLastSaved(lastSaved);
    }
  }, [lastSaved]);

  // Save immediately when user changes part (matching ReadingTestContext behavior)
  // This ensures progress is persisted before the user navigates away
  useEffect(() => {
    if (!session || Object.keys(answers).length === 0 || isFinished) return;

    // Skip initial render when activePart is 0 and no answers yet
    const isInitialRender = activePart === 0 && Object.keys(answers).length <= 1;
    if (isInitialRender) return;

    saveNow();
    console.log('[Autosave] Triggered on part change');
  }, [activePart]);

  // Expose ref setter for audio time
  const setAudioTimeRef = useCallback((time) => {
    audioTimeRef.current = time;
    store.getState().setAudioTime(time);
  }, []);

  // Get latest state helper
  const getLatestState = useCallback(() => store.getState(), []);

  // Create dispatch function that maps to Zustand actions
  const dispatch = useCallback((action) => {
    dispatchListeningAction(store, action);
  }, []);

  // Memoize dispatch value to prevent unnecessary re-renders
  const dispatchValue = useMemo(
    () => ({ dispatch, getLatestState, setAudioTimeRef, ACTIONS }),
    [dispatch, getLatestState, setAudioTimeRef]
  );

  // For backward compatibility, provide context values
  return (
    <ListeningTestDispatchContext.Provider value={dispatchValue} data-oid="3in1v1-">
      <ListeningTestTimerContext.Provider value={timeRemaining} data-oid="z1gptzb">
        <ListeningTestStateContext.Provider value={null} data-oid="x1lwu7d">
          {children}
        </ListeningTestStateContext.Provider>
      </ListeningTestTimerContext.Provider>
    </ListeningTestDispatchContext.Provider>
  );
}

/**
 * useListeningTestState - Now reads from Zustand
 * OPTIMIZATION: Does NOT include audioCurrentTime to prevent rendering loop.
 * Use useListeningAudioTime() for the active playback time.
 */
export function useListeningTestState() {
  const testData = useListeningTestStore((s) => s.testData);
  const questions = useListeningTestStore((s) => s.questions);
  const questionsWithNumbers = useListeningTestStore((s) => s.questionsWithNumbers);
  const session = useListeningTestStore((s) => s.session);
  const answers = useListeningTestStore((s) => s.answers);
  const isLoading = useListeningTestStore((s) => s.isLoading);
  const isSubmitting = useListeningTestStore((s) => s.isSubmitting);
  const isFinished = useListeningTestStore((s) => s.isFinished);
  const activePart = useListeningTestStore((s) => s.activePart);
  const showResults = useListeningTestStore((s) => s.showResults);
  const showTranscript = useListeningTestStore((s) => s.showTranscript);
  const flaggedQuestions = useListeningTestStore((s) => s.flaggedQuestions);
  const correctAnswersMap = useListeningTestStore((s) => s.correctAnswersMap);
  const showConfetti = useListeningTestStore((s) => s.showConfetti);
  const earnedXP = useListeningTestStore((s) => s.earnedXP);
  const testResults = useListeningTestStore((s) => s.testResults);
  const error = useListeningTestStore((s) => s.error);

  return {
    testData,
    questions,
    questionsWithNumbers,
    session,
    answers,
    isLoading,
    isSubmitting,
    isFinished,
    activePart,
    showResults,
    showTranscript,
    flaggedQuestions,
    correctAnswersMap,
    showConfetti,
    earnedXP,
    testResults,
    error,
    isSaving: useListeningTestStore((s) => s.isSaving),
    lastSaved: useListeningTestStore((s) => s.lastSaved),
    timeRemaining: useListeningTestStore((s) => s.timeRemaining),
  };
}

/**
 * useListeningAudioTime - Specialized hook for frequently changing audio time.
 * Components using this will re-render during playback.
 */
export function useListeningAudioTime() {
  return useListeningTestStore((s) => s.audioCurrentTime);
}

/**
 * useListeningTestTimer - Now reads from Zustand
 */
export function useListeningTestTimer() {
  return useListeningTestStore((s) => s.timeRemaining);
}

/**
 * useListeningTestDispatch - Now provides Zustand-backed dispatch
 */
export function useListeningTestDispatch() {
  const context = useContext(ListeningTestDispatchContext);
  if (!context) {
    // Fallback: Create dispatch directly from store if outside Provider
    const store = useListeningTestStore;
    const audioTimeRef = { current: 0 };

    return {
      dispatch: (action) => {
        dispatchListeningAction(store, action);
      },
      getLatestState: () => store.getState(),
      setAudioTimeRef: (time) => {
        audioTimeRef.current = time;
        store.getState().setAudioTime(time);
      },
      useListeningAudioTime, // Expose for shim consistency if needed
      ACTIONS: LISTENING_ACTIONS,
    };
  }
  return { ...context, ACTIONS: LISTENING_ACTIONS };
}

// Export ACTIONS for external use
export { LISTENING_ACTIONS };
