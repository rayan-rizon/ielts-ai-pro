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
  const isEffectivelyCompleted = !!(session.is_completed || hasFeedback || hasScore);

  return {
    activeSession: !isEffectivelyCompleted ? session : undefined,
    completedSession: isEffectivelyCompleted ? session : undefined,
    isEffectivelyCompleted,
  };
}
