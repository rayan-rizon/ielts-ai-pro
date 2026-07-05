import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { removeFromCache } from '@/lib/apiCache';
import { useGamification } from '@/hooks/useGamification';
import { calculateEnhancedMetrics, type EnhancedTestMetrics } from '@/services/testMetricsService';
import { refreshLearningPathAfterTest } from '@/services/adaptiveLearningService';

/**
 * Test results returned by calculateResults function
 */
export interface TestResults {
  /** IELTS band score (0-9) */
  bandScore: number;
  /** Total number of questions */
  totalQuestions: number;
  /** Number of correct answers */
  correctAnswers: number;
  /** Percentage score (0-100) */
  percentage: number;
  /** User's responses */
  userResponses?: Record<string, unknown>;
  /** Statistics per section */
  sectionStats?: Record<string, unknown>;
  /** Statistics per question type */
  typeStats?: Record<string, unknown>;
  /** Map of correct answers */
  correctAnswersMap?: Record<string, unknown>;
  /** Legacy alias for correctAnswersMap */
  answersMap?: Record<string, unknown>;
}

/**
 * Test session object
 */
export interface TestSession {
  id: string;
  duration_minutes?: number;
  content_data?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * State returned by getLatestState function
 */
export interface LatestState {
  timeRemaining?: number;
  [key: string]: unknown;
}

/**
 * Section data for test
 */
export interface TestSection {
  id?: string;
  [key: string]: unknown;
}

/**
 * Question data
 */
export interface TestQuestion {
  id?: string;
  [key: string]: unknown;
}

/**
 * Options for useTestSubmission hook
 */
export interface UseTestSubmissionOptions {
  /** The current test session object from context */
  session: TestSession | null;
  /** Function that calculates results */
  calculateResults: (
    questions: TestQuestion[],
    answers: Record<string, unknown>,
    sections: TestSection[]
  ) => TestResults;
  /** Test type: 'reading' or 'listening' */
  testType: 'reading' | 'listening';
  /** Optional function to get the latest state (for timer) */
  getLatestState?: () => LatestState | null;
}

/**
 * Submit parameters
 */
export interface SubmitTestParams {
  /** All questions for the test */
  questions: TestQuestion[];
  /** User's answers { questionId: answer } */
  answers: Record<string, unknown>;
  /** Sections/parts of the test data */
  sections: TestSection[];
}

/**
 * Return type for useTestSubmission hook
 */
export interface UseTestSubmissionResult {
  /** Function to submit the test */
  submitTest: (params: SubmitTestParams) => Promise<TestResults | null>;
  /** Whether submission is in progress */
  isSubmitting: boolean;
  /** Error message if submission failed */
  error: string | null;
}

/**
 * useTestSubmission
 *
 * A shared hook that encapsulates the test submission workflow for both
 * Reading and Listening tests. This eliminates code duplication by centralizing:
 * - Running the score calculation function.
 * - Updating the test_sessions table in Supabase.
 * - Invalidating the relevant library cache.
 * - Awarding XP via the useGamification hook.
 */
export function useTestSubmission({
  session,
  calculateResults,
  testType,
  getLatestState,
}: UseTestSubmissionOptions): UseTestSubmissionResult {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const { awardXP } = useGamification();

  /**
   * Submits the test.
   */
  const submitTest = useCallback(
    async ({ questions, answers, sections }: SubmitTestParams): Promise<TestResults | null> => {
      if (!session) {
        setError('No session found. Cannot submit.');
        return null;
      }

      if (submittingRef.current) return null;
      submittingRef.current = true;
      setIsSubmitting(true);
      setError(null);

      try {
        const latestState = getLatestState ? getLatestState() : null;

        // 1. Calculate results using the provided function
        const results = calculateResults(questions, answers, sections);

        // 2a. Calculate actual time spent
        const durationMins = session.duration_minutes || 60;
        const initialTotalSeconds = durationMins * 60;
        let actualTimeSpentSeconds = initialTotalSeconds; // Default
        let actualTimeSpentMinutes = durationMins;

        if (latestState?.timeRemaining !== undefined) {
          actualTimeSpentSeconds = initialTotalSeconds - (latestState.timeRemaining as number);
          actualTimeSpentMinutes = Math.max(1, Math.floor(actualTimeSpentSeconds / 60));
        }

        const answerTimestamps =
          latestState && typeof latestState === 'object' && 'answerTimestamps' in latestState
            ? ((latestState as any).answerTimestamps as Record<string, number>) || null
            : null;

        const answerChangeCounts =
          latestState && typeof latestState === 'object' && 'answerChangeCounts' in latestState
            ? ((latestState as any).answerChangeCounts as Record<string, number>) || null
            : null;

        const timePerQuestionSeconds = (() => {
          if (!answerTimestamps || Object.keys(answerTimestamps).length === 0) return null;

          const entries = Object.entries(answerTimestamps)
            .map(([questionId, ts]) => [questionId, Number(ts)] as const)
            .filter(([, ts]) => Number.isFinite(ts) && ts >= 0)
            .sort((a, b) => a[1] - b[1]);

          const out: Record<string, number> = {};
          let prev = 0;
          entries.forEach(([questionId, ts]) => {
            const delta = Math.max(0, ts - prev);
            out[questionId] = Math.round(delta);
            prev = ts;
          });
          return out;
        })();

        const totalAnswerChanges = answerChangeCounts
          ? Object.values(answerChangeCounts).reduce((sum, v) => sum + (Number(v) || 0), 0)
          : 0;

        // 2b. Calculate enhanced metrics (no API calls - purely local computation)
        const enhancedMetrics = calculateEnhancedMetrics(
          {
            bandScore: results.bandScore,
            totalQuestions: results.totalQuestions,
            correctAnswers: results.correctAnswers,
            percentage: results.percentage,
            sectionStats: (results.sectionStats as any) || [],
            typeStats:
              (results.typeStats as Record<string, { correct: number; total: number }>) || {},
            correctAnswersMap: (results.correctAnswersMap || results.answersMap) as Record<
              string,
              string
            >,
          },
          answers,
          answerTimestamps,
          actualTimeSpentSeconds,
          testType,
          answerChangeCounts
        );

        // 3. Update test session in Supabase with enhanced metrics
        const { error: updateError } = await supabase
          .from('test_sessions')
          .update({
            score: results.bandScore,
            user_responses: results.userResponses || answers,
            is_completed: true,
            completed_at: new Date().toISOString(),
            duration_minutes: actualTimeSpentMinutes,
            content_data: {
              ...session.content_data,
              // Core metrics (Free tier)
              sectionStats: results.sectionStats,
              typeStats: results.typeStats,
              correctAnswersMap: results.correctAnswersMap || results.answersMap,
              totalQuestions: results.totalQuestions,
              correctAnswers: results.correctAnswers,
              percentage: Math.round(results.percentage),
              ...(answerTimestamps ? { answerTimestamps } : {}),
              ...(timePerQuestionSeconds ? { timePerQuestionSeconds } : {}),
              ...(answerChangeCounts ? { answerChangeCounts } : {}),
              ...(answerChangeCounts ? { totalAnswerChanges } : {}),
              ...(answerChangeCounts
                ? { changedAnswersCount: enhancedMetrics.errorPatterns?.changedAnswers || 0 }
                : {}),
              // Enhanced metrics (Pro/Premium - gated at UI layer)
              timeMetrics: enhancedMetrics.timeMetrics,
              errorPatterns: enhancedMetrics.errorPatterns,
              skillGaps: enhancedMetrics.skillGaps,
              passageProficiency: enhancedMetrics.passageProficiency,
            },
          })
          .eq('id', session.id);

        if (updateError) {
          throw new Error(`Failed to save test results: ${updateError.message}`);
        }

        // 4. Invalidate library cache so progress updates immediately
        removeFromCache(`${testType}-tests-list`);

        // 5. Award XP
        await awardXP(results.correctAnswers, results.totalQuestions);

        // 6. Trigger learning path refresh (fire and forget - runs in background)
        const sessionUserId = session.user_id || (session as any).created_by;
        if (sessionUserId) {
          refreshLearningPathAfterTest(sessionUserId, testType, results.bandScore);
        }

        return results;
      } catch (err) {
        console.error('[useTestSubmission] Error submitting test:', err);
        setError(err instanceof Error ? err.message : 'Failed to submit test.');
        return null;
      } finally {
        setIsSubmitting(false);
        submittingRef.current = false;
      }
    },
    [session, calculateResults, testType, getLatestState, awardXP]
  );

  return {
    submitTest,
    isSubmitting,
    error,
  };
}

export default useTestSubmission;
