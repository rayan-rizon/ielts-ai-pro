import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useWritingTestStore } from '@/features/testing/writing/store/useWritingTestStore';
import { useWritingTestDispatch } from '../context/WritingTestContext';
import { generateDetailedFeedback } from '@/utils/api';
import { removeFromCache } from '@/hooks/useDataQuery';
import { trackAppEvent } from '@/lib/tracking';
import { refreshLearningPathAfterTest } from '@/services/adaptiveLearningService';
import { CURRENT_EVALUATION_VERSION } from '@/features/testing/shared/evaluationVersion';
import {
  aggregateWritingCriteria,
  calculateWeightedWritingBand,
  isCurrentWritingFeedbackCache,
  normalizeTaskPrompt,
  normalizeWritingSource,
} from '@/features/testing/writing/utils/evaluationEvidence';
import {
  getWritingFeedbacks,
  getWritingEvaluationCreditMessage,
  isWritingLearnerQuotaError,
  isStalePendingWritingEvaluation,
  isValidFeedback,
  summarizeWritingEvaluationFailure,
} from '@/features/testing/writing/writingFeedbackHelpers';

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
export function useWritingFeedback(awardXP) {
  const { saveNow } = useWritingTestDispatch();
  const queryClient = useQueryClient();

  const analyzingRef = useRef(false);

  const restoreSavedFeedback = useCallback((store, session) => {
    if (session?.evaluation_status !== 'complete') return false;
    const feedbacks = getWritingFeedbacks(session?.content_data);
    if (!feedbacks) return false;

    const currentFeedback =
      feedbacks[store.activeType] || feedbacks['Task 1'] || feedbacks['Task 2'] || null;
    if (!isValidFeedback(currentFeedback)) return false;

    store.setSession(session);
    store.setFeedbacksBulk(feedbacks);
    store.setCurrentFeedback(currentFeedback);
    store.setCompleted(true);
    store.setFeedbackError(null);
    return true;
  }, []);

  const claimEvaluation = useCallback(
    async (store) => {
      if (!store.session) return true;

      const claim = async () => {
        const requestedAt = new Date().toISOString();
        const contentData = {
          ...store.session.content_data,
          evaluationRequestedAt: requestedAt,
        };
        const { data, error } = await supabase
          .from('test_sessions')
          .update({
            evaluation_status: 'pending',
            updated_at: requestedAt,
            content_data: contentData,
          })
          .eq('id', store.session.id)
          .in('evaluation_status', ['not_requested', 'failed'])
          .select('id, evaluation_status, content_data, updated_at')
          .maybeSingle();
        if (error) throw error;
        if (data) {
          store.setSession({
            ...store.session,
            ...data,
            content_data: contentData,
          });
        }
        return Boolean(data);
      };

      if (await claim()) return true;

      const { data: latestSession, error } = await supabase
        .from('test_sessions')
        .select('id, is_completed, evaluation_status, evaluation_version, content_data, updated_at')
        .eq('id', store.session.id)
        .maybeSingle();
      if (error) throw error;

      if (restoreSavedFeedback(store, latestSession)) return false;

      // Rejoin the existing generation after refresh. Server job fingerprints
      // and quota reservations prevent another provider call for either part.
      if (
        latestSession?.evaluation_status === 'pending' &&
        !isStalePendingWritingEvaluation(latestSession)
      ) {
        store.setSession({ ...store.session, ...latestSession });
        return true;
      }

      if (isStalePendingWritingEvaluation(latestSession)) {
        const { data: recovered, error: recoveryError } = await supabase
          .from('test_sessions')
          .update({ evaluation_status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', store.session.id)
          .eq('evaluation_status', 'pending')
          .select('id')
          .maybeSingle();
        if (recoveryError) throw recoveryError;
        if (recovered && (await claim())) return true;
      }

      store.setFeedbackError(
        'Your feedback is still being prepared. Check again in a moment; it will appear here when ready.'
      );
      return false;
    },
    [restoreSavedFeedback]
  );

  const handleGetFeedback = useCallback(async () => {
    if (analyzingRef.current) return;
    const store = useWritingTestStore.getState();
    if (store.session?.evaluation_status === 'legacy') {
      store.setFeedbackError(
        'This older report is saved as it was. Start a new response to use the latest feedback.'
      );
      return;
    }
    if (
      store.session?.evaluation_status === 'complete' &&
      store.session?.evaluation_version === CURRENT_EVALUATION_VERSION
    ) {
      return;
    }

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

    // Plan before the quota check. A full Cambridge Writing test submits both
    // Task 1 and Task 2, so do not start either provider request unless the
    // learner has enough part-review capacity for every uncached task. The
    // server maps any two part reviews to one admin-configured evaluation.
    const analysisPlan = tasksToAnalyze.map((type) => {
      const currentTextRaw = normalizeWritingSource(store.drafts[type]);
      const wordCount = type === 'Task 1' ? task1Words : task2Words;
      const isBelowMinimum = type === 'Task 1' ? wordCount < 150 : wordCount < 250;
      const taskConfig = store.compositeTasks[type] || store.task;
      // Send the prompt as plain text. Stored prompts are rich text, and the
      // markup both polluted the examiner prompt and split the shared feedback
      // cache away from the writing checker, which already strips it.
      const prompt = normalizeTaskPrompt(taskConfig?.prompt);
      const imageUrl = type === 'Task 1' ? taskConfig?.image_url || null : null;
      const savedFeedback = store.feedbacks[type];

      if (
        isCurrentWritingFeedbackCache({
          feedback: savedFeedback,
          response: currentTextRaw,
          prompt,
          imageUrl,
        })
      ) {
        return {
          type,
          cached: true,
          feedback: { ...savedFeedback, isBelowMinimumWordCount: isBelowMinimum },
        };
      }
      return { type, cached: false, text: currentTextRaw, isBelowMinimum, prompt, imageUrl };
    });
    const requiredPartReviews = analysisPlan.filter((item) => !item.cached).length;
    const isRetryingFailedEvaluation = store.session?.evaluation_status === 'failed';
    const isRecoveringPendingEvaluation = store.session?.evaluation_status === 'pending';

    // Claim the in-memory mutex before the asynchronous quota preflight. The
    // database claim below remains the cross-tab/process safeguard, while this
    // prevents a rapid second click from repeating preflight and save work.
    analyzingRef.current = true;

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
          const dailyRemaining = Number(quota?.daily_remaining);
          const monthlyRemaining = Number(quota?.monthly_remaining);
          const hasEnoughPartReviews =
            quota &&
            (!Number.isFinite(dailyRemaining) || dailyRemaining >= requiredPartReviews) &&
            (!Number.isFinite(monthlyRemaining) || monthlyRemaining >= requiredPartReviews);
          if (
            requiredPartReviews > 0 &&
            !isRetryingFailedEvaluation &&
            !isRecoveringPendingEvaluation &&
            quota &&
            (quota.allowed === false || !hasEnoughPartReviews)
          ) {
            store.setFeedbackError(getWritingEvaluationCreditMessage(requiredPartReviews, quota));
            store.setShowUpgradeDialog(true);
            analyzingRef.current = false;
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

    try {
      // Ensure content is saved before starting feedback
      console.info('[WritingTest] Starting AI feedback, saving content first...');
      // The worker owns pending results; a stale draft save must not replace
      // its generation marker or partially completed reports.
      if (!isRecoveringPendingEvaluation) await saveNow();

      store.setAnalyzing(true);
      store.setFeedbackError(null);
      store.setCurrentFeedback(null);

      const newFeedbacks = { ...store.feedbacks };
      let overallScore = null;

      if (!(await claimEvaluation(store))) return;

      // Execute parallel analysis for non-cached tasks
      const analysisPromises = analysisPlan.map(async (item) => {
        if (item.cached) {
          console.info(`[Writing] Using cached feedback for ${item.type}`);
          return { type: item.type, feedback: item.feedback };
        }

        const payload = {
          writingText: item.text,
          sessionId: store.session?.id,
          evaluationRequestedAt:
            useWritingTestStore.getState().session?.content_data?.evaluationRequestedAt,
          taskPrompt: item.prompt,
          taskType: item.type,
          imageUrl: item.imageUrl,
        };

        const res = await generateDetailedFeedback(payload);
        const responseData = res.data || res;

        if (responseData && Object.keys(responseData).length > 0) {
          const raw = responseData;
          const feedbackData = raw.feedback || raw;
          const responseVersion = feedbackData.evaluationVersion || raw.evaluationVersion;
          if (responseVersion !== CURRENT_EVALUATION_VERSION) {
            throw new Error('The feedback service is out of date. Please retry in a moment.');
          }

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
            summary: feedbackData.summary || raw.summary || '',
            priorities: feedbackData.priorities || raw.priorities || [],
            weaknesses: feedbackData.weaknesses || raw.weaknesses || [],
            suggestions: feedbackData.suggestions || raw.suggestions || [],
            corrections: feedbackData.corrections || raw.corrections || [],
            taskType: item.type,
            scoreAgreement: feedbackData.scoreAgreement ?? raw.scoreAgreement ?? null,
            writingCalibrationRevision:
              feedbackData.writingCalibrationRevision ?? raw.writingCalibrationRevision ?? null,
            taskPrompt: item.prompt,
            imageUrl: item.imageUrl,
            originalSource: store.drafts[item.type],
            isBelowMinimumWordCount: item.isBelowMinimum,
            evaluationVersion: responseVersion,
            sourceFingerprint: feedbackData.sourceFingerprint || null,
            model: feedbackData.model || null,
            generatedAt: feedbackData.generatedAt || new Date().toISOString(),
          };

          if (item.type === 'Task 2' && !normalized.overallBand && raw.band_score) {
            normalized.overallBand = parseFloat(raw.band_score);
          }
          return { type: item.type, feedback: normalized };
        }
        return { type: item.type, feedback: null };
      });

      const settledResults = await Promise.allSettled(analysisPromises);
      const results = settledResults
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value);

      results.forEach(({ type, feedback }) => {
        if (feedback) {
          newFeedbacks[type] = feedback;
        }
      });

      const failedResult = settledResults.find((result) => result.status === 'rejected');
      if (failedResult) {
        const failure = summarizeWritingEvaluationFailure(failedResult.reason, tasksToAnalyze);
        const currentSession = useWritingTestStore.getState().session;
        if (currentSession?.id && currentSession.evaluation_status === 'pending') {
          const failedAt = new Date().toISOString();
          const failedContent = {
            ...currentSession.content_data,
            ai_feedbacks: newFeedbacks,
            evaluationFailure: failure,
          };
          await supabase
            .from('test_sessions')
            .update({
              evaluation_status: 'failed',
              content_data: failedContent,
              updated_at: failedAt,
            })
            .eq('id', currentSession.id)
            .eq('evaluation_status', 'pending');
          store.setSession({
            ...currentSession,
            evaluation_status: 'failed',
            content_data: failedContent,
            updated_at: failedAt,
          });
          store.setFeedbacksBulk(newFeedbacks);
        }
        throw failedResult.reason;
      }

      const scoredTask1Band = newFeedbacks['Task 1']?.overallBand;
      const scoredTask2Band = newFeedbacks['Task 2']?.overallBand;
      overallScore = calculateWeightedWritingBand(scoredTask1Band, scoredTask2Band);

      store.setFeedbacksBulk(newFeedbacks);
      store.setCurrentFeedback(newFeedbacks[store.activeType] || newFeedbacks[tasksToAnalyze[0]]);

      // Save session
      if (store.session) {
        const completedAt = new Date().toISOString();

        // Extract per-task criteria scores for analytics
        const task1Feedback = newFeedbacks['Task 1'];
        const task2Feedback = newFeedbacks['Task 2'];

        const t1Criteria = aggregateWritingCriteria(task1Feedback, null);
        const t2Criteria = aggregateWritingCriteria(null, task2Feedback);
        const aggregatedCriteria = aggregateWritingCriteria(task1Feedback, task2Feedback);

        const updatePayload = {
          is_completed: true,
          completed_at: store.session.completed_at || completedAt,
          score: overallScore,
          evaluation_status: 'complete',
          evaluation_version: CURRENT_EVALUATION_VERSION,
          evaluated_at: completedAt,
          actual_duration_seconds:
            store.session.actual_duration_seconds ||
            Math.max(1, 60 * 60 - Number(store.timeRemaining || 0)),
          user_responses: [
            {
              response: JSON.stringify(store.drafts),
              word_count: store.wordCount,
              task1_response: store.drafts['Task 1'],
              task2_response: store.drafts['Task 2'],
            },
          ],
          content_data: {
            ...Object.fromEntries(
              Object.entries(store.session.content_data || {}).filter(
                ([key]) => key !== 'evaluationFailure'
              )
            ),
            time_remaining: store.timeRemaining,
            ai_feedbacks: newFeedbacks,
            // Criteria scores for analytics dashboard
            criteriaScores: aggregatedCriteria,
            task1CriteriaScores: t1Criteria,
            task2CriteriaScores: t2Criteria,
            task1Band: task1Feedback?.overallBand ?? null,
            task2Band: task2Feedback?.overallBand ?? null,
            evaluationVersion: CURRENT_EVALUATION_VERSION,
            evaluatedAt: completedAt,
            evaluationModel: task2Feedback?.model || task1Feedback?.model || null,
            sourceFingerprints: {
              task1: task1Feedback?.sourceFingerprint || null,
              task2: task2Feedback?.sourceFingerprint || null,
            },
            timeMetrics: {
              ...store.session.content_data?.timeMetrics,
              totalTimeSpent:
                store.session.actual_duration_seconds ||
                Math.max(1, 60 * 60 - Number(store.timeRemaining || 0)),
            },
          },
          updated_at: completedAt,
        };

        const { data: completedEvaluation, error: updateError } = await supabase
          .from('test_sessions')
          .update(updatePayload)
          .eq('id', store.session.id)
          .eq('evaluation_status', 'pending')
          .select('id')
          .maybeSingle();

        if (updateError) {
          throw new Error(`Failed to save feedback: ${updateError.message}`);
        }
        if (!completedEvaluation) throw new Error('Feedback was already saved for this response.');

        store.setSession({
          ...store.session,
          ...updatePayload,
        });
        store.setCompleted(true);

        trackAppEvent('writing_submitted', {
          test_type: 'writing',
          task_type: store.activeType,
          overall_band: overallScore,
          session_id: store.session?.id,
        });
        trackAppEvent('test_completed', {
          test_type: 'writing',
          overall_band: overallScore,
          session_id: store.session?.id,
        });

        removeFromCache('writing-tests-list');

        // Invalidate usage stats so Settings page updates immediately
        queryClient.invalidateQueries({ queryKey: ['user-usage-counts'] });

        if (overallScore != null && Number.isFinite(Number(overallScore))) {
          refreshLearningPathAfterTest(
            store.session.user_id,
            'writing',
            Number(overallScore)
          ).catch((refreshError) => {
            if (refreshError?.status !== 403) {
              console.warn(
                'Writing: learning path refresh failed:',
                refreshError?.message || refreshError
              );
            }
          });
        }

        const totalTasks = tasksToAnalyze.length;
        if (awardXP) {
          await awardXP(totalTasks, totalTasks, {
            includePerfectBonus: overallScore >= 7.0,
            updateStreak: true,
            notificationDelay: 800,
            actionKey: `writing-test:${store.session.id}`,
          });
        }
      }
    } catch (err) {
      console.error('Feedback error:', err);
      const currentSession = useWritingTestStore.getState().session;
      if (currentSession?.id && currentSession.evaluation_status === 'pending') {
        const failedAt = new Date().toISOString();
        const failedContent = {
          ...currentSession.content_data,
          evaluationFailure: summarizeWritingEvaluationFailure(err, tasksToAnalyze),
        };
        await supabase
          .from('test_sessions')
          .update({
            evaluation_status: 'failed',
            content_data: failedContent,
            updated_at: failedAt,
          })
          .eq('id', currentSession.id)
          .eq('evaluation_status', 'pending');
        store.setSession({
          ...currentSession,
          evaluation_status: 'failed',
          content_data: failedContent,
          updated_at: failedAt,
        });
      }

      // Only learner-account quota exhaustion is an upgrade condition. A
      // provider 429 is an operational outage and must never blame the learner.
      if (isWritingLearnerQuotaError(err)) {
        store.setShowUpgradeDialog(true);
        return;
      }

      store.setFeedbackError(err.message || 'Failed to generate AI feedback.');
    } finally {
      store.setAnalyzing(false);
      analyzingRef.current = false;
    }
  }, [saveNow, awardXP, claimEvaluation, queryClient]);

  return { handleGetFeedback };
}
