import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useReadingTestDispatch, useReadingTestState } from '../context/ReadingTestContext';
import { initializeTest } from '@/lib/testInitializer';
import { TestSession } from '@/features/testing/shared/services/TestSession';
import { calculateTestResults } from '../utils'; // Fixed import path
import { removeFromCache } from '@/lib/apiCache';
import { useTestNavigation } from '@/hooks/useTestNavigation';
import { calculateEnhancedMetrics } from '@/services/testMetricsService';
import { supabase } from '@/lib/supabase';

export function useReadingTestLogic(initialId, { awardXP, user: contextUser = null }) {
  const { dispatch } = useReadingTestDispatch();
  const { getLatestState } = useReadingTestDispatch(); // getLatestState is attached to dispatch object in context
  const ctxState = useReadingTestState();
  const answers = ctxState.answers || {};

  const navigate = useNavigate();
  const location = useLocation();

  // State
  const [testData, setTestData] = useState(null);
  const [allQuestions, setAllQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(contextUser); // Initialize with context user

  // Results & Status State
  const [isFinished, setIsFinished] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const initializingRef = useRef(false); // Guard for loadTest re-entrancy
  const [correctAnswersMap, setCorrectAnswersMap] = useState({});
  const [showTimeUpDialog, setShowTimeUpDialog] = useState(false);

  // Validation
  const [validationMap, setValidationMap] = useState({});

  // Navigation Block
  const { blocker, showExitDialog, setShowExitDialog, handleExit, resetBlocker, isExiting } =
    useTestNavigation({
      session,
      isFinished,
      answers,
      exitPath: '/reading',
    });

  // PERFORMANCE: removed redundant loadUser call as we now get it from context

  const loadTest = useCallback(
    async (taskIdOrSessionId, viewResults = false, isRetake = false) => {
      // Guard against re-entry (e.g. Strict Mode or rapid clicks)
      if (initializingRef.current) return;

      // If we already have a session matching the requested ID, skip re-init
      if (session?.id === taskIdOrSessionId) return;
      initializingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        const {
          testData: passage,
          questions,
          session: existingSession,
          user: userData,
        } = await initializeTest({
          type: 'reading',
          id: taskIdOrSessionId,
          isRetake,
          viewResults,
          user: user || contextUser, // Pass user to avoid redundant User.me() inside initializeTest
        });

        setTestData(passage);
        setAllQuestions(questions);

        // === EXPLANATION HYDRATION ===
        // Questions may come from stale cache (admin imported explanations in a different browser tab).
        // Always fetch fresh explanation_data and merge into allQuestions so Deep Dive buttons appear.
        try {
          const passageIdForExplanations = passage?.id || passage?.passage_id;
          if (passageIdForExplanations) {
            // Fetch ALL passage IDs (multi-section tests have multiple passages)
            const allPassageIds = passage.sections
              ? passage.sections.map((s) => s.id).filter(Boolean)
              : [passageIdForExplanations];

            const { data: explanationRows } = await supabase
              .from('questions')
              .select('id, explanation_data')
              .in('passage_id', allPassageIds)
              .not('explanation_data', 'is', null);

            if (explanationRows && explanationRows.length > 0) {
              const explanationMap = new Map(
                explanationRows.map((r) => [r.id, r.explanation_data])
              );
              const hydrated = questions.map((q) => {
                const freshExplanation = explanationMap.get(q.id);
                if (freshExplanation && !q.explanation_data) {
                  return { ...q, explanation_data: freshExplanation };
                }
                return q;
              });
              setAllQuestions(hydrated);
            }
          }
        } catch (hydrationErr) {
          // Non-critical — don't break test loading if hydration fails
          console.warn('[ReadingTest] Explanation hydration failed:', hydrationErr);
        }

        // Hoist sortedQuestions for compatibility logic if needed, but 'questions' is usually sorted

        if (userData) {
          if (existingSession) {
            console.log('Resuming existing session:', existingSession);

            // Validate session for tab safety
            dispatch({ type: 'VALIDATE_SESSION', payload: existingSession.id });

            setSession(existingSession);
            dispatch({ type: 'SET_SESSION', payload: existingSession });

            if (
              location.pathname !== `/reading-test/${existingSession.id}` &&
              !existingSession.is_completed
            ) {
              navigate(`/reading-test/${existingSession.id}`, { replace: true });
            }

            if (existingSession.is_completed) {
              console.log('Session is completed, loading results...');
              setIsFinished(true);
              dispatch({ type: 'FINISH_TEST' });

              // Load results data
              const contentData = existingSession.content_data || {};
              const rawResponses = existingSession.user_responses;
              const userResponses = Array.isArray(rawResponses) ? rawResponses : [];

              // Reconstruct or Recalculate test results
              let results;

              if (contentData.sectionStats && contentData.sectionStats.length > 0) {
                // Use stored data if available
                results = {
                  bandScore: existingSession.score,
                  totalQuestions: contentData.totalQuestions || 0,
                  correctAnswers: contentData.correctAnswers || 0,
                  percentage: contentData.percentage || 0,
                  sectionStats: contentData.sectionStats || [],
                  typeStats: contentData.typeStats || {},
                  correctAnswersMap: contentData.correctAnswersMap || {},
                  userResponses: userResponses,
                  // Enhanced metrics (may not exist for older sessions)
                  timeMetrics: contentData.timeMetrics || null,
                  errorPatterns: contentData.errorPatterns || null,
                  skillGaps: contentData.skillGaps || null,
                  passageProficiency: contentData.passageProficiency || null,
                  durationMinutes: existingSession.duration_minutes || null,
                };
              } else {
                // Legacy session or missing stats: Recalculate
                console.log('Recalculating stats for legacy/incomplete session...');

                // Rehydrate answers map
                const answersMap = {};
                userResponses.forEach((r) => {
                  const qId = r.question_id || r.questionId;
                  const uAns = r.user_answer !== undefined ? r.user_answer : r.userAnswer;
                  if (qId) {
                    answersMap[qId] = uAns;
                  }
                });

                results = calculateTestResults(
                  questions, // from initializeTest
                  answersMap,
                  passage.sections || [] // from initializeTest
                );

                // Ensure bandScore matches session even if recalc differs slightly (truth is db)
                results.bandScore = existingSession.score || results.bandScore;
              }

              setTestResults(results);

              if (viewResults) {
                setShowResults(true);
              }

              // Use results.correctAnswersMap to derive validationMap
              // If correctAnswersMap is empty, RECALCULATE it from questions and answers
              let caMap = results.correctAnswersMap;

              if (!caMap || Object.keys(caMap).length === 0) {
                // correctAnswersMap is missing - recalculate validation
                console.log('[ReadingTest] correctAnswersMap missing, recalculating...');

                // Build answers map from userResponses
                const answersMap = {};
                userResponses.forEach((r) => {
                  const qId = r.question_id || r.questionId;
                  const uAns = r.user_answer !== undefined ? r.user_answer : r.userAnswer;
                  if (qId) {
                    answersMap[qId] = uAns;
                  }
                });

                // Recalculate to get fresh correctAnswersMap
                const recalcResults = calculateTestResults(
                  questions,
                  answersMap,
                  passage.sections || []
                );

                caMap = recalcResults.correctAnswersMap;
                console.log(
                  '[ReadingTest] Recalculated correctAnswersMap with',
                  Object.keys(caMap).length,
                  'entries'
                );
              }

              if (caMap && Object.keys(caMap).length > 0) {
                setCorrectAnswersMap(caMap);

                // Derive validationMap directly from correctAnswersMap
                setValidationMap(caMap);
                console.log(
                  '[ReadingTest] Loaded validationMap with',
                  Object.keys(caMap).length,
                  'entries'
                );
              }
            } else {
              // Restore time for in-progress session
              if (existingSession.content_data?.time_remaining !== undefined) {
                // Fix: Check if we have a fresher local timer before overwriting with server time
                const currentState = getLatestState();
                const localSessionId = currentState.sessionId;
                const localTime = currentState.timeRemaining;
                const serverTime = existingSession.content_data.time_remaining;

                let timeToSet = serverTime;

                // If we are in the same session and local time is advanced (smaller) than server time, keep local
                // We use < because it's a countdown
                if (
                  localSessionId === existingSession.id &&
                  localTime < serverTime &&
                  localTime > 0
                ) {
                  console.log(
                    `[Reading] Keeping local timer (${localTime}s) vs server (${serverTime}s)`
                  );
                  timeToSet = localTime;
                }

                dispatch({
                  type: 'SET_TIME',
                  payload: timeToSet,
                });
              }
            }

            // Universal Answer Restoration Block (for both completed and in-progress sessions)
            const contentData = existingSession.content_data || {};
            const rawResponses = existingSession.user_responses;
            let answersMapToRestore = {};

            if (contentData.savedAnswers) {
              answersMapToRestore = contentData.savedAnswers;
            } else if (existingSession.is_completed && contentData.correctAnswersMap) {
              Object.entries(contentData.correctAnswersMap).forEach(([qId, data]) => {
                if (data.userAnswer !== undefined && data.userAnswer !== '') {
                  answersMapToRestore[qId] = data.userAnswer;
                }
              });
            } else if (rawResponses && typeof rawResponses === 'object') {
              if (Array.isArray(rawResponses)) {
                rawResponses.forEach((r) => {
                  const qId = r.question_id || r.questionId;
                  const uAns = r.user_answer !== undefined ? r.user_answer : r.userAnswer;
                  if (qId && uAns !== undefined) {
                    answersMapToRestore[qId] = uAns;
                  }
                });
              } else {
                answersMapToRestore = rawResponses;
              }
            }

            if (Object.keys(answersMapToRestore).length > 0) {
              dispatch({ type: 'SET_ANSWERS_BULK', payload: answersMapToRestore });
              console.log(
                '[Reading] Restored',
                Object.keys(answersMapToRestore).length,
                'answers from session into Context'
              );
            }
          } else {
            // No existing session - Create a new one
            console.log('Creating new session for passage:', passage.id);

            // Import dynamically to avoid circular deps (or use supabase directly)
            const { createTestSession } = await import('@/lib/testInitializer');

            const newSession = await createTestSession({
              userId: userData.id,
              passageId: passage.id,
              type: 'reading',
              durationMinutes: 60,
            });

            console.log('New session created:', newSession.id);
            setSession(newSession);
            dispatch({ type: 'SET_SESSION', payload: newSession });

            // Reset timer and state for fresh start
            dispatch({ type: 'SET_TIME', payload: 3600 }); // 60 minutes
            dispatch({ type: 'RESET_TEST' });

            // Navigate to session URL
            navigate(`/reading-test/${newSession.id}`, { replace: true });
          }
        }
      } catch (err) {
        console.error('Error initializing reading test:', err);
        setError('Failed to load the test. Please try again or choose a different test.');
      } finally {
        setIsLoading(false);
        initializingRef.current = false;
      }
    },
    [dispatch, location.pathname, navigate]
  );

  const handleSubmit = useCallback(
    async (options = {}) => {
      if (!testData || !session) return;
      if (submittingRef.current) return;
      submittingRef.current = true;

      setIsSubmitting(true);
      setShowTimeUpDialog(false);

      try {
        const results = calculateTestResults(allQuestions, answers, testData.sections || []);

        // Calculate duration
        const durationMins = session && session.duration_minutes ? session.duration_minutes : 60;
        const initialTotalSeconds = durationMins * 60;
        const latestState = getLatestState();
        const finalTimeRemaining = latestState.timeRemaining;
        const answerTimestamps = latestState.answerTimestamps || {};
        const answerChangeCounts = latestState.answerChangeCounts || {};
        const passageTimes =
          options?.passageTimes && typeof options.passageTimes === 'object'
            ? options.passageTimes
            : {};

        const actualTimeSpentSeconds = Math.max(
          1,
          initialTotalSeconds - Math.max(0, finalTimeRemaining || 0)
        );
        const actualTimeSpentMinutes = Math.max(1, Math.floor(actualTimeSpentSeconds / 60));

        const timePerQuestionSeconds = (() => {
          const entries = Object.entries(answerTimestamps)
            .map(([k, v]) => [k, Number(v)])
            .filter(([, v]) => Number.isFinite(v) && v >= 0)
            .sort((a, b) => a[1] - b[1]);

          const out = {};
          let prev = 0;
          entries.forEach(([questionId, ts]) => {
            const delta = Math.max(0, ts - prev);
            out[questionId] = Math.round(delta);
            prev = ts;
          });
          return out;
        })();

        const totalAnswerChanges = Object.values(answerChangeCounts).reduce(
          (sum, v) => sum + (Number(v) || 0),
          0
        );

        // Calculate enhanced metrics for Pro/Premium features
        const enhancedMetrics = calculateEnhancedMetrics(
          {
            bandScore: results.bandScore,
            totalQuestions: results.totalQuestions,
            correctAnswers: results.correctAnswers,
            percentage: results.percentage,
            sectionStats: results.sectionStats || [],
            typeStats: results.typeStats || {},
            correctAnswersMap: results.correctAnswersMap,
          },
          answers,
          answerTimestamps, // Now passing actual timestamps
          actualTimeSpentSeconds,
          'reading',
          answerChangeCounts
        );

        // Fetch previous band score for trend comparison
        let previousBandScore = null;
        try {
          const { data: previousTest } = await supabase
            .from('test_sessions')
            .select('score')
            .eq('user_id', user.id)
            .eq('test_type', 'reading')
            .eq('is_completed', true)
            .neq('id', session.id)
            .order('completed_at', { ascending: false })
            .limit(1)
            .single();

          if (previousTest?.score) {
            previousBandScore = previousTest.score;
          }
        } catch {
          // No previous test found - that's ok
        }

        // Include enhanced metrics in results for the UI
        const enhancedResults = {
          ...results,
          timeMetrics: enhancedMetrics.timeMetrics,
          errorPatterns: enhancedMetrics.errorPatterns,
          skillGaps: enhancedMetrics.skillGaps,
          passageProficiency: enhancedMetrics.passageProficiency,
          durationMinutes: actualTimeSpentMinutes,
          // Include timestamps for AnswerJourneyCard
          answerTimestamps,
          timePerQuestionSeconds,
          // Include previous score for Band Trend badge
          previousBandScore,
        };

        setTestResults(enhancedResults);
        setCorrectAnswersMap(results.correctAnswersMap);

        // Update validationMap immediately for real-time UI feedback
        setValidationMap(results.correctAnswersMap);

        const updateData = {
          score: results.bandScore,
          user_responses: results.userResponses,
          is_completed: true,
          completed_at: new Date().toISOString(),
          duration_minutes: actualTimeSpentMinutes,
          content_data: {
            ...session.content_data,
            // Core metrics
            sectionStats: results.sectionStats,
            typeStats: results.typeStats,
            correctAnswersMap: results.correctAnswersMap,
            totalQuestions: results.totalQuestions,
            correctAnswers: results.correctAnswers,
            percentage: Math.round(results.percentage),
            savedAnswers: answers,
            passageTimes,
            answerTimestamps,
            timePerQuestionSeconds,
            answerChangeCounts,
            changedAnswersCount: enhancedMetrics.errorPatterns?.changedAnswers || 0,
            totalAnswerChanges,
            // Enhanced metrics (Pro/Premium)
            timeMetrics: enhancedMetrics.timeMetrics,
            errorPatterns: enhancedMetrics.errorPatterns,
            skillGaps: enhancedMetrics.skillGaps,
            passageProficiency: enhancedMetrics.passageProficiency,
          },
        };

        await TestSession.update(session.id, updateData);
        removeFromCache('reading-tests-list');

        setSession((prev) => (prev ? { ...prev, is_completed: true } : prev));
        setIsFinished(true);
        setShowResults(true);
        dispatch({ type: 'FINISH_TEST' });

        await awardXP(results.correctAnswers, results.totalQuestions);
      } catch (error) {
        console.error('Error submitting test:', error);
        setError('Failed to submit test. Please try again.');
      } finally {
        setIsSubmitting(false);
        submittingRef.current = false;
      }
    },
    [testData, session, allQuestions, answers, getLatestState, dispatch, awardXP]
  );

  // Timer sync for auto-submit is complex to move entirely, but we can expose handleSubmit
  // The component usually handles the "Time's Up" dialog trigger via context or check

  return {
    // State
    testData,
    allQuestions,
    isLoading,
    error,
    session,
    user,
    isFinished,
    showResults,
    setShowResults, // Needed for closing modal
    testResults,
    isSubmitting,
    correctAnswersMap,
    validationMap,
    showTimeUpDialog,
    setShowTimeUpDialog,

    // Actions
    loadTest,
    // PERFORMANCE: loadUser is now a no-op as it comes from context
    loadUser: () => {},
    handleSubmit,

    // Navigation
    blocker,
    showExitDialog,
    setShowExitDialog,
    handleExit,
    resetBlocker,
    isExiting,
  };
}
