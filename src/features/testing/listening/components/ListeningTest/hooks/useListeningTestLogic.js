import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useListeningTestDispatch, useListeningTestState } from '../context/ListeningTestContext';
import { initializeTest } from '@/lib/testInitializer';
import { TestSession } from '@/features/testing/shared/services/TestSession';
import {
  getLearningActivityId,
  getRequestedTestMode,
} from '@/features/testing/shared/activityContext';
import { computeQuestionNumbers } from '../utils/questionProcessing';
import { calculateListeningTestResults } from '../utils/scoreCalculator';
import { refreshLearningPathAfterTest } from '@/services/adaptiveLearningService';
import { ANALYSIS_SCHEMA_VERSION } from '@/features/testing/shared/utils/resultEvidence';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useListeningTestStore } from '../../../store/useListeningTestStore';
import {
  LISTENING_REVIEW_SECONDS,
  getListeningExamEligibility,
  getListeningParts,
  getExamRemainingSeconds,
  getSessionTestMode,
  resolveNewAttemptMode,
  toPersistedTestMode,
} from '@/features/testing/shared/testMode';
import { useExamDeadline } from '@/features/testing/shared/hooks/useExamDeadline';
import { trackAppEvent } from '@/lib/tracking';
import { invalidateLearnerPracticeQueries } from '@/lib/queryClient';

function loadAudioDuration(src) {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    let settled = false;
    const cleanup = () => {
      window.clearTimeout(timeout);
      audio.onloadedmetadata = null;
      audio.onerror = null;
      audio.removeAttribute('src');
      audio.load();
    };
    const finish = (callback) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback();
    };
    const timeout = window.setTimeout(
      () => finish(() => reject(new Error(`Audio metadata timed out: ${src}`))),
      15_000
    );
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      finish(() => resolve(Math.ceil(audio.duration)));
    };
    audio.onerror = () => {
      finish(() => reject(new Error(`Unable to load audio metadata: ${src}`)));
    };
    audio.src = src;
  });
}

export const useListeningTestLogic = ({ awardXP: awardXPFromPage, onResumeExpired } = {}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session, answers, testData, questions, questionsWithNumbers, isFinished, activePart } =
    useListeningTestState();

  const { dispatch, ACTIONS, setAudioTimeRef } = useListeningTestDispatch();

  const { userProfile: currentUser, loading: authLoading } = useAuth();
  const [pendingAudioSeek, setPendingAudioSeek] = useState(null);
  const [selectedMode, setSelectedMode] = useState(() => getRequestedTestMode());
  const [examEligibility, setExamEligibility] = useState({ eligible: false, reason: '' });
  const [isStarting, setIsStarting] = useState(false);
  const [examReview, setExamReview] = useState(false);
  const audioPlayerRef = useRef(null);
  const awardXP = awardXPFromPage || (async () => ({ success: false }));

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
        const eligibility = getListeningExamEligibility(testData, questions);
        setExamEligibility(eligibility);

        // 3. HANDLE USER SESSION
        if (currentUser) {
          // setCurrentUser removed as it's from auth context now

          if (existingSession) {
            dispatch({ type: ACTIONS.SET_SESSION, payload: existingSession });
            setSelectedMode(getSessionTestMode(existingSession));
            if (getSessionTestMode(existingSession) === 'exam' && !existingSession.is_completed) {
              const durations = existingSession.content_data?.audio_durations || [];
              const durationSeconds =
                Number(existingSession.content_data?.duration_seconds) ||
                existingSession.duration_minutes * 60;
              const remaining = getExamRemainingSeconds(existingSession, durationSeconds);
              const elapsed = Math.max(0, durationSeconds - remaining);
              const audioTotal = durations.reduce((total, value) => total + Number(value || 0), 0);
              if (elapsed >= audioTotal) {
                setExamReview(true);
                dispatch({
                  type: ACTIONS.SET_ACTIVE_PART,
                  payload: Math.max(0, durations.length - 1),
                });
              } else {
                let offset = elapsed;
                let partIndex = 0;
                while (partIndex < durations.length - 1 && offset >= durations[partIndex]) {
                  offset -= durations[partIndex];
                  partIndex += 1;
                }
                dispatch({ type: ACTIONS.SET_ACTIVE_PART, payload: partIndex });
                setPendingAudioSeek(offset);
              }
            }

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
              const storedMetrics = existingSession.content_data || {};
              const hydratedResults = {
                ...results,
                responseDetails: storedMetrics.responseDetails || results.responseDetails,
                answerChangeCounts: storedMetrics.answerChangeCounts || {},
                durationMinutes: existingSession.duration_minutes || null,
              };

              dispatch({ type: ACTIONS.SET_CORRECT_ANSWERS_MAP, payload: results.answersMap });
              dispatch({ type: ACTIONS.SET_RESULTS, payload: hydratedResults });

              // Only show modal if EXPLICITLY requested via URL
              if (viewResults) {
                dispatch({ type: ACTIONS.SHOW_RESULTS_MODAL, payload: true });
              } else {
                // Ensure modal is closed when just reviewing
                dispatch({ type: ACTIONS.SHOW_RESULTS_MODAL, payload: false });
              }
            }

            // Restore Audio
            if (
              getSessionTestMode(existingSession) !== 'exam' &&
              existingSession.content_data?.audio_current_time &&
              !existingSession.is_completed
            ) {
              setPendingAudioSeek(existingSession.content_data.audio_current_time);
            }

            // Restore Time
            if (
              getSessionTestMode(existingSession) !== 'exam' &&
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
            dispatch({ type: ACTIONS.SET_SESSION, payload: null });
            const preferredMode = resolveNewAttemptMode({
              search: window.location.search,
              settings: user.settings,
            });
            setSelectedMode(
              preferredMode === 'exam' && !eligibility.eligible ? 'practice' : preferredMode
            );
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
    if (!testData || !session || isFinished) return;

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
  }, [testData, session, isFinished]);

  // Handle Auto-Play on Part/Tab Change
  const prevActivePartRef = useRef(activePart);
  useEffect(() => {
    // Skip if this is the initial render (no previous part)
    if (prevActivePartRef.current === activePart) return;

    // Update the previous part ref
    prevActivePartRef.current = activePart;

    // Don't auto-play if test is finished or we're viewing results
    if (!session || isFinished || examReview) return;

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
  }, [activePart, session, isFinished, examReview]);

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

      const submissionState = useListeningTestStore.getState();
      const results = calculateListeningTestResults(
        questionsWithNumbers,
        answers,
        Array.isArray(testData?.content) ? testData.content : testData?.audio_url ? [testData] : [],
        submissionState.flaggedQuestions
      );

      dispatch({ type: ACTIONS.SET_CORRECT_ANSWERS_MAP, payload: results.answersMap });
      dispatch({ type: ACTIONS.SET_RESULTS, payload: results });

      if (session) {
        // Calculate duration and enhanced metrics for Listening
        const durationMins = session.duration_minutes || 40; // Listening is typically ~40mins
        const finalTimeRemaining = submissionState.timeRemaining || 0;

        const actualTimeSpentSeconds = Math.max(1, durationMins * 60 - finalTimeRemaining);
        const actualTimeSpentMinutes = Math.max(1, Math.floor(actualTimeSpentSeconds / 60));

        dispatch({
          type: ACTIONS.SET_RESULTS,
          payload: {
            ...results,
            durationMinutes: actualTimeSpentMinutes,
          },
        });

        const didComplete = await TestSession.complete(session.id, {
          score: results.bandScore,
          completed_at: new Date().toISOString(),
          duration_minutes: actualTimeSpentMinutes,
          actual_duration_seconds: actualTimeSpentSeconds,
          user_responses: answers || {},
          content_data: {
            ...session.content_data,
            analysisSchemaVersion: ANALYSIS_SCHEMA_VERSION,
            // Core metrics
            correctAnswersMap: results.answersMap || {},
            responseDetails: results.responseDetails || [],
            totalQuestions: results.totalQuestions || 40,
            correctAnswers: results.correctAnswers || 0,
            percentage: results.percentage || 0,
            savedAnswers: answers || {},
            sectionStats: results.sectionStats || [],
            typeStats: results.typeStats || {},
            // Listening audio controls pace; only total elapsed time is measured.
            timeMetrics: { totalTimeSpent: actualTimeSpentSeconds },
            errorPatterns: results.errorPatterns || {},
          },
        });

        const { removeFromCache } = await import('@/lib/apiCache');
        removeFromCache('listening-tests-list');
        if (didComplete) invalidateLearnerPracticeQueries();

        if (didComplete) {
          trackAppEvent('test_completed', {
            test_type: 'listening',
            test_mode: getSessionTestMode(session),
            overall_band: results.bandScore,
          });
          try {
            await awardXP(results.correctAnswers, questions.length, {
              updateStreak: false,
              actionKey: `listening-test:${session.id}`,
            });
          } catch (e) {
            console.error('XP Error', e);
          }
          refreshLearningPathAfterTest(
            session.user_id || currentUser?.id,
            'listening',
            results.bandScore
          ).catch((refreshError) => {
            if (refreshError?.status !== 403) {
              console.warn(
                'Listening: learning path refresh failed:',
                refreshError?.message || refreshError
              );
            }
          });
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

  const handleStartTest = useCallback(
    async (requestedMode) => {
      if (!testData || !currentUser || session || isStarting) return;
      const testMode = requestedMode === 'exam' && examEligibility.eligible ? 'exam' : 'practice';
      setIsStarting(true);
      try {
        const parts = getListeningParts(testData);
        const audioDurations =
          testMode === 'exam'
            ? await Promise.all(parts.map((part) => loadAudioDuration(part.audio_url)))
            : [];
        const durationSeconds =
          testMode === 'exam'
            ? audioDurations.reduce((total, value) => total + value, 0) + LISTENING_REVIEW_SECONDS
            : 40 * 60;
        const newSession = await TestSession.create({
          user_id: currentUser.id,
          test_type: 'listening',
          test_mode: toPersistedTestMode(testMode),
          is_completed: false,
          duration_minutes: Math.ceil(durationSeconds / 60),
          passage_id: testData.id,
          learning_path_activity_id: getLearningActivityId(),
          content_data: {
            passage_id: testData.id,
            title: testData.title,
            test_mode: testMode,
            duration_seconds: durationSeconds,
            audio_durations: audioDurations,
            review_seconds: testMode === 'exam' ? LISTENING_REVIEW_SECONDS : 0,
          },
        });
        dispatch({ type: ACTIONS.RESET_TEST });
        dispatch({ type: ACTIONS.SET_SESSION, payload: newSession });
        if (testMode === 'exam') {
          dispatch({ type: ACTIONS.SET_TIME, payload: durationSeconds });
        }
        setSelectedMode(testMode);
        setExamReview(false);
        const { removeFromCache } = await import('@/lib/apiCache');
        removeFromCache('listening-tests-list');
        navigate(`/listening-test/${newSession.id}`, { replace: true });
      } catch (startError) {
        console.error('Failed to start listening test:', startError);
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: 'Failed to start the test or load its audio. Please try again.',
        });
      } finally {
        setIsStarting(false);
      }
    },
    [
      testData,
      currentUser,
      session,
      isStarting,
      examEligibility.eligible,
      dispatch,
      ACTIONS,
      navigate,
    ]
  );

  const examDurationSeconds =
    Number(session?.content_data?.duration_seconds) || session?.duration_minutes * 60 || 40 * 60;
  useExamDeadline({
    session,
    isFinished,
    durationSeconds: examDurationSeconds,
    onTick: useCallback(
      (remaining) => {
        dispatch({ type: ACTIONS.SET_TIME, payload: remaining });
        const reviewSeconds =
          Number(session?.content_data?.review_seconds) || LISTENING_REVIEW_SECONDS;
        setExamReview(remaining <= reviewSeconds);
      },
      [dispatch, ACTIONS.SET_TIME, session?.content_data?.review_seconds]
    ),
    onExpire: handleSubmit,
    onResumeExpired,
  });

  const handleExamAudioEnded = useCallback(() => {
    if (getSessionTestMode(session) !== 'exam') return;
    if (activePart < getListeningParts(testData).length - 1) {
      dispatch({ type: ACTIONS.SET_ACTIVE_PART, payload: activePart + 1 });
    } else {
      setExamReview(true);
    }
  }, [session, activePart, testData, dispatch, ACTIONS.SET_ACTIVE_PART]);

  return {
    // State
    audioPlayerRef,
    currentUser,
    testMode: session ? getSessionTestMode(session) : selectedMode,
    selectedMode,
    setSelectedMode,
    examEligibility,
    isAwaitingStart: Boolean(testData && currentUser && !session),
    isStarting,
    examReview,
    // Handlers
    toggleFlag,
    handleAnswerChange,
    handleMultiSelectChange,
    handleSubmit,
    handleStartTest,
    handleExamAudioEnded,
  };
};
