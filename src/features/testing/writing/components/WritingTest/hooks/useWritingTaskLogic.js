import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useBlocker } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useWritingTestStore } from '@/features/testing/writing/store/useWritingTestStore';
import { useWritingTestDispatch } from '../context/WritingTestContext';
import { removeFromCache } from '@/hooks/useDataQuery';
import { refreshLearningPathAfterTest } from '@/services/adaptiveLearningService';

// Modular Hooks
import { useWritingInitialization } from './useWritingInitialization';
import { useWritingFeedback } from './useWritingFeedback';
import { useWritingGamification } from './useWritingGamification';
import { useWritingStatus } from './useWritingStatus';

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
  const setError = useWritingTestStore((state) => state.setError);
  const setFeedbackError = useWritingTestStore((state) => state.setFeedbackError);

  const [showSample, setShowSample] = useState(false);
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

  const { handleGetFeedback } = useWritingFeedback(awardXP, isExiting);
  const { loadingMessage } = useWritingStatus();

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

      const { error: submitError } = await supabase
        .from('test_sessions')
        .update({
          user_responses: currentResponse,
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', store.session.id);

      if (submitError) throw submitError;

      removeFromCache('writing-tests-list');

      // Trigger adaptive learning path refresh in background (Pro/Premium only)
      if (store.session?.user_id) {
        refreshLearningPathAfterTest(store.session.user_id, 'writing', 0).catch((err) => {
          if (err?.status !== 403)
            console.warn('Writing: learning path refresh failed:', err?.message);
        });
      }

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
    handleSwitchTask,

    // Gamification
    showConfetti,
    showXPNotification,
    earnedXP,
    setShowConfetti,
    setShowXPNotification,
  };
}
