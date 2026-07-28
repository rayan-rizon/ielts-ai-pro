export const CURRENT_EVALUATION_VERSION = '2026-07-29-v5';

export function isCurrentEvaluation(sessionOrEvaluation) {
  return (
    sessionOrEvaluation?.evaluation_version === CURRENT_EVALUATION_VERSION ||
    sessionOrEvaluation?.evaluationVersion === CURRENT_EVALUATION_VERSION
  );
}
