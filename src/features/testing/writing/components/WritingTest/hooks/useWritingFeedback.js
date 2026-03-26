import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useWritingTestStore } from '@/features/testing/writing/store/useWritingTestStore';
import { useWritingTestDispatch } from '../context/WritingTestContext';
import { generateDetailedFeedback } from '@/utils/api';
import { removeFromCache } from '@/hooks/useDataQuery';

/**
 * useWritingFeedback
 *
 * Handles all AI Feedback generation logic:
 * - Role/Tier Access Control
 * - Word Count Validation
 * - Cost Optimization (Text-based caching): Checks if the essay text has changed
 *   before making new AI API calls, preventing redundant costs.
 * - Parallel Execution: Runs multiple task analyses concurrently for speed.
 * - AI API Calls
 * - Results Processing & Parsing
 * - Session Updates
 * - XP Awarding integration
 */
export function useWritingFeedback(awardXP, isExiting) {
  const { saveNow } = useWritingTestDispatch();
  const queryClient = useQueryClient();

  // Helper validation function
  const isValidFeedback = (fb) => {
    if (!fb) return false;
    return (
      fb.overallBand !== undefined ||
      fb.overall_band !== undefined ||
      fb.band_score !== undefined ||
      fb.score !== undefined
    );
  };

  const analyzingRef = useRef(false);

  const handleGetFeedback = useCallback(async () => {
    if (analyzingRef.current) return;
    const store = useWritingTestStore.getState();
    // Idempotency: prevent duplicate XP awards if already completed
    if (store.completed || store.session?.is_completed) return;

    // Access Control: The backend edge function (generateDetailedFeedback)
    // enforces quota via checkDatabaseQuota() which respects admin-configured
    // tier limits (e.g., free users get N evaluations/month). If quota is
    // exceeded, the backend returns 429 which we handle in the catch block
    // to show the upgrade dialog.

    // Identify tasks to analyze with proper word count requirements
    const tasksToAnalyze = [];
    const task1Words =
      store.drafts['Task 1']
        ?.replace(/<[^>]*>/g, ' ')
        .trim()
        .split(/\s+/)
        .filter(Boolean).length || 0;
    const task2Words =
      store.drafts['Task 2']
        ?.replace(/<[^>]*>/g, ' ')
        .trim()
        .split(/\s+/)
        .filter(Boolean).length || 0;

    if (task1Words >= 50) tasksToAnalyze.push('Task 1');
    if (store.compositeTasks['Task 2'] && task2Words >= 100) tasksToAnalyze.push('Task 2');

    if (tasksToAnalyze.length === 0) {
      const errors = [];
      if (task1Words < 50) errors.push(`Task 1 needs ${50 - task1Words} more words (minimum 50)`);
      if (store.compositeTasks['Task 2'] && task2Words < 100)
        errors.push(`Task 2 needs ${100 - task2Words} more words (minimum 100)`);
      store.setFeedbackError(errors.join('. ') || 'Please write enough content to get feedback.');
      return;
    }

    // Pre-flight quota check: verify limit BEFORE showing analysis UI
    // This prevents the "AI Analysis In Progress" animation from flashing
    // when the user has already hit their limit.
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('id, subscription_tier')
          .eq('auth_id', user.id)
          .single();

        if (profile) {
          const { data: quotaData } = await supabase.rpc('check_user_rate_limit', {
            p_user_id: profile.id,
            p_tier: profile.subscription_tier || 'free',
            p_feature_type: 'writing',
          });

          const quota = quotaData?.[0] || quotaData;
          if (quota && quota.allowed === false) {
            store.setShowUpgradeDialog(true);
            return;
          }
        }
      }
    } catch (preflight) {
      // If pre-flight fails, fall through to the backend call
      // which will enforce limits server-side anyway
      console.warn(
        '[WritingTest] Pre-flight quota check failed, falling back to backend:',
        preflight
      );
    }

    // Ensure content is saved before starting feedback
    console.info('[WritingTest] Starting AI feedback, saving content first...');
    await saveNow();

    let timeoutId;
    try {
      analyzingRef.current = true;
      store.setAnalyzing(true);
      store.setFeedbackError(null);
      store.setCurrentFeedback(null);

      // Add timeout protection (2 minutes max)
      timeoutId = setTimeout(() => {
        console.warn('[Writing] Feedback analysis timed out');
        const state = useWritingTestStore.getState();
        state.setAnalyzing(false);
        state.setFeedbackError('Analysis timed out. Please try again.');
      }, 120000);

      const newFeedbacks = { ...store.feedbacks };
      let overallScore = null;

      // Prepare analysis plan: check cache first for all tasks
      const analysisPlan = tasksToAnalyze.map((type) => {
        const currentTextRaw = store.drafts[type]
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        const savedFeedback = store.feedbacks[type];
        if (savedFeedback && isValidFeedback(savedFeedback) && savedFeedback.originalSource) {
          const savedSourceRaw = savedFeedback.originalSource
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          if (currentTextRaw === savedSourceRaw) {
            return { type, cached: true, feedback: savedFeedback };
          }
        }
        return { type, cached: false, text: currentTextRaw };
      });

      // Execute parallel analysis for non-cached tasks
      const analysisPromises = analysisPlan.map(async (item) => {
        if (item.cached) {
          console.info(`[Writing] Using cached feedback for ${item.type}`);
          return { type: item.type, feedback: item.feedback };
        }

        let prompt = store.task.prompt;
        let imageUrl = store.task.image_url;
        if (store.compositeTasks[item.type]) {
          prompt = store.compositeTasks[item.type].prompt;
          imageUrl = store.compositeTasks[item.type].image_url;
        }

        const payload = {
          writingText: item.text,
          taskPrompt: prompt,
          taskType: item.type,
          imageUrl: item.type === 'Task 1' ? imageUrl : null,
        };

        const res = await generateDetailedFeedback(payload);
        const responseData = res.data || res;

        if (responseData && Object.keys(responseData).length > 0) {
          const raw = responseData;
          const feedbackData = raw.feedback || raw;

          const normalized = {
            ...feedbackData,
            overallBand:
              parseFloat(
                feedbackData.overallBand ||
                  feedbackData.overall_band ||
                  raw.overallBand ||
                  raw.overall_band ||
                  0
              ) || null,
            criteriaScores:
              feedbackData.criteriaScores ||
              feedbackData.criteria_scores ||
              raw.criteriaScores ||
              raw.criteria_scores ||
              {},
            annotations: Array.isArray(feedbackData.annotations)
              ? feedbackData.annotations
              : Array.isArray(raw.annotations)
                ? raw.annotations
                : [],
            vocabularyEnhancements: Array.isArray(
              feedbackData.vocabularyEnhancements || feedbackData.vocabulary_enhancements
            )
              ? feedbackData.vocabularyEnhancements || feedbackData.vocabulary_enhancements
              : Array.isArray(raw.vocabularyEnhancements || raw.vocabulary_enhancements)
                ? raw.vocabularyEnhancements || raw.vocabulary_enhancements
                : [],
            strengths: feedbackData.strengths || raw.strengths || [],
            weaknesses: feedbackData.weaknesses || raw.weaknesses || [],
            suggestions: feedbackData.suggestions || raw.suggestions || [],
            corrections: feedbackData.corrections || raw.corrections || [],
            taskType: item.type,
            originalSource: store.drafts[item.type],
          };

          if (item.type === 'Task 2' && !normalized.overallBand && raw.band_score) {
            normalized.overallBand = parseFloat(raw.band_score);
          }
          return { type: item.type, feedback: normalized };
        }
        return { type: item.type, feedback: null };
      });

      const results = await Promise.all(analysisPromises);

      results.forEach(({ type, feedback }) => {
        if (feedback) {
          newFeedbacks[type] = feedback;
          if (type === store.activeType) {
            overallScore = feedback.overallBand;
          } else if (overallScore === null) {
            overallScore = feedback.overallBand;
          }
        }
      });

      store.setFeedbacksBulk(newFeedbacks);
      store.setCurrentFeedback(newFeedbacks[store.activeType] || newFeedbacks[tasksToAnalyze[0]]);

      // Save session
      if (store.session) {
        const completedAt = new Date().toISOString();
        const updatePayload = {
          is_completed: true,
          completed_at: completedAt,
          score: overallScore,
          user_responses: [
            {
              response: JSON.stringify(store.drafts),
              word_count: store.wordCount,
              task1_response: store.drafts['Task 1'],
              task2_response: store.drafts['Task 2'],
            },
          ],
          content_data: {
            ...store.session.content_data,
            time_remaining: store.timeRemaining,
            ai_feedbacks: newFeedbacks,
          },
        };

        const { error: updateError } = await supabase
          .from('test_sessions')
          .update(updatePayload)
          .eq('id', store.session.id);

        if (updateError) {
          throw new Error(`Failed to save feedback: ${updateError.message}`);
        }

        store.setSession({
          ...store.session,
          ...updatePayload,
        });
        store.setCompleted(true);

        removeFromCache('writing-tests-list');

        // Invalidate usage stats so Settings page updates immediately
        queryClient.invalidateQueries({ queryKey: ['user-usage-counts'] });

        const totalTasks = tasksToAnalyze.length;
        if (awardXP) {
          await awardXP(totalTasks, totalTasks, {
            includePerfectBonus: overallScore >= 7.0,
            updateStreak: true,
            notificationDelay: 800,
          });
        }
      }
    } catch (err) {
      console.error('Feedback error:', err);

      // If backend returned 429 (quota exceeded), show upgrade dialog
      if (err.status === 429 || err.name === 'RateLimitError') {
        store.setShowUpgradeDialog(true);
        return;
      }

      store.setFeedbackError(err.message || 'Failed to generate AI feedback.');
    } finally {
      clearTimeout(timeoutId);
      store.setAnalyzing(false);
      analyzingRef.current = false;
    }
  }, [saveNow, awardXP, isExiting]);

  return { handleGetFeedback };
}
