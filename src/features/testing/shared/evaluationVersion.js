export const CURRENT_EVALUATION_VERSION = '2026-07-29-v5';

/**
 * Must stay in lockstep with WRITING_CALIBRATION_REVISION in
 * supabase/functions/_shared/evaluationUtils.ts — the server stamps it onto
 * every report and onto the cache key, and the client treats a report carrying
 * any other revision as stale. Bumping one without the other silently
 * invalidates every saved writing report, so a test asserts they match.
 */
export const WRITING_CALIBRATION_REVISION = 3;

export function isCurrentEvaluation(sessionOrEvaluation) {
  return (
    sessionOrEvaluation?.evaluation_version === CURRENT_EVALUATION_VERSION ||
    sessionOrEvaluation?.evaluationVersion === CURRENT_EVALUATION_VERSION
  );
}
