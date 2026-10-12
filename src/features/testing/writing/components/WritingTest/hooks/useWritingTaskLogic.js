import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useBlocker } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useWritingTestStore } from '@/features/testing/writing/store/useWritingTestStore';
import { useWritingTestDispatch } from '../context/WritingTestContext';
import { removeFromCache } from '@/hooks/useDataQuery';
import { TestSession } from '@/features/testing/shared/services/TestSession';
import {
  EXAM_DURATION_SECONDS,
  getSessionTestMode,
  getWritingExamEligibility,
  resolveNewAttemptMode,
  toPersistedTestMode,
} from '@/features/testing/shared/testMode';
import { useExamDeadline } from '@/features/testing/shared/hooks/useExamDeadline';
import {
  getLearningActivityId,
  getRequestedTestMode,
} from '@/features/testing/shared/activityContext';

// Modular Hooks
import { useWritingInitialization } from './useWritingInitialization';
import { useWritingFeedback } from './useWritingFeedback';
import { useWritingGamification } from './useWritingGamification';
import { useWritingStatus } from './useWritingStatus';
import { flushPendingWritingDrafts } from '@/features/testing/writing/writingDraftFlush';

/**
 * useWritingTaskLogic
 *
 * Orchestration hook that combines specialized hooks for the Writing Task module.
 */
export function useWritingTaskLogic(passedUser = null) {
  const navigate = useNavigate();
  const isExiting = useRef(false);
  const submittingRef = useRef(false);

  // 1. Store Selectors
  const task = useWritingTestStore((state) => state.task);
  const compositeTasks = useWritingTestStore((state) => state.compositeTasks);
  const session = useWritingTestStore((state) => state.session);
  const activeType = useWritingTestStore((state) => state.activeType);
  const isLoading = useWritingTestStore((state) => state.isLoading);
  const isSubmitting = useWritingTestStore((state) => state.isSubmitting);
  const isAnalyzing = useWritingTestStore((state) => state.isAnalyzing);
  const isCompleted = useWritingTestStore((state) => state.isCompleted);
  const error = useWritingTestStore((state) => state.error);
  const feedbackError = useWritingTestStore((state) => state.feedbackError);
  const currentUser = useWritingTestStore((state) => state.currentUser);

  // Dialog State
  const showExitDialog = useWritingTestStore((state) => state.showExitDialog);
  const showSubmitDialog = useWritingTestStore((state) => state.showSubmitDialog);
  const showTimeUpDialog = useWritingTestStore((state) => state.showTimeUpDialog);
  const showUpgradeDialog = useWritingTestStore((state) => state.showUpgradeDialog);

  // Save State
  const isSaving = useWritingTestStore((state) => state.isSaving);
  const lastSaved = useWritingTestStore((state) => state.lastSaved);

  // Actions
  const setShowExitDialog = useWritingTestStore((state) => state.setShowExitDialog);
  const setShowSubmitDialog = useWritingTestStore((state) => state.setShowSubmitDialog);
  const setShowTimeUpDialog = useWritingTestStore((state) => state.setShowTimeUpDialog);
  const setShowUpgradeDialog = useWritingTestStore((state) => state.setShowUpgradeDialog);

  const [showSample, setShowSample] = useState(false);
  const [selectedMode, setSelectedMode] = useState(() => getRequestedTestMode());
  const [examEligibility, setExamEligibility] = useState({ eligible: false, reason: '' });
  const [isStarting, setIsStarting] = useState(false);
  const modeInitializationKeyRef = useRef(null);
  const { saveNow } = useWritingTestDispatch();

  // 2. Initialize Sub-Hooks
  const { initialize } = useWritingInitialization();
  const {
    showConfetti,
    showXPNotification,
    earnedXP,
    awardXP,
    setShowConfetti,
    setShowXPNotification,
  } = useWritingGamification();

  const { handleGetFeedback } = useWritingFeedback(awardXP);
  const { loadingMessage } = useWritingStatus();
  const recoveredGenerationRef = useRef(null);

  useEffect(() => {
    if (isLoading || !session?.id || session.evaluation_status !== 'pending') return;
    const generation = `${session.id}:${session.content_data?.evaluationRequestedAt || ''}`;
    if (recoveredGenerationRef.current === generation) return;
    recoveredGenerationRef.current = generation;
    void handleGetFeedback();
  }, [isLoading, session, handleGetFeedback]);

  useEffect(() => {
    if (!task || !currentUser) return;
    const key = session?.id || task.id;
    if (modeInitializationKeyRef.current === key) return;
    modeInitializationKeyRef.current = key;
    const eligibility = getWritingExamEligibility(compositeTasks);
    setExamEligibility(eligibility);
    if (session) {
      setSelectedMode(getSessionTestMode(session));
      return;
    }
    const preferredMode = resolveNewAttemptMode({
      search: window.location.search,
      settings: currentUser.settings,
    });
    setSelectedMode(preferredMode === 'exam' && !eligibility.eligible ? 'practice' : preferredMode);
  }, [task, compositeTasks, currentUser, session]);

  // 3. Navigation Blocker (Legacy Logic kept here for now as it bridges Router + Store)
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    const state = useWritingTestStore.getState();
    const activeDraft = state.drafts[state.activeType] || '';
    const textOnly = activeDraft
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const hasFeedback = state.feedbacks['Task 1'] || state.feedbacks['Task 2'];
    const testIsCompleted =
      state.isCompleted || state.session?.is_completed || !!state.currentFeedback || hasFeedback;

    return (
      !isExiting.current &&
      state.session &&
      !testIsCompleted &&
      currentLocation.pathname !== nextLocation.pathname &&
      textOnly.length > 0
    );
  });

  useEffect(() => {
    if (blocker.state === 'blocked') {
      useWritingTestStore.getState().setShowExitDialog(true);
    }
  }, [blocker.state]);

  // 4. Manual Submission Handler
  const handleSubmit = async () => {
    flushPendingWritingDrafts();
    const store = useWritingTestStore.getState();
    if (!store.session || !store.task) return;
    if (submittingRef.current) return;
    submittingRef.current = true;
    store.setSubmitting(true);
    try {
      await saveNow();

      const currentResponse = [
        {
          response: JSON.stringify(store.drafts),
          word_count: store.wordCount,
          task1_response: store.drafts['Task 1'],
          task2_response: store.drafts['Task 2'],
        },
      ];
      const actualDurationSeconds = Math.max(1, 60 * 60 - Number(store.timeRemaining || 0));

      const { error: submitError } = await supabase
        .from('test_sessions')
        .update({
          user_responses: currentResponse,
          is_completed: true,
          completed_at: new Date().toISOString(),
          evaluation_status: 'not_requested',
          actual_duration_seconds: actualDurationSeconds,
          content_data: {
            ...store.session.content_data,
            time_remaining: store.timeRemaining,
            timeMetrics: {
              ...store.session.content_data?.timeMetrics,
              totalTimeSpent: actualDurationSeconds,
            },
          },
        })
        .eq('id', store.session.id)
        .eq('is_completed', false)
        .select('id')
        .maybeSingle();

      if (submitError) throw submitError;

      store.setCompleted(true);
      removeFromCache('writing-tests-list');

      isExiting.current = true;
      store.setShowSubmitDialog(false);
      navigate('/writing', {
        state: { message: 'Test submitted successfully!', type: 'success' },
      });
    } catch (err) {
      console.error('Submission failed:', err);
      store.setError('Failed to submit test.');
    } finally {
      store.setSubmitting(false);
      submittingRef.current = false;
    }
  };

  const handleStartTest = useCallback(
    async (requestedMode) => {
      const store = useWritingTestStore.getState();
      if (!store.task || !store.currentUser || store.session || isStarting) return;
      const testMode = requestedMode === 'exam' && examEligibility.eligible ? 'exam' : 'practice';
      setIsStarting(true);
      store.setError(null);
      try {
        const activityId = getLearningActivityId();
        const newSession = await TestSession.create({
          user_id: store.currentUser.id,
          test_type: 'writing',
          test_mode: toPersistedTestMode(testMode),
          duration_minutes: 60,
          passage_id: store.task.id,
          learning_path_activity_id: activityId || null,
          evaluation_status: 'not_requested',
          content_data: {
            ...store.task,
            test_mode: testMode,
            duration_seconds: EXAM_DURATION_SECONDS,
          },
        });
        store.resetTest();
        store.setTask(store.task, store.compositeTasks);
        store.setSession(newSession);
        store.setTime(EXAM_DURATION_SECONDS);
        setSelectedMode(testMode);
        const params = new URLSearchParams();
        params.set('sessionId', newSession.id);
        navigate(`?${params.toString()}`, { replace: true });
      } catch (startError) {
        console.error('Failed to start writing test:', startError);
        store.setError('Failed to start the test. Please try again.');
      } finally {
        setIsStarting(false);
      }
    },
    [isStarting, examEligibility.eligible, navigate]
  );

  useExamDeadline({
    session,
    isFinished: isCompleted,
    onTick: useCallback((remaining) => useWritingTestStore.getState().setTime(remaining), []),
    onExpire: handleSubmit,
    onResumeExpired: useCallback(
      () => useWritingTestStore.getState().setShowTimeUpDialog(true),
      []
    ),
  });

  // 5. Task Switching (atomic — single store update)
  const handleSwitchTask = useCallback((type) => {
    useWritingTestStore.getState().switchTaskFull(type);
    setShowSample(false);
  }, []);

  return {
    // Data & State
    task,
    compositeTasks,
    session,
    activeType,
    isLoading,
    isSubmitting,
    isAnalyzing,
    isCompleted,
    error,
    feedbackError,
    currentUser,
    testMode: session ? getSessionTestMode(session) : selectedMode,
    selectedMode,
    setSelectedMode,
    examEligibility,
    isAwaitingStart: Boolean(task && currentUser && !session),
    isStarting,

    // UI State
    showExitDialog,
    showSubmitDialog,
    showTimeUpDialog,
    showUpgradeDialog,
    isSaving,
    lastSaved,
    loadingMessage,
    showSample,
    setShowSample,
    isExiting,

    // Dialog Actions
    setShowExitDialog,
    setShowSubmitDialog,
    setShowTimeUpDialog,
    setShowUpgradeDialog,

    // Methods
    initialize: useCallback(() => initialize(passedUser), [initialize, passedUser]),
    handleGetFeedback,
    handleSubmit,
    handleStartTest,
    handleSwitchTask,

    // Gamification
    showConfetti,
    showXPNotification,
    earnedXP,
    setShowConfetti,
    setShowXPNotification,
  };
}
