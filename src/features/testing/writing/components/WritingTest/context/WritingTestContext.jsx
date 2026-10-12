/**
 * WritingTestContext - Zustand Adapter
 *
 * This file provides backward compatibility for existing code that uses the Context API.
 * Internally, it now delegates to the Zustand store for state management.
 *
 * MIGRATION NOTE:
 * - All existing hooks continue to work
 * - The Provider component is now a thin wrapper
 * - dispatch() calls are automatically converted to Zustand actions
 * - Timer and autosave logic is preserved but uses Zustand state
 */
import React, { createContext, useContext, useEffect, useCallback, useMemo, useRef } from 'react';
import { useWritingTestStore } from '@/features/testing/writing/store/useWritingTestStore';
import { useAutosave } from '@/hooks/useAutosave';
import { getSessionTestMode } from '@/features/testing/shared/testMode';

// ============ ACTIONS CONSTANT (for dispatch compatibility) ============
const ACTIONS = {
  SET_TASK: 'SET_TASK',
  SET_SESSION: 'SET_SESSION',
  SET_DRAFT: 'SET_DRAFT',
  SET_DRAFTS_BULK: 'SET_DRAFTS_BULK',
  SET_WORD_COUNT: 'SET_WORD_COUNT',
  TICK_TIMER: 'TICK_TIMER',
  SET_TIME: 'SET_TIME',
  SET_ACTIVE_TYPE: 'SET_ACTIVE_TYPE',
  SET_LOADING: 'SET_LOADING',
  SET_SUBMITTING: 'SET_SUBMITTING',
  SET_ANALYZING: 'SET_ANALYZING',
  SET_COMPLETED: 'SET_COMPLETED',
  SET_ERROR: 'SET_ERROR',
  SET_FEEDBACK_ERROR: 'SET_FEEDBACK_ERROR',
  SET_FEEDBACK: 'SET_FEEDBACK',
  SET_FEEDBACKS_BULK: 'SET_FEEDBACKS_BULK',
  SET_CURRENT_FEEDBACK: 'SET_CURRENT_FEEDBACK',
  SET_CURRENT_USER: 'SET_CURRENT_USER',
  SWITCH_TASK: 'SWITCH_TASK',
  RESET_TEST: 'RESET_TEST',
  SHOW_EXIT_DIALOG: 'SHOW_EXIT_DIALOG',
  SHOW_SUBMIT_DIALOG: 'SHOW_SUBMIT_DIALOG',
  SHOW_TIME_UP_DIALOG: 'SHOW_TIME_UP_DIALOG',
  SHOW_UPGRADE_DIALOG: 'SHOW_UPGRADE_DIALOG',
};

// ============ CONTEXTS (for Provider compatibility) ============
const WritingTestStateContext = createContext(null);
const WritingTestDispatchContext = createContext(null);

/**
 * WritingTestProvider
 *
 * Maintains the same API but now acts as a thin wrapper.
 * Timer and autosave logic runs here, using Zustand state.
 *
 * Pattern matches ReadingTestProvider for consistency.
 */
export function WritingTestProvider({ children }) {
  // Get Zustand store reference
  const store = useWritingTestStore;

  // Subscribe to only what we need for effects (matching Reading pattern)
  const session = useWritingTestStore((s) => s.session);
  const isCompleted = useWritingTestStore((s) => s.isCompleted);
  const activeType = useWritingTestStore((s) => s.activeType);

  // Timer Logic - Robust implementation using wall-clock time
  useEffect(() => {
    // Don't run timer if no session or test is completed
    if (!session || isCompleted || getSessionTestMode(session) === 'exam') {
      return;
    }

    // Check if test has feedback (effectively finished)
    const hasFeedback = store.getState().hasAnyFeedback();
    if (hasFeedback) {
      return;
    }

    // Store start values for detailed drift correction
    const startTime = Date.now();
    const startRemaining = store.getState().timeRemaining;

    const timer = setInterval(() => {
      // Get fresh state
      const state = store.getState();

      // Stop if completed or has feedback
      if (state.isCompleted || state.hasAnyFeedback()) {
        clearInterval(timer);
        return;
      }

      // Calculate expected time based on wall clock (anti-throttling)
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const newRemaining = Math.max(0, startRemaining - elapsedSeconds);

      // Only update if changed (prevents unnecessary store updates)
      if (state.timeRemaining !== newRemaining) {
        state.setTime(newRemaining);
      }

      // Show time up dialog when timer reaches 0
      if (newRemaining <= 0) {
        state.setShowTimeUpDialog(true);
        clearInterval(timer);
      }
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [session, isCompleted, store]);

  // Robust Autosave with Retry - using shared hook
  const getAnswers = useCallback(() => {
    const state = store.getState();
    // Construct response payload matching expected format
    return [
      {
        response: JSON.stringify(state.drafts),
        word_count: state.wordCount,
        task1_response: state.drafts['Task 1'],
        task2_response: state.drafts['Task 2'],
      },
    ];
  }, [store]);

  const getExtraData = useCallback(() => {
    const feedbacks = store.getState().feedbacks;
    const hasFeedback = !!(feedbacks?.['Task 1'] || feedbacks?.['Task 2']);

    return {
      time_remaining: store.getState().timeRemaining,
      ...(hasFeedback ? { ai_feedbacks: feedbacks } : {}),
    };
  }, [store]);

  const onSaveSuccess = useCallback(() => {
    // Invalidate cache so Writing page shows fresh data when user returns
    // Use dynamic import to avoid circular deps
    import('@/hooks/useDataQuery')
      .then(({ removeFromCache }) => {
        removeFromCache('writing-tests-list');
      })
      .catch(() => {
        // Fallback: cache will be stale but not critical
      });
  }, []);

  const onSaveError = useCallback((err) => {
    console.error('[WritingTest] Autosave ultimately failed:', err);
  }, []);

  const { saveNow, isSaving, lastSaved } = useAutosave({
    session,
    getAnswers,
    getExtraData,
    isFinished: isCompleted || session?.evaluation_status === 'pending',
    onSaveSuccess,
    onSaveError,
  });

  // Sync internal autosave state to store
  useEffect(() => {
    store.getState().setSaving(isSaving);
  }, [isSaving, store]);

  useEffect(() => {
    if (lastSaved) {
      store.getState().setLastSaved(lastSaved);
    }
  }, [lastSaved, store]);

  // Track previous activeType to detect changes (for save on task switch)
  const previousActiveTypeRef = useRef(activeType);

  // Save immediately when user switches task type (matching Reading/Listening behavior)
  useEffect(() => {
    // Skip initial mount - only save on actual changes
    if (previousActiveTypeRef.current === activeType) return;
    previousActiveTypeRef.current = activeType;

    // Check conditions using store.getState() for fresh values
    const state = store.getState();
    if (!state.session || state.isCompleted) return;

    // Check if there's any content to save
    const hasDraftContent = state.drafts['Task 1']?.trim() || state.drafts['Task 2']?.trim();
    if (!hasDraftContent) return;

    saveNow();
  }, [activeType, saveNow, store]);

  // Get latest state helper
  const getLatestState = useCallback(() => store.getState(), [store]);

  // Create dispatch function that maps to Zustand actions
  const dispatch = useCallback(
    (action) => {
      const state = store.getState();

      switch (action.type) {
        case ACTIONS.SET_TASK:
          state.setTask(action.payload.task, action.payload.compositeTasks);
          break;
        case ACTIONS.SET_SESSION:
          state.setSession(action.payload);
          break;
        case ACTIONS.SET_DRAFT:
          state.setDraft(action.payload.taskType, action.payload.content);
          break;
        case ACTIONS.SET_DRAFTS_BULK:
          state.setDraftsBulk(action.payload);
          break;
        case ACTIONS.SET_WORD_COUNT:
          state.setWordCount(action.payload);
          break;
        case ACTIONS.TICK_TIMER:
          state.tickTimer();
          break;
        case ACTIONS.SET_TIME:
          state.setTime(action.payload);
          break;
        case ACTIONS.SET_ACTIVE_TYPE:
          state.setActiveType(action.payload);
          break;
        case ACTIONS.SET_LOADING:
          state.setLoading(action.payload);
          break;
        case ACTIONS.SET_SUBMITTING:
          state.setSubmitting(action.payload);
          break;
        case ACTIONS.SET_ANALYZING:
          state.setAnalyzing(action.payload);
          break;
        case ACTIONS.SET_COMPLETED:
          state.setCompleted(action.payload);
          break;
        case ACTIONS.SET_ERROR:
          state.setError(action.payload);
          break;
        case ACTIONS.SET_FEEDBACK_ERROR:
          state.setFeedbackError(action.payload);
          break;
        case ACTIONS.SET_FEEDBACK:
          state.setFeedback(action.payload.taskType, action.payload.feedback);
          break;
        case ACTIONS.SET_FEEDBACKS_BULK:
          state.setFeedbacksBulk(action.payload);
          break;
        case ACTIONS.SET_CURRENT_FEEDBACK:
          state.setCurrentFeedback(action.payload);
          break;
        case ACTIONS.SET_CURRENT_USER:
          state.setCurrentUser(action.payload);
          break;
        case ACTIONS.SWITCH_TASK:
          state.switchTask(action.payload);
          break;
        case ACTIONS.RESET_TEST:
          state.resetTest();
          break;
        case ACTIONS.SHOW_EXIT_DIALOG:
          state.setShowExitDialog(action.payload);
          break;
        case ACTIONS.SHOW_SUBMIT_DIALOG:
          state.setShowSubmitDialog(action.payload);
          break;
        case ACTIONS.SHOW_TIME_UP_DIALOG:
          state.setShowTimeUpDialog(action.payload);
          break;
        case ACTIONS.SHOW_UPGRADE_DIALOG:
          state.setShowUpgradeDialog(action.payload);
          break;
        default:
          console.warn(`Unknown action type: ${action.type}`);
      }
    },
    [store]
  );

  const dispatchContextValue = useMemo(
    () => ({ dispatch, getLatestState, saveNow, ACTIONS }),
    [dispatch, getLatestState, saveNow]
  );

  // For backward compatibility, provide context values
  return (
    <WritingTestDispatchContext.Provider value={dispatchContextValue} data-oid="eudftio">
      <WritingTestStateContext.Provider value={null} data-oid="6o3:tg3">
        {children}
      </WritingTestStateContext.Provider>
    </WritingTestDispatchContext.Provider>
  );
}

/**
 * useWritingTestState - Now reads from Zustand
 */
export function useWritingTestState() {
  const task = useWritingTestStore((s) => s.task);
  const compositeTasks = useWritingTestStore((s) => s.compositeTasks);
  const session = useWritingTestStore((s) => s.session);
  const drafts = useWritingTestStore((s) => s.drafts);
  const feedbacks = useWritingTestStore((s) => s.feedbacks);
  const currentFeedback = useWritingTestStore((s) => s.currentFeedback);
  const activeType = useWritingTestStore((s) => s.activeType);
  const wordCount = useWritingTestStore((s) => s.wordCount);
  const isLoading = useWritingTestStore((s) => s.isLoading);
  const isSubmitting = useWritingTestStore((s) => s.isSubmitting);
  const isAnalyzing = useWritingTestStore((s) => s.isAnalyzing);
  const isCompleted = useWritingTestStore((s) => s.isCompleted);
  const showExitDialog = useWritingTestStore((s) => s.showExitDialog);
  const showSubmitDialog = useWritingTestStore((s) => s.showSubmitDialog);
  const showTimeUpDialog = useWritingTestStore((s) => s.showTimeUpDialog);
  const showUpgradeDialog = useWritingTestStore((s) => s.showUpgradeDialog);
  const error = useWritingTestStore((s) => s.error);
  const feedbackError = useWritingTestStore((s) => s.feedbackError);
  const currentUser = useWritingTestStore((s) => s.currentUser);

  return {
    task,
    compositeTasks,
    session,
    drafts,
    feedbacks,
    currentFeedback,
    activeType,
    wordCount,
    isLoading,
    isSubmitting,
    isAnalyzing,
    isCompleted,
    showExitDialog,
    showSubmitDialog,
    showTimeUpDialog,
    showUpgradeDialog,
    error,
    feedbackError,
    currentUser,
    isSaving: useWritingTestStore((s) => s.isSaving),
    lastSaved: useWritingTestStore((s) => s.lastSaved),
  };
}

/**
 * useWritingTestTimer - Now reads from Zustand
 */
export function useWritingTestTimer() {
  return useWritingTestStore((s) => s.timeRemaining);
}

/**
 * useWritingTestDispatch - Now provides Zustand-backed dispatch
 */
export function useWritingTestDispatch() {
  const context = useContext(WritingTestDispatchContext);
  if (!context) {
    // Fallback: Create dispatch directly from store if outside Provider
    const store = useWritingTestStore;

    return {
      dispatch: (action) => {
        const state = store.getState();
        switch (action.type) {
          case ACTIONS.SET_TASK:
            state.setTask(action.payload.task, action.payload.compositeTasks);
            break;
          case ACTIONS.SET_SESSION:
            state.setSession(action.payload);
            break;
          case ACTIONS.SET_DRAFT:
            state.setDraft(action.payload.taskType, action.payload.content);
            break;
          case ACTIONS.SET_DRAFTS_BULK:
            state.setDraftsBulk(action.payload);
            break;
          case ACTIONS.SET_WORD_COUNT:
            state.setWordCount(action.payload);
            break;
          case ACTIONS.TICK_TIMER:
            state.tickTimer();
            break;
          case ACTIONS.SET_TIME:
            state.setTime(action.payload);
            break;
          case ACTIONS.SET_ACTIVE_TYPE:
            state.setActiveType(action.payload);
            break;
          case ACTIONS.SET_LOADING:
            state.setLoading(action.payload);
            break;
          case ACTIONS.SET_SUBMITTING:
            state.setSubmitting(action.payload);
            break;
          case ACTIONS.SET_ANALYZING:
            state.setAnalyzing(action.payload);
            break;
          case ACTIONS.SET_COMPLETED:
            state.setCompleted(action.payload);
            break;
          case ACTIONS.SET_ERROR:
            state.setError(action.payload);
            break;
          case ACTIONS.SET_FEEDBACK_ERROR:
            state.setFeedbackError(action.payload);
            break;
          case ACTIONS.SET_FEEDBACK:
            state.setFeedback(action.payload.taskType, action.payload.feedback);
            break;
          case ACTIONS.SET_FEEDBACKS_BULK:
            state.setFeedbacksBulk(action.payload);
            break;
          case ACTIONS.SET_CURRENT_FEEDBACK:
            state.setCurrentFeedback(action.payload);
            break;
          case ACTIONS.SET_CURRENT_USER:
            state.setCurrentUser(action.payload);
            break;
          case ACTIONS.SWITCH_TASK:
            state.switchTask(action.payload);
            break;
          case ACTIONS.RESET_TEST:
            state.resetTest();
            break;
          case ACTIONS.SHOW_EXIT_DIALOG:
            state.setShowExitDialog(action.payload);
            break;
          case ACTIONS.SHOW_SUBMIT_DIALOG:
            state.setShowSubmitDialog(action.payload);
            break;
          case ACTIONS.SHOW_TIME_UP_DIALOG:
            state.setShowTimeUpDialog(action.payload);
            break;
          case ACTIONS.SHOW_UPGRADE_DIALOG:
            state.setShowUpgradeDialog(action.payload);
            break;
          default:
            console.warn(`Unknown action type: ${action.type}`);
        }
      },
      getLatestState: () => store.getState(),
      saveNow: async () => {
        console.warn('[WritingTest] saveNow called outside Provider - no-op');
        return false;
      },
      ACTIONS,
    };
  }
  return context;
}

/**
 * Legacy hook for backward compatibility.
 * @deprecated Use useWritingTestState, useWritingTestTimer, or useWritingTestDispatch
 */
export function useWritingTest() {
  const state = useWritingTestState();
  const timer = useWritingTestTimer();
  const { dispatch } = useWritingTestDispatch();

  return {
    state: { ...state, timeRemaining: timer },
    dispatch,
  };
}

// Export ACTIONS for external use
export { ACTIONS as WRITING_ACTIONS };
