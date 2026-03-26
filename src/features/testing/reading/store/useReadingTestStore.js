/**
 * Reading Test Zustand Store
 *
 * Centralized state management for the Reading test module with sessionStorage persistence.
 * This store replaces the previous Context + useReducer pattern while maintaining
 * the same logical structure.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';

/**
 * Reading Test Store
 *
 * Features:
 * - All test state in one place
 * - Persists answers, timeRemaining, and currentPassageIndex to sessionStorage
 * - Fine-grained subscriptions via subscribeWithSelector
 * - DevTools support (automatic in development)
 */
export const useReadingTestStore = create(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // ============ TEST DATA (not persisted) ============
        testData: null,
        allQuestions: [],

        // ============ SESSION STATE (partially persisted) ============
        session: null,
        sessionId: null, // Kept separate for persistence key
        answers: {},
        answerTimestamps: {}, // Maps questionId -> seconds elapsed when answered
        answerChangeCounts: {}, // Maps questionId -> number of times answer changed
        timeRemaining: 3600, // 60 minutes in seconds
        initialTime: 3600, // Initial time for calculating elapsed time

        // ============ PACING ASSISTANT STATE (persisted) ============
        passageTimes: {}, // { [passageIndex]: cumulativeSecondsSpent }

        // ============ UI STATE (not persisted) ============
        isLoading: true,
        isSubmitting: false,
        isFinished: false,
        currentPassageIndex: 0,
        showResults: false,
        isSaving: false,
        lastSaved: null,

        // ============ INTERACTION STATE (not persisted) ============
        highlights: [],
        notes: [],

        // ============ ERROR STATE ============
        error: null,

        // ============ ACTIONS ============

        /**
         * Set test data and questions after fetching
         */
        setTestData: (passage, questions) =>
          set({
            testData: passage,
            allQuestions: questions,
            isLoading: false,
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
            console.warn('[ReadingTestStore] Session ID mismatch. Resetting store for tab safety.');
            get().fullReset();
            return false;
          }
          return true;
        },

        /**
         * Set a single answer with timestamp
         */
        setAnswer: (questionId, value) =>
          set((state) => {
            // Calculate elapsed time (seconds since test started)
            const elapsedSeconds = state.initialTime - state.timeRemaining;
            const prevValue = state.answers[questionId];
            const normalizedPrev =
              prevValue === undefined || prevValue === null ? '' : String(prevValue);
            const normalizedNext = value === undefined || value === null ? '' : String(value);
            const didChange =
              normalizedPrev.trim() !== '' && normalizedPrev.trim() !== normalizedNext.trim();

            return {
              answers: { ...state.answers, [questionId]: value },
              // Only record timestamp on first answer or if answer changed
              answerTimestamps: {
                ...state.answerTimestamps,
                [questionId]: state.answerTimestamps[questionId] || elapsedSeconds,
              },
              answerChangeCounts: didChange
                ? {
                    ...state.answerChangeCounts,
                    [questionId]: (state.answerChangeCounts[questionId] || 0) + 1,
                  }
                : state.answerChangeCounts,
            };
          }),

        /**
         * Set multiple answers at once (for restoring from DB)
         */
        setAnswersBulk: (answersObj) =>
          set((state) => ({
            answers: { ...state.answers, ...answersObj },
          })),

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
         * Set pacing times for all passages (for restoring)
         */
        setPassageTimes: (passageTimes) => set({ passageTimes }),

        /**
         * Add elapsed seconds to a specific passage
         */
        addPassageTime: (passageIndex, seconds) =>
          set((state) => ({
            passageTimes: {
              ...state.passageTimes,
              [passageIndex]: (state.passageTimes[passageIndex] || 0) + seconds,
            },
          })),

        /**
         * Set loading state
         */
        setLoading: (isLoading) => set({ isLoading }),

        /**
         * Set error state
         */
        setError: (error) => set({ error, isLoading: false }),

        /**
         * Mark test as finished
         */
        finishTest: () => set({ isFinished: true, showResults: true }),

        /**
         * Reset test state for retakes
         */
        resetTest: () =>
          set({
            isFinished: false,
            showResults: false,
            answers: {},
            answerTimestamps: {},
            answerChangeCounts: {},
            timeRemaining: 3600,
            initialTime: 3600,
            currentPassageIndex: 0,
            highlights: [],
            notes: [],
            passageTimes: {},
          }),

        /**
         * Set current passage index
         */
        setPassageIndex: (index) => set({ currentPassageIndex: index }),

        /**
         * Set highlights array
         */
        setHighlights: (highlights) => set({ highlights }),

        /**
         * Set notes array
         */
        setNotes: (notes) => set({ notes }),

        /**
         * Show/hide results modal
         */
        setShowResults: (show) => set({ showResults: show }),

        /**
         * Set saving state
         */
        setSaving: (isSaving) => set({ isSaving }),

        /**
         * Set last saved timestamp
         */
        setLastSaved: (lastSaved) => set({ lastSaved }),

        /**
         * Set submitting state
         */
        setSubmitting: (isSubmitting) => set({ isSubmitting }),

        /**
         * Clear persisted session data (call on successful submit or retake)
         */
        clearPersistedData: () => {
          const sessionId = get().sessionId;
          if (sessionId) {
            sessionStorage.removeItem(`reading-test-${sessionId}`);
          }
        },

        /**
         * Full reset (including session)
         */
        fullReset: () =>
          set({
            testData: null,
            allQuestions: [],
            session: null,
            sessionId: null,
            answers: {},
            answerTimestamps: {},
            answerChangeCounts: {},
            timeRemaining: 3600,
            initialTime: 3600,
            isLoading: true,
            isSubmitting: false,
            isFinished: false,
            currentPassageIndex: 0,
            showResults: false,
            highlights: [],
            notes: [],
            error: null,
            isSaving: false,
            lastSaved: null,
            passageTimes: {},
          }),

        // ============ SELECTORS (for fine-grained subscriptions) ============

        /**
         * Get answer for a specific question
         */
        getAnswer: (questionId) => get().answers[questionId],

        /**
         * Get answered question count
         */
        getAnsweredCount: () => Object.keys(get().answers).length,
      }),
      {
        name: 'reading-test-store', // sessionStorage key prefix
        storage: createJSONStorage(() => sessionStorage),

        // Only persist these fields
        partialize: (state) => ({
          answers: state.answers,
          answerTimestamps: state.answerTimestamps,
          answerChangeCounts: state.answerChangeCounts,
          timeRemaining: state.timeRemaining,
          initialTime: state.initialTime,
          currentPassageIndex: state.currentPassageIndex,
          sessionId: state.sessionId,
          passageTimes: state.passageTimes,
        }),

        // Version for migrations if schema changes
        version: 1,

        // Optional: Log hydration for debugging
        onRehydrateStorage: () => (state) => {
          if (state) {
            console.log('[ReadingTestStore] Hydrated from sessionStorage');
          }
        },
      }
    )
  )
);

/**
 * Selector hooks for optimized subscriptions
 * Use these instead of selecting full state to prevent unnecessary re-renders
 */
export const useReadingAnswers = () => useReadingTestStore((state) => state.answers);
export const useReadingAnswerTimestamps = () =>
  useReadingTestStore((state) => state.answerTimestamps);
export const useReadingTimeRemaining = () => useReadingTestStore((state) => state.timeRemaining);
export const useReadingSession = () => useReadingTestStore((state) => state.session);
export const useReadingPassageIndex = () =>
  useReadingTestStore((state) => state.currentPassageIndex);
export const useReadingIsFinished = () => useReadingTestStore((state) => state.isFinished);
export const useReadingIsLoading = () => useReadingTestStore((state) => state.isLoading);

export default useReadingTestStore;
