import { useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useReadingTestDispatch, useReadingTestState } from '../context/ReadingTestContext';
import { createTestSession, initializeTest } from '@/lib/testInitializer';
import { TestSession } from '@/features/testing/shared/services/TestSession';
import { calculateTestResults } from '../utils'; // Fixed import path
import { removeFromCache } from '@/lib/apiCache';
import { useTestNavigation } from '@/hooks/useTestNavigation';
import { calculateErrorPatterns, calculatePassageProficiency } from '@/services/testMetricsService';
import { refreshLearningPathAfterTest } from '@/services/adaptiveLearningService';
import { ANALYSIS_SCHEMA_VERSION } from '@/features/testing/shared/utils/resultEvidence';
import { supabase } from '@/lib/supabase';
import {
  EXAM_DURATION_SECONDS,
  getReadingExamEligibility,
  getSessionTestMode,
  resolveNewAttemptMode,
} from '@/features/testing/shared/testMode';
import { useExamDeadline } from '@/features/testing/shared/hooks/useExamDeadline';

export function useReadingTestLogic(
  initialId,
  { awardXP, user: contextUser = null, flaggedQuestions = null }
) {
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
  const [selectedMode, setSelectedMode] = useState('practice');
  const [examEligibility, setExamEligibility] = useState({ eligible: false, reason: '' });
  const [isStarting, setIsStarting] = useState(false);

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
        setUser(userData || contextUser);
        const eligibility = getReadingExamEligibility(passage, questions);
        setExamEligibility(eligibility);

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
            setSelectedMode(getSessionTestMode(existingSession));
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
                  responseDetails: contentData.responseDetails || [],
                  passageTimes: contentData.passageTimes || {},
                  answerChangeCounts: contentData.answerChangeCounts || {},
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
            const preferredMode = resolveNewAttemptMode({
              search: location.search,
              settings: userData.settings,
            });
            setSelectedMode(
              preferredMode === 'exam' && !eligibility.eligible ? 'practice' : preferredMode
            );
            dispatch({ type: 'RESET_TEST' });
            dispatch({ type: 'SET_SESSION', payload: null });
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

  const handleStartTest = useCallback(
    async (requestedMode) => {
      if (!testData || !user || session || isStarting) return;
      const testMode = requestedMode === 'exam' && examEligibility.eligible ? 'exam' : 'practice';
      setIsStarting(true);
      setError(null);
      try {
        const newSession = await createTestSession({
          userId: user.id,
          passageId: testData.id,
          type: 'reading',
          testMode,
          durationSeconds: EXAM_DURATION_SECONDS,
        });
        dispatch({ type: 'RESET_TEST' });
        dispatch({ type: 'SET_TIME', payload: EXAM_DURATION_SECONDS });
        dispatch({ type: 'SET_SESSION', payload: newSession });
        setSession(newSession);
        setSelectedMode(testMode);
        navigate(`/reading-test/${newSession.id}`, { replace: true });
      } catch (startError) {
        console.error('Failed to start reading test:', startError);
        setError('Failed to start the test. Please try again.');
      } finally {
        setIsStarting(false);
      }
    },
    [testData, user, session, isStarting, examEligibility.eligible, dispatch, navigate]
  );

  const handleSubmit = useCallback(
    async (options = {}) => {
      if (!testData || !session) return;
      if (submittingRef.current) return;
      submittingRef.current = true;

      setIsSubmitting(true);
      setShowTimeUpDialog(false);

      try {
        const results = calculateTestResults(
          allQuestions,
          answers,
          testData.sections || [],
          flaggedQuestions
        );

        // Calculate duration
        const durationMins = session && session.duration_minutes ? session.duration_minutes : 60;
        const initialTotalSeconds = durationMins * 60;
        const latestState = getLatestState();
        const finalTimeRemaining = latestState.timeRemaining;
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

        const totalAnswerChanges = Object.values(answerChangeCounts).reduce(
          (sum, v) => sum + (Number(v) || 0),
          0
        );

        const errorPatterns = calculateErrorPatterns(
          answers,
          results.correctAnswersMap,
          results.totalQuestions,
          results.typeStats || {},
          answerChangeCounts
        );
        const passageProficiency = calculatePassageProficiency(results.sectionStats || []);

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
          timeMetrics: { totalTimeSpent: actualTimeSpentSeconds },
          errorPatterns,
          passageProficiency,
          durationMinutes: actualTimeSpentMinutes,
          passageTimes,
          answerChangeCounts,
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
            analysisSchemaVersion: ANALYSIS_SCHEMA_VERSION,
            // Core metrics
            sectionStats: results.sectionStats,
            typeStats: results.typeStats,
            correctAnswersMap: results.correctAnswersMap,
            responseDetails: results.responseDetails,
            totalQuestions: results.totalQuestions,
            correctAnswers: results.correctAnswers,
            percentage: Math.round(results.percentage),
            savedAnswers: answers,
            passageTimes,
            answerChangeCounts,
            changedAnswersCount: errorPatterns.changedAnswers || 0,
            totalAnswerChanges,
            // The test clock supports total and passage timing, not per-question dwell time.
            timeMetrics: { totalTimeSpent: actualTimeSpentSeconds },
            errorPatterns,
            passageProficiency,
          },
        };

        const didComplete = await TestSession.complete(session.id, updateData);
        removeFromCache('reading-tests-list');

        setSession((prev) => (prev ? { ...prev, is_completed: true } : prev));
        setIsFinished(true);
        setShowResults(true);
        dispatch({ type: 'FINISH_TEST' });

        if (didComplete) {
          refreshLearningPathAfterTest(
            session.user_id || user?.id,
            'reading',
            results.bandScore
          ).catch((refreshError) => {
            if (refreshError?.status !== 403) {
              console.warn(
                'Reading: learning path refresh failed:',
                refreshError?.message || refreshError
              );
            }
          });
          try {
            await awardXP(results.correctAnswers, results.totalQuestions);
          } catch (xpError) {
            console.error('Reading XP error:', xpError);
          }
        }
      } catch (error) {
        console.error('Error submitting test:', error);
        setError('Failed to submit test. Please try again.');
      } finally {
        setIsSubmitting(false);
        submittingRef.current = false;
      }
    },
    [
      testData,
      session,
      allQuestions,
      answers,
      flaggedQuestions,
      getLatestState,
      user,
      dispatch,
      awardXP,
    ]
  );

  useExamDeadline({
    session,
    isFinished,
    onTick: useCallback(
      (remaining) => dispatch({ type: 'SET_TIME', payload: remaining }),
      [dispatch]
    ),
    onExpire: handleSubmit,
  });

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
    testMode: session ? getSessionTestMode(session) : selectedMode,
    selectedMode,
    setSelectedMode,
    examEligibility,
    isAwaitingStart: Boolean(testData && user && !session),
    isStarting,
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
    handleStartTest,

    // Navigation
    blocker,
    showExitDialog,
    setShowExitDialog,
    handleExit,
    resetBlocker,
    isExiting,
  };
}
