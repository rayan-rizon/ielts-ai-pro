/**
 * Listening Test Zustand Store
 *
 * Centralized state management for the Listening test module with sessionStorage persistence.
 * Includes audio-specific state like currentTime persistence.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createThrottledWebStorage } from '@/lib/throttledWebStorage';
import { subscribeWithSelector } from 'zustand/middleware';

const listeningSessionStorage = createThrottledWebStorage(() => sessionStorage, {
  intervalMs: 5000,
});

/**
 * Listening Test Store
 *
 * Features:
 * - All test state including audio-specific fields
 * - Persists answers, timeRemaining, activePart, and audioCurrentTime
 * - Fine-grained subscriptions via subscribeWithSelector
 */
export const useListeningTestStore = create(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // ============ TEST DATA (not persisted) ============
        testData: null,
        questions: [],
        questionsWithNumbers: [], // Computed question numbering

        // ============ SESSION STATE (partially persisted) ============
        session: null,
        sessionId: null,
        answers: {},
        timeRemaining: 0, // Listening timer is based on audio duration

        // ============ AUDIO STATE (persisted) ============
        audioCurrentTime: 0,

        // ============ SAVE STATE ============
        isSaving: false,
        lastSaved: null,

        // ============ UI STATE (partially persisted) ============
        isLoading: true,
        isSubmitting: false,
        isFinished: false,
        activePart: 0,
        showResults: false,
        showTranscript: false,

        // ============ INTERACTION STATE (not persisted) ============
        flaggedQuestions: new Set(),
        correctAnswersMap: {},

        // ============ GAMIFICATION STATE ============
        showConfetti: false,
        earnedXP: { xp: 0, bonus: 0, streak: 0 },

        // ============ RESULTS STATE ============
        testResults: null,

        // ============ ERROR STATE ============
        error: null,

        // ============ ACTIONS ============

        /**
         * Set test data and questions after fetching
         * Note: questionsWithNumbers should be computed before calling this
         */
        setTestData: (passage, questions, questionsWithNumbers = []) =>
          set({
            testData: passage,
            questions: questions,
            questionsWithNumbers:
              questionsWithNumbers.length > 0 ? questionsWithNumbers : questions,
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
         * Set a single answer
         */
        setAnswer: (questionId, value) =>
          set((state) => ({
            answers: { ...state.answers, [questionId]: value },
          })),

        /**
         * Set multiple answers at once (for restoring from DB)
         */
        setAnswersBulk: (answersObj) =>
          set((state) => ({
            // Preserve sessionStorage answers when the network restores an
            // older autosave snapshot for this same listening session.
            answers: { ...answersObj, ...state.answers },
          })),

        /**
         * Decrement timer by 1 second
         */
        tickTimer: () =>
          set((state) => ({
            timeRemaining: Math.max(0, state.timeRemaining - 1),
          })),

        /**
         * Set time directly (for restoring from DB or on audio duration change)
         */
        setTime: (seconds) => set({ timeRemaining: seconds }),

        /**
         * Set audio current time
         */
        setAudioTime: (time) => set({ audioCurrentTime: time }),

        /**
         * Set loading state
         */
        setLoading: (isLoading) => set({ isLoading }),

        /**
         * Set submitting state
         */
        setSubmitting: (isSubmitting) => set({ isSubmitting }),

        /**
         * Set error state
         */
        setError: (error) => set({ error, isLoading: false }),

        /**
         * Mark test as finished
         */
        finishTest: () => set({ isFinished: true }),

        /**
         * Reset test state for retakes
         */
        resetTest: () =>
          set({
            isFinished: false,
            showResults: false,
            answers: {},
            timeRemaining: 0,
            activePart: 0,
            audioCurrentTime: 0,
            flaggedQuestions: new Set(),
            testResults: null,
            isSaving: false,
            lastSaved: null,
          }),

        /**
         * Set active part (section)
         */
        setActivePart: (part) => set({ activePart: part }),

        /**
         * Toggle question flag
         */
        toggleFlag: (questionId) =>
          set((state) => {
            const newSet = new Set(state.flaggedQuestions);
            if (newSet.has(questionId)) {
              newSet.delete(questionId);
            } else {
              newSet.add(questionId);
            }
            return { flaggedQuestions: newSet };
          }),

        /**
         * Toggle transcript visibility
         */
        toggleTranscript: () =>
          set((state) => ({
            showTranscript: !state.showTranscript,
          })),

        /**
         * Set test results
         */
        setResults: (results) => set({ testResults: results }),

        /**
         * Set correct answers map
         */
        setCorrectAnswersMap: (map) => set({ correctAnswersMap: map }),

        /**
         * Set confetti state
         */
        setConfetti: (show) => set({ showConfetti: show }),

        /**
         * Set earned XP
         */
        setXP: (xpData) => set({ earnedXP: xpData }),

        /**
         * Show/hide results modal
         */
        showResultsModal: (show) => set({ showResults: show }),

        /**
         * Set saving state
         */
        setSaving: (isSaving) => set({ isSaving }),

        /**
         * Set last saved timestamp
         */
        setLastSaved: (lastSaved) => set({ lastSaved }),

        /**
         * Clear persisted session data
         */
        clearPersistedData: () => {
          // Must go through the throttled adapter, not sessionStorage directly:
          // a queued write would otherwise land after the removal and resurrect
          // the session we just cleared.
          listeningSessionStorage.removeItem('listening-test-store');
        },

        /**
         * Full reset (including session)
         */
        fullReset: () =>
          set({
            testData: null,
            questions: [],
            questionsWithNumbers: [],
            session: null,
            sessionId: null,
            answers: {},
            timeRemaining: 0,
            audioCurrentTime: 0,
            isLoading: true,
            isSubmitting: false,
            isFinished: false,
            activePart: 0,
            showResults: false,
            showTranscript: false,
            flaggedQuestions: new Set(),
            correctAnswersMap: {},
            showConfetti: false,
            earnedXP: { xp: 0, bonus: 0, streak: 0 },
            testResults: null,
            error: null,
            isSaving: false,
            lastSaved: null,
          }),

        /**
         * Validates that the persisted session matches the current intended session.
         * If the IDs mismatch (e.g. copied from another tab), it hard resets the store
         * to prevent data leakage between tests.
         */
        validateSession: (currentSessionId) => {
          const state = get();
          // If we have a persisted session ID and it doesn't match the new one
          if (state.sessionId && state.sessionId !== currentSessionId) {
            console.warn(
              `[ListeningTestStore] Session mismatch detected (Persisted: ${state.sessionId}, Current: ${currentSessionId}). Resetting store.`
            );
            get().fullReset();
            // Important: Update the sessionId to the new one immediately after reset
            set({ sessionId: currentSessionId });
          }
        },

        // ============ SELECTORS ============
        getAnswer: (questionId) => get().answers[questionId],
        getAnsweredCount: () => Object.keys(get().answers).length,
      }),
      {
        name: 'listening-test-store',
        // `timeRemaining` ticks once a second and `audioCurrentTime` follows the
        // <audio> `timeupdate` event (~4x/sec). Both are genuinely needed for
        // resume-where-you-left-off, so instead of dropping them we coalesce the
        // writes: sessionStorage is touched at most once every 5s, plus a
        // synchronous flush on pagehide/tab-hide. Same persisted data, ~1/25th
        // of the main-thread serialisation work.
        storage: createJSONStorage(() => listeningSessionStorage),

        partialize: (state) => ({
          answers: state.answers,
          timeRemaining: state.timeRemaining,
          activePart: state.activePart,
          audioCurrentTime: state.audioCurrentTime,
          sessionId: state.sessionId,
          flaggedQuestions: Array.from(state.flaggedQuestions || []),
        }),

        version: 2,
        migrate: (persistedState) => ({
          ...persistedState,
          flaggedQuestions: Array.isArray(persistedState?.flaggedQuestions)
            ? persistedState.flaggedQuestions
            : [],
        }),

        onRehydrateStorage: () => (state) => {
          if (state) {
            console.log('[ListeningTestStore] Hydrated from sessionStorage');
          }
        },

        // Custom merge to handle Set type for flaggedQuestions
        merge: (persistedState, currentState) => ({
          ...currentState,
          ...persistedState,
          flaggedQuestions: new Set(persistedState?.flaggedQuestions || []),
        }),
      }
    )
  )
);

/**
 * Selector hooks for optimized subscriptions
 */
export const useListeningAnswers = () => useListeningTestStore((state) => state.answers);
export const useListeningTimeRemaining = () =>
  useListeningTestStore((state) => state.timeRemaining);
export const useListeningSession = () => useListeningTestStore((state) => state.session);
export const useListeningActivePart = () => useListeningTestStore((state) => state.activePart);
export const useListeningIsFinished = () => useListeningTestStore((state) => state.isFinished);
export const useListeningIsLoading = () => useListeningTestStore((state) => state.isLoading);
export const useListeningAudioTime = () => useListeningTestStore((state) => state.audioCurrentTime);

export default useListeningTestStore;
