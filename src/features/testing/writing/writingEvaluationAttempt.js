import { supabase } from '@/lib/supabase';
import { getWritingFeedbacks, summarizeWritingEvaluationFailure } from './writingFeedbackHelpers';
import { aggregateWritingCriteria, calculateWeightedWritingBand } from './utils/evaluationEvidence';
import { CURRENT_EVALUATION_VERSION } from '@/features/testing/shared/evaluationVersion';

function evaluationMarker(session) {
  return session.content_data?.evaluationRequestedAt ?? null;
}

/** Whether two snapshots refer to the same evaluation attempt. */
export function isSameWritingEvaluation(expected, actual) {
  if (!expected || !actual) return false;
  return (
    Boolean(expected.id) &&
    expected.id === actual.id &&
    evaluationMarker(expected) === evaluationMarker(actual)
  );
}

function isPendingWritingAttempt(expected, actual) {
  return isSameWritingEvaluation(expected, actual) && actual.evaluation_status === 'pending';
}

/** Both reads and writes select exactly the attempt that owns the operation. */
function pendingAttemptQuery(query, session) {
  const requestedAt = evaluationMarker(session);
  const pending = query.eq('id', session.id).eq('evaluation_status', 'pending');
  return requestedAt !== null
    ? pending.eq('content_data->>evaluationRequestedAt', requestedAt)
    : pending.is('content_data->>evaluationRequestedAt', null);
}

async function readPendingWritingAttempt(session, client) {
  if (!isPendingWritingAttempt(session, session)) return null;
  const { data, error } = await pendingAttemptQuery(
    client.from('test_sessions').select('*'),
    session
  ).maybeSingle();
  if (error) throw error;
  return isPendingWritingAttempt(session, data) ? data : null;
}

/** A worker's newer snapshot must also survive a write within this attempt. */
async function savePendingWritingAttempt({ session, latest, payload }, client) {
  let update = pendingAttemptQuery(client.from('test_sessions').update(payload), session);
  update = latest.updated_at
    ? update.eq('updated_at', latest.updated_at)
    : update.is('updated_at', null);
  const { data, error } = await update.select('*').maybeSingle();
  if (error) throw error;
  return data ? { ...session, ...payload, ...data } : null;
}

/** Preserve partial feedback and record failure only for the owning attempt. */
export async function recordWritingEvaluationFailure(
  { session, error, attemptedTasks, feedbacks = {} },
  client = supabase
) {
  const latest = await readPendingWritingAttempt(session, client);
  if (!latest) return null;
  const payload = {
    evaluation_status: 'failed',
    content_data: {
      ...latest.content_data,
      ai_feedbacks: {
        ...getWritingFeedbacks(session.content_data),
        ...getWritingFeedbacks(latest.content_data),
        ...feedbacks,
      },
      evaluationFailure: summarizeWritingEvaluationFailure(error, attemptedTasks),
    },
    updated_at: new Date().toISOString(),
  };

  return savePendingWritingAttempt({ session, latest, payload }, client);
}

function writingTaskBands(feedbacks) {
  return {
    task1Band: feedbacks['Task 1']?.overallBand ?? null,
    task2Band: feedbacks['Task 2']?.overallBand ?? null,
  };
}

function writingEvaluationDuration(session, timeRemaining) {
  return session.actual_duration_seconds || Math.max(1, 60 * 60 - Number(timeRemaining || 0));
}

function writingFeedbackProvenance(task1Feedback, task2Feedback) {
  const first = task1Feedback || {};
  const second = task2Feedback || {};
  return {
    evaluationModel: second.model || first.model || null,
    sourceFingerprints: {
      task1: first.sourceFingerprint || null,
      task2: second.sourceFingerprint || null,
    },
  };
}

function buildWritingCompletionPayload({ current, feedbacks, drafts, wordCount, timeRemaining }) {
  const completedAt = new Date().toISOString();

  // Extract per-task criteria scores for analytics
  const task1Feedback = feedbacks['Task 1'];
  const task2Feedback = feedbacks['Task 2'];
  const { task1Band, task2Band } = writingTaskBands(feedbacks);
  const duration = writingEvaluationDuration(current, timeRemaining);

  const t1Criteria = aggregateWritingCriteria(task1Feedback, null);
  const t2Criteria = aggregateWritingCriteria(null, task2Feedback);
  const aggregatedCriteria = aggregateWritingCriteria(task1Feedback, task2Feedback);

  return {
    is_completed: true,
    completed_at: current.completed_at || completedAt,
    score: calculateWeightedWritingBand(task1Band, task2Band),
    evaluation_status: 'complete',
    evaluation_version: CURRENT_EVALUATION_VERSION,
    evaluated_at: completedAt,
    actual_duration_seconds: duration,
    user_responses: [
      {
        response: JSON.stringify(drafts),
        word_count: wordCount,
        task1_response: drafts['Task 1'],
        task2_response: drafts['Task 2'],
      },
    ],
    content_data: {
      ...Object.fromEntries(
        Object.entries(current.content_data || {}).filter(([key]) => key !== 'evaluationFailure')
      ),
      time_remaining: timeRemaining,
      ai_feedbacks: feedbacks,
      // Criteria scores for analytics dashboard
      criteriaScores: aggregatedCriteria,
      task1CriteriaScores: t1Criteria,
      task2CriteriaScores: t2Criteria,
      task1Band,
      task2Band,
      evaluationVersion: CURRENT_EVALUATION_VERSION,
      evaluatedAt: completedAt,
      ...writingFeedbackProvenance(task1Feedback, task2Feedback),
      timeMetrics: {
        ...current.content_data?.timeMetrics,
        totalTimeSpent: duration,
      },
    },
    updated_at: completedAt,
  };
}

/**
 * Complete only the attempt that produced these reports. Null means its
 * pending snapshot changed; callers must not publish scores or award XP.
 */
export async function completeWritingEvaluation(
  { session, feedbacks, drafts, wordCount, timeRemaining },
  client = supabase
) {
  const latest = await readPendingWritingAttempt(session, client);
  if (!latest) return null;
  const current = { ...session, ...latest };
  const updatePayload = buildWritingCompletionPayload({
    current,
    feedbacks,
    drafts,
    wordCount,
    timeRemaining,
  });

  try {
    return await savePendingWritingAttempt({ session, latest, payload: updatePayload }, client);
  } catch (error) {
    throw new Error(`Failed to save feedback: ${error.message}`, { cause: error });
  }
}
