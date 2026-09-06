/**
 * ReadingTestContext - Zustand Adapter
 *
 * This file provides backward compatibility for existing code that uses the Context API.
 * Internally, it now delegates to the Zustand store for state management.
 *
 * MIGRATION NOTE:
 * - All existing hooks (useReadingTestState, useReadingTestDispatch, etc.) continue to work
 * - The Provider component is now a thin wrapper that just renders children
 * - dispatch() calls are automatically converted to Zustand actions
 * - Timer and autosave logic is preserved but uses Zustand state
 */
import React, { createContext, useContext, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useReadingTestStore } from '@/features/testing/reading/store/useReadingTestStore';
import { useAutosave } from '@/hooks/useAutosave';

// ============ ACTIONS CONSTANT (for dispatch compatibility) ============
const ACTIONS = {
  SET_TEST_DATA: 'SET_TEST_DATA',
  SET_SESSION: 'SET_SESSION',
  SET_ANSWER: 'SET_ANSWER',
  SET_ANSWERS_BULK: 'SET_ANSWERS_BULK',
  TICK_TIMER: 'TICK_TIMER',
  SET_TIME: 'SET_TIME',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  FINISH_TEST: 'FINISH_TEST',
  RESET_TEST: 'RESET_TEST',
  SET_PASSAGE_INDEX: 'SET_PASSAGE_INDEX',
  VALIDATE_SESSION: 'VALIDATE_SESSION',
};

// ============ CONTEXTS (for Provider compatibility) ============
const ReadingTestStateContext = createContext(null);
const ReadingTestTimerContext = createContext(null);
const ReadingTestDispatchContext = createContext(null);

/**
 * ReadingTestProvider
 *
 * Maintains the same API but now acts as a thin wrapper.
 * Timer and autosave logic runs here, using Zustand state.
 */
export function ReadingTestProvider({ children }) {
  // Get Zustand store reference
  const store = useReadingTestStore;

  // Subscribe to only what we need for effects at the top level
  const session = useReadingTestStore((s) => s.session);
  const isFinished = useReadingTestStore((s) => s.isFinished);
  const showResults = useReadingTestStore((s) => s.showResults);
  const answers = useReadingTestStore((s) => s.answers);
  const currentPassageIndex = useReadingTestStore((s) => s.currentPassageIndex);
  // const timeRemaining = useReadingTestStore((s) => s.timeRemaining); // Removed to prevent re-renders

  // Timer Logic
  useEffect(() => {
    if (!session || isFinished || showResults) return;

    const timer = setInterval(() => {
      store.getState().tickTimer();
    }, 1000);

    return () => clearInterval(timer);
  }, [session, isFinished, showResults]);

  // Robust Autosave with Retry - using shared hook
  const getAnswers = useCallback(() => store.getState().answers, [store]);
  const getExtraData = useCallback(
    () => ({
      time_remaining: store.getState().timeRemaining,
      // Annotations ride along with the answer autosave so that resuming on
      // another day (or another device) restores the learner's own markup, not
      // just their answers.
      highlights: store.getState().highlights,
      notes: store.getState().notes,
    }),
    [store]
  );
  const onSaveSuccess = useCallback(() => {
    // Handled by return values from useAutosave, but we could do more here
  }, []);
  const onSaveError = useCallback((err) => {
    console.error('[ReadingTest] Autosave ultimately failed:', err);
  }, []);

  const { saveNow, isSaving, lastSaved } = useAutosave({
    session,
    getAnswers,
    getExtraData,
    isFinished,
    onSaveSuccess,
    onSaveError,
  });

  // Sync internal autosave state to store (to keep logic centralized)
  useEffect(() => {
    store.getState().setSaving(isSaving);
  }, [isSaving]);

  useEffect(() => {
    if (lastSaved) {
      store.getState().setLastSaved(lastSaved);
    }
  }, [lastSaved]);

  // Save immediately when user changes passage (using retry-enabled saveNow)
  useEffect(() => {
    if (!session || Object.keys(answers).length === 0 || isFinished) return;

    const isInitialRender = currentPassageIndex === 0 && Object.keys(answers).length <= 1;
    if (isInitialRender) return;

    saveNow();
    console.log('[Autosave] Triggered on passage change');
  }, [currentPassageIndex]);

  // Create dispatch function that maps to Zustand actions
  const dispatch = useCallback((action) => {
    const state = store.getState();

    switch (action.type) {
      case ACTIONS.SET_TEST_DATA:
        state.setTestData(action.payload.passage, action.payload.questions);
        break;
      case ACTIONS.SET_SESSION:
        state.setSession(action.payload);
        break;
      case ACTIONS.SET_ANSWER:
        state.setAnswer(action.payload.id, action.payload.value);
        break;
      case ACTIONS.SET_ANSWERS_BULK:
        state.setAnswersBulk(action.payload);
        break;
      case ACTIONS.TICK_TIMER:
        state.tickTimer();
        break;
      case ACTIONS.SET_TIME:
        state.setTime(action.payload);
        break;
      case ACTIONS.SET_LOADING:
        state.setLoading(action.payload);
        break;
      case ACTIONS.SET_ERROR:
        state.setError(action.payload);
        break;
      case ACTIONS.FINISH_TEST:
        state.finishTest();
        break;
      case ACTIONS.RESET_TEST:
        state.resetTest();
        break;
      case ACTIONS.SET_PASSAGE_INDEX:
        state.setPassageIndex(action.payload);
        break;
      case ACTIONS.VALIDATE_SESSION:
        state.validateSession(action.payload);
        break;
      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  }, []);

  // Get latest state helper (for exit logic)
  const getLatestState = useCallback(() => store.getState(), []);

  // Memoize dispatch value to prevent unnecessary re-renders
  const dispatchValue = useMemo(() => ({ dispatch, getLatestState }), [dispatch, getLatestState]);

  // For backward compatibility, provide context values
  return (
    <ReadingTestDispatchContext.Provider value={dispatchValue} data-oid="f6e_mab">
      <ReadingTestTimerContext.Provider value={null} data-oid="agxtpev">
        <ReadingTestStateContext.Provider value={null} data-oid="_w:cw9o">
          {children}
        </ReadingTestStateContext.Provider>
      </ReadingTestTimerContext.Provider>
    </ReadingTestDispatchContext.Provider>
  );
}

/**
 * useReadingTestState - Now reads from Zustand
 */
export function useReadingTestState() {
  const testData = useReadingTestStore((s) => s.testData);
  const allQuestions = useReadingTestStore((s) => s.allQuestions);
  const session = useReadingTestStore((s) => s.session);
  const answers = useReadingTestStore((s) => s.answers);
  const isLoading = useReadingTestStore((s) => s.isLoading);
  const isSubmitting = useReadingTestStore((s) => s.isSubmitting);
  const isFinished = useReadingTestStore((s) => s.isFinished);
  const currentPassageIndex = useReadingTestStore((s) => s.currentPassageIndex);
  const showResults = useReadingTestStore((s) => s.showResults);
  const highlights = useReadingTestStore((s) => s.highlights);
  const notes = useReadingTestStore((s) => s.notes);
  const error = useReadingTestStore((s) => s.error);
  const isSaving = useReadingTestStore((s) => s.isSaving);
  const lastSaved = useReadingTestStore((s) => s.lastSaved);

  return {
    testData,
    allQuestions,
    session,
    answers,
    isLoading,
    isSubmitting,
    isFinished,
    currentPassageIndex,
    showResults,
    highlights,
    notes,
    error,
    isSaving,
    lastSaved,
  };
}

/**
 * useReadingTestTimer - Now reads from Zustand
 */
export function useReadingTestTimer() {
  return useReadingTestStore((s) => s.timeRemaining);
}

/**
 * useReadingTestDispatch - Now provides Zustand-backed dispatch
 */
export function useReadingTestDispatch() {
  const context = useContext(ReadingTestDispatchContext);
  if (!context) {
    // Fallback: Create dispatch directly from store if outside Provider
    const store = useReadingTestStore;
    return {
      dispatch: (action) => {
        const state = store.getState();
        switch (action.type) {
          case ACTIONS.SET_TEST_DATA:
            state.setTestData(action.payload.passage, action.payload.questions);
            break;
          case ACTIONS.SET_SESSION:
            state.setSession(action.payload);
            break;
          case ACTIONS.SET_ANSWER:
            state.setAnswer(action.payload.id, action.payload.value);
            break;
          case ACTIONS.SET_ANSWERS_BULK:
            state.setAnswersBulk(action.payload);
            break;
          case ACTIONS.TICK_TIMER:
            state.tickTimer();
            break;
          case ACTIONS.SET_TIME:
            state.setTime(action.payload);
            break;
          case ACTIONS.SET_LOADING:
            state.setLoading(action.payload);
            break;
          case ACTIONS.SET_ERROR:
            state.setError(action.payload);
            break;
          case ACTIONS.FINISH_TEST:
            state.finishTest();
            break;
          case ACTIONS.RESET_TEST:
            state.resetTest();
            break;
          case ACTIONS.SET_PASSAGE_INDEX:
            state.setPassageIndex(action.payload);
            break;
          case ACTIONS.VALIDATE_SESSION:
            state.validateSession(action.payload);
            break;
          default:
            console.warn(`Unknown action type: ${action.type}`);
        }
      },
      getLatestState: () => store.getState(),
    };
  }
  return context;
}

/**
 * Legacy hook for backward compatibility.
 * @deprecated Use useReadingTestState, useReadingTestTimer, or useReadingTestDispatch
 */
export function useReadingTest() {
  const state = useReadingTestState();
  const timer = useReadingTestTimer();
  const { dispatch } = useReadingTestDispatch();

  return {
    state: { ...state, timeRemaining: timer },
    dispatch,
  };
}

// Export ACTIONS for external use
export { ACTIONS as READING_ACTIONS };
