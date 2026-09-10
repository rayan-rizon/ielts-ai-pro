// ---------------------------------------------------------------------------
// AI feedback validators
// ---------------------------------------------------------------------------

export function isValidFeedback(fb) {
  return (
    !!fb &&
    (fb.overallBand !== undefined ||
      fb.overall_band !== undefined ||
      fb.band_score !== undefined ||
      fb.score !== undefined)
  );
}

export function hasValidAiFeedback(content) {
  const feedbacks = getWritingFeedbacks(content);
  if (!feedbacks) return false;
  return isValidFeedback(feedbacks['Task 1']) || isValidFeedback(feedbacks['Task 2']);
}

export function getWritingFeedbacks(content) {
  const feedbacks = content?.ai_feedbacks;
  return feedbacks && typeof feedbacks === 'object' ? feedbacks : null;
}

export function isStalePendingWritingEvaluation(session, now = Date.now()) {
  if (session?.evaluation_status !== 'pending') return false;

  const requestedAt =
    session?.content_data?.evaluationRequestedAt || session?.updated_at || session?.created_at;
  const requestedAtMs = new Date(requestedAt || 0).getTime();
  return Number.isFinite(requestedAtMs) && now - requestedAtMs >= 2 * 60 * 1000;
}

function extractBandFromFeedback(fb) {
  const band = fb.overallBand ?? fb.overall_band ?? fb.band_score ?? fb.score;
  if (band === undefined || band === null) return null;
  const num = Number(band);
  return Number.isFinite(num) ? num : null;
}

export function getScoreFromFeedback(content) {
  const feedbacks = content?.ai_feedbacks;
  if (!feedbacks) return null;
  const fb =
    (isValidFeedback(feedbacks['Task 1']) && feedbacks['Task 1']) ||
    (isValidFeedback(feedbacks['Task 2']) && feedbacks['Task 2']) ||
    null;
  return fb ? extractBandFromFeedback(fb) : null;
}

// ---------------------------------------------------------------------------
// Completion / session derivations
// ---------------------------------------------------------------------------

export function resolveWritingSessionState(session) {
  if (!session) {
    return { activeSession: undefined, completedSession: undefined, isEffectivelyCompleted: false };
  }
  const hasFeedback = hasValidAiFeedback(session.content_data);
  const hasScore = session.score !== undefined && session.score !== null;
  // A submitted Writing test can be marked is_completed before its AI evaluation
  // has finished. A failed evaluation must remain resumable, even if one parallel
  // task returned feedback, otherwise the learner is sent to an incomplete result.
  const evaluationFailed = session.evaluation_status === 'failed';
  const isEffectivelyCompleted =
    !evaluationFailed && !!(session.is_completed || hasFeedback || hasScore);

  return {
    activeSession: !isEffectivelyCompleted ? session : undefined,
    completedSession: isEffectivelyCompleted ? session : undefined,
    isEffectivelyCompleted,
  };
}

export function getWritingEvaluationCreditMessage(required, quota) {
  const dailyRemaining = Number(quota?.daily_remaining);
  const monthlyRemaining = Number(quota?.monthly_remaining);
  const remaining = Math.max(
    0,
    Math.min(
      Number.isFinite(dailyRemaining) ? dailyRemaining : Number.POSITIVE_INFINITY,
      Number.isFinite(monthlyRemaining) ? monthlyRemaining : Number.POSITIVE_INFINITY
    )
  );
  const requiredLabel = `${required} task review${required === 1 ? '' : 's'}`;
  const remainingLabel = `${remaining} task review${remaining === 1 ? '' : 's'} remaining`;
  return `This request includes ${requiredLabel}, but you have ${remainingLabel}. Every 2 task reviews count as 1 Writing evaluation. Upgrade or wait for your allowance to reset before starting the evaluation.`;
}

export function summarizeWritingEvaluationFailure(error, attemptedTasks) {
  const status = Number(error?.status);
  const category = status === 429 ? 'quota' : status >= 500 ? 'provider' : 'request';
  return {
    occurredAt: new Date().toISOString(),
    category,
    status: Number.isFinite(status) ? status : null,
    attemptedTasks,
  };
}
