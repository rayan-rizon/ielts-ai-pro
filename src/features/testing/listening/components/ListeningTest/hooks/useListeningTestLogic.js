import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useListeningTestDispatch, useListeningTestState } from '../context/ListeningTestContext';
import { initializeTest } from '@/lib/testInitializer';
import { TestSession } from '@/features/testing/shared/services/TestSession';
import { computeQuestionNumbers } from '../utils/questionProcessing';
import { calculateListeningTestResults } from '../utils/scoreCalculator';
import { calculateEnhancedMetrics } from '@/services/testMetricsService';
import { useGamification } from '@/hooks/useGamification';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useListeningTestStore } from '../../../store/useListeningTestStore';

export const useListeningTestLogic = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session, answers, testData, questions, questionsWithNumbers, isFinished, activePart } =
    useListeningTestState();

  const { dispatch, ACTIONS, setAudioTimeRef } = useListeningTestDispatch();

  const { userProfile: currentUser, loading: authLoading } = useAuth();
  const [pendingAudioSeek, setPendingAudioSeek] = useState(null);
  const audioPlayerRef = useRef(null);

  // Gamification
  const { awardXP } = useGamification();

  // In-flight guard: prevents re-entrant init when currentUser ref changes mid-flight
  const initializingRef = useRef(false);

  // Initialize Test
  useEffect(() => {
    const initializeTestInternal = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const taskId = id || urlParams.get('test-id');
      const viewResults =
        urlParams.get('view-results') === 'true' || urlParams.get('view_results') === 'true';
      const isRetake = urlParams.get('retake') === 'true';

      if (!taskId || authLoading) return;
      if (initializingRef.current) return; // Already in-flight — skip duplicate run

      // Skip re-init when URL just changed to match our current session
      // (e.g., after navigate from passage-ID to session-ID)
      if (session?.id === taskId) return;

      initializingRef.current = true;

      dispatch({ type: ACTIONS.SET_LOADING, payload: true });

      try {
        const {
          testData,
          questions,
          session: existingSession,
          user,
        } = await initializeTest({
          type: 'listening',
          id: taskId,
          isRetake,
          viewResults,
          user: currentUser, // Pass user to avoid redundant User.me()
        });

        // 1. PREPARE STORE STATE (Validate or Reset)
        if (currentUser && existingSession) {
          // Resume Mode: Validate session ID to prevent data mixing
          dispatch({ type: ACTIONS.VALIDATE_SESSION, payload: existingSession.id });
        } else {
          // New Session or Guest: Ensure clean slate
          dispatch({ type: ACTIONS.RESET_TEST });
        }

        // 2. SET DATA (Always, after store is prepared)
        dispatch({
          type: ACTIONS.SET_TEST_DATA,
          payload: { passage: testData, questions: questions },
        });

        // 3. HANDLE USER SESSION
        if (currentUser) {
          // setCurrentUser removed as it's from auth context now

          if (existingSession) {
            dispatch({ type: ACTIONS.SET_SESSION, payload: existingSession });

            if (existingSession.user_responses) {
              dispatch({ type: ACTIONS.SET_ANSWERS_BULK, payload: existingSession.user_responses });
            }

            // Handle Completion/Review
            if (existingSession.is_completed || viewResults) {
              dispatch({ type: ACTIONS.FINISH_TEST });

              const processedQuestions = computeQuestionNumbers(questions);
              const results = calculateListeningTestResults(
                processedQuestions,
                existingSession.user_responses || {},
                Array.isArray(testData.content)
                  ? testData.content
                  : testData.audio_url
                    ? [testData]
                    : []
              );

              dispatch({ type: ACTIONS.SET_CORRECT_ANSWERS_MAP, payload: results.answersMap });
              dispatch({ type: ACTIONS.SET_RESULTS, payload: results });

              // Only show modal if EXPLICITLY requested via URL
              if (viewResults) {
                dispatch({ type: ACTIONS.SHOW_RESULTS_MODAL, payload: true });
              } else {
                // Ensure modal is closed when just reviewing
                dispatch({ type: ACTIONS.SHOW_RESULTS_MODAL, payload: false });
              }
            }

            // Restore Audio
            if (existingSession.content_data?.audio_current_time && !existingSession.is_completed) {
              setPendingAudioSeek(existingSession.content_data.audio_current_time);
            }

            // Restore Time
            if (
              existingSession.content_data?.time_remaining !== undefined &&
              !existingSession.is_completed
            ) {
              dispatch({
                type: ACTIONS.SET_TIME,
                payload: existingSession.content_data.time_remaining,
              });
            }

            // Redirect if needed
            if (!existingSession.is_completed && !location.pathname.includes(existingSession.id)) {
              navigate(`/listening-test/${existingSession.id}`, { replace: true });
            }
          } else {
            // New Session
            const newSession = await TestSession.create({
              user_id: user.id,
              test_type: 'listening',
              is_completed: false,
              passage_id: testData.id,
              content_data: {
                passage_id: testData.id,
                title: testData.title,
              },
            });

            const { removeFromCache } = await import('@/lib/apiCache');
            removeFromCache('listening-tests-list');

            dispatch({ type: ACTIONS.SET_SESSION, payload: newSession });
            navigate(`/listening-test/${newSession.id}`, { replace: true });
          }
        }
      } catch (error) {
        console.error('Error initializing test:', error);
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
        initializingRef.current = false;
      }
    };

    initializeTestInternal();
  }, [id, dispatch, ACTIONS, navigate, authLoading, currentUser, session?.id]);

  // Handle Pending Audio Seek (for session restore)
  useEffect(() => {
    if (pendingAudioSeek !== null && audioPlayerRef.current) {
      const timer = setTimeout(() => {
        if (audioPlayerRef.current) {
          audioPlayerRef.current.seek(pendingAudioSeek);
          setAudioTimeRef(pendingAudioSeek);
          // Also start playing after seeking
          audioPlayerRef.current.play();
        }
        setPendingAudioSeek(null);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [pendingAudioSeek, setAudioTimeRef]);

  // Handle Initial Auto-Play on Test Load (not part change)
  const hasAutoPlayedRef = useRef(false);
  useEffect(() => {
    // Only trigger once per test load
    if (hasAutoPlayedRef.current) return;
    if (!testData || isFinished) return;

    const params = new URLSearchParams(window.location.search);
    const isViewResults =
      params.get('view-results') === 'true' || params.get('view_results') === 'true';

    if (isViewResults) return;

    // Use a slightly longer buffer to ensure component is fully mounted and ref is stable
    const timer = setTimeout(() => {
      if (audioPlayerRef.current && !isFinished && !hasAutoPlayedRef.current) {
        audioPlayerRef.current.play();
        hasAutoPlayedRef.current = true;
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [testData, isFinished]);

  // Handle Auto-Play on Part/Tab Change
  const prevActivePartRef = useRef(activePart);
  useEffect(() => {
    // Skip if this is the initial render (no previous part)
    if (prevActivePartRef.current === activePart) return;

    // Update the previous part ref
    prevActivePartRef.current = activePart;

    // Don't auto-play if test is finished or we're viewing results
    if (isFinished) return;

    const params = new URLSearchParams(window.location.search);
    const isViewResults =
      params.get('view-results') === 'true' || params.get('view_results') === 'true';
    if (isViewResults) return;

    // Wait for the new audio to load, then auto-play
    const timer = setTimeout(() => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.play();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [activePart, isFinished]);

  // Reset auto-play flag on retake (when session changes to a new one)
  useEffect(() => {
    if (!session) {
      hasAutoPlayedRef.current = false;
    }
  }, [session]);

  // Handlers
  const toggleFlag = useCallback(
    (id) => {
      dispatch({ type: ACTIONS.TOGGLE_FLAG, payload: id });
    },
    [dispatch, ACTIONS.TOGGLE_FLAG]
  );

  const handleAnswerChange = useCallback(
    (questionId, value) => {
      dispatch({ type: ACTIONS.SET_ANSWER, payload: { id: questionId, value } });
    },
    [dispatch, ACTIONS.SET_ANSWER]
  );

  const handleMultiSelectChange = useCallback(
    (questionId, optionValue, isChecked, limit = null) => {
      const currentAnswers = answers[questionId] || [];
      const ansArray = Array.isArray(currentAnswers) ? currentAnswers : [currentAnswers];

      if (isChecked) {
        if (ansArray.includes(optionValue)) return;
        if (limit !== null && ansArray.length >= limit) return;
        dispatch({
          type: ACTIONS.SET_ANSWER,
          payload: { id: questionId, value: [...ansArray, optionValue] },
        });
      } else {
        dispatch({
          type: ACTIONS.SET_ANSWER,
          payload: { id: questionId, value: ansArray.filter((a) => a !== optionValue) },
        });
      }
    },
    [answers, dispatch, ACTIONS.SET_ANSWER]
  );

  const submittingRef = useRef(false);

  const handleSubmit = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    dispatch({ type: ACTIONS.SET_SUBMITTING, payload: true });

    try {
      // Stop the audio playback when test is submitted
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }

      const results = calculateListeningTestResults(
        questionsWithNumbers,
        answers,
        Array.isArray(testData?.content) ? testData.content : testData?.audio_url ? [testData] : []
      );

      dispatch({ type: ACTIONS.SET_CORRECT_ANSWERS_MAP, payload: results.answersMap });
      dispatch({ type: ACTIONS.SET_RESULTS, payload: results });

      if (session) {
        // Calculate duration and enhanced metrics for Listening
        const durationMins = session.duration_minutes || 40; // Listening is typically ~40mins
        const state = useListeningTestStore?.getState() || {};
        const finalTimeRemaining = state.timeRemaining || 0;
        const answerTimestamps = state.answerTimestamps || {};
        const answerChangeCounts = state.answerChangeCounts || {};

        const actualTimeSpentSeconds = Math.max(1, durationMins * 60 - finalTimeRemaining);
        const actualTimeSpentMinutes = Math.max(1, Math.floor(actualTimeSpentSeconds / 60));

        let timePerQuestionSeconds = {};
        let totalAnswerChanges = 0;
        let enhancedMetrics = {};

        try {
          // Time per question calculation
          timePerQuestionSeconds = (() => {
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

          totalAnswerChanges = Object.values(answerChangeCounts).reduce(
            (sum, v) => sum + (Number(v) || 0),
            0
          );

          // Enhanced metrics equivalent to Reading
          enhancedMetrics = calculateEnhancedMetrics(
            {
              bandScore: results.bandScore || 0,
              totalQuestions: results.totalQuestions || 40,
              correctAnswers: results.correctAnswers || 0,
              percentage: results.percentage || 0,
              sectionStats: results.sectionStats || [],
              typeStats: results.typeStats || {},
              correctAnswersMap: results.answersMap || {},
            },
            answers || {},
            answerTimestamps,
            actualTimeSpentSeconds || 1,
            'listening',
            answerChangeCounts
          );
        } catch (metricError) {
          console.error('[ListeningTest] Error calculating enhanced metrics:', metricError);
          // Fallback to empty blocks to guarantee initialized persistence
          enhancedMetrics = {
            timeMetrics: {
              averageSecondsPerQuestion: 0,
              timePerQuestionType: {},
              rushedQuestions: 0,
              overanalyzedQuestions: 0,
              totalTimeSpent: actualTimeSpentSeconds || 0,
              recommendedPace: 60,
              paceEfficiency: 1,
            },
            errorPatterns: {
              nearMissCount: 0,
              troubleTypes: [],
              unansweredCount: results.totalQuestions || 40,
              changedAnswers: 0,
              totalAnswerChanges: 0,
              confidenceIndex: 0,
              indecisionScore: 0,
            },
            skillGaps: {
              detailRetention: 0,
              paraphrasingRecognition: 0,
              logicalReasoning: 0,
              scanningEfficiency: 0,
              globalComprehension: 0,
            },
          };
        }

        await TestSession.update(session.id, {
          is_completed: true,
          score: results.bandScore,
          completed_at: new Date().toISOString(),
          duration_minutes: actualTimeSpentMinutes,
          content_data: {
            ...session.content_data,
            // Core metrics
            correctAnswersMap: results.answersMap || {},
            totalQuestions: results.totalQuestions || 40,
            correctAnswers: results.correctAnswers || 0,
            percentage: results.percentage || 0,
            savedAnswers: answers || {},
            sectionStats: results.sectionStats || [],
            typeStats: results.typeStats || {},
            // Enhanced metrics
            answerTimestamps,
            timePerQuestionSeconds,
            answerChangeCounts,
            totalAnswerChanges,
            changedAnswersCount: enhancedMetrics.errorPatterns?.changedAnswers || 0,
            timeMetrics: enhancedMetrics.timeMetrics || {},
            errorPatterns: enhancedMetrics.errorPatterns || {},
            skillGaps: enhancedMetrics.skillGaps || {},
          },
        });

        const { removeFromCache } = await import('@/lib/apiCache');
        removeFromCache('listening-tests-list');

        try {
          await awardXP(results.correctAnswers, questions.length, { updateStreak: false });
        } catch (e) {
          console.error('XP Error', e);
        }
      }

      dispatch({ type: ACTIONS.FINISH_TEST });
      dispatch({ type: ACTIONS.SHOW_RESULTS_MODAL, payload: true });
    } catch (error) {
      console.error('Error submitting listening test:', error);
    } finally {
      dispatch({ type: ACTIONS.SET_SUBMITTING, payload: false });
      submittingRef.current = false;
    }
  };

  return {
    // State
    audioPlayerRef,
    currentUser,
    // Handlers
    toggleFlag,
    handleAnswerChange,
    handleMultiSelectChange,
    handleSubmit,
  };
};
