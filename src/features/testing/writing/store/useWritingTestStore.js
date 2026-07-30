/**
 * Writing Test Zustand Store
 *
 * Centralized state management for the Writing test module with sessionStorage persistence.
 * Follows the same architectural pattern as Reading and Listening stores.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';

/**
 * Writing Test Store
 *
 * Features:
 * - All test state including multi-task support (Task 1 & Task 2)
 * - Persists drafts, timeRemaining, and activeType
 * - Fine-grained subscriptions via subscribeWithSelector
 */
export const useWritingTestStore = create(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // ============ TEST DATA (not persisted) ============
        task: null,
        compositeTasks: {}, // { 'Task 1': {...}, 'Task 2': {...} }

        // ============ SESSION STATE (partially persisted) ============
        session: null,
        sessionId: null,
        drafts: { 'Task 1': '', 'Task 2': '' }, // Writing content per task
        timeRemaining: 3600, // 60 minutes default

        // ============ FEEDBACK STATE (persisted) ============
        feedbacks: { 'Task 1': null, 'Task 2': null },
        currentFeedback: null,

        // ============ UI STATE (partially persisted) ============
        activeType: 'Task 1',
        isLoading: true,
        isSubmitting: false,
        isAnalyzing: false,
        isCompleted: false,
        wordCount: 0,
        isSaving: false,
        lastSaved: null,

        // ============ DIALOGS STATE ============
        showExitDialog: false,
        showSubmitDialog: false,
        showTimeUpDialog: false,
        showUpgradeDialog: false,

        // ============ ERROR STATE ============
        error: null,
        feedbackError: null,

        // ============ USER STATE ============
        currentUser: null,

        // ============ ACTIONS ============

        /**
         * Set task data after fetching
         */
        setTask: (task, compositeTasks = {}, activeType) =>
          set({
            task,
            compositeTasks,
            isLoading: false,
            ...(activeType ? { activeType } : {}),
          }),

        /**
         * Set the current session
         */
        setSession: (session) =>
          set({
            session,
            sessionId: session?.id || null,
          }),

        /**
         * Validate current session against persisted sessionId
         * Required for tab-safety (prevents loading state from other tabs)
         */
        validateSession: (currentSessionId) => {
          const persistedId = get().sessionId;
          if (persistedId && persistedId !== currentSessionId) {
            console.warn('[WritingTestStore] Session ID mismatch. Resetting store for tab safety.');
            get().fullReset();
            return false;
          }
          return true;
        },

        /**
         * Set current user
         */
        setCurrentUser: (user) => set({ currentUser: user }),

        /**
         * Set draft for specific task type
         */
        setDraft: (taskType, content) =>
          set((state) => {
            if (state.drafts[taskType] === content) return state;
            return {
              drafts: { ...state.drafts, [taskType]: content },
            };
          }),

        /**
         * Set drafts bulk (for restoring from DB)
         */
        setDraftsBulk: (draftsObj) =>
          set((state) => ({
            drafts: { ...state.drafts, ...draftsObj },
          })),

        /**
         * Get current active draft content
         */
        getCurrentDraft: () => {
          const state = get();
          return state.drafts[state.activeType] || '';
        },

        /**
         * Set word count
         */
        setWordCount: (count) => set({ wordCount: count }),

        /**
         * Decrement timer by 1 second
         */
        tickTimer: () =>
          set((state) => ({
            timeRemaining: Math.max(0, state.timeRemaining - 1),
          })),

        /**
         * Set time directly (for restoring from DB)
         */
        setTime: (seconds) => set({ timeRemaining: seconds }),

        /**
         * Set active task type (Task 1 or Task 2)
         */
        setActiveType: (type) => set({ activeType: type }),

        /**
         * Set loading state
         */
        setLoading: (isLoading) => set({ isLoading }),

        /**
         * Set submitting state
         */
        setSubmitting: (isSubmitting) => set({ isSubmitting }),

        /**
         * Set analyzing state (AI feedback)
         */
        setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),

        /**
         * Set completed state
         */
        setCompleted: (isCompleted) => set({ isCompleted }),

        /**
         * Set error state
         */
        setError: (error) => set({ error, isLoading: false }),

        /**
         * Set feedback error
         */
        setFeedbackError: (feedbackError) => set({ feedbackError }),

        /**
         * Set feedback for specific task type
         */
        setFeedback: (taskType, feedback) =>
          set((state) => ({
            feedbacks: { ...state.feedbacks, [taskType]: feedback },
            currentFeedback: feedback,
          })),

        /**
         * Set feedbacks bulk (for restoring from DB)
         */
        setFeedbacksBulk: (feedbacksObj) =>
          set((state) => ({
            feedbacks: { ...state.feedbacks, ...feedbacksObj },
          })),

        /**
         * Set current visible feedback
         */
        setCurrentFeedback: (feedback) => set({ currentFeedback: feedback }),

        /**
         * Dialog setters
         */
        setShowExitDialog: (show) => set({ showExitDialog: show }),
        setShowSubmitDialog: (show) => set({ showSubmitDialog: show }),
        setShowTimeUpDialog: (show) => set({ showTimeUpDialog: show }),
        setShowUpgradeDialog: (show) => set({ showUpgradeDialog: show }),

        /**
         * Set saving state
         */
        setSaving: (isSaving) => set({ isSaving }),

        /**
         * Set last saved timestamp
         */
        setLastSaved: (lastSaved) => set({ lastSaved }),

        /**
         * Switch to different task type (lightweight — used by context dispatch)
         */
        switchTask: (newType) => {
          const state = get();
          const newTaskData = state.compositeTasks[newType] || {};

          set({
            activeType: newType,
            currentFeedback: state.feedbacks[newType] || null,
          });

          return newTaskData;
        },

        /**
         * Atomic full task switch — updates activeType, task, currentFeedback,
         * and wordCount in a single set() to avoid intermediate inconsistent state.
         */
        switchTaskFull: (newType) => {
          const state = get();
          const newTaskData = state.compositeTasks[newType];
          if (!newTaskData) return;
          const {
            prompt: _previousPrompt,
            instructions: _previousInstructions,
            image_url: _previousImageUrl,
            sample_answer: _previousSampleAnswer,
            activeType: _previousActiveType,
            ...taskMetadata
          } = state.task || {};

          // Recalculate word count for the target draft
          const targetDraft = state.drafts[newType] || '';
          const newWordCount = targetDraft
            .replace(/<[^>]*>/g, ' ')
            .trim()
            .split(/\s+/)
            .filter(Boolean).length;

          set({
            activeType: newType,
            currentFeedback: state.feedbacks[newType] || null,
            task: {
              ...taskMetadata,
              ...newTaskData,
              activeType: newType,
            },
            wordCount: newWordCount,
          });
        },

        /**
         * Check if task is finished (word count threshold)
         */
        isTaskFinished: (taskType) => {
          const state = get();
          const content = state.drafts[taskType] || '';
          const words = content
            .replace(/<[^>]*>/g, ' ')
            .trim()
            .split(/\s+/)
            .filter(Boolean).length;
          const target = taskType === 'Task 1' ? 120 : 200;
          return words >= target;
        },

        /**
         * Reset test state for retakes
         */
        resetTest: () =>
          set({
            isCompleted: false,
            drafts: { 'Task 1': '', 'Task 2': '' },
            feedbacks: { 'Task 1': null, 'Task 2': null },
            currentFeedback: null,
            timeRemaining: 3600,
            activeType: 'Task 1',
            wordCount: 0,
            error: null,
            feedbackError: null,
            isSaving: false,
            lastSaved: null,
          }),

        /**
         * Clear persisted session data
         */
        clearPersistedData: () => {
          const sessionId = get().sessionId;
          if (sessionId) {
            sessionStorage.removeItem(`writing-test-${sessionId}`);
          }
        },

        /**
         * Full reset (including session)
         */
        fullReset: () =>
          set({
            task: null,
            compositeTasks: {},
            session: null,
            sessionId: null,
            drafts: { 'Task 1': '', 'Task 2': '' },
            feedbacks: { 'Task 1': null, 'Task 2': null },
            currentFeedback: null,
            timeRemaining: 3600,
            activeType: 'Task 1',
            isLoading: true,
            isSubmitting: false,
            isAnalyzing: false,
            isCompleted: false,
            wordCount: 0,
            showExitDialog: false,
            showSubmitDialog: false,
            showTimeUpDialog: false,
            showUpgradeDialog: false,
            error: null,
            feedbackError: null,
            currentUser: null,
            isSaving: false,
            lastSaved: null,
          }),

        // ============ SELECTORS ============
        getDraft: (taskType) => get().drafts[taskType] || '',
        getFeedback: (taskType) => get().feedbacks[taskType],
        hasAnyFeedback: () => {
          const { feedbacks } = get();
          return feedbacks['Task 1'] !== null || feedbacks['Task 2'] !== null;
        },
      }),
      {
        name: 'writing-test-store',
        storage: createJSONStorage(() => sessionStorage),

        partialize: (state) => ({
          drafts: state.drafts,
          feedbacks: state.feedbacks,
          timeRemaining: state.timeRemaining,
          activeType: state.activeType,
          sessionId: state.sessionId,
          isCompleted: state.isCompleted,
        }),

        version: 1,

        onRehydrateStorage: () => (state) => {
          if (state) {
            console.info('[WritingTestStore] Hydrated from sessionStorage');
          }
        },
      }
    )
  )
);

/**
 * Selector hooks for optimized subscriptions
 */
export const useWritingDrafts = () => useWritingTestStore((state) => state.drafts);
export const useWritingTimeRemaining = () => useWritingTestStore((state) => state.timeRemaining);
export const useWritingSession = () => useWritingTestStore((state) => state.session);
export const useWritingActiveType = () => useWritingTestStore((state) => state.activeType);
export const useWritingIsCompleted = () => useWritingTestStore((state) => state.isCompleted);
export const useWritingIsLoading = () => useWritingTestStore((state) => state.isLoading);
export const useWritingFeedbacks = () => useWritingTestStore((state) => state.feedbacks);
export const useWritingCurrentFeedback = () =>
  useWritingTestStore((state) => state.currentFeedback);
export const useWritingWordCount = () => useWritingTestStore((state) => state.wordCount);

export default useWritingTestStore;
